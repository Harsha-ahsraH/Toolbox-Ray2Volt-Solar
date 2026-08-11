# Quote Generator: Short and Long Proposals

## Goal

Define two Proposal modes in the Ray2Volt Solar Toolbox:

- Short Quotation
- Long Comprehensive Quotation for C&I solar EPC projects (target: at least 20 A4 pages)

The authoring screen will expose a mode toggle near the top. Implementation starts only after the product design is confirmed.

## Current Baseline

- The existing Quote Generator produces an 8-page A4 Proposal.
- Existing pages: Cover; Proposal Overview; How Your System Works; Technology & Installation; Bill of Materials; Commercial Offer; Savings & ROI; Terms & Conditions.
- Existing Installation Types are On-Grid and Hybrid. Off-Grid is intentionally excluded.
- Existing Schematics are installation-type PNG assets for On-Grid and Hybrid.
- Existing inputs cover customer details, project details, editable BOM, pricing and discount, GST/payment details, and savings assumptions.
- Existing exports support print/save as PDF and PDF download.

## Working Principles

- The Toolbox should remain the source of truth for project data, calculations, page selection, and final repeatable PDF generation.
- Proposal structure must adapt to real project facts; optional or irrelevant pages should not be padded with filler.
- C&I claims and calculations should be traceable to explicit inputs or clearly disclosed assumptions.
- One shared data model should power both Proposal modes where practical.

## Preliminary Recommendation

Build the comprehensive Proposal inside the Toolbox. Use Canva only to design reusable visual assets or to explore a visual direction, not as the operating proposal generator.

Reason: the Proposal contains structured project data, engineering assumptions, calculations, conditional sections, repeated fields, BOM/commercial data, and version-sensitive content. Keeping generation in the Toolbox reduces copy/paste errors and makes every page reproducible. Canva can still contribute backgrounds, icons, diagrams, or a static design reference that is implemented in the Toolbox.

## Decisions Made

- 2026-08-11: The present design phase is limited to the tool interface and Proposal content.
- Business logic, calculations, workflow rules, validation, and sales-stage logic are deferred.
- 2026-08-11: Every Comprehensive Proposal section must be user-selectable, removable, and editable.
- 2026-08-11: The Comprehensive Proposal is a modular document builder rather than a fixed 20-page template.
- 2026-08-11: Section order is fixed; drag-to-reorder controls are not required.
- 2026-08-11: Users select the sections they need, then edit the contents of each selected section.
- 2026-08-11: Section-level freeform Proposal editing is not required. Users will author the Proposal through structured input panels.
- 2026-08-11: The input-system design will be completed before the Proposal page-by-page design.
- 2026-08-11: Short and Comprehensive modes will share one input form and data model.
- 2026-08-11: Switching modes preserves shared values; Comprehensive mode reveals additional C&I inputs and section choices.
- 2026-08-11: The form will use a multi-open accordion. Any combination of input panels can remain expanded simultaneously.
- 2026-08-11: Provide Expand All and Collapse All controls.
- 2026-08-11: Customer Details will begin with Company/Individual selection.
- 2026-08-11: Company inputs include legal company name, contact person, designation, phone, email, GSTIN, CIN, registered/billing address, and project/site address.
- 2026-08-11: Individual mode hides company-only fields.
- 2026-08-11: Project Settings separates System Configuration (On-Grid/Hybrid) from Installation Location.
- 2026-08-11: Installation Location options are RCC rooftop, metal-sheet rooftop, ground-mounted, carport, and mixed.
- 2026-08-11: Mixed installations allow multiple locations with a capacity assigned to each.
- 2026-08-11: Project capacity inputs include solar DC capacity (kWp), inverter AC capacity (kW), displayed DC/AC ratio, and Hybrid-only battery energy (kWh) and power (kW).
- 2026-08-11: Short mode retains a simple System Capacity field mapped to solar DC capacity.
- 2026-08-11: Project Settings and BOM capacity fields must not become competing sources of truth. Their reconciliation behavior must be explicitly designed.
- 2026-08-11: Project Settings is the authoritative source for approved DC, AC, and battery capacities.
- 2026-08-11: BOM equipment ratings and quantities derive comparison totals. Mismatches show warnings and do not silently overwrite either value.
- 2026-08-11: Project Settings also includes project/proposal title, project/site name, prepared by, Proposal revision number, and quotation validity in days.

## Existing BOM Baseline

- Current columns: serial number, item description, quantity, unit, and make.
- On-Grid defaults: modules, inverter, mounting structure, ACDB, DCDB, and DC cable.
- Hybrid defaults: modules, hybrid inverter, battery, mounting structure, combined DB set, and DC cable.
- Shared accessories: lightning arrester, earthing kit, MC4 connectors, AC cable, installation and commissioning, and transportation and handling.
- The Comprehensive BOM needs materially greater component coverage and detail than this baseline.

## Approved Comprehensive BOM Categories

1. Solar PV modules
2. Inverters
3. Battery system, when applicable
4. Module mounting structures
5. DC cables and connectors
6. AC cables and power evacuation
7. DCDB, ACDB and protection devices
8. Earthing and lightning protection
9. Monitoring, communication and SCADA
10. Metering and synchronization
11. Safety equipment and signage
12. Civil and miscellaneous works
13. Installation, testing and commissioning
14. Transportation and documentation

Empty BOM categories are hidden from the generated Proposal.

## Approved BOM Row Fields

- Component/item name
- Technical specification or model
- Make/manufacturer
- Quantity
- Unit
- Warranty
- Remarks or scope note

Modules, inverters, and batteries expose additional rating fields for capacity reconciliation. Country of origin is not required.

## Approved BOM Authoring Behavior

- Load a detailed default BOM based on System Configuration and Installation Location.
- Allow users to add, remove, duplicate, and edit rows inside each category.
- Provide Reset to Defaults with confirmation.

## Approved Commercial Offer Inputs

- Support repeatable named discount rows.
- Each discount row contains Discount Name and Discount Amount.
- Show one empty discount row initially; users can add or remove rows.
- Retain Actual Project Cost (including GST) as the main total.
- Provide an optional commercial price-breakdown table containing description and GST-inclusive amount.
- Users may leave the breakdown empty and enter only Actual Project Cost.
- The price breakdown totals into Actual Project Cost, followed by named discounts and the final offered price.
- Payment milestones are repeatable rows with milestone name/payment trigger, payment percentage, calculated amount, and an optional note/due condition.
- Show a running milestone-percentage total and an error until the entries total 100%.

## Approved Savings Projection Inputs

- Provide Simple and Detailed C&I electricity-consumption entry methods.
- Simple entry contains current electricity tariff and average monthly consumption.
- Detailed C&I entry contains a repeatable 12-month table with month, imported energy (kWh), electricity bill amount, and maximum demand (kVA).
- Short mode uses Simple entry. Comprehensive mode can use either method.
- Capture estimated self-consumption percentage and grid-export percentage; validate that they total 100%.
- Capture export/net-metering credit rate in INR/kWh and the net-metering/open-access arrangement type.
- Projection period defaults to 30 years in both modes and accepts a custom number of years.
- Provide an optional future-cost table with cost name, starting amount, annual escalation percentage, starting year, and ending year.
- The table supports annual recurring costs and one-time costs when starting and ending years are the same.
- Typical entries include O&M, insurance, monitoring subscriptions, and equipment-replacement provisions.
- Recurring operating costs and one-time replacement provisions are intentionally excluded from the input system.
- A one-question-at-a-time grilling session is in progress.

## Open Decisions

- Exact definition and page count of Short Quotation.
- Long Proposal audience and decision stage.
- Required inputs, calculated fields, and uploaded evidence.
- Default 20+ page structure and its optional section library.
- Completion/status treatment for accordion panels.
- Exact controls, defaults, and dependencies within every input panel.
- How Terms, Inclusions, and Exclusions should be authored and reused.

## Proposed Input Panels

### 1. Customer Details

- Customer name
- Phone number
- Email address
- GSTIN
- CIN, when applicable
- Address

### 2. Project Settings

- Quote date
- Quotation Number
- System capacity
- Installation Type

### 3. Bill of Materials

- Preserve everything available in the current generator.
- Expand the BOM to capture every component in greater detail.
- The rendered BOM should occupy a complete Proposal page.

### 4. Commercial Offer

- Actual project cost, including GST
- Discount amount
- Discount name
- GST type
- GST percentage
- User-defined payment milestones, each with a name and percentage
- Validation error when payment milestone percentages do not total 100%

### 5. Savings Projections

- Current electricity tariff in INR/kWh
- Annual generation in kWh/kWp
- Tariff escalation percentage
- Annual solar-panel degradation rate
- Additional projection inputs to be determined during grilling

### 6. Contract Content

- Terms and conditions
- Inclusions
- Exclusions
- Authoring control and reusable-content behavior to be determined during grilling

## Approved Contract Content Authoring

- Use three independent clause-list editors: Terms and Conditions, Scope Inclusions, and Scope Exclusions.
- Load Ray2Volt standard clauses by default.
- Treat every clause as a separate editable row with an enable/disable checkbox.
- Allow users to add custom clauses and delete existing clauses.
- Provide a control to restore standard defaults.

## Approved Proposal Section Selector

- Add a dedicated Proposal Sections accordion panel in Comprehensive mode.
- Display available sections as a grouped checklist in a fixed output order.
- Provide Select Recommended, Select All, and Clear Optional Sections controls.
- Display an estimated resulting page count.
- Unchecked sections are omitted, but their entered content remains available if reselected.
- Start Comprehensive mode with a recommended 20+ page selection rather than an empty checklist.
- Provide C&I On-Grid Rooftop, C&I Ground-Mounted, and C&I Hybrid starting presets.
- Changing a preset replaces section selections only after user confirmation.

## Standard Versus Project-Specific Content

- Reusable Ray2Volt sections are selectable/removable but not edited per quotation.
- Examples: About Ray2Volt, execution methodology, quality assurance, safety, warranty support, and company credentials.
- Project-specific content remains editable through the approved structured input panels.
- Standard wording can be updated separately in the tool's maintained templates later.

## Approved Workspace Layout

- Place Inputs and Proposal Preview workspace tabs beneath the Short/Comprehensive toggle.
- Inputs contains the multi-open accordion form.
- Proposal Preview contains a fixed-order page-thumbnail sidebar and one large A4 page preview.
- Page thumbnails navigate but do not reorder pages.
- Print and Download controls live in the Proposal Preview workspace.

## Approved Draft Persistence

- Autosave the current quotation inputs in the browser and restore them after reload or accidental closure.
- Display a small Saved Locally status.
- Provide New Quotation with confirmation and Reset Current Panel.
- Multiple named drafts and cloud storage are outside the first version.

## Approved Validation Behavior

- Accordion headers display Incomplete, Complete, or Error.
- A top-level validation summary links users to panels containing errors.
- Proposal Preview remains available with placeholders when inputs are incomplete.
- Final PDF download is blocked only by critical errors.
- Critical errors include missing customer/project identity, missing capacity or price, BOM capacity mismatch, and payment milestones not totalling 100%.
- Optional fields never block download.

## Input-System Grilling Outcome

- Completed on 2026-08-11 after 28 questions.
- Shared input-system design is confirmed.
- No Quote Generator implementation was performed during grilling.
- Next design phase: define the Comprehensive Proposal's selectable sections and page-by-page layouts/content.

## Resulting Specification

- Implementation specification: `docs/specs/quote-generator-short-comprehensive-mode.md`
- The specification supplies an implementation baseline for the selectable Comprehensive Proposal section library and page content in addition to the approved input system.

## Project Drawings and Media Decision

- Do not add a detailed Project Media & Drawings input panel; it would make the main form too complex.
- Keep standard Ray2Volt visuals inside the Proposal templates.
- Treat project-specific drawings and supporting documents only as optional annexures appended at the end.

## Approved Annexures Input

- Add a simple Annexures accordion panel at the bottom of Comprehensive mode.
- Each annexure has an image/PDF upload, title, type, and include/exclude checkbox.
- Annexure types: Drawing, Datasheet, Certificate, Site Photograph, and Other.
- Included annexures are appended after the main Proposal in upload order.

## Approved Project Description & Scope Panel

- Add a Comprehensive-only Project Description & Scope accordion panel.
- Inputs: customer project objective, existing electrical-system summary, proposed solar solution summary, site conditions/constraints, special customer requirements, and general project notes.
- Use multiline text inputs for the executive-summary and project-overview content.
- Provide editable default content; exact defaults and reset behavior are being defined.
- Load narrative defaults once from the selected project configuration and installation location.
- Never overwrite user-edited narrative fields automatically.
- Provide Restore Default per field and Restore All Defaults for the panel.

## Grilling Closure

- Five final input-system questions remain after Question 23.
- They cover default section selection, standard versus per-Proposal content, preview layout, draft persistence, and validation behavior.
- C&I schematic variants and how they are selected/generated.
- Commercial, legal, and financial page content and layout; underlying calculation rules are deferred.
- Authoring form organization and Proposal preview/export presentation; persistence and workflow rules are deferred.

## Assumptions to Validate

- The comprehensive Proposal is primarily customer-facing and intended for C&I decision-makers.
- It should support projects beyond standard residential rooftop configurations.
- Some long-Proposal sections will be conditional by project type, contract model, and available site data.

## Interview Log

- 2026-08-11: Started design grilling. Current codebase and 8-page Proposal baseline inspected.
- 2026-08-11: User narrowed the current exercise to tool creation and page content; business logic is out of scope for now.
- 2026-08-11: User supplied the first six structured input panels and requested that input-system design be resolved before Proposal page design.
