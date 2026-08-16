# Toolbox: Remove Download PDF from every tool

## Goal

Finish across the toolbox what the Quote Generator did first — see
`quote-generator-remove-download-pdf.md`. Every Tool Operation offers
`Generate Preview` and `Print / Save as PDF`; nothing else.

## Assumptions

- Browser printing is the whole output workflow. Saving a PDF is the print
  dialogue's job, and it produces a truer document than a screenshot does.
- Letterheadify is not in scope. Its `Add Letterhead & Download` is not a second
  route to a preview — the stamped file *is* the tool's output, and it has no
  preview or print flow at all.
- The Resource Library's per-entry `Download` links are file downloads from the
  catalogue, not a document export. Out of scope.

## Underlying principles

- Avoid duplicate output actions that produce the same Artifact.
- Remove the code and its dependencies together with the visible control.
- What the salesperson prints and what the customer receives should come from
  one path, so they cannot drift apart.

## Decisions

- Removed the `Download PDF` button and its handler from all ten remaining
  tools: Payment Receipt, Invoice, Proforma Invoice, Purchase Order, PaySlip,
  Warranty Card, Comparison Sheet, Margin Breakdown, Request For Quotation and
  the EMI Calculator.
- Deleted `global/scripts/pdf-download.js`. With the last caller gone it was
  dead, and it pulled html2canvas and jsPDF from a CDN on every page that
  loaded it — two third-party scripts the toolbox no longer needs at all.
- The html2canvas capture route was always the weaker one: it photographs the
  preview rather than printing the document, so selectable text, link targets
  and hairline rules were lost. Browser printing keeps them.
- Added a repo-wide assertion in `tests/tool-shell.test.js` so neither the
  button nor the helper can come back unnoticed, with Letterheadify exempt.
- Corrected the comments in `quote-generator-calc.js`, `-pagination.js`,
  `-annexures.js` and `comparison-sheet.js` that still described a download
  path that no longer exists.
