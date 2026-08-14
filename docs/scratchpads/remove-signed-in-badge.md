# Remove Signed-In Badge

## Goal

Remove the decorative icon badge to the left of the persistent `Signed in as ...` information.

## Assumptions

- Correction: "badge" means only the icon/avatar to the left of the signed-in information.
- The `Signed in as ...` label and Account name must remain visible.
- Theme switching and signing out must remain accessible from the sidebar.
- The no-access message may still identify the active Account because that context explains why access was denied.

## Underlying principles

- Preserve Account identity while removing the unwanted decorative element.
- Preserve essential navigation actions when simplifying the Chrome.
- Keep the compact and expanded sidebar states consistent.

## Decisions

- Restore the signed-in label, Account name, Theme control, and sign-out control.
- Remove only the avatar/icon badge on the left.
- Hide the text as before when the sidebar is collapsed, where only the controls fit.

## Correction history

- The first implementation removed the full signed-in section after interpreting "badge" too broadly.
- The user clarified that only the badge to the left should be removed; this correction supersedes the earlier interpretation.
