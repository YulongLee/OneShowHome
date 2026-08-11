# OneShow Home Farm v2 Design QA

## Evidence

- Source visual truth: `.qa/farm-v2-source.png`
- Native macOS implementation: `.qa/farm-v2-implementation.png`
- Side-by-side comparison: `.qa/farm-v2-comparison.png`
- Source pixels: 1307 × 1203.
- Implementation pixels / CSS viewport: 1120 × 700, captured from the packaged macOS application at display scale 1.
- Comparison canvas: 1881 × 700. The source was proportionally normalized to 761 × 700 and placed beside the 1120 × 700 implementation without cropping.
- State: spring daylight farm, water tool selected, two growing plots and two open plots, Buddy idle on the central path.
- Browser note: the in-app browser preview was checked at `127.0.0.1:1420`; it correctly cannot load the native Tauri data bridge. Product QA therefore uses the packaged native application, which is the actual requested runtime.

## Full-view comparison evidence

The comparison image confirms that the implementation carries over the reference's defining hierarchy: profile and energy at top-left, season/time/weather beside it, five compact actions at top-right, a translucent task board on the left, a Buddy action notice on the right, one continuous 2.5D farm world, persistent tools at the bottom and a dedicated river action. The scene was intentionally adapted from the source's near-square composition to the product's 16:10 macOS window instead of stretching or cropping the reference.

## Focused comparison evidence

- HUD: profile, level, energy, coins, season, day, time and weather remain readable against the detailed scene and use the same cream, olive and dark translucent surface families as the source.
- Farm world: cottage, blue-roof barn, pasture, chicken coop, cultivated fields, four personal plots, river and bridge are visible in one camera view. The central stone path remains unobstructed for character navigation.
- Tools and crops: the selected water tool has a clear active state; seed selection expands into a six-crop chooser; four persisted plots remain individually clickable and show empty, growing and harvest-ready states.
- Buddy behavior: the character stands on the central path, uses the four-frame walk cycle during navigation, walks to a target before acting, and returns to the standing frame. Farm action notifications describe Buddy's current or completed work.
- Panels: backpack, map and diary open as real panels and close through a labelled control. Wardrobe and settings are intentionally preview-only because they are outside the first playable farm loop.

## Required fidelity surfaces

- Fonts and typography: the implementation uses PingFang SC for dense game UI and Georgia/Songti-style display faces for the player name and panel titles. Weight, line height and compact labels match the source hierarchy without illegible microcopy at 1120 × 700.
- Spacing and layout rhythm: top HUD groups align to a shared 18–20 px inset; the mission board follows the profile column; the toolbelt uses six equal slots and does not cover the four interactive plots. No persistent control overflows the window.
- Colors and visual tokens: warm parchment, dark olive, muted gold, spring green and river teal consistently map to profile, tasks, selected tools, notifications and action controls. Text contrast remains readable over the painted background.
- Image quality and asset fidelity: the farm world is a dedicated 1672 × 941 raster asset created for the 16:9 gameplay slot, not a screenshot crop or CSS illustration. Existing Buddy and crop raster assets remain sharp at product scale. Phosphor provides the UI icon family; no emoji, handcrafted SVG illustration or placeholder art is used.
- Copy and content: the HUD and tasks use OneShow Home's companion framing. Buddy says what it is doing and promises to observe crops, rather than presenting the farm as an anonymous economy simulator.
- Accessibility: primary controls are native buttons with visible labels, active tools expose `aria-pressed`, map movement has an accessible name, panels have labelled regions and a labelled close button, and keyboard focus uses the existing application focus treatment.

## Comparison history

### Iteration 1

- [P1] The old screen read as a Home page with overlays rather than a farm game.
  Fix: replaced the sparse farm scene and inherited Home rails with a complete game HUD and a dedicated continuous 2.5D world.
- [P1] The previous scene lacked the reference's coherent cottage–pasture–fields–river composition.
  Fix: generated and integrated a widescreen farm world with all gameplay regions and a reserved central movement path.
- [P2] The seed chooser was permanently open and created a second competing bottom toolbar.
  Fix: changed the default tool to the water can; the crop chooser now opens only after selecting the seed tool.
- [P2] Buddy initially stood over the cabbage field and was too large for the scene scale.
  Fix: moved the initial position to the central stone path and reduced depth-scaled character sizing.
- Post-fix evidence: `.qa/farm-v2-implementation.png` and `.qa/farm-v2-comparison.png`.

### Final pass

No actionable P0, P1 or P2 visual mismatches remain for the scoped first playable farm loop. The missing social, shop, activity and circular world-map controls are intentional scope exclusions from the reference, consistent with the supplied PRD's first implementation round.

## Primary interactions tested

- Click map ground and transition from idle to the four-frame walk cycle, then back to idle.
- Select water, hoe, axe, basket, seed and feed tools with visible active states.
- Open and close backpack; expose persisted crop inventory.
- Open map and diary panels.
- Select a crop, interact with persisted land, water growing crops and harvest ready crops.
- Walk to pasture animals before feeding; walk to the river before fishing.
- Automated frontend, API and Rust state tests verify the existing crop, fishing and animal persistence paths.

## Follow-up polish

- [P3] Add north/south walk-cycle sheets when movement expands from left/right presentation into eight-direction navigation.
- [P3] Add alternate weather and seasonal farm-world assets after the spring gameplay loop is stable.

final result: passed
