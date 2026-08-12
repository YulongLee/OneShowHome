extends Node2D

@onready var room: IsoRoom = $World/Room
@onready var floor_tiles: TileMapLayer = $World/FloorTiles
@onready var furniture_layer: Node2D = $World/Entities/Furniture
@onready var walls: Node2D = $World/Walls
@onready var player: PlayerController = $World/Entities/Player
@onready var buddy: BuddyController = $World/Entities/Buddy
@onready var title_label: Label = $HUD/TopBar/Content/Title
@onready var subtitle_label: Label = $HUD/TopBar/Content/Subtitle
@onready var prompt_label: Label = $HUD/Prompt
@onready var state_label: Label = $HUD/Status/Content/State
@onready var mood_label: Label = $HUD/Status/Content/Mood
@onready var room_buttons: HBoxContainer = $HUD/RoomButtons

var current_room: StringName = &"living_room"

func _ready() -> void:
	player.interaction_changed.connect(_on_interaction_changed)
	player.state_changed.connect(_on_player_state_changed)
	buddy.player = player
	_build_floor_tileset()
	_build_collision_walls()
	_build_room_buttons()
	_load_room(current_room)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("switch_living_room"):
		_load_room(&"living_room")
	elif event.is_action_pressed("switch_kitchen"):
		_load_room(&"kitchen")
	elif event.is_action_pressed("switch_bedroom"):
		_load_room(&"bedroom")

func _load_room(room_id: StringName) -> void:
	current_room = room_id
	var layout := RoomLayout.definition(room_id)
	room.setup(room_id)
	title_label.text = layout.title
	subtitle_label.text = layout.subtitle
	for child in furniture_layer.get_children():
		furniture_layer.remove_child(child)
		child.free()
	if player.nearby:
		player.nearby.set_near(false)
	player.nearby = null
	for object_data in layout.objects:
		var object := Interactable.new()
		object.add_to_group("interactables")
		furniture_layer.add_child(object)
		object.setup(object_data)
	player.position = layout.spawn
	player.velocity = Vector2.ZERO
	var camera := player.get_node("Camera2D") as Camera2D
	camera.global_position = Vector2(640, 360)
	camera.reset_smoothing()
	buddy.position = layout.buddy_spawn
	buddy.home_position = buddy.global_position
	buddy.target = buddy.global_position
	prompt_label.text = "WASD / 方向键移动 · 靠近家具按 E · 1/2/3 切换房间"
	mood_label.text = "Buddy · 开心 · 精力 80%"
	for button in room_buttons.get_children():
		if button is Button:
			button.disabled = button.name == String(room_id)
	floor_tiles.clear()
	for row in range(-7, 8):
		for column in range(-7, 8):
			var center := Vector2((column - row) * 42.0, (column + row) * 21.0)
			if abs(center.x) < 520.0 and abs(center.y) < 248.0:
				floor_tiles.set_cell(Vector2i(column, row), 0, Vector2i.ZERO)

func _build_floor_tileset() -> void:
	var tile_image := Image.create(84, 42, false, Image.FORMAT_RGBA8)
	tile_image.fill(Color.TRANSPARENT)
	var tile_color := Color("#b5824e")
	for y in range(42):
		var half_width := int(42.0 * (1.0 - abs(float(y) - 20.5) / 20.5))
		for x in range(42 - half_width, 43 + half_width):
			if x >= 0 and x < 84:
				tile_image.set_pixel(x, y, tile_color)
	var texture := ImageTexture.create_from_image(tile_image)
	var tile_set := TileSet.new()
	tile_set.tile_size = Vector2i(84, 42)
	tile_set.tile_shape = TileSet.TILE_SHAPE_ISOMETRIC
	var source := TileSetAtlasSource.new()
	source.texture = texture
	source.texture_region_size = Vector2i(84, 42)
	source.create_tile(Vector2i.ZERO)
	tile_set.add_source(source, 0)
	floor_tiles.tile_set = tile_set

func _build_room_buttons() -> void:
	for child in room_buttons.get_children():
		child.queue_free()
	var labels := {
		&"living_room": "1  客厅",
		&"kitchen": "2  厨房",
		&"bedroom": "3  卧室",
	}
	for room_id in RoomLayout.ROOM_IDS:
		var button := Button.new()
		button.name = String(room_id)
		button.text = labels[room_id]
		button.custom_minimum_size = Vector2(108, 42)
		button.pressed.connect(_load_room.bind(room_id))
		room_buttons.add_child(button)

func _build_collision_walls() -> void:
	for child in walls.get_children():
		child.queue_free()
	_add_wall(Vector2(-545, 100), Vector2(28, 335), -0.46)
	_add_wall(Vector2(545, 100), Vector2(28, 335), 0.46)
	_add_wall(Vector2(0, -42), Vector2(1060, 24), 0.0)
	_add_wall(Vector2(0, 265), Vector2(930, 24), 0.0)

func _add_wall(at: Vector2, size: Vector2, rotation: float) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = 1
	body.position = at
	body.rotation = rotation
	var shape := RectangleShape2D.new()
	shape.size = size
	var collision := CollisionShape2D.new()
	collision.shape = shape
	body.add_child(collision)
	walls.add_child(body)

func _on_interaction_changed(label: String) -> void:
	prompt_label.text = label

func _on_player_state_changed(next_state: StringName) -> void:
	state_label.text = "Player · %s" % String(next_state).capitalize()
