# Compact quotation controls

## Goal

Reduce the height of the Short / Comprehensive selector and the Inputs / Proposal Preview bar slightly, as requested in the screenshot.

## Assumptions and principles

- Reduce vertical padding while retaining the existing labels and readable text sizes.
- Keep mobile controls at least 44px tall and preserve navigation behavior.

## Decisions

- Reduce quotation cards from a 64px to a 52px minimum height, tighten the title-to-description gap, and reduce surrounding padding.
- Reduce workspace bar vertical padding from 12px to 6px, preserving the 44px tab targets.
- Refresh the stylesheet cache version so the change reaches returning users.

## Validation

- Checked local browser rendering at 1440px and 390px widths; desktop selector height is approximately 61px and workspace bar height is 58px.
- Confirmed mobile mode controls and workspace tabs retain 44px targets.
- Verified switching between Inputs, Proposal Preview, and Short mode still works.
- Inspected desktop/mobile screenshots and passed the whitespace diff check.
