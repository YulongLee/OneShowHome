extends SceneTree

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var failures: Array[String] = []
	for room_id in RoomLayout.ROOM_IDS:
		var layout := RoomLayout.definition(room_id)
		if layout.get("objects", []).is_empty():
			failures.append("%s has no interactive entities" % room_id)
		if not layout.has("spawn") or not layout.has("buddy_spawn"):
			failures.append("%s is missing character spawn points" % room_id)

	var main_scene := load("res://scenes/home/home_world.tscn") as PackedScene
	if main_scene == null:
		failures.append("home_world.tscn could not be loaded")
	else:
		var instance := main_scene.instantiate()
		if instance.get_script() == null:
			failures.append("home world script failed to compile")
		if instance.get_node_or_null("World/FloorTiles") == null:
			failures.append("TileMapLayer floor is missing")
		if instance.get_node_or_null("World/Entities/Player/Camera2D") == null:
			failures.append("player Camera2D is missing")
		if instance.get_node_or_null("World/Entities/Buddy") == null:
			failures.append("Buddy is missing")
		instance.free()

	if failures.is_empty():
		print("OneShow Home runtime checks passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
