# Ray2Volt Solar Toolbox

Internal toolbox of document generators (quotes, invoices, receipts, payslips) and calculators for Ray2Volt Solar Private Limited, a rooftop solar EPC company in Andhra Pradesh, India.

## Language

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
