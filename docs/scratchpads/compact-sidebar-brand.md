# Compact Sidebar Brand

## Goal

Latest request: show only Toolbox at the top of the sidebar, in Google Sans Flex bold, and restore the typography that existed before the Inter change. Keep the header compact.

## Assumptions and principles

- Apply the requested sidebar branding consistently to the dashboard and every tool, including the mobile drawer.
- Preserve the separate mobile page header and document branding.
- Use existing theme colours and typography; keep collapse and close controls accessible.

## Decisions

- Replace sidebar logo images with a shared two-line text heading.
- Reduce desktop vertical padding from 24px to 12px and mobile drawer padding from 12px to 8px.
- Use a 20px brand name and a 14px subtitle in a compact heading.
- Keep the heading hidden in the collapsed desktop sidebar, as before.
- Correction: put an explicit HTML line break between Ray2Volt and Toolbox, so the two lines also survive an older cached stylesheet.
- Version the navigation stylesheet URL to refresh cached header styles.

## Verification

- Verified both sidebar headings on all 19 pages; no sidebar logo images remain.
- Existing sidebar navigation, toolbox search, and local link tests passed.
- Git diff whitespace checks passed.
- Correction verified in Chromium with 95 rendered heading checks across 19 pages: desktop, mobile, older cached navigation styles, and no styles. Both words occupy separate lines; current desktop and mobile headers remain compact.

## Latest decisions

- The single Toolbox heading supersedes the earlier two-line branding.
- Set the sidebar heading explicitly in Google Sans Flex at weight 700.
- Reverse the complete typography change from commit 59802e5: restore the original Google Sans headings, Google Sans Flex body and form typography, sign-in typography, and previous numeral and spacing settings.
- Refresh URLs for restored styles and the sign-in script, including imported form styles, to avoid mixing cached Inter styles with the restored fonts.
- Preserve existing document content, calculations, navigation, and the compact sidebar padding.
- Verification: all 34 existing test suites passed. Confirmed exact restoration of 19 font-related files; Chromium comparisons matched 4,938 text/control styles to the pre-Inter version across all 19 pages at desktop and mobile widths. All 38 visible sidebar headings use only Toolbox, Google Sans Flex, weight 700.
