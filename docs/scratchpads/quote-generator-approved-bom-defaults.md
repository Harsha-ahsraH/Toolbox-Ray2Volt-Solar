# Quote Generator Approved BOM Defaults

## Goal

Make the BOM supplied in the user's reference image the default for new On-Grid short Proposals.

## Assumptions

- The reference image is the short Proposal BOM: six main items followed by six Installation Accessories.
- The request applies to On-Grid defaults because the supplied list names an On-Grid Inverter and no battery.
- Hybrid defaults remain installation-specific and unchanged.
- Text, quantities, units, and makes should match the supplied reference, including `Schnider`.

## Underlying principles

- Defaults remain editable by Sales.
- Installation Type continues to select the appropriate BOM.
- A regression check records the complete approved 12-row On-Grid list.

## Decisions

- Updated the module make to `Adani/Vikram/Waaree`.
- Updated ACDB and DCDB makes to `Havells/Schnider/Reputed`.
- Retained the other nine rows because they already matched the reference.
- Did not modify Comprehensive Proposal BOM defaults; the reference matches the short Proposal schema.
