# Quotation section page composition

## Goal
- Each proposal section starts on a new page and occupies at least 80% of its final page.
- Review all sections, revising explanatory content and composition to make the document read as complete, deliberate pages.

## Principles and assumptions
- This replaces the previous 75% rule that allowed sections to share pages.
- Retain the established typography, navy palette, real component images and full continuous preview.
- Preserve entered customer facts, equipment, financial calculations and commercial clauses. Editorial additions explain the offer without inventing commitments or site findings.
- Rebalance continuation pages before adding space. Keep headings with content, photo credits with images, and table headers with rows.
- Use synthetic On-Grid, Hybrid and stress fixtures, then render sample PDFs for visual review.

## Decisions
- Every section now starts on a fresh page, including the annexure index. The 80% target measures the usable body between the running header and footer.
- Added section-specific editorial context to short sections and used full-width steps/checklists where that improves reading. Entered project facts, calculations, equipment rows and contractual clauses are retained.
- Compact spacing resolves small overruns without shrinking type. Longer tables and lists redistribute their final items backwards across existing continuation pages, preserving order, headers and page references.
- A final spacing pass uses modest row/card padding and block spacing. Card header bands remain attached; photographs preserve their aspect ratio. The battery illustration uses a full-width landscape treatment.
- Corrected the monthly consumption chart found during visual review: flex shrink previously made different high values appear equal. Bars now use a fixed print scale and preserve zero values.

## Verification and outputs
- On-grid: 39 pages. Hybrid: 41 pages. Every page in both samples fills at least 80% of its usable body.
- Stress fixture: 55 pages, including long authored narrative, equipment specifications and negotiated terms. Ground-mounted + detailed monthly consumption + an attached drawing: 41 pages. All section endings meet 80%, all sections start fresh, and content/overflow/reference checks pass.
- All 31 Node test files pass. Added regression coverage for preserving authored content, adding guidance only once per section, and proportional consumption bars.
- Reviewed all on-grid page compositions and full-size changed pages, hybrid battery/technical pages, and the monthly consumption and annexure variants. PDF exports have the expected page counts and correct consecutive footers; no truncated capture text.
- Saved output/pdf/Ray2Volt-sample-long-quotation.pdf and output/pdf/Ray2Volt-sample-hybrid-quotation.pdf. Evidence: tmp/quotation-section-fill.
- Earlier Claude review loop remains a separate unfinished task (two of five rounds complete); its old screenshots are superseded by this layout.

## Publication
- On 11 September 2026, the user authorised committing and pushing the completed quotation updates.
- Commit scope includes the pending quotation UI refinements, section composition, component assets, tests and scratchpads. Generated sample PDFs remain local review artifacts in output/pdf.
