# Clean quotation imagery

## Goal and decisions
- Replace the long quotation cover, eight component pictures and both commercial/industrial system diagrams with new clean-background visuals.
- Use a consistent white backdrop, restrained navy and neutral equipment colours, realistic geometry and generous clear margins.
- Remove image credits, source links and generation labels from the quotation. Captions explain equipment functions without claiming an exact supplied make/model.
- Retain the established typography, section boundaries and minimum 80% final-page fill.
- Verify all replacement assets and the rendered On-Grid and Hybrid samples before delivery.
- The user authorized committing and pushing the completed image changes after restoring the original cover.

## Verification
- Replaced all 11 visuals and removed the eight obsolete component JPEGs and attribution metadata. Captions now explain the pictured equipment.
- All 31 Node test files pass, including image asset existence, configuration selection and omission of attribution labels.
- Browser layout checks pass for On-Grid (39 pages), Hybrid (41 pages) and dense-content stress (55 pages). All section final pages meet the 80% threshold, with no overflow or missing source text.
- Rendered both sample PDFs to A4 and visually inspected every replacement in context, including cover, both architecture diagrams, all eight components and adjacent continuation pages.
- Updated local sample PDFs under output/pdf; sample documents remain local and are excluded from the source commit.

## Cover follow-up
- Restore the original `Cover Page Image.png` on the long quotation at the user's request; retain the eight new component images and both diagrams.
- Refresh both sample PDFs with the restored cover.
- Both refreshed covers were visually verified; final PDF lengths remain 39 and 41 pages. All 31 tests pass before commit.
