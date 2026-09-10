# Long quotation preview refinements — 10 September 2026

## Goal and scope
- User requested five targeted changes after reviewing the previous redesign, followed by a sample PDF for further feedback.
- Show the entire proposal continuously, like the Short Quotation, without a page picker or thumbnail rail.
- Start the next section on a new page when preceding content reaches 75% of the available page body.
- Show only quotation number and date in the cover's top-right reference block.
- Remove the narrow separation and vertical rules between the label/value columns in Document Control, while keeping the two Prepared For/Prepared By tables separate.
- Use the section occupying the greatest vertical area as the page's running header.
- Preserve inputs and calculations. Do not use Claude Code. No new commit or push requested in this phase.

## Decisions and implementation
- Replaced single-page selection with a continuous A4 preview using clones of every print-source page. Removed obsolete page selection, thumbnail and keyboard-selection code.
- Applied the 75% rule before adding a new section. Disabled extra spacing between blocks on mixed-section pages so spacing cannot push a transition past the threshold afterward.
- Measured each section's occupied block height, including its heading and margins, to choose the running header. Kept section membership for contents references independent of the dominant header.
- Removed revision and validity only from the cover. They remain in Document Control and the existing inputs.
- Prepared For/Prepared By use the standard 3mm gap and complete card borders. Document Control keeps horizontal row separators, with no vertical column dividers or gaps between the label/value columns within each table.
- User clarified that item 4 requires row lines to remain. Removed the override that suppressed horizontal rules; the existing rules now run continuously across both columns.
- User then clarified that Prepared For and Prepared By must remain separate tables. Removed the overrides that joined those cards, restoring the existing grid spacing and outer borders.
- Updated the default validity clause to refer to Document Control now that validity is absent from the cover. Existing saved custom clauses are preserved.

## Verification
- Browser checks pass for the complete On-Grid proposal (30 pages), Hybrid proposal (30 pages) and long-text stress case (45 pages).
- Checks cover complete preview page count, absence of obsolete selectors, source-content retention, overflow, page numbering, contents references, 75% section transitions and dominant headers.
- Visually checked continuous preview on desktop (1440px) and mobile (390px); mobile has no horizontal document overflow. Reset the temporary viewport override afterward.
- All 28 Node test files pass. `git diff --check` passes. Final sample browser has no console errors.
- Windows UI automation stopped because it could not confidently determine the current browser URL. Stopped native UI automation and used an isolated headless Chromium document renderer on the local rendered HTML instead.
- Saved `output/pdf/Ray2Volt-sample-long-quotation.pdf`: 30 A4 pages, searchable text, synthetic Example Industries customer, 250 kWp On-Grid system, all standard sections and acceptance.
- Rendered and visually inspected every PDF page using Poppler. Confirmed page count, A4 geometry, all footer numbers and cover metadata from the saved PDF.
- Final validity-reference update changed only PDF page 28; verified this with rendered-image hashes and re-inspected that page. Other 29 pages are unchanged from the full visual pass.
- Supporting JSON checks, screenshots, source HTML and PDF renders are under `tmp/quotation-refinements/`.
- After the row-separator correction, regenerated the sample PDF and visually checked Document Control. Horizontal rules run continuously across label/value columns; no vertical column dividers remain. Image hashes confirm only page 2 changed. The PDF still has 30 A4 pages with correct numbering, and `git diff --check` passes.
- After restoring the gap between Prepared For and Prepared By, regenerated the PDF again and visually confirmed two separate, aligned cards with intact horizontal row lines. Only page 2 changed; all 30 pages remain A4 with correct numbering. `git diff --check` passes.
