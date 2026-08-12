class_name IsoRoom
extends Node2D

var room_id: StringName = &"living_room"
var layout: Dictionary = {}

func setup(next_room_id: StringName) -> void:
	room_id = next_room_id
	layout = RoomLayout.definition(room_id)
	queue_redraw()

func _draw() -> void:
	var floor_color: Color = layout.get("floor", Color("#966437"))
	var accent: Color = layout.get("accent", Color("#708657"))
	var floor_points := PackedVector2Array([
		Vector2(-570, 0), Vector2(0, -285), Vector2(570, 0), Vector2(0, 285)
	])
	draw_colored_polygon(floor_points, floor_color)

	# Cutaway walls share the same orthographic projection as the floor.
	var left_wall := PackedVector2Array([
		Vector2(-570, 0), Vector2(0, -285), Vector2(0, -505), Vector2(-570, -220)
	])
	var right_wall := PackedVector2Array([
		Vector2(0, -285), Vector2(570, 0), Vector2(570, -220), Vector2(0, -505)
	])
	draw_colored_polygon(left_wall, Color("#e5cfaa"))
	draw_colored_polygon(right_wall, Color("#d8bc91"))
	draw_polyline(left_wall, Color("#5c3e25"), 10.0, true)
	draw_polyline(right_wall, Color("#5c3e25"), 10.0, true)

	# Window and warm room identity accents.
	draw_rect(Rect2(-95, -420, 190, 125), Color("#88b6cd"), true)
	draw_rect(Rect2(-95, -420, 190, 125), Color("#594027"), false, 8.0)
	draw_line(Vector2(0, -420), Vector2(0, -295), Color("#594027"), 6.0)
	draw_line(Vector2(-95, -357), Vector2(95, -357), Color("#594027"), 6.0)
	draw_circle(Vector2(0, -337), 34.0, Color(accent, 0.17))
