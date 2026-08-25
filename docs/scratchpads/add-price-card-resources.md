# Add the price card and its Telugu edition to Resources

## Goal

Add the supplied `Ray2Volt Price Card and Packages.pdf` and `Ray2Volt Price Card and Packages Telugu.pdf` to the Resource Library as downloadable toolbox-hosted resources.

## Assumptions

- The two files are the same document in two languages, so they belong side by side as two entries rather than one.
- The source files' last-modified date, 2026-08-24, is the best available value for the catalogue's `updated` field.

## Underlying principles

- A toolbox-hosted file is published to the public internet permanently, so the decision to host rather than link is the user's, not a default.
- Every file under `downloads/` must have a matching catalogue entry.
- Resource filenames should be stable, lower-case and descriptive.

## Decisions

- Read both PDFs before committing. Each is a single page holding capacity, subsidy, four package prices, down payments and EMI from 2 kWp to 10 kWp — retail figures only. No landed cost, no margin, no customer or employee details, no form fields. This is the customer-facing card, so it clears the bar for `downloads/`.
- Put the choice to the user anyway, since hosting publishes retail prices to competitors irreversibly. They chose toolbox hosting over Drive links.
- Classified both under `Price lists`, the first entries in that category.
- Stored them as `downloads/price-lists/ray2volt-price-card-and-packages.pdf` and `...-telugu.pdf`.
- Marked the Telugu entry as the Telugu edition in both title and description, so the two are never mistaken for different price sets.

## Outcome

- Three resources now list in the Resource Library, across two categories.
- Full test suite passes, and both PDFs were confirmed served and downloadable through the running site.
