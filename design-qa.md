# OneShow Home Entry Experience — Design QA

## Evidence

- Source visual truth:
  - `/var/folders/2c/sdg0hxmx3b5_x84y09b7hk1w0000gn/T/codex-clipboard-dca27ff7-83b7-4cb6-81cc-9b74a3b76ad3.png`
  - `/var/folders/2c/sdg0hxmx3b5_x84y09b7hk1w0000gn/T/codex-clipboard-3c204282-7c96-487c-bd45-5336ffff7fd9.png`
- Implementation screenshots:
  - `.qa/house-implementation-v1.png`
  - `.qa/transition-implementation-final.png`
  - `.qa/home-implementation-v1.png`
- Combined comparison input: `.qa/design-comparison-final.png`
- Viewport: macOS native windows; Home configured at 1120 × 700 CSS px, house at 310 × 290 CSS px.
- Source pixels: flow board 1310 × 1201; exterior board 1402 × 1122.
- Implementation pixels: Home 1188 × 768 including native frame/shadow; transition 1188 × 768 including native frame/shadow; house 310 × 290.
- Density normalization: source crops and implementation captures were fitted into equal 900 × 526 evidence panels without stretching; aspect ratio was preserved.
- State: evening desktop cottage, mid-entry doorway push, and final living-room interaction state.

## Findings

- No actionable P0/P1/P2 visual mismatch remains.
- Fonts and typography: native Apple system typography, compact weights, and Chinese fallback hierarchy align with the macOS direction. Small labels remain readable at the target window size.
- Spacing and layout rhythm: persistent left room rail, right quick rail, top weather card, Buddy speech, and bottom chat dock match the reference hierarchy without covering Buddy or primary room objects.
- Colors and visual tokens: the amber/brown translucent controls, cream speech surface, and warm highlight color consistently follow the source palette and maintain usable contrast.
- Image quality and asset fidelity: exterior, doorway, and interior are real raster assets in one coherent premium 3D miniature style. The exterior uses a verified alpha channel and has no placeholder SVG/CSS artwork.
- Copy and content: room names, quick actions, weather, Buddy welcome, and chat prompt reproduce the intended product roles with concise MVP copy.
- Expected deviation: the source exterior is shown against a designed landscape wallpaper while the implementation intentionally uses transparency so the user's real desktop remains visible.

## Focused Region Comparison

- The combined comparison includes focused, equal-slot evidence for all three key regions: Home UI composition, doorway transition frame, and transparent cottage silhouette. No additional crop was needed because each focus area is legible at 900 px panel width.

## Comparison History

1. Initial native capture confirmed the Home composition but did not show the doorway frame. Investigation found an event-delivery race between showing the native window and mounting the listener (P1 interaction reliability).
2. Fixed by persisting a pending transition in Rust and consuming it on either the Tauri event or native focus change. Added a deterministic preview flag for native visual QA.
3. Post-fix capture `.qa/transition-implementation-final.png` confirms the doorway push and warm-light crossing frame renders inside the native app before the final room reveal.

## Implementation Checklist

- [x] Transparent desktop cottage uses the new production raster asset.
- [x] Cottage click begins a short exterior camera approach.
- [x] Native Home window reliably plays the doorway push transition.
- [x] Final living room exposes working room controls, return-to-desktop, and local chat interaction.
- [x] Reduced-motion preferences collapse animation duration.
- [x] Frontend tests, lint, typecheck, Rust tests, and macOS app build pass.

## Follow-up Polish

- P3: future day/night and weather art variants should reuse the same camera, cottage silhouette, and Buddy proportions to avoid visible style drift.

final result: passed
