# OneShow Home Interactive Desktop Cottage — Design QA

## Evidence

- Source visual truth: `/var/folders/2c/sdg0hxmx3b5_x84y09b7hk1w0000gn/T/codex-clipboard-b624bc0e-a15b-474d-95e7-b9ee2af42d43.png`
- Implementation screenshots: `.qa/interactive-house-idle.png`, `.qa/interactive-house-wave.png`
- Combined comparison input: `.qa/interactive-house-comparison.png`
- Viewport: macOS transparent native house window configured at 310 × 290 CSS px.
- Source pixels: 296 × 374; implementation pixels: 310 × 290 for both states.
- Density normalization: the source and both native captures are shown at native scale in one 1020 × 430 comparison canvas. Aspect ratios are preserved.
- State: source fixed Buddy; implementation idle breathing state and automatic/hover greeting state.

## Findings

- No actionable P0/P1/P2 visual or interaction mismatch remains.
- Fonts and typography: the only transient copy is the compact `你好呀` response, using the existing Apple/PingFang UI stack at a readable 10 px optical weight. No persistent label competes with the cottage.
- Spacing and layout rhythm: Buddy remains anchored to the front steps without covering the door, cat, mailbox, or cottage silhouette. The former top drag control has been removed, reducing visual clutter.
- Colors and visual tokens: the transient cream-and-botanical-green speech pill matches the Home interface and existing website palette.
- Image quality and asset fidelity: cottage, idle Buddy, and waving Buddy are separate production raster assets in the same hand-painted anime style. All three alpha channels were verified. No character or illustration is approximated with CSS, SVG, emoji, or placeholders.
- Copy and content: `你好呀` appears only during the greeting state; the hover hint now explains both gestures: `轻点回家 · 按住拖动`.
- Interaction: moving at least 5 px or holding for 180 ms starts native window dragging; a short press still opens Home. Buddy breathes continuously, greets every 9 seconds, and greets immediately on pointer hover.

## Focused Region Comparison

- The complete 310 × 290 widget is itself the focused region. The combined input places the fixed source, new idle state, and new wave state together, so character separation, alignment, and state change are directly visible without another crop.

## Comparison History

1. Source capture showed two P1 product issues: Buddy was baked into the cottage bitmap, and dragging depended on a small top `…` handle.
2. Rebuilt the cottage as a character-free base layer, added separate idle and greeting Buddy assets, and introduced state-driven cross-fade/micro-motion.
3. Replaced handle-only dragging with a gesture threshold on the entire cottage surface while preserving click-to-enter.
4. Post-fix evidence `.qa/interactive-house-comparison.png` confirms the fixed character is removed, the greeting state is visually distinct, and the obsolete drag control no longer appears.

## Implementation Checklist

- [x] Buddy is independent from the cottage artwork.
- [x] Idle breathing and greeting states animate automatically.
- [x] Hovering the cottage triggers an immediate Buddy response.
- [x] The complete cottage surface supports native dragging.
- [x] Short press still enters Home without triggering a drag.
- [x] Frontend lint, typecheck, 19 tests, production build, Rust formatting, and 4 Rust tests pass.
- [x] Unsigned macOS `.app` bundle builds successfully.

## Follow-up Polish

- P3: a future animation pack can add blinking, reading, watering, sleep, and weather-specific actions while keeping the same sprite anchor and character scale.

final result: passed
