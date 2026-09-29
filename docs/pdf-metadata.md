# PDF tracking in the static toolbox

## Use

1. Generate the document preview. Enter optional existing customer/project/supplier or related-document IDs in **Document details & PDF tracking**, if needed.
2. Use the existing **Print / Save as PDF** action to save the document. The metadata snapshot is frozen when the print dialog opens.
3. In the tracking panel, select that saved PDF and confirm it belongs to the frozen print preview.
4. Select **Embed metadata & download tracked PDF**. Share the `-tracked.pdf` copy.

The browser's original saved file has not been stamped. Selecting the correct file is a manual step; the toolbox cannot prove that an arbitrary uploaded PDF matches the preview. A canceled print dialog does not count as a completed PDF export in the registry.

Letterheadify embeds metadata as part of **Add Letterhead & Download**. Its source file is identified by SHA-256. The source title, author, creator and creation date are retained in separate source fields; the tracked output has new Ray2Volt metadata.

The optional footer adds document ID, revision and export ID to each PDF page. Enable it only when the document has a clear bottom margin. Re-stamping an output that already has a tracking footer is rejected to avoid conflicting visible references; use the original PDF.

## What is recorded

- Standard PDF title, author, subject, creator, producer and dates.
- Custom Ray2Volt fields in both the PDF Info dictionary (`R2V_*`) and XMP namespace `https://ray2voltsolar.com/ns/pdf/1.0/`.
- Document and export IDs, revision, generation time, originating tool, template/schema version, source-file hash and page count.
- Tool-specific fields, for example quoted amount, capacity, invoice total, warranty durations, employee/pay period, or calculated loan parameters. See `pdf-metadata-proposal.md` and `global/scripts/pdf-metadata-fields.js`.
- The selected static toolbox account, when available. Shared accounts identify the account, not a verified individual employee.

Unknown optional links are left out. Existing project/document references are captured from the rendered document or the data used to build it. Bank details, PAN, private notes and internal profitability amounts are not included in the metadata allowlist. Values are snapshots at issue time; a receipt balance does not update later.

## Identity and history

For the same account, tool and document number (or project reference), subsequent exports retain the document ID. Changed preview content or metadata increments the revision. Each successful stamping operation receives a new export ID. Copying an existing downloaded file retains its ID.

Reports without a business reference share the current tracking identity for that tool. Use **Start a new tracking identity** before generating an unrelated report. This also separates documents that intentionally reuse a business number.

The latest 100 export records are held in this browser's local storage; the panel lists the ten most recent for the current tool. **Download tracking record** saves a JSON record containing the IDs and final PDF SHA-256. Clearing browser storage, using another device, or evicting old records loses that local continuity. There is no central database or synchronization on the static branch. If storage is unavailable, stamping still works and the panel asks the user to download the record.

Metadata is readable and editable, not a digital signature, access control or open/forward tracker. Signed/encrypted source PDFs are rejected. No PDF content is uploaded by this feature. Existing page scripts and web fonts retain their existing network behavior.

## Coverage

All 14 existing PDF-producing tools are wired, including short/comprehensive solar proposals and all three EMI calculation modes. Main's Solar Savings PDF is the ownership report; the RESCO calculator does not currently have a separate PDF output. Static Resource Library downloads and offline catalogue-building scripts are outside this tool workflow.

## Maintenance and verification

The browser modules are `pdf-metadata-fields.js`, `pdf-metadata-core.js` and `pdf-metadata-ui.js`. Preview generators call `Ray2VoltPdfTracking.capture` only after their output is ready. Explicit calculated values override generic form collection. The UI chooses the active proposal mode at print time. Increment `VERSION` in the core when changing tracking templates/schema behavior.

pdf-lib 1.17.1 is vendored under `global/vendor/` with its MIT license. The feature uses browser printing for layout and post-processes the actual PDF bytes; it does not rasterize the page.

Run:

```text
node --test tests/*.test.js
node tests/pdf-metadata.browser.cjs
```

The browser test requires `@playwright/test` and its Chromium browser in the test environment. It starts its own localhost server, uses synthetic fixtures and writes ignored artifacts under `tmp/pdf-metadata-qa/`. It covers all tools and special report modes, frozen snapshots, revision/export IDs, page-content preservation, XMP parsing, local-storage failure, bad inputs, and responsive panel layouts.
