# downloads/

Files placed here are served by the Resource Library tool and can be downloaded
in one click.

## Read this before adding a file

**This repository is public.** Every file in this folder is:

- Downloadable by anyone on the internet who has or guesses the address, for
  example `https://ray2voltsolar.com/downloads/your-file.pdf`
- Visible in the public GitHub repository
- **Permanent in git history, even after you delete it.** Removing the file in a
  later commit does not remove it from the history, and there is no simple undo.
- Reachable without the tool password. The password on each tool page is
  client-side JavaScript; it does not protect a direct file address.

So this folder is the right place for:

- Manufacturer datasheets and public specifications
- Customer-facing brochures
- Blank templates that contain no real figures, names or prices

And the wrong place for:

- Price lists showing landed cost or margin
- Vendor contracts, or anything signed
- Payslips, purchase orders or invoices holding real figures
- Anything with a customer's or an employee's personal details

For those, upload the file to Drive and add a `place: 'link'` entry to the
catalogue instead. Access then stays with whoever owns the Drive folder, and
your team can add files without needing access to this repository.

**If you are not sure, use a Drive link.**

## Adding a file

1. Put the file in this folder, ideally in a sub-folder by kind
   (`downloads/datasheets/`, `downloads/brochures/`).
2. Add an entry to `tools/resource-library/resource-library-catalogue.js` with
   `place: 'toolbox'` and `path: 'downloads/<your-path>'`.
3. Commit both. `tests/resource-library.test.js` fails if a file here is not
   listed in the catalogue, or if the catalogue points at a file that is not
   here — so the two cannot drift apart, and nothing gets published silently.
