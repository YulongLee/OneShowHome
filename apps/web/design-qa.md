# OneShow Home Website — Design QA

## Evidence

- Source visual truth: `/var/folders/2c/sdg0hxmx3b5_x84y09b7hk1w0000gn/T/codex-clipboard-853a89d1-9c5d-4087-a7a4-e43f624a7757.png`
- Browser-rendered implementation: `.qa/desktop-final.png`
- Mobile implementation: `.qa/mobile-top-v1.png`
- Combined comparison input: `.qa/design-comparison.png`
- Source pixels: 1214 × 1295.
- Desktop browser viewport/capture: 1270 × 1093 CSS px at device scale 1.
- Mobile browser viewport/capture: 325 × 703 CSS px at device scale 1.
- Density normalization: source top region and implementation viewport were fitted without stretching into equal 1214 × 900 comparison panels.
- State: top-of-page desktop landing experience; mobile top-of-page with collapsed navigation.

## Findings

- No actionable P0/P1/P2 difference remains.
- Fonts and typography: the implementation uses a Chinese Song-style display stack for the emotional headings and a compact system sans-serif for navigation and controls, matching the source hierarchy and optical contrast.
- Spacing and layout rhythm: header, left-aligned hero copy, right-side cottage focal point, feature-card row, journey cards, full-width story scenes, FAQ, and waitlist maintain the source structure. Production spacing is intentionally more generous than the compressed full-page design board.
- Colors and visual tokens: sky blue, cream, botanical green, warm brown, translucent cream controls, restrained borders, and soft shadows consistently follow the source palette.
- Image quality and asset fidelity: hero, home diary, and future world use three production raster scenes generated from the supplied reference. They share the same hand-painted anime storybook direction and contain no placeholder CSS/SVG illustration.
- Copy and content: Chinese-first copy clearly explains the home, Buddy, memory growth, world expansion, platform requirements, and early-access action.
- Responsive behavior: mobile has no horizontal overflow (`scrollWidth === innerWidth`), preserves the hero hierarchy, and exposes a working menu.

## Primary Interactions Tested

- Navigation anchor scrolling and mobile navigation open/close.
- Download CTA opens the macOS early-access dialog.
- Product-story CTA opens and closes the story dialog.
- FAQ accordion changes expanded state.
- Email form validates an email and reaches the local success state.
- Browser console checked after interaction testing: no errors or warnings.

## Focused Region Comparison

- The equal-size comparison makes the header, hero typography, CTA treatments, house/Buddy art direction, palette, and beginning of the feature narrative legible. The mobile capture separately verifies the responsive hero and navigation; no additional focused crop was necessary.

## Comparison History

1. Initial browser capture confirmed the full section structure, visuals, and interactions. No P0/P1/P2 discrepancy was found.
2. Desktop and mobile width checks confirmed zero horizontal overflow, and the final console check remained clean.

## Follow-up Polish

- P3: create four dedicated feature-card illustrations later if stronger thumbnail variety is desired; the current cards intentionally reuse coherent crops from the production scenes.

final result: passed
