# Remove Interface Logos

## Goal

Remove every company logo from the toolbox interface across mobile, tablet, and desktop views.

## Assumptions and principles

- The user confirmed interface only; document previews and exported invoices/quotations keep their company branding.
- Retain Toolbox as the text title, using Google Sans Flex at weight 700.
- Check all 19 pages, including the fixed mobile toolbar, the drawer, the desktop sidebar, and the browser-tab icon.
- Preserve existing typography, navigation, search, resizing, and mobile controls.
- Other ongoing project-review changes in the workspace belong to separate work and must be excluded from this commit.

## Decisions

- Replace each mobile logo image with the shared Toolbox text title.
- Remove branded favicons using an empty data favicon, preventing a cached or default logo from appearing in the browser tab.
- Align the mobile toolbar title with the mobile navigation icon column.
- Remove obsolete mobile-logo CSS and refresh the shared navigation stylesheet URL.

## Verification

- Static checks confirm text-only mobile headers and sidebars on all 19 pages.
- Chromium checks passed for 95 views: 320px, 390px, 768px, 769px, and 1280px across every page. Verified Google Sans Flex bold titles, empty favicons, toolbar controls, drawer opening/closing, and mobile search focus.
- Existing toolbox-search, sidebar-navigation, tool-shell, and local-link tests passed.
- The isolated commit excludes unrelated project-review changes and preserves document branding.
