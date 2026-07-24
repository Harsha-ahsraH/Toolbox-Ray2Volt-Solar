# `ray2volt-invoice` design

Status: In discussion

## Agreed behavior

- Parse Invoice details already present in the user's request before asking questions.
- Build and validate a structured Generation Request.
- Use a 5% GST Rate when none is supplied; preserve an explicitly supplied rate.
- Treat supplied prices as GST-Inclusive Amounts unless the user explicitly says GST is excluded or must be added.
- Show all supplied, defaulted, inferred, and calculated values and obtain Generation Confirmation before creating the PDF.
- Save the PDF in `Ray2Volt Invoices` under the active project, creating the directory when necessary. If an active project root cannot be identified, use the current working directory.
- Name the PDF `[Invoice Number]_[Customer Name]_Tax-Invoice.pdf` after replacing characters that are invalid in Windows filenames.

## Concrete example

The example request supplies Invoice Number `R2VINV0726-0092`, customer `P Chandra Sekhar`, phone `8956473201`, billing address `Srikalahasti, Tirupati Dist, Andhra Pradesh, 517644`, one 10 kWp On-Grid system at a GST-Inclusive Amount of `345000`, and a 5% GST Rate. Fields not safely derivable from those facts remain unresolved and must be obtained through one-at-a-time follow-up questions or explicit defaults approved during this design.
