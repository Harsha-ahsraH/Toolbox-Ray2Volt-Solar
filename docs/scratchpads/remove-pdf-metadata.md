# Remove PDF metadata features

Date: 2026-09-30

## Goal
Remove the embedded PDF metadata feature from every tool. The user will revisit its implementation later.

## Assumptions and principles
- This request covers the tracking panels, reference inputs, history, optional tracking footer, embedding actions, and automatic Letterheadify stamping.
- Preserve document content, calculations, previews, printing, and Letterheadify's letterhead download.
- Preserve existing PDF source metadata in Letterheadify without adding Ray2Volt tracking fields.
- Keep the previous proposal as historical reference for later work; mark the feature as deferred.

## Decisions
- Remove the shared metadata scripts and stylesheet, their imports in all 14 affected tools, and preview capture/invalidation hooks.
- Save Letterheadify output directly with pdf-lib; retain the vendored library and license needed for letterhead processing.
- Remove obsolete metadata tests and adjust the Letterheadify checks for direct saving.
- Refresh changed script URLs so browsers load the updated code.
- Leave existing browser-local tracking records unused; no data migration or clearing is needed.

## Validation
- All 34 existing regression test files passed with `node --test tests/*.test.js`.
- Executed the production Letterheadify handler with pdf-lib: the two-page PDF retained its page sizes, source title and author; both pages received the letterhead; download succeeded without Ray2Volt tracking fields or XMP.
- Checked all runtime sources for removed tracking APIs and feature imports; none remain. Script URL version labels describe this removal only.
- `git diff --check` passed.
