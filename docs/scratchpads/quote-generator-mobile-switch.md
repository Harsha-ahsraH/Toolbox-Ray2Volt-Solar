# Compact mobile quotation switch

- Both quotation modes must use the same compact side-by-side mobile selector.
- Use Short and Comprehensive as visible mobile labels, retaining complete accessible tab names and 44px touch targets.
- Keep the shared corner-radius token and desktop descriptions.
- Remove the preset selector and its event handler from all viewport sizes. Keep existing saved draft data and internal default initialization intact.
- Verify both modes at 390px and 320px, desktop controls, mode switching and the existing test suite.
- Visually verified both modes at 390px and 320px: tabs remain side by side, measure 44px high, and produce no horizontal overflow. Verified desktop descriptions and toolbar, removed selector and no browser errors.
- All 32 test files pass, including the accessible tab names and removed preset control.
