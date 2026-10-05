# Background effects exploration

Date: 2026-10-05

## Goal
Offer at least ten subtle animated background ideas with live demos so the user can choose a direction for the Ray2Volt Solar Toolbox.

## Assumptions and principles
- This chat requests exploration; integration into the toolbox follows the user's choice.
- Preserve the existing cyan accents, sharp corners, opaque cards, and light/dark palettes.
- Motion should be slow, faint, peripheral, and independent of tool calculations.
- Backgrounds must not receive pointer events, obscure text, or enter printed documents.
- Respect reduced motion, allow pausing, and suspend inactive previews.

## Decisions
- Provide twelve distinct live effects in an inline comparison carousel.
- Use the same compact EMI calculator mockup for each effect, avoiding layout changes that would bias comparison.
- Include theme comparison, motion pause, and adjustable effect strength.
- Use lightweight CSS effects and local interactions, with no external assets or API calls.
- Use animation demos rather than static generated images because motion is the subject of this request.
- Store the preview in this chat's visualization directory; production tool files are unchanged.

## Options
Solar haze; corner glow; drifting dots; breathing grid; contour currents; soft aurora; diagonal daylight; horizon wash; orbital lines; quiet dust; cursor halo; paper grain.

## Status
Created twelve live previews and verified them in the in-app browser. Checked every carousel option, light/dark rendering, pause/resume, effect strength, live calculator inputs, and a 360px viewport (314px content frame, without horizontal overflow). Browser reported no console errors. Reduced-motion preference disables animation, and backgrounded or inactive previews suspend CSS motion. Production tool files remain unchanged. Await the user's selection after delivery.

## Follow-up: dots and grids
- User requested additional dot and grid effects, while retaining the original subtle style.
- Prior preview interaction showed Breathing grid at 50% strength. Treat this as exploration context, not a final implementation choice.
- Created a separate set of twelve additional live effects, starting at 50% strength: Dot tide, Dot shimmer, Layered dots, Dot ripple, Connected dots, Cursor dots, Grid glide, Grid sweep, Perspective grid, Grid junctions, Solar cells, Blueprint layers.
- Reuse the same tool mockup and light/dark, intensity, pause, reduced-motion, and print handling.
- Keep both demo sets available; integrate only after a final choice.
- Verified all twelve new carousel options, rendered light/dark previews, and checked pause through the computed animation state. Browser reported no errors or warnings. At a 360px viewport the app fits its 314px frame with no horizontal overflow. Ready for the user's choice.

## Follow-up: cursor dots theme balance
- User likes Cursor dots in light mode; dark mode draws too much attention at the same strength setting.
- Adjust only Cursor dots: keep the light dot alpha at 33%; reduce the dark dot alpha to 14% before the shared intensity setting and feathered pointer mask apply. This reduces dark dot intensity by about 58%.
- Preserve dot size, spacing, pointer lag, and light-mode appearance. Continue to treat this as preview refinement until integration is requested.

## Approved implementation
- User approved the revised Cursor dots and explicitly requested implementation, commit, and push.
- Use the most recently previewed 100% strength, with light alpha 33% and dark alpha 14%.
- Add shared background CSS and JavaScript to the dashboard and all eighteen tool pages.
- Keep the background behind the full app without changing card fills, document palettes, or existing modal/sidebar stacking.
- Animate only while following the pointer; stop when settled, hidden, navigating, or printing. Reduced-motion and coarse-pointer devices get a still corner patch.
- Add checks for pointer tracking, idle stopping, touch/reduced-motion handling, print suspension, and complete page coverage.
- Leave unrelated local `.env.local` and `.claude/worktrees/` files out of the commit.
- Implemented in `global/styles/cursor-background.css` and `global/scripts/cursor-background.js`, loaded by all nineteen pages with a release cache tag.
- All 35 `tests/*.test.js` files passed, including the new background behavior and page-coverage tests; `git diff --check` passed.
- In-app browser checks verified dashboard navigation, pointer movement, approved light/dark dot intensity, opaque cards, report preview above the sidebar, mobile layout, and sidebar collapse. No browser console errors.
- Implementation complete and verified. The user authorized committing and pushing these changes; the Git destination is `origin/main`.
