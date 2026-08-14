# Remove Signed-In Badge

## Goal

Remove the persistent `Signed in as ...` badge from the toolbox sidebar.

## Assumptions

- The user wants the identity badge removed, not the underlying Sign-in system.
- Theme switching and signing out must remain accessible from the sidebar.
- The no-access message may still identify the active Account because that context explains why access was denied.

## Underlying principles

- Do not repeat Account identity when it adds no operational value.
- Preserve essential navigation actions when simplifying the Chrome.
- Keep the compact and expanded sidebar states consistent.

## Decisions

- Replace the identity badge with a compact navigation-control row.
- Retain only the Theme and sign-out icon buttons in that row.
- Remove avatar, Account name, Access Level, and `Signed in as` markup from the persistent sidebar.
