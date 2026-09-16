# EMI printable and monthly schedule

## Goal
Make the EMI report consistent with the other Ray2Volt printables and always print every repayment month.

## Assumptions and principles
- Margin Breakdown and Comparison Sheet establish the document style: A4, logo left, title right, navy headings, light table headers, thin borders and Google Sans Flex.
- Month numbers are appropriate because the calculator has no repayment start date.
- Preview, tool printing and browser printing should contain the same complete schedule.

## Decisions
- Replace the annual summary and optional monthly appendix with one continuous monthly schedule, beginning on page one below the loan overview.
- Repeat document headers, column labels, loan context, month ranges and page numbers on continuation pages.
- Show principal, interest, actual payment and remaining balance for every month, with totals at the end.
- Cap the last reducing-balance principal repayment at the outstanding balance; report totals sum the actual schedule.
- Keep calculator controls and unrelated documents unchanged.

## Verification
- Chromium checks passed for 1, 24, 25, 54, 55, 120 and 360 months: consecutive monthly rows, no missing months, no table/footer overlap and no clipped amounts.
- Verified all three calculation modes with both reducing-balance and flat-rate methods: schedule sums reconcile within displayed rounding and the final balance is zero.
- Verified maximum input values and browser printing without first opening the preview.
- Generated a five-page A4 PDF for a 120-month loan; extracted text confirms all 120 monthly rows and correct page numbers. Visually inspected the opening, continuation and final pages.
- Local links, codebase structure and tool shell tests pass. JavaScript syntax and `git diff --check` pass.
- Local QA scripts, screenshots and sample PDF are in `tmp/emi-print/` (ignored artifacts).
