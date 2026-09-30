# PDF metadata proposal

Status: Deferred on 2026-09-30 at the user's request. The implementation was removed from all tools; the proposal below is retained as historical reference.
Date: 2026-09-29

## Previous implementation (removed)

The user previously approved the fields, details panel and optional footer, then chose the static workflow: save through the browser, select that PDF, embed metadata locally and download the tracked copy. Letterheadify stamped automatically. These historical notes describe the removed implementation; see `pdf-metadata.md` for its current status.

- The static branch has account IDs, not authenticated individual employee IDs. Metadata uses GeneratedByAccountId and IdentitySource without claiming verified authorship.
- References not already in a tool can be entered in Optional record links; unknown links are omitted.
- Revisions and export history are local to this browser, independent of the unfinished Next.js database model.
- The original Solar Savings tool only has an ownership PDF report. RESCO is an on-screen calculator; its separate PDF mode is not implemented by main and is not invented here.
- The tracking footer is available as an unchecked option requiring a clear bottom margin. QR verification was not part of the approved implementation summary and requires a hosted lookup destination.

## Scope

Cover the 14 current PDF-producing runtimes, including all report modes in Quote Generator, Solar Savings and EMI Calculator. Resource Library downloads are existing files, not generated documents; per-download identifiers would need a separate stamping flow. Tools without a document export are not included merely because a browser can print any webpage.

## Shared fields

| Field | Meaning / proposed source |
| --- | --- |
| Title | Document type and human-readable reference |
| Author | Ray2Volt Solar |
| Subject | Brief document description |
| Keywords | Document type and reference |
| Creator | Ray2Volt Solar Toolbox |
| Producer | Actual PDF-generation software |
| Creation / modification time | Actual PDF creation and subsequent modification time |
| DocumentId | Stable unique ID for the logical document; allocate one for unsaved reports too |
| DocumentNumber | Existing business number, where available; do not replace numbering conventions |
| Revision | Saved or immutable content revision represented by this PDF |
| ExportId | Unique ID for each newly generated PDF artifact |
| DocumentType / ToolId / ReportMode | Type, originating tool, and applicable mode |
| GeneratedAt | UTC timestamp for this export; UI may display local time |
| GeneratedByUserId | Authenticated employee account ID, where available |
| CustomerId / ProjectId | Include only where known and linked; never derive IDs from names |
| TemplateVersion / MetadataSchemaVersion | Layout version and metadata schema version |
| Currency | Explicit currency for monetary fields, where applicable |

Use standard properties for common PDF fields and a versioned Ray2Volt XMP namespace for custom fields. The chosen writer must support writing and reading back XMP; pdf-lib's convenience setters cover the standard properties, not a complete custom XMP implementation.

## Fields specific to each output

These are proposed business fields, not claims that every field already exists in every form. Existing inputs and computed values should populate them automatically; unavailable links are omitted until supported.

| Output | Additional proposed metadata |
| --- | --- |
| Solar proposal (Quote Generator) | Proposal number/date, short/comprehensive mode, capacity in kWp, installation type, total quoted amount, subsidy eligibility as stated in the proposal |
| Quotation | Quotation number/date, line-item count, total quoted amount |
| Invoice | Invoice number/date, line-item count, invoice total |
| Proforma invoice | Proforma number/date, line-item count, proforma total; linked quotation ID if known |
| Purchase order | PO number/date, supplier reference if known, line-item count, order total |
| Payment receipt | Receipt number/payment date, current payment, previous payments, balance as of issue; linked invoice ID if known |
| Warranty card | Project ID, installation date, module/inverter models, module/inverter warranty durations, performance-warranty duration |
| Payslip | Payslip number, employee ID of recipient, pay period, payment date; exclude salary, PAN and bank details from the default metadata set |
| Request for quotation | RFQ number/date, supplier reference if known, RFQ heading; avoid embedding the entire free-text body |
| Comparison sheet | Capacity, system type, battery configuration, compared package labels/IDs and their quoted prices |
| Margin breakdown | Project ID, capacity, project type, consultant ID and report date; keep profit, costs, commission and free-text notes in the internal record by default |
| EMI report | Principal, annual interest rate, tenure in months, flat/reducing-balance method, calculation mode, calculated EMI, total interest |
| Solar savings report | Ownership/RESCO mode, capacity, applicable tariff assumptions, generation estimate, calculation-model version; add PPA tenure for RESCO and investment/subsidy for ownership |
| Letterheadify output | Source-file SHA-256, source page count, letterhead version, stamping timestamp; preserve known source authorship separately from the Ray2Volt processing event |

## Display proposal

- Toolbox: a Document details panel displaying the shared and type-specific fields with friendly labels, plus copyable full IDs. This makes display predictable across outputs.
- PDF Document Properties: standard title, author, subject, creator and dates. Custom XMP visibility depends on the reader; do not promise that every viewer displays it.
- Optional visible footer, subject to approval: document number (or generated report reference), revision, and export reference. Metadata itself does not require a printed footer.
- Optional verification QR code is a separate feature requiring a lookup destination and a decision about what a recipient can see.

## Identity and consistency rules

- Same document retains DocumentId; content changes create a new revision; generating new PDF bytes creates a new ExportId. Copying or re-downloading an existing artifact retains its ExportId.
- Generate metadata from the exact content used for the PDF, not from a form changed after preview creation. Unsaved changes must be captured as an immutable export revision before claiming a revision link.
- Do not fabricate approval status, missing business IDs or inferred warranty expiry dates. A warranty duration may have start-date rules beyond the installation date.
- Metadata is a snapshot at issue time. A recorded balance, validity or status does not update as the business record changes.
- Keep phone numbers, email addresses, full addresses, bank details, PAN, internal margins and private notes out of default metadata. Metadata travels with the customer-facing file.
- Store the final artifact hash in the internal export record, outside the PDF, for exact-file comparison. A self-contained final-file hash cannot be embedded naively because writing it changes the file.
- Metadata IDs support lookup; they do not prove authorship, prevent editing or record recipient opens.

## Implementation implication and review boundary

Most tools currently use browser Print / Save as PDF, which does not return PDF bytes for stamping. Automatic embedded metadata requires a controlled PDF generation/stamping path, preserving the print layouts and selectable text. This proposal does not reintroduce the removed screenshot export implementation or alter buttons.

Approval received: user requested implementation of the suggested fields and display, and commit/push to main. In a follow-up answer, the user selected save-then-select local stamping. No backend or Next.js migration is included.
