# Sidebar Resizing and Dashboard

## Goal

Align Toolbox with the navigation icons, centre the collapse arrow vertically in the header, allow user-controlled sidebar width with collapse below a minimum, and start the dashboard directly with its cards.

## Assumptions and principles

- Preserve the restored Google Sans and Google Sans Flex typography.
- Apply shared sidebar behaviour to all 19 pages.
- Desktop users resize by dragging the sidebar's right edge; mobile retains its existing drawer.
- Use 220px as the minimum expanded width and the existing 76px icon rail when collapsed.
- Allow widths up to the viewport minus 320px so the main content stays usable.
- Remember expanded width and collapsed state on this device across tools.
- Keep resize and collapse controls usable with the keyboard.

## Decisions

- Align the title's left edge with the navigation icon boxes, including the navigation row's 3px active border.
- Compensate for the mobile active row's extra 1px border so all icon boxes keep the same left alignment.
- Centre the arrow relative to the compact header height, including when hovered.
- Use pointer capture for continuous dragging through collapse and expansion.
- Arrow keys resize; Home collapses; End expands to the available maximum; Enter or Space toggles collapse.
- Remove the dashboard heading and welcome paragraph, retaining the tool cards and search filtering.
- Refresh shared navigation asset URLs for the deployed update.

## Verification

- All 34 existing test suites passed; navigation, search, tool-shell, and local-link checks also passed after the final mobile alignment adjustment.
- Chromium regression checks passed for title alignment and arrow centring on all 19 pages at desktop and mobile widths.
- Verified continuous dragging through collapse and expansion, saved width/state between pages, keyboard controls, viewport limits, mobile drawer operation, and malformed or blocked storage.
- The dashboard's first element is the card grid; its introductory header is removed.
- Git whitespace checks passed.
