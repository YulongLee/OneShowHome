# OneShow Home Farm Design QA

## Evidence

- source visual truth path: `/var/folders/2c/sdg0hxmx3b5_x84y09b7hk1w0000gn/T/codex-clipboard-d463e843-f39d-47a1-a382-f30e4a7eda39.png`
- implementation screenshot path: `/tmp/oneshow-commercial-farm-final.png`
- full-view comparison evidence: `/tmp/oneshow-commercial-farm-comparison-final.png`
- focused region comparison evidence: `/tmp/oneshow-commercial-farm-focused-final.png`
- viewport: macOS native application window, `1120 x 700` CSS pixels, 16:10
- source dimensions: `1448 x 1086` pixels, 4:3 visual reference
- implementation dimensions: `1120 x 700` pixels, captured at native 1x density
- density normalization: both images were resized to equal `720 x 540` evidence panels with cover cropping for the full-view comparison; HUD and central-world areas were also independently cropped and normalized for focused comparison
- state: spring daytime, sunny, 08:34 game time, farm view, watering tool selected, no modal

## Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] The reference has a denser fenced pasture and more finely illustrated ground transitions. The implementation deliberately uses independently animated buildings, trees, crops, animals, water, weather, player, and Buddy layers, so some transitions are less painterly than a single flattened illustration. This does not block the commercial desktop MVP.
- [P3] The task panel occupies slightly more vertical space than the reference. It remains readable, does not cover the player interaction area, and is suitable for dynamic task copy.

## Required Fidelity Surfaces

- Fonts and typography: clear display/body hierarchy, stable wrapping, appropriate small-text weight, and no truncation in the captured desktop viewport. Chinese system fallbacks differ from the illustrated reference lettering but remain visually coherent.
- Spacing and layout rhythm: profile, time/weather, navigation, task board, Buddy notice, world, and bottom tools form a consistent HUD frame. The 16:10 adaptation preserves the reference hierarchy without clipping persistent controls.
- Colors and visual tokens: warm cream HUD surfaces, moss green active states, dark translucent utility panels, sunny greens, orange roofs, and blue water map closely to the target palette with sufficient contrast.
- Image quality and asset fidelity: all prominent world imagery uses raster artwork rather than CSS/SVG substitutes. Terrain, vista, environment atlas, crops, animals, pet, player, and Buddy are composited as separate entities. No placeholder art is visible.
- Copy and content: farm copy is concise and product-specific. Goals, Buddy status, time, season, weather, tool names, interaction labels, and inventory counts are coherent in the standalone app.
- Icons and affordances: one consistent Phosphor icon family is used for HUD controls and tools; selected state, counts, labels, and practical click targets are visible.
- States and accessibility: native buttons retain semantic labels, active tool state is visually distinct, reduced-motion support remains available in CSS, and key controls are keyboard-reachable through their button semantics.

## Comparison History

### Iteration 1

- Earlier findings: the scene inherited the Mac's real midnight state, appeared excessively dark, and the farm felt empty.
- Fixes made: introduced an independent 08:30 game clock, derived world lighting from game time, removed the parent night overlay, and added independent sky, cloud, river-light, tree, smoke, animal, pet, and crop motion layers.
- Post-fix evidence: `/tmp/oneshow-commercial-farm-v2.png` and `/tmp/oneshow-commercial-farm-comparison-v2.png`.

### Iteration 2

- Earlier findings: field density, edge vegetation, distant scenery, and the task board still drifted from the commercial reference.
- Fixes made: added a parallax vista layer, denser independent tree entities, six crop fields with per-plant sway, brighter river integration, and a compact dynamic goal board.
- Post-fix evidence: `/tmp/oneshow-commercial-farm-v3b.png`.

### Iteration 3

- Earlier findings: final crop coverage and build capture were stale after the last scene composition changes.
- Fixes made: completed the additional crop fields, formatted and rebuilt the native app, recaptured the exact `1120 x 700` farm window, and compared both full view and focused HUD/world regions.
- Post-fix evidence: `/tmp/oneshow-commercial-farm-final.png`, `/tmp/oneshow-commercial-farm-comparison-final.png`, and `/tmp/oneshow-commercial-farm-focused-final.png`.

## Primary Interactions Tested

- Open desktop house and enter OneShow Home.
- Restore and raise the Farm scene in the native macOS app.
- Click the world/field and confirm semantic farm interaction remains active.
- Verify HUD, task board, tool dock, animal area, crop plots, player, and Buddy render together without overlap or clipping.
- Automated verification: 9 test files and 31 tests passed; type checking, linting, web build, and macOS application bundle build passed.

## Implementation Checklist

- [x] Commercial anime visual direction
- [x] Independent dynamic scene entities
- [x] Game-time-driven lighting and weather
- [x] Player path movement and walk state
- [x] Buddy autonomous movement and routine
- [x] Dynamic farm goals and interactive tool dock
- [x] Native macOS build and visual comparison

## Follow-up Polish

- P3: introduce a larger high-resolution player/Buddy walk atlas for sharper character silhouettes at Retina scale.
- P3: add seasonal fence and ground-edge variants while keeping every world entity independently animated.

final result: passed
