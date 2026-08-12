class_name BuddyController
extends CharacterBody2D

enum State { IDLE, WALK, SIT, READ, SLEEP, CHAT }

@export var speed := 105.0
var state := State.IDLE
var home_position := Vector2.ZERO
var target := Vector2.ZERO
var routine_timer := 0.0
var player: PlayerController

func _ready() -> void:
	collision_layer = 8
	collision_mask = 1
	home_position = global_position
	target = home_position
	routine_timer = randf_range(2.5, 5.5)
	queue_redraw()

func _physics_process(delta: float) -> void:
	routine_timer -= delta
	if player and global_position.distance_to(player.global_position) < 88.0:
		velocity = Vector2.ZERO
		state = State.CHAT
	elif global_position.distance_to(target) > 8.0:
		velocity = global_position.direction_to(target) * speed
		state = State.WALK
	else:
		velocity = velocity.move_toward(Vector2.ZERO, speed * 4.0 * delta)
		state = State.IDLE
		if routine_timer <= 0.0:
			routine_timer = randf_range(4.0, 8.0)
			target = home_position + Vector2(randf_range(-105, 105), randf_range(-45, 75))
	move_and_slide()
	queue_redraw()

func _draw() -> void:
	_draw_oval(Vector2(0, 10), Vector2(18, 7), Color(0.08, 0.06, 0.03, 0.22))
	var bob := -2.0 if state == State.WALK and Time.get_ticks_msec() % 320 < 160 else 0.0
	draw_circle(Vector2(0, -34 + bob), 16, Color("#f1c79f"))
	draw_style_box(_body_style(), Rect2(-16, -20 + bob, 32, 40))
	draw_circle(Vector2(-5, -36 + bob), 2.2, Color("#3d2b20"))
	draw_circle(Vector2(5, -36 + bob), 2.2, Color("#3d2b20"))
	if state == State.CHAT:
		draw_circle(Vector2(24, -58), 12, Color("#fff8df"))
		draw_string(ThemeDB.fallback_font, Vector2(19, -53), "…", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color("#566749"))

func _draw_oval(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for index in 24:
		var angle := TAU * float(index) / 24.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)

func _body_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#e7ddc0")
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_left = 7
	style.corner_radius_bottom_right = 7
	return style
