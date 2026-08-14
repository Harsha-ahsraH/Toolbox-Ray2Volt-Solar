# Quote Generator: Remove Download PDF

## Goal

Remove the direct `Download PDF` action from both Proposal modes.

## Assumptions

- The request applies to both Short and Comprehensive Proposal workspaces.
- `Generate Preview` and `Print / Save as PDF` remain the complete output workflow.
- Browser printing must continue waiting for Comprehensive annexures to render.

## Underlying principles

- Avoid duplicate output actions that produce the same customer Artifact.
- Remove unused code and dependencies together with the visible control.
- Keep Short and Comprehensive Proposal actions consistent.

## Decisions

- Remove both Download PDF buttons and their event handlers.
- Remove the Quote Generator's shared PDF-download script dependency.
- Retain validation gating for browser printing in Comprehensive mode.
- Update the Comprehensive specification to record the superseding product decision.
