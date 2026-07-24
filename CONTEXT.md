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
