# PDF metadata and tracking

Date: 2026-09-28

## Goal
Implement approved PDF tracking metadata across the original static toolbox, then commit and push to main. The user explicitly excluded the unfinished Next.js migration.

## Implementation decisions - 2026-09-29

- User approved implementation and selected the static save-PDF, select-file, embed-and-download workflow after the browser API limitation was explained.
- Isolated checkout: tmp/wt-pdf-metadata, branch codex/pdf-metadata, based on origin/main 5183f13. Next.js branch remains untouched.
- Added a shared allowlisted field collector, PDF Info/XMP writer, browser tracking panel, and locally vendored pdf-lib 1.17.1 with license.
- All 14 existing PDF tools are connected. Comprehensive proposals and all EMI calculation modes capture their own calculated values. Solar Savings on main only prints the ownership report.
- Capture metadata from completed previews and freeze the selected preview at beforeprint. Later form edits cannot silently change a previously printed PDF's metadata.
- Stable document IDs and revisions use a browser-local record registry. Each new stamped artifact has a new export ID. The latest 100 exports are retained locally; downloadable JSON records contain the final file hash.
- Static account ID is explicitly labeled as a convenience-session identity, not an authenticated employee identity. No Next.js or database components are brought into main.
- Footer is optional, off by default. Signed PDFs are rejected instead of invalidating signatures. Letterheadify preserves source authorship in separate metadata fields.
- Supplier/customer/project links can be entered where relevant and are omitted when unknown. No bank details, PAN, private notes or internal profitability fields are copied into default metadata.

## Validation

- 38 unit/regression checks passed, including PDF round trips, identity/revisions, XML escaping, content/link preservation, signatures, footer and privacy allowlists.
- Browser exports passed for all 14 tools, plus comprehensive proposal and EMI tenure/rate modes (17 paths).
- Browser tests cover repeated exports, changed-content revisions, stale form edits, optional footer, malformed PDFs, and storage quota failures.
- Original and stamped page streams match for every non-Letterheadify browser fixture. An invoice rendering is pixel-identical before/after metadata stamping. Desktop/mobile panel and a footer PDF were visually checked.
- Delivery target: origin/main. Git history records the resulting commit; the Next.js migration is excluded.

## Assumptions and open questions
- Tracking may mean identifying the source document, creator and revision, or observing recipient opens/downloads. These require different mechanisms; user intent needs clarification.
- Preserve the quality and selectable text of the current printed documents.

## Findings
- Most active document runtimes use window.print(). The browser manages Save as PDF; that API exposes neither custom PDF metadata parameters nor resulting PDF bytes.
- The previous export decision is documented in remove-download-pdf-everywhere.md: one preview/print workflow, with the screenshot-based download implementation removed.
- Letterheadify already loads and saves PDF bytes through pdf-lib 1.17.1, making metadata insertion straightforward there.
- DocumentHistory already models saved document IDs and revisions, providing a potential link between PDF identifiers and saved records.

## Principles and proposed approach
- Use a unique document ID, revision and per-export ID; connect them to an internal record containing creator, creation time, document type and customer reference.
- For automatic embedded metadata across tools, obtain actual PDF bytes through a controlled generation path, then stamp metadata with pdf-lib before delivery. An upload-and-stamp workflow is another option but adds a manual step.
- Keep personal/customer details in internal records where possible; metadata is readable and editable, not a secret or proof of authenticity.
- A visible reference or QR code can support lookup even on printed copies. It can also provide basic traceability while retaining the current browser-print workflow.
- Metadata alone does not report recipient opens or forwards. Hosted links can record access, with identity dependent on authentication; downloaded files can circulate offline.

## Decisions
- Prepared docs/pdf-metadata-proposal.md covering all 14 PDF-producing runtimes, common identity fields, output-specific metadata, display options, and identity rules. Subsequently approved as recorded above.
- Interpret display as a proposed Toolbox Document details panel plus embedded metadata; a visible PDF footer and QR code remain optional, not assumed requirements.
- Prefer existing input/computed values and omit unavailable IDs. Keep personal, bank and internal profitability fields out of default metadata.
- Follow-up: user asks what data PDF metadata can contain. Explain standard descriptive fields and extensible custom XMP fields, with business-specific examples. Custom field names are our schema, not predefined PDF fields; values describe a point in time and do not enforce permissions, expiry or authenticity.
- Present these options and clarify what the user means by tracking before selecting an implementation.
- Earlier discussion was proposal-only; the approved static implementation now supersedes that stage. No database changes.

## References
- https://developer.mozilla.org/en-US/docs/Web/API/Window/print
- https://pdf-lib.js.org/docs/api/classes/pdfdocument
- https://pdfa.org/resource/including-custom-metadata-structures-in-pdf/
