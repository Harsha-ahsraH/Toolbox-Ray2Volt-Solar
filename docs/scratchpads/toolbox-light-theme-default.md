# Toolbox Light Theme Default

## Goal

Make light the default Theme across the toolbox.

## Assumptions

- "Default" means the Theme used when the device has no saved toolbox preference.
- An explicit light or dark choice already saved on the device must remain authoritative.
- The existing Theme toggle and cross-tab synchronization should remain unchanged.

## Underlying principles

- Stamp the Theme before first paint to avoid a visible colour flash.
- Keep one shared default in `global/scripts/theme.js` for every toolbox page.
- Artifact and print palettes remain independent of the toolbox Chrome Theme.

## Decisions

- Resolve an absent or invalid saved choice to `light`.
- Stop using the operating-system colour-scheme preference as the fallback.
- Preserve saved choices, toggle behavior, and storage synchronization.
