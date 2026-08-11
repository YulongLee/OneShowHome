# OneShow Home 2.5D Rooms — Design QA

## Evidence

- source visual truth paths:
  - `apps/desktop/src/assets/house/living-room-isometric-v1.png`
  - `apps/desktop/src/assets/house/kitchen-isometric-v1.png`
  - `apps/desktop/src/assets/house/bedroom-isometric-v1.png`
- implementation screenshots:
  - `/tmp/oneshow-room-final-living.png`
  - `/tmp/oneshow-room-final-kitchen.png`
  - `/tmp/oneshow-room-final-bedroom.png`
- full-view comparison evidence: `/tmp/oneshow-isometric-rooms-final.png`
- movement-state evidence: `/tmp/oneshow-room-walk-mid.png`
- viewport: macOS native application window, `1120 x 700` CSS pixels
- source assets: `1586 x 992` pixels; implementation captures: `1120 x 700` pixels; both approximately 16:10 and compared at native aspect ratio
- state: living room, kitchen, and bedroom; night local time; no modal; indoor-only launch scope

## Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] The generated cutaway rooms use a dark outer matte. It creates a consistent game-stage boundary and does not reduce room readability.
- [P3] Action poses use the current Buddy illustration set, while the walk cycle has a slightly different rendering finish. A unified character atlas can be produced in a later character-art pass.

## Fidelity Surfaces

- typography: clear hierarchy and readable Chinese labels; title contrast was raised for the dark isometric stage.
- spacing/layout: all three rooms preserve the same HUD frame, 16:10 composition, navigation rails, chat dock, and interaction density.
- colors/tokens: warm cream, wood, sage green, amber light, and muted night blue remain consistent across all rooms.
- image quality: every room uses a production raster background with one shared orthographic 45-degree projection; no CSS-drawn substitute scenery is visible.
- copy/content: farm, planting, fishing, and animal-care entry copy are removed from the launch UI; room labels and tasks are indoor-specific.
- behavior: floor clicks use constrained paths, long routes pass through a safe hub, Buddy faces the movement direction, and interactions execute only after arrival.
- accessibility: room and object buttons retain semantic labels, active states are visible, and persistent controls do not clip at `1120 x 700`.

## Comparison History

### Iteration 1

- finding: previous interior assets were front-facing one-point-perspective illustrations, not playable 2.5D maps.
- fix: created three new commercial anime cutaway room assets using a shared orthographic 45-degree view and open walkable floor layout.
- evidence: the three source visual truth paths above.

### Iteration 2

- finding: Buddy appeared too small; dark-stage title copy had low contrast; the movement hint collided with the chat dock; old users could retain a farm task.
- fix: increased character scale, raised title contrast, moved the hint above chat, migrated existing farm tasks to indoor tasks, and restricted release navigation to three rooms.
- evidence: `/tmp/oneshow-isometric-living-final.png`, `/tmp/oneshow-isometric-kitchen.png`, and `/tmp/oneshow-isometric-bedroom.png`.

### Iteration 3

- finding: the kitchen spawn could overlap dining furniture and a sleeping pose could appear on open floor.
- fix: moved the kitchen spawn to the central clear floor, added a right-side kitchen collision limit, and positioned sleeping state at the bedroom bed.
- post-fix evidence: `/tmp/oneshow-isometric-rooms-final.png` and `/tmp/oneshow-room-walk-mid.png`.

## Verification

- 10 frontend test files, 34 tests passed.
- 12 Rust tests passed.
- TypeScript type checking, ESLint, Rust formatting, and Clippy passed.
- Native macOS release bundle built successfully.
- Primary interactions tested: enter Home, switch all three rooms, click floor to walk, capture mid-walk animation, and activate room object hotspots.

final result: passed
