class_name RoomLayout
extends RefCounted

const ROOM_IDS := [&"living_room", &"kitchen", &"bedroom"]

static func definition(room_id: StringName) -> Dictionary:
	match room_id:
		&"kitchen":
			return {
				"title": "厨房 Kitchen",
				"subtitle": "一起准备今天的小餐点",
				"floor": Color("#9f6b37"),
				"accent": Color("#82915a"),
				"spawn": Vector2(0, 110),
				"buddy_spawn": Vector2(90, 30),
				"objects": [
					[&"stove", "炉灶", "做一道暖心料理", Vector2(-360, -105), Vector2(160, 120), &"cook"],
					[&"counter", "料理台", "准备新鲜食材", Vector2(-95, -145), Vector2(270, 105), &"prepare"],
					[&"sink", "水槽", "把厨房收拾干净", Vector2(285, -145), Vector2(220, 100), &"wash"],
					[&"table", "餐桌", "一起吃点东西", Vector2(285, 120), Vector2(230, 125), &"eat"],
				],
			}
		&"bedroom":
			return {
				"title": "卧室 Bedroom",
				"subtitle": "安静休息，写下今天的心情",
				"floor": Color("#785638"),
				"accent": Color("#65758b"),
				"spawn": Vector2(80, 110),
				"buddy_spawn": Vector2(155, 35),
				"objects": [
					[&"bed", "床铺", "睡一觉恢复精力", Vector2(-285, -40), Vector2(300, 190), &"sleep"],
					[&"desk", "书桌", "写下今天的心情", Vector2(90, -145), Vector2(185, 95), &"write"],
					[&"wardrobe", "衣柜", "整理自己的小空间", Vector2(350, -125), Vector2(125, 165), &"tidy"],
				],
			}
		_:
			return {
				"title": "客厅 Living Room",
				"subtitle": "适合聊天、读书和休息",
				"floor": Color("#966437"),
				"accent": Color("#708657"),
				"spawn": Vector2(115, 110),
				"buddy_spawn": Vector2(25, 35),
				"objects": [
					[&"sofa", "沙发", "坐下来休息", Vector2(-300, -65), Vector2(255, 125), &"sit"],
					[&"tea_table", "茶几", "一起读本书", Vector2(-85, 85), Vector2(170, 95), &"read"],
					[&"fireplace", "壁炉", "暖暖手、聊聊天", Vector2(300, -105), Vector2(180, 130), &"warm"],
					[&"bookshelf", "书架", "看看收藏的书", Vector2(455, -80), Vector2(95, 180), &"inspect"],
				],
			}

