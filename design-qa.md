# OneShow Home Anime Desktop — Design QA

## Evidence

- Source visual truth: `/var/folders/2c/sdg0hxmx3b5_x84y09b7hk1w0000gn/T/codex-clipboard-853a89d1-9c5d-4087-a7a4-e43f624a7757.png`
- Implementation screenshots: `.qa/anime-home.png`, `.qa/anime-house.png`
- Combined comparison input: `.qa/anime-comparison.png`
- Viewport: macOS native Home window configured at 1120 × 700 CSS px; transparent house window at 310 × 290 CSS px.
- Source pixels: 1214 × 1265.
- Implementation pixels: Home capture 1232 × 812 including native frame/shadow; house capture 310 × 290.
- Density normalization: source and Home capture were fitted into separate 1200 px comparison columns with aspect ratio preserved; the house capture remained at its native pixel size.
- State: final living-room interaction state and idle transparent desktop cottage.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- Fonts and typography: Apple system typography and PingFang Chinese fallbacks preserve the reference's quiet, editorial hierarchy. Labels remain readable at native desktop size.
- Spacing and layout rhythm: the left room rail, right quick rail, status/weather cards, Buddy speech, and bottom chat dock leave the character and room focal points visible. Rounded cream surfaces reproduce the soft card rhythm of the website.
- Colors and visual tokens: botanical green, warm cream, honey wood, and muted coral are consistently shared by the illustration assets and interactive controls. Contrast is usable without returning to the previous dark HUD style.
- Image quality and asset fidelity: the cottage, doorway, living room, and Buddy portrait are real production raster assets generated in one hand-painted anime storybook direction. Cottage and avatar alpha channels were verified; no visible illustration is approximated with CSS, SVG, emoji, or placeholders.
- Copy and content: room names, Buddy status, time/weather, quick actions, welcome line, and chat prompt remain concise and aligned with the MVP.
- Expected deviation: the website shows the cottage inside a landscape hero, while the native widget intentionally has a transparent background so it can live naturally on the user's real desktop.

## Focused Region Comparison

- The combined input includes the full website source, the complete native Home window, and the native-size cottage widget in one canvas. The controls, character rendering, palette, and cottage silhouette are legible at that scale, so another focused crop was not required.

## Comparison History

1. Earlier implementation used a glossy 3D miniature cottage, dark brown glass controls, and a 3D interior. These were P1 style mismatches against the selected hand-painted anime reference.
2. Replaced all four character/environment assets, converted required backgrounds to alpha, and remapped UI tokens to cream paper and botanical green.
3. Post-fix evidence `.qa/anime-comparison.png` confirms the native app and website now share character design, cottage architecture, illustration texture, palette, and emotional tone. No P0/P1/P2 findings remain.

## Implementation Checklist

- [x] Transparent anime cottage is readable at 310 × 290.
- [x] Doorway transition uses the same cottage and interior art direction.
- [x] Living room, Buddy, cat, and portrait remain visually consistent.
- [x] Native room controls, return-to-desktop, quick actions, and local chat remain functional.
- [x] Frontend lint, typecheck, 17 tests, production build, Rust formatting, and 4 Rust tests pass.
- [x] Unsigned macOS `.app` bundle builds successfully.

## Follow-up Polish

- P3: future day/night and weather variants should retain the same camera, line weight, Buddy proportions, and green/cream token system.

final result: passed
