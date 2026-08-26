# Responsive Search Clear Alignment

## Goal

Keep the search field's clear button aligned at the right-center of the input in responsive layouts.

## Assumptions

- The reported “x button” is the toolbox navigation search control `.nav-search-clear`.
- Responsive state means the mobile drawer breakpoint at 768px and below.
- The existing visual size and constrained touch target should remain unchanged.

## Underlying principles

- An in-field control must remain positioned relative to the search-field wrapper.
- The visible icon and its touch target should share the same center.
- A regression assertion should cover the responsive override that caused the defect.

## Decisions

- Preserve absolute positioning at the mobile breakpoint.
- Add explicit vertical centering for the taller mobile input.
- Retain the existing 32px by 44px pseudo-element touch target.
