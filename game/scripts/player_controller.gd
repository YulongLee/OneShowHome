class_name PlayerController
extends CharacterBody2D

signal interaction_changed(label: String)
signal state_changed(state: StringName)

enum State { IDLE, WALK, RUN, SIT, TALK, SLEEP, INTERACT }

@export var walk_speed := 220.0
@export var acceleration := 1500.0
@export var friction := 1800.0

var state := State.IDLE
var facing := Vector2.DOWN
var nearby: Interactable
var locked := false

func _ready() -> void:
	collision_layer = 2
	collision_mask = 1
	queue_redraw()

func _physics_process(delta: float) -> void:
	if locked:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
		move_and_slide()
		queue_redraw()
		return

	var input_vector := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	# A small y scale preserves the visual feel of an isometric floor.
	var desired := Vector2(input_vector.x, input_vector.y * 0.72).normalized() * walk_speed
	if input_vector.length_squared() > 0.01:
		velocity = velocity.move_toward(desired, acceleration * delta)
		facing = input_vector.normalized()
		_set_state(State.WALK)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
		_set_state(State.IDLE)
	move_and_slide()
	position.x = clamp(position.x, -500.0, 500.0)
	position.y = clamp(position.y, -15.0, 245.0)
	_update_nearby()
	queue_redraw()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") and nearby and not locked:
		nearby.interact(self)
	elif event.is_action_pressed("interact") and locked:
		end_interaction()

func begin_interaction(action: StringName, object_name: String) -> void:
	locked = true
	match action:
		&"sit": _set_state(State.SIT)
		&"sleep": _set_state(State.SLEEP)
		&"read", &"write", &"cook", &"prepare", &"wash", &"warm", &"eat", &"tidy":
			_set_state(State.INTERACT)
		_: _set_state(State.TALK)
	interaction_changed.emit("正在与%s互动 · 按 E 结束" % object_name)
	get_tree().create_timer(1.8).timeout.connect(end_interaction)

func end_interaction() -> void:
	locked = false
	_set_state(State.IDLE)
	_update_nearby()

func _update_nearby() -> void:
	var closest: Interactable
	var closest_distance := 118.0
	for node in get_tree().get_nodes_in_group("interactables"):
		var candidate := node as Interactable
		if not candidate:
			continue
		var distance := global_position.distance_to(candidate.interaction_point())
		if distance < closest_distance:
			closest = candidate
			closest_distance = distance
	if nearby == closest:
		return
	if nearby:
		nearby.set_near(false)
	nearby = closest
	if nearby:
		nearby.set_near(true)
		interaction_changed.emit("按 E · %s · %s" % [nearby.display_name, nearby.hint])
	else:
		interaction_changed.emit("WASD / 方向键移动")

func _set_state(next_state: State) -> void:
	if state == next_state:
		return
	state = next_state
	state_changed.emit(State.keys()[state].to_lower())
	queue_redraw()

func _draw() -> void:
	# Runtime placeholder: a code-native character body used to validate physics.
	_draw_oval(Vector2(0, 13), Vector2(22, 9), Color(0.08, 0.06, 0.03, 0.25))
	var bob := -2.0 if state == State.WALK and Time.get_ticks_msec() % 260 < 130 else 0.0
	draw_circle(Vector2(0, -42 + bob), 18, Color("#f2c79d"))
	draw_style_box(_body_style(), Rect2(-18, -25 + bob, 36, 48))
	draw_rect(Rect2(-14, 23 + bob, 11, 27), Color("#40586f"), true)
	draw_rect(Rect2(3, 23 + bob, 11, 27), Color("#40586f"), true)
	var eye_x := 6.0 if facing.x >= 0 else -6.0
	draw_circle(Vector2(eye_x, -45 + bob), 2.5, Color("#39291f"))
	if state in [State.INTERACT, State.TALK]:
		draw_arc(Vector2.ZERO, 35, 0, TAU, 24, Color("#fff0a0"), 3)

func _draw_oval(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for index in 24:
		var angle := TAU * float(index) / 24.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)

func _body_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#798b58")
	style.corner_radius_top_left = 11
	style.corner_radius_top_right = 11
	style.corner_radius_bottom_left = 7
	style.corner_radius_bottom_right = 7
	return style
