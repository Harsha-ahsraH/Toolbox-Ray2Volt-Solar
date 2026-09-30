# Compact Sidebar Brand

## Goal

Replace the logo at the top of the sidebar with two lines: Ray2Volt and Toolbox. Reduce the space occupied by the header.

## Assumptions and principles

- Apply the requested sidebar branding consistently to the dashboard and every tool, including the mobile drawer.
- Preserve the separate mobile page header and document branding.
- Use existing theme colours and typography; keep collapse and close controls accessible.

## Decisions

- Replace sidebar logo images with a shared two-line text heading.
- Reduce desktop vertical padding from 24px to 12px and mobile drawer padding from 12px to 8px.
- Use a 20px brand name, a 14px subtitle, and a 2px gap between lines.
- Keep the heading hidden in the collapsed desktop sidebar, as before.

## Verification

- Verified both sidebar headings on all 19 pages; no sidebar logo images remain.
- Existing sidebar navigation, toolbox search, and local link tests passed.
- Git diff whitespace checks passed.
