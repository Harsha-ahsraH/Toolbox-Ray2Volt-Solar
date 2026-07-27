# Ray2Volt Solar Toolbox

Internal toolbox of document generators (quotes, invoices, receipts, payslips) and calculators for Ray2Volt Solar Private Limited, a rooftop solar EPC company in Andhra Pradesh, India.

## Language

**Tool Operation**:
A named Ray2Volt business task, such as creating an Invoice or calculating an EMI.
_Avoid_: Tool page, skill, slash command

**Generation Request**:
The complete, validated business information required to execute one document-producing Tool Operation.
_Avoid_: Form data, prompt answers

**Artifact**:
A saved business document produced by a Tool Operation, such as an Invoice PDF or Warranty Card PDF.
_Avoid_: Output file, download

**Invoice**:
The numbered GST tax document issued for an actual taxable supply, distinct from a Proforma Invoice.
_Avoid_: Bill, Proforma Invoice

**Invoice Number**:
The identifier for an Invoice, using the format `R2VINV[MMYY]-[NNNN]`.
_Avoid_: Invoice ID, reference number

**GST Rate**:
The GST percentage applied to an Invoice line. Use 5% when the user does not specify a rate; an explicitly supplied rate overrides that default.
_Avoid_: Tax slab

**GST-Inclusive Amount**:
An amount that already contains its applicable GST. Treat a user-supplied Invoice price as GST-inclusive unless the user explicitly states that GST is excluded or must be added.
_Avoid_: Base price, taxable value

**Generation Confirmation**:
The user's explicit approval of a completed Generation Request, including inferred defaults and calculated totals, before its Artifact is created.
_Avoid_: Preview, form submission

**Installation Type**:
The kind of solar system being quoted. Exactly two values exist: On-Grid and Hybrid. Each has its own schematic diagram and BOM defaults. (Off-Grid was dropped as an offering — 2026-07-06.)
_Avoid_: Off-Grid, system type

**Proposal**:
The customer-facing multi-page A4 document produced by the Quote Generator, identified by a Quotation Number.
_Avoid_: Quote document, offer letter

**Quotation Number**:
Unique identifier for a Proposal, format `R2VQ[MMYY]-[NNNN]`, sequential per month.

**Schematic**:
The illustrated system-diagram PNG in `tools/quote-generator/assets/`, one per Installation Type, shown on the Proposal's technical overview page.
_Avoid_: circuit diagram, wiring diagram

**BOM (Bill of Materials)**:
The editable list of supplied components and services in a Proposal — main items plus Installation Accessories. Quantities and makes, no per-line pricing.

**Comparison Sheet**:
The two-page A4 document produced by the Comparison Sheet tool, setting three Build Standards for one plant against each other at three entered prices. Ships alongside a Proposal; it is not a quotation and carries no BOM, margins, customer name, date or Quotation Number.
_Avoid_: Options sheet, price comparison, quote comparison

**Build Standard**:
One of the three specification levels a Comparison Sheet compares — Option 1 (Basic build), Option 2 (Standard build), Option 3 (Ray2Volt Choice). A Build Standard is a specification, not a package or a price.
_Avoid_: Tier, package, variant

**Derived Row**:
A Comparison Sheet specification row filled from the Generation Request rather than the template — rear-side generation, earthing, annual maintenance, and usable storage on Hybrid. A Derived Row cell the salesperson edits by hand is frozen permanently and is never recalculated, including when capacity changes.
_Avoid_: Computed row, auto row

**Resource Library**:
The catalogue tool listing every downloadable template, datasheet, brochure and process document. It stores nothing itself; each entry either points at a file committed into `downloads/` or links to one held in Drive.
_Avoid_: Downloads page, file manager, document store

**Toolbox-hosted resource**:
A Resource Library entry whose file is committed into this repository (`place: 'toolbox'`). **The repository is public**, so such a file is downloadable by anyone with its address, is not protected by the tool password, and remains in git history after deletion. Reserved for material that is safe to publish: manufacturer datasheets, brochures, blank templates.
_Avoid_: Local file, internal file

**Linked resource**:
A Resource Library entry that points at a file in Drive or SharePoint (`place: 'link'`). Access is governed by whoever owns that folder, and staff without repository access can add them. Required for anything internal — price lists showing margin, contracts, or documents holding real figures or personal details.
_Avoid_: External file, remote file

**Earth Pit Schedule**:
The capacity bands fixing earth pit counts for Option 3 — 3 pits to 10 kWp, 4 to 20, 6 to 50, 8 to 250, 10 to 500, 12 to 1 MWp, then 2 more per additional MWp. Options 1 and 2 take two fewer, with a floor of three pits for any option at any capacity, so below 20 kWp the counts converge and electrode type is what distinguishes the options.
_Avoid_: Earthing table, pit count rule
