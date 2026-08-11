# OneShow Home Anime Farm v3 Design QA

## Evidence

- Source visual truth: `.qa/farm-anime-v3-source.png`
- Packaged macOS implementation: `.qa/farm-anime-v3-implementation.png`
- Side-by-side comparison: `.qa/farm-anime-v3-comparison.png`
- Source pixels: 1448 × 1086.
- Implementation pixels: 1188 × 768, including the native macOS title bar. The playable CSS surface is 1120 × 700 at display scale 1.
- Comparison canvas: 2256 × 768. The source was proportionally normalized to 1024 × 768 and placed beside the 1188 × 768 implementation without cropping.
- State: bright spring farm, water tool selected, four empty persisted plots, Buddy idle on the central path.
- Runtime: packaged native Tauri application, which is the requested desktop product and the only runtime with the local persistence bridge.

## Full-view comparison evidence

The side-by-side comparison confirms that the redesign carries the source's defining anime-game language: bright cyan sky, large white clouds, layered green mountains, crisp olive linework, flatter cel-shaded surfaces, orange-roof cottage, blue-roof barn, fenced animals, clear river, bridge, ordered crop beds and a light cream game HUD. The reference is 4:3 while OneShow Home's product surface is 16:10; the environment was redrawn for the wider viewport rather than stretched or cropped.

The implementation preserves OneShow Home's existing playable structure: click-to-move navigation, four personal plots, animal and river hotspots, task state, Buddy notifications, inventory/map/diary panels and the six-tool dock. This is an art-direction change, not a static mock or loss of behavior.

## Focused comparison evidence

- Top HUD: the profile card, season/time/weather card and five compact actions use the source's cream, muted green and warm-gold visual families with similar corner radii and hierarchy.
- Mission panel: the dark translucent green task surface matches the source's lightweight overlay treatment while keeping live progress values readable.
- World art: cottage, barn, cow, sheep, chicken coop, river, bridge, crop beds and four empty plots are real raster artwork in one coherent scene; no CSS illustration or placeholder geometry is used.
- Buddy: the character is depth-scaled to the source's small in-world proportion, begins on the open central path and switches to the existing four-frame walking sheet while moving.
- Tool dock: the cream bottom dock is centered and compact, uses one consistent icon family, has a clear green selected state and does not cover the interactive plots.

## Required fidelity surfaces

- Fonts and typography: PingFang SC supplies compact native Chinese game UI; the player name retains the existing Songti/Georgia display treatment. Weights and line heights preserve the source's hierarchy at the smaller desktop window. No actionable wrapping or truncation is visible.
- Spacing and layout rhythm: the top cards share a consistent inset and height family; the mission panel aligns beneath the profile; the bottom dock is centered; the notification sits below top actions. Persistent controls remain inside the playable viewport.
- Colors and visual tokens: high-key sky blue, fresh leaf green, orange tile, cream parchment, olive translucent panels and warm gold accents reproduce the reference's bright anime palette. The old dark scene filter was removed.
- Image quality and asset fidelity: `farm-world-anime-v3.png` is a dedicated 1672 × 941 game background generated for this product slot. It has clean linework, readable crop boundaries and no embedded UI or text. Existing transparent Buddy and crop rasters are used at appropriate in-world scale; Phosphor supplies standard interface icons.
- Copy and content: labels remain product-specific and concise. Buddy's notice describes autonomous companion behavior, while task and tool copy stays grounded in the playable farm loop.
- Accessibility and states: interactive hotspots are native labelled buttons; active tools retain visible state; panels and movement surfaces have accessible names; disabled states remain wired to in-progress actions.

## Comparison history

### Iteration 1

- [P1] Previous farm art was dark and painterly, not the requested bright cel-shaded anime style.
  Fix: generated and integrated a new full-bleed world with crisp linework, flatter color, blue sky, white clouds and distant mountains.
- [P2] Previous HUD surfaces were visually heavy and pulled attention away from the world.
  Fix: reduced shadow weight, lightened cream surfaces, changed dark controls to translucent slate-green and centered the bottom tool dock.
- [P2] Buddy was oversized relative to the new environment.
  Fix: reduced idle/gardening/fishing depth scale while preserving the existing walk-cycle behavior.
- Post-fix evidence: `.qa/farm-anime-v3-implementation.png` and `.qa/farm-anime-v3-comparison.png`.

### Final pass

No actionable P0, P1 or P2 mismatch remains for the user's requested art-direction update. Differences such as the widescreen composition, dedicated fishing action and Buddy activity notice are intentional OneShow Home product adaptations rather than visual regressions.

## Primary interactions verified

- Click-to-move continues to update Buddy position and use the walk-cycle sheet.
- Water, hoe, axe, basket, seed and feed tools retain selected/disabled states.
- The four persisted plots still plant, water and harvest through the local store.
- Animal feeding and fishing continue to walk to their targets before resolving.
- Backpack, map and diary panels remain interactive.
- Frontend, API and Rust verification suites all pass.

## Follow-up polish

- [P3] Add dedicated front/back walk sheets when navigation expands from the current horizontal four-frame cycle to eight-direction movement.

final result: passed
