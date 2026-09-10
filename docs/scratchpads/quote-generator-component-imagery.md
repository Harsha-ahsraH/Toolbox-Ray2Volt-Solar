# Quotation component imagery

## Goal and assumptions
- Add real equipment photographs to the long quotation's explanatory sections, including modules, inverters, mounting, distribution/protection and related components.
- Generate commercial and industrial system architecture illustrations with the built-in Codex image generator for both On-Grid and Hybrid configurations.
- Preserve authored equipment, calculations, existing design, continuous preview, 75% section breaks, dominant page headers and document-control spacing.
- Photographs illustrate component types, not the exact offered make/model. Print this distinction beside the images. Keep source/author/licence credits and bundle local assets for reliable export.
- Use the existing synthetic proposal fixtures for visual validation and regenerate the sample PDF. No commit/push requested in this phase.

## Decisions
- Built-in image generation used for architecture only. All component photography is sourced from real photographs.
- New sibling architecture files keep short quotation assets intact.
- Earlier five-round Claude review remains at two complete rounds; round three was blocked by quota. New imagery changes require fresh evidence before remaining reviews.

## Validation
- Complete: eight real component photographs bundled locally with per-image author, source and licence links. Seven appear in the On-Grid sample; Hybrid also includes the battery photograph.
- Both architecture variants generated using the built-in Codex image generator. Prompts retained at tools/quote-generator/assets/architecture-prompts.json. Final artwork: assets/commercial-ongrid-architecture.png and assets/commercial-hybrid-architecture.png.
- Refined the architecture height to 108mm after the first render left an avoidable sparse page. Standard sample now 32 pages; hybrid sample 34 pages. Larger figures, captions and credits remain together.
- Browser checks passed for all 32/34 sample pages and 49 stress pages: loaded images, content retention, overflow, 75% section starts, dominant headings and continuous preview. 30 test files pass, including image provenance, bundled assets, configuration selection, pagination-aware category imagery and empty equipment categories.
- Inspected all sample page overviews and full-size affected architecture/component pages. No image clipping, detached credits or text overlap found.
- Saved output/pdf/Ray2Volt-sample-long-quotation.pdf and output/pdf/Ray2Volt-sample-hybrid-quotation.pdf. Evidence in tmp/quotation-imagery. No commit or push performed.
