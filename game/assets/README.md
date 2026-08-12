# Game asset contract

- `characters/`: directional sprite sheets and animation libraries.
- `environment/`: TileSet source textures for floor, wall, door, and trim.
- `furniture/`: independent furniture sprites, collisions, and interaction data.
- `reference/`: non-runtime visual references only.

The complete room paintings used by the React prototype must not become
collision maps. Production rooms are assembled from TileMapLayer and entities.

