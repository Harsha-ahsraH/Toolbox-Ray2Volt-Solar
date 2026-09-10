# Long quotation visual redesign — 10 September 2026

## Goal and direction
- User rejected the previous long quotation design after testing it.
- Keep every existing input and its meaning; improve the entire input interface.
- Personally inspect every quotation page and every input component visually.
- All pages should feel full and composed, without arbitrary blank areas.
- Do not use Claude Code. The earlier instruction to use it is superseded.

## Principles and assumptions
- Use the Short Quotation's existing fonts, colours, controls, and document stationery.
- Keep customer data, calculations, defaults, section choices, draft persistence, and export behaviour.
- Use local synthetic fixtures, isolated from saved customer drafts, for visual checks.
- Full pages means flowing useful existing content together with readable spacing; do not invent claims or pad the proposal with filler.
- Record actual page-by-page screenshots and component checks, including conditional inputs and mobile layouts.

## Initial visual evidence
- Existing desktop customer panel has a large full-width customer-type field, cramped three-column fields, an orphaned CIN field, and an address label touching the field above.
- Reset actions take prime space above the actual inputs in every panel.
- The mobile entry is dominated by workspace controls and the section checklist before customer inputs are reached.
- The standard 250 kWp fixture produces 42 pages, including two contents pages. Page fullness needs a separate layout review, beyond overflow checks.
- Current screenshots are saved in `tmp/long-quotation-visual-audit/`.

## Decisions
- Replace the long accordion journey with a section navigator and one focused editor at a time, keeping all input fields.
- Use two-column field groups, clear subsection boundaries, readable repeating rows, and quieter reset actions at the bottom.
- Investigate measured content flow to consolidate short document sections into complete A4 pages.

## Implementation decisions and completed work
- Implemented nine focused input editors with a desktop section navigator, mobile picker, completion states and Back/Next navigation. Existing fields, IDs and data bindings remain in place.
- Matched the Short Quotation's fonts and colour tokens. Improved field spacing, labels, repeating rows, disabled controls, narrative areas and reset-action placement.
- Added equipment/category and clause/group selectors. Specifications and remarks now use textareas; long clauses grow with their content.
- Verified company/individual, Hybrid battery, mixed installation, simple/detailed consumption, cost rows, milestones, included/excluded clauses and empty/populated attachment states.
- Fixed automatic proposal-title updates when switching system configurations; manually edited titles remain preserved.
- Added measured A4 composition shared by preview and print source nodes. Sections flow together, tables retain headings and categories, and long text can continue without being dropped.
- Consolidated contents to one page; rebuilt all contents, footer and annexure-index references from the final measured plan.
- Combined small annexure indexes with their first drawing page. Refined cover, document-control, acceptance and a short final closing-section variation.
- Fixed a visually detected collision between continuation clause numbers and clause text.
- Kept export unavailable until the fonts and initially rendered images settle before the final layout pass.

## Verification and evidence
- Visually inspected every page of the 30-page On-Grid fixture with all available sections, including acceptance. The original 43 source pages compose into 30 pages, with measured body occupancy of 86–100%.
- Visually inspected all 45 pages of a stress fixture with very long custom narrative, equipment specification and contract clause text.
- Inspected the Hybrid-specific architecture and battery pages, plus the shared section designs already covered by the full On-Grid review. Automated geometry/content/reference checks pass for all 30 Hybrid pages.
- Inspected all nine input sections on desktop light, desktop dark and mobile layouts, including lower portions of long editors and conditional component states. Verified mobile preview, fixed-header spacing, sticky desktop navigation and validation routing.
- Browser checks pass for On-Grid (30 pages / 1,364 source text runs), Hybrid (30 / 1,405), stress (45), attachments (30) and detailed consumption with attachment (31). JSON results hold the precise final run counts.
- Verified an actual uploaded drawing loads and survives reload. A fixture-only shared IndexedDB name originally caused test fixtures to prune one another's files; each fixture now uses an isolated database. No real customer drafts or uploads were used.
- Final `node --test tests/*.test.js`: all 28 test files pass. New JavaScript syntax checks and `git diff --check` pass. Final stress fixture has no console errors.
- Review report: `tmp/long-quotation-visual-audit/visual-review.html`. It links the complete page-by-page screenshot gallery, desktop/mobile/dark input evidence, variation viewers and machine-readable check results.
- Viewport override reset after responsive checks. Claude Code was not used.
- After reviewing the completed redesign, the user explicitly requested committing and pushing it to the current branch (`main`). Generated screenshots and local review fixtures remain ignored under `tmp/`.

## Practical limits
- Visual review covers rendered A4 browser nodes, which are also the print source. The native OS Print / Save as PDF dialog was not automated or visually inspected.
- Recorded fixtures cover the named states and component designs, not every possible custom text combination or arbitrary uploaded PDF.
