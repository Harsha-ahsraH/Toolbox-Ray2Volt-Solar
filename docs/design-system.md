# Toolbox design system

Every tool is built from the same parts, so a new tool looks like the rest without anyone copying CSS. This page lists those parts and shows how to add a tool.

The toolbox has two layers, and they never share styles:

| Layer | What it is | Where it's styled | Themed? |
| --- | --- | --- | --- |
| **Chrome** | The sidebar, forms, buttons, results: everything a person works in | `global/styles/*.css` tokens and components | Yes, light and dark |
| **Documents** | The A4 sheets that print or save as PDF | Each document's own stylesheet, or `financial-document.css` | No. Paper is always white. |

`.no-print-area` marks where the chrome ends. Everything inside it is hidden when printing.

## Files

| File | Owns |
| --- | --- |
| `global/scripts/tools.js` | **The registry**: the one list of tools. The sidebar, dashboard cards, tool search and access levels are all read from it. |
| `global/scripts/theme.js` | Light/dark choice. Loads in `<head>` so the page never flashes the wrong theme. |
| `global/scripts/auth.js` | The sign-in gate and each tool's access level (read from the registry). |
| `global/scripts/navigation.js` | Builds the mobile header, the sidebar, the search and the dashboard cards. |
| `global/scripts/financial-document.js` | Line items, GST maths, money and amount-in-words for the invoice family. |
| `global/styles/base.css` | Tokens (colour, spacing, radius, type), resets, the scrollbar and icon font. |
| `global/styles/navigation.css` | The sidebar, mobile header, dashboard cards and sign-in gate. |
| `global/styles/components.css` | The shared components below. |
| `global/styles/responsive.css` | Shell breakpoints: the mobile drawer and sidebar sizes. |
| `global/styles/cursor-background.css` | The faint cursor dot field, with separate light/dark intensity and print exclusion. |
| `global/scripts/cursor-background.js` | Pointer tracking for the background; stops when settled, hidden, printing, or reduced motion is enabled. |
| `global/styles/financial-document.css` | The A4 sheet used by the invoice, proforma, quotation, PO and receipt. |

## Tokens

Use tokens, never raw colours, anywhere in the chrome. The dark theme redefines every colour token, so a raw hex code is how a white panel ends up on a dark page. `tests/theme.test.js` checks that the two themes stay paired.

| Group | Tokens |
| --- | --- |
| Brand | `--primary` (fills, borders), `--primary-light` (tints), `--primary-text` (brand-coloured **text**: it passes contrast; `--primary` does not), `--on-primary` (text on a `--primary` fill) |
| Surfaces | `--bg-body`, `--bg-card`, `--bg-sidebar`, `--bg-hover`, `--bg-active`, `--row-stripe`, `--table-head-bg` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` |
| Borders | `--border-light`, `--border-medium` |
| Status | `--danger-*`, `--warning-*`, `--success-*`, `--info-*`, each with `-text`, `-bg` and `-border` |
| Space | `--spacing-xs` 0.5rem · `--spacing-sm` 0.75rem · `--spacing-md` 1rem · `--spacing-lg` 1.5rem · `--spacing-xl` 2rem · `--section-gap` |
| Shape | `--radius-sm` / `--radius-md` 2px, `--radius-lg` 4px, `--lift` (the one card shadow) |
| Layout | `--tool-width` (every tool's column), `--sidebar-width`, `--sidebar-collapsed-width` |

Type: the chrome sets body text in Google Sans Flex and headings in Google Sans (`base.css`). Buttons and fields inherit the page font. Documents use Google Sans Flex. Icons in the chrome are Material Symbols Rounded: `<span class="material-symbols-rounded" aria-hidden="true">name</span>`. Documents draw inline SVG icons instead.

Every toolbox page loads `cursor-background.css` with the shared styles and `cursor-background.js` after navigation. It adds one decorative, pointer-transparent layer behind the page content. The 32px dot pattern stays still while its feathered 250px × 220px mask follows the pointer. Light mode uses 33% of `--primary-text`; dark mode uses 14%, matching the approved preview at 100% strength. Reduced-motion and touch devices show a still corner patch. The layer is hidden when printing and cannot enter the document previews.

The icon font is downloaded as a subset: only the names listed in `icon_names` on the import at the top of `base.css`. **A new icon must be added to that list**, in alphabetical order, or it renders as its name. `tests/material-icons.test.js` finds every icon the Toolbox draws and fails until it's listed.

## Components

All of these live in `components.css`. A tool's own stylesheet should only hold what is particular to that tool.

### Tool header

```html
<div class="tool-header">
    <h1>Tax Invoice Generator</h1>
    <p>One line saying what the tool does.</p>
</div>
```

For a header with page-level actions on the right (preview, print), add `.tool-header-row` and put the buttons in `.tool-header-actions`:

```html
<div class="tool-header tool-header-row">
    <div>
        <h1>Margin Breakdown</h1>
        <p>One line saying what the tool does.</p>
    </div>
    <div class="tool-header-actions">
        <button type="button" class="btn btn-secondary btn-sm">Preview</button>
    </div>
</div>
```

### Card

A card holds every panel a person fills in or reads a result from. The icon is optional.

```html
<div class="card">
    <h3 class="card-title">
        <span class="material-symbols-rounded" aria-hidden="true">person</span>
        Customer Details
    </h3>
    ...
</div>
```

One line of help under the title goes in `<p class="card-note">`.

For a card whose title needs a subtitle, a count or a button beside it, use `.card-header`. `.card-count` is a muted count such as "12 rows":

```html
<div class="card-header">
    <div>
        <h3>Invoice Items</h3>
        <p>Add items with individual GST rates</p>
    </div>
    <button type="button" class="btn btn-secondary btn-sm">Reset</button>
</div>
```

### Form grid

`.form-grid` places cards two across on a wide screen and one across below 1025px. A card whose fields belong to the whole document takes `.card-wide` and runs the full width.

```html
<div class="form-grid">
    <div class="card">...</div>
    <div class="card">...</div>
</div>
```

### Field

```html
<div class="field">
    <label for="customerName">Customer Name</label>
    <input type="text" id="customerName" class="input" placeholder="Enter customer name">
    <p class="field-hint">Optional helper text.</p>
</div>
```

`.input` works on `<input>`, `<select>` and `<textarea>`. Below 769px, inputs are 16px (so iOS doesn't zoom in) and 44px tall (a thumb-sized target). Don't override either.

- A value the tool rejects gets `.is-invalid` (a red border and ring); remove it once the value is fixed. Pair it with `aria-invalid="true"`.
- A box people write Markdown or code in adds `.input-code` for a monospace face.

### Choosing between options

A **segmented control** picks one of a few options, such as a mode or a method. Mark the chosen button with `.active` and `aria-pressed="true"`. Placed straight after an `.input`, it becomes a row of quick picks for that field.

```html
<div class="segmented" role="group" aria-label="Calculate">
    <button type="button" class="segmented-btn active" aria-pressed="true">EMI</button>
    <button type="button" class="segmented-btn" aria-pressed="false">Loan amount</button>
</div>
```

A **choice group** draws radio buttons or checkboxes as bordered chips. The label wraps its input, so the whole chip is the tap target; the checked chip is tinted.

```html
<div class="choice-group" role="radiogroup" aria-label="Layout">
    <label class="choice"><input type="radio" name="layout" value="two" checked> Two columns</label>
    <label class="choice"><input type="radio" name="layout" value="three"> Three columns</label>
</div>
```

### Split

`.split` sets a card's inputs beside its results on a wide screen and stacks them below 1025px.

```html
<div class="card">
    <div class="split">
        <div>...inputs...</div>
        <div>...results...</div>
    </div>
</div>
```

### Buttons

```html
<div class="actions">
    <button type="button" class="btn btn-primary">Generate Preview</button>
    <button type="button" class="btn btn-secondary">Print / Save as PDF</button>
</div>
```

| Class | Use |
| --- | --- |
| `.btn-primary` | The one main action on a screen |
| `.btn-secondary` | Everything else: a neutral outline |
| `.btn-danger` | Destructive actions |
| `.btn-sm` | Compact, inside a card header or table |
| `.btn-block` | Full width |

`.actions` centres a row of buttons. On a phone it stacks them full width.

### Line items

A repeatable group of fields. The invoice family gets these built by `financial-document.js` (see below). Build them by hand only for other data, such as payslip earnings.

```html
<div class="item-row">
    <div class="item-header">
        <span class="item-number">Item 1</span>
        <button type="button" class="btn-remove" aria-label="Remove item">&times;</button>
    </div>
    <div class="item-fields">
        <div class="field">...</div>
        <div class="field">...</div>
    </div>
</div>
<button type="button" class="btn-add">Add Another Item</button>
```

On a wide screen, set the columns on any ancestor, e.g. `--item-columns: minmax(0, 1fr) 120px;`. Below that, each field takes the full width. Disable `.btn-remove` when only one row is left; don't show an alert.

### Tables

A **data table** shows results and schedules: a light header, striped rows. Right-align amounts with `.num` on both the `<th>` and its `<td>`s, and mark the row that sums the table `.total-row`. Never give a table header a dark fill.

```html
<div class="table-wrap">
    <table class="data-table">
        <thead><tr><th>Month</th><th class="num">EMI</th></tr></thead>
        <tbody>
            <tr><td>1</td><td class="num">₹12,500</td></tr>
            <tr class="total-row"><td>Total</td><td class="num">₹1,50,000</td></tr>
        </tbody>
    </table>
</div>
```

An **edit table** is a grid of borderless inputs: a bill of materials, a spec sheet, add-on lines. Each cell's input fills the cell and shows a focus ring inside it. Number inputs right-align on their own. `td.cell-index` holds a read-only row number, and `.cell-action` is the narrow last column for the row's `.btn-remove`. Set `--edit-table-min` to the width below which the table should scroll instead of squeezing its fields (600px by default).

```html
<div class="table-wrap">
    <table class="edit-table" style="--edit-table-min: 760px">
        <thead><tr><th>S.No</th><th>Item</th><th>Qty</th><th></th></tr></thead>
        <tbody>
            <tr>
                <td class="cell-index">1</td>
                <td><input type="text" aria-label="Item 1 description"></td>
                <td><input type="number" aria-label="Item 1 quantity"></td>
                <td class="cell-action"><button type="button" class="btn-remove" aria-label="Remove row 1">&times;</button></td>
            </tr>
        </tbody>
    </table>
</div>
```

A tool that needs more than this adds its own class beside the shared one, such as `class="edit-table qg-bom-table"` for the Quote Generator's category rows.

### Alerts

An `.alert` is informational by default; add `.alert-warning`, `.alert-danger` or `.alert-success`. It spaces itself off `--section-gap`. For a list of problems, give it a title and one list per severity:

```html
<div class="alert alert-danger" role="alert">
    <p class="alert-title">Fix these before printing:</p>
    <ul class="alert-list">
        <li>Customer name is required.</li>
    </ul>
    <ul class="alert-list alert-list-warning">
        <li>No GSTIN entered.</li>
    </ul>
</div>
```

### Viewer

A document preview in a dialog over the tool. Toggle `.active` on the overlay. The pages inside `.viewer-body` are paper and keep their own palette; the tool's print stylesheet decides what prints.

```html
<div class="viewer-overlay" id="reportViewer">
    <div class="viewer" role="dialog" aria-modal="true" aria-labelledby="reportTitle">
        <div class="viewer-header">
            <h3 id="reportTitle">Savings Report</h3>
            <div class="viewer-actions">
                <button type="button" class="btn btn-primary btn-sm">Print / Save as PDF</button>
                <button type="button" class="viewer-close" aria-label="Close preview">&times;</button>
            </div>
        </div>
        <div class="viewer-body">...A4 pages...</div>
    </div>
</div>
```

## Financial documents

The tax invoice, proforma invoice, quotation, purchase order and receipt share one sheet and one line-item builder. The markup looks like this:

```html
<link rel="stylesheet" href="../../global/styles/financial-document.css?v=20260930-cleanup">
...
<div id="invoiceItemsContainer" class="line-items-hsn"></div>   <!-- or line-items-plain: no HSN column -->
<button type="button" id="addInvoiceItemBtn" class="btn-add">Add Another Item</button>
...
<div id="invoicePreview" class="doc-sheet">...</div>
```

```js
const lineItems = Docs.setupLineItems({
    container: byId('invoiceItemsContainer'),
    addButton: byId('addInvoiceItemBtn'),
    includeHsn: true
});
const items = lineItems.collectItems();
```

`setupLineItems` renders the first row itself, so the page leaves the container empty.

## Adding a tool

1. **Registry.** Add an entry to `TOOLS` in `global/scripts/tools.js`: `id` (the folder name), `label`, `icon` (a Material Symbols name), `level` (0 Everyone, 1 Sales, 2 Admin, 3 Owner), `description` and `keywords`. That one entry puts the tool in the sidebar, on the dashboard, in search and behind the right access level.
2. **Folder.** Create `tools/<id>/<id>.html` and `tools/<id>/<id>.js`. Add `<id>.css` only if the tool needs something the components don't cover.
3. **Page.** Start from this skeleton. The shell (sidebar, header, drawer) is built by `navigation.js`; don't copy it in.

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Tool - Ray2Volt Toolbox</title>
    <link rel="icon" href="data:,">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Google+Sans+Flex:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../global/styles/base.css?v=20260930-cleanup">
    <link rel="stylesheet" href="../../global/styles/navigation.css?v=20260930-cleanup">
    <link rel="stylesheet" href="../../global/styles/components.css?v=20260930-cleanup">
    <link rel="stylesheet" href="../../global/styles/responsive.css?v=20260930-cleanup">
    <link rel="stylesheet" href="my-tool.css?v=20260930-cleanup">
    <script src="../../global/scripts/theme.js?v=20260930-cleanup"></script>
</head>

<body>
    <div class="app-container">
        <main class="main-content">
            <section class="content-section active">
                <div class="no-print-area">
                    <div class="tool-header">
                        <h1>My Tool</h1>
                        <p>What it does, in one line.</p>
                    </div>
                    <div class="card">...</div>
                </div>
            </section>
        </main>
    </div>

    <script src="../../global/scripts/tools.js?v=20260930-cleanup"></script>
    <script src="../../global/scripts/auth.js?v=20260930-cleanup" data-tool-id="my-tool"></script>
    <script src="../../global/scripts/navigation.js?v=20260930-cleanup"></script>
    <script src="my-tool.js?v=20260930-cleanup"></script>
</body>

</html>
```

4. **Check.** Run `node --test tests/*.test.js`. `codebase-structure.test.js` fails if the registry and the folders disagree, and `auth.test.js` fails if the page loads its scripts in the wrong order. Then look at the tool at 1440px and 375px, in light and dark, and print it.

## Rules the tests hold

- No file over 1,000 lines.
- Tool CSS doesn't restyle the scrollbar. There is one 6px grey pill, in `base.css`.
- Documents never use chrome tokens (`var(--bg-*)`, `var(--text-*)`, …). A themed token inside a document is how a dark A4 page would get printed.
- Below 769px: 44px tap targets and 16px inputs. The sidebar rows are the one exception.
- Every local stylesheet and script is loaded with a `?v=` release tag. When a file changes, bump the tag on every page that loads it (and on the `@import`s of a manifest such as `quote-generator.css`), so no one is served a stale copy.
- Every Material Symbols icon the Toolbox draws is listed in `icon_names` in `base.css`.
- No page loads the retired `tool-responsive.css`. Forms are built from the components above; anything particular to a tool lives in that tool's own stylesheet.
