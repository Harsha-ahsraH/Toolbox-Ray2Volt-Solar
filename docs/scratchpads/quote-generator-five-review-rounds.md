# Quotation design review: five rounds

## Goal and principles
- User requests five sequential Claude Code CLI review rounds, each followed by my assessment, implementation and visual verification.
- Reviewer uses Claude Opus 5 at high effort, matching the earlier requested model. Claude reviews only; Codex implements accepted findings.
- Compare every long proposal page and component with the short quotation and with peer components. Include all nine input sections and responsive states.
- Preserve user inputs, calculations, authored clauses and the existing design language. No invented business claims or changes to commercial commitments.
- Preserve continuous preview, the 75% section-start rule, dominant-section page headers, cover quotation/date only, horizontal document-control row rules, and separate Prepared For/Prepared By cards.
- Use synthetic sample data. Save each round's fresh evidence and CLI report under tmp/quotation-five-reviews. Do not commit or push unless requested.

## Round ledger
- Round 1: complete. Claude inspected 30 PDF pages, eight short reference pages and nine input panels. All 33 suggestions assessed in tmp/quotation-five-reviews/round-1/assessment.md; accepted changes implemented. All 29 test files passed.
- Round 2: complete. Claude inspected all 47 PNGs; all 15 suggestions assessed in tmp/quotation-five-reviews/round-2/assessment.md. Accepted fixes implemented. Fresh standard proposal remains 30 pages, with 1,363 text runs checked and no layout failures. All 29 test files pass. Mode-switch regression verified fixed: stored short preview remains hidden in Comprehensive Inputs.
- Round 3: interrupted by Claude Code session quota, not complete. CLI read all 47 primary PNGs, then returned "You've hit your session limit · resets 1:20am (Asia/Kolkata)" at 21:08 IST on 10 September. Reset expected 01:20 IST on 11 September. Session d9362e95-0282-4d44-903b-6500927b3243. No review report or assessment yet.
- Round 4: pending.
- Round 5: pending.

## Decisions and verification
- Reviews must list every inspected page and input panel, with specific evidence for findings. Unsupported suggestions and conflicts with user requirements are recorded rather than applied blindly.
- Additional checks: image plus two-page PDF attachments render successfully in the live hybrid preview; 35-page hybrid including acceptance and annexures passes layout checks. Offline export embeds the same synthetic PDF artwork for portability; actual browser canvas artwork also visually inspected. All 14 equipment category screenshots and mobile/dark screenshots saved for the remaining reviewer rounds.
- Last small correction: DC/AC ratio helper uses existing qg-field-hint paragraph styling, matching adjacent helpers.

## Resume after Claude quota resets
- Subsequent user task added real component photography and two Codex-generated commercial architecture illustrations. See quote-generator-component-imagery.md. Standard sample is now 32 pages and hybrid 34; round-3 images are stale, so recapture all evidence and update the review brief before resuming the remaining three rounds. Do not reuse the old resume prompt's claim that current images were already read.
- Run Python tmp/quotation-five-reviews/review.py 3 --resume with the bundled runtime. It preserves the interrupted log and resumes the same read-only CLI agent. Do not count round 3 until a successful report is returned and assessed.
- Implement and validate all accepted round-3 findings before capturing round 4. Include full fresh hybrid evidence, all equipment category screenshots, populated annexures and responsive states in round 4. Regenerate fixtures using prepare-fixtures.py 4; add-annexure-fixture.py creates synthetic files and a QA upload button. Do not touch real customer drafts.
- Complete round 5 on fresh final evidence, assess/implement, rerender and recheck the final PDF. Remaining rounds must use Claude Code CLI as requested. Do not substitute Codex reviews or claim all five finished.
- Current output/pdf/Ray2Volt-sample-long-quotation.pdf is the interim sample after two completed cycles. No commit or push requested for this phase.
