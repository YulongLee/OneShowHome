# OneShow Home Farm Design QA

## Evidence

- Source visual truth: `.qa/farm-reference.png`
- Final implementation: `.qa/farm-implementation.png`
- Focused fishing state: `.qa/farm-fishing-state.png`
- Focused animal-care state: `.qa/farm-animal-state.png`
- Source pixels: 1313 × 1198
- Implementation pixels / CSS viewport: 1120 × 700 at macOS display scale captured as a window region
- State: daylight farm, existing planted crops, default planting tool selected
- Density normalization: the source is a portrait-like game composition while the product is a fixed 16:10 desktop window. Comparison therefore uses equal full-screen content framing rather than pixel-for-pixel scaling.

## Full-view comparison evidence

The implementation preserves the source's defining composition: cottage on the left, pasture and animals above, cultivated plots in the center, water on the right, Buddy in the working area, and a persistent tool dock along the bottom. It deliberately removes the source's shop, currencies, social, event, map and monetization surfaces to remain inside OneShow Home's companion-product scope.

## Focused comparison evidence

- Fishing: the pond is visible and clickable, switches Buddy to a dedicated fishing pose, waits for a catch, updates the fish inventory, and displays a success notice.
- Animal care: cow, sheep and hen remain visually distinct in the pasture. Feeding Momo updates affection, daily-fed state, Buddy dialogue and the animal tool panel.
- Planting: all four plots retain visible interaction regions; planted crops show growth scale, mature harvest affordance and offline timers. The lower plot was raised so the persistent tool dock no longer blocks its primary hit target.

## Required fidelity surfaces

- Fonts and typography: matches the existing OneShow Home compact macOS UI hierarchy. Small labels remain readable at the 1120 × 700 product viewport.
- Spacing and layout rhythm: persistent room rails, status cards, tool dock and chat dock remain aligned to the current desktop design system. Farm regions do not overflow the window.
- Colors and visual tokens: warm cream surfaces, sage actions, terracotta roofs and sky-blue water match both the source direction and existing Home scenes.
- Image quality and asset fidelity: the farm scene, animal trio and fishing Buddy are full raster assets generated in the same hand-painted anime style. Transparent assets have clean alpha edges and no visible chroma-key halo at product scale.
- Copy and content: language is companion-oriented and action-specific. Commercial and social copy from the source was intentionally omitted.

## Comparison history

### Iteration 1

- [P2] Buddy dialogue obscured part of the animal group.
- [P2] The fourth plot's interaction center sat too close to the bottom tool dock.
- Fixes: moved the farm dialogue bubble to the open left path and raised the fourth plot interaction center from 79% to 72%.
- Post-fix evidence: `.qa/farm-implementation.png` shows all animals unobstructed and the lower crop/plot affordance above the dock.

### Final pass

No actionable P0, P1 or P2 differences remain. The lower interface density versus the reference is an intentional desktop-companion constraint, not unfinished fidelity.

## Primary interactions tested

- Select planting mode and interact with a plot.
- Select fishing mode, click the pond, catch a fish and update inventory.
- Select animal mode, feed Momo and update affection/daily state.
- Switch between planting, fishing and animal tool panels.

## Follow-up polish

- [P3] Add one alternate idle pose per animal in a later animation pass.
- [P3] Add seasonal farm background variants after the core Home loop is stable.

final result: passed
