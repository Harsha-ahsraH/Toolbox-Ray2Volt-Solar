# Per-Wp pricing and shared corner radius

- Correct the header's fixed radii to the toolbox's shared radius token. Keep the approved header arrangement.
- User confirmed: total project cost includes GST; per-Wp pricing always excludes GST. At 100 kWp and 5% GST, Rs 40/Wp corresponds to Rs 42,00,000 total.
- Link the existing before-discount project cost to an editable before-discount per-Wp field, using approved DC capacity in Wp. Retain total cost as the stored authority; capacity or GST changes refresh its equivalent rate.
- Add a saved display option, off by default for existing quotations. When enabled, executive summary, commercial offer and acceptance show the final offered rate after discounts, excluding GST.
- Zero/missing DC capacity disables rate entry and omits the printed rate; never divide by zero.
- Verify bidirectional conversion, GST changes, discounts, persistence, display toggle, live input behavior, page composition and shared radii.

## Verification
- All 32 Node test files pass, including numeric round trips, fractional rates/capacities, discounts, zero capacity, saved/legacy drafts and all three proposal sections.
- Browser verified 100 kWp: entering 40 gives 4,200,000; entering 4,200,000 gives 40. A 4,226,250 cost with 26,250 discount shows a final 40.00/Wp.
- Verified rate entry disables at zero DC capacity, saved option/rate survive reload, and toggling the option removes/reinstates proposal rates.
- Full 39-page proposal passes content retention, overflow, section boundaries and minimum 80% final-page fill checks with the option enabled.
- Visually inspected executive summary, commercial offer, acceptance, and desktop/mobile pricing controls. Header controls all resolve to the shared 2px radius; mobile has no horizontal overflow.
