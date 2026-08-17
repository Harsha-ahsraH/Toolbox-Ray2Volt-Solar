# Add sales and commissioning form to Resources

## Goal

Add the supplied `Sales Requirements and Project Commissioning Form 2.pdf` to the Resource Library as a downloadable toolbox-hosted resource.

## Assumptions

- "Resources" means the existing Resource Library catalogue.
- The PDF is intended to be publicly downloadable because toolbox-hosted files are committed to this public repository.
- The source file's last-modified date, 2026-07-23, is the best available value for the catalogue's `updated` field.

## Underlying principles

- Public resources must be blank templates or other material safe to publish.
- Every file under `downloads/` must have a matching catalogue entry.
- Resource paths and filenames should be stable, descriptive, and free of version-copy suffixes such as `2`.

## Decisions

- Inspected both pages and confirmed the PDF is a blank form containing no customer data and no interactive form fields.
- Classified it under `Templates`.
- Stored it as `downloads/templates/sales-requirements-project-commissioning-form.pdf`.
- Described the customer onboarding checklist, project commissioning checklist, and on-grid/hybrid schematics in the catalogue.
- Removed the three pre-existing catalogue entries at the user's request, without deleting their underlying project files.

## Outcome

- The PDF is available through the Resource Library as its only listed resource.
