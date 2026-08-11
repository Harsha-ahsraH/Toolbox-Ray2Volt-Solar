# Letterheadify: New Letterhead

## Goal

Update the Letterheadify tool to use the Ray2Volt letterhead PNG added to the Desktop `Ray2Volt` folder on 2026-08-11.

## Assumptions

- `Letterhead (Latest) Ray2Volt Solar.png`, modified at 15:05 on 2026-08-11, is the requested new letterhead.
- The uploaded PDF content must remain visible beneath the letterhead artwork.
- The bundled asset filename can remain unchanged to avoid unnecessary path changes.

## Underlying Principles

- Bundle the business asset with the static tool so Letterheadify works without filesystem access.
- Preserve the source artwork exactly.
- Use PDF multiply blending because the new PNG has an opaque white background; white then leaves existing PDF content unchanged.

## Decisions

- 2026-08-11: Replace the existing bundled letterhead asset with the newly added Desktop PNG.
- 2026-08-11: Draw the letterhead using PDF `Multiply` blend mode.
- 2026-08-11: Pin the new asset SHA-256 in the focused test to prevent accidental regression to the older letterhead.

## Verification

- `node tests\\letterhead-documents.test.js` passed.
- The bundled asset SHA-256 matches the Desktop source: `7D4510724D5924CA426CA7254DD35D524DE0CF27CEA572F24B9480B93B7FE5CB`.
- The standard `node --test` runner could not spawn its child process in the workspace sandbox (`EPERM`); the same test file passed when executed directly.
