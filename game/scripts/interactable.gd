class_name Interactable
extends StaticBody2D

signal focused(interactable: Interactable)
signal unfocused(interactable: Interactable)

var object_id: StringName
var display_name := "物品"
var hint := "查看"
var action: StringName = &"inspect"
var object_size := Vector2(160, 100)
var is_near := false

func setup(data: Array) -> void:
	object_id = data[0]
	display_name = data[1]
	hint = data[2]
	position = data[3]
	object_size = data[4]
	action = data[5]
	collision_layer = 1 | 4
	collision_mask = 0
	var collision := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = object_size * Vector2(0.78, 0.42)
	collision.shape = shape
	add_child(collision)
	queue_redraw()

func interaction_point() -> Vector2:
	return global_position + Vector2(0, object_size.y * 0.45 + 40)

func set_near(value: bool) -> void:
	if is_near == value:
		return
	is_near = value
	queue_redraw()
	if value:
		focused.emit(self)
	else:
		unfocused.emit(self)

func interact(actor: Node) -> void:
	if actor.has_method("begin_interaction"):
		actor.begin_interaction(action, display_name)

func _draw() -> void:
	var half := object_size * 0.5
	var base := PackedVector2Array([
		Vector2(-half.x, 0), Vector2(0, -half.y * 0.48),
		Vector2(half.x, 0), Vector2(0, half.y * 0.48)
	])
	var color := _object_color()
	draw_colored_polygon(base, color.darkened(0.18))
	draw_polyline(base, color.lightened(0.12), 3.0, true)
	draw_rect(Rect2(-half.x * 0.72, -object_size.y, half.x * 1.44, object_size.y), color, true)
	draw_rect(Rect2(-half.x * 0.72, -object_size.y, half.x * 1.44, object_size.y), color.darkened(0.35), false, 4.0)
	if is_near:
		draw_arc(Vector2.ZERO, max(object_size.x, object_size.y) * 0.58, 0, TAU, 48, Color("#fff3a8"), 5.0)

func _object_color() -> Color:
	match object_id:
		&"sofa", &"sink": return Color("#758b58")
		&"bed": return Color("#d9cba7")
		&"stove": return Color("#ded7c4")
		&"fireplace": return Color("#ad6a36")
		&"wardrobe", &"bookshelf": return Color("#6e4728")
		_: return Color("#93643b")

