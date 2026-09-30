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
| `global/styles/navigation.css` | The sidebar and mobile header. |
| `global/styles/components.css` | The shared components below. |
| `global/styles/responsive.css` | Shell breakpoints: the mobile drawer and sidebar sizes. |
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

## Components

All of these live in `components.css`. A tool's own stylesheet should only hold what is particular to that tool.

### Tool header

```html
<div class="tool-header">
    <h1>Tax Invoice Generator</h1>
    <p>One line saying what the tool does.</p>
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

For a card whose title needs a subtitle or a button beside it, use `.card-header`:

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

`.form-grid` places cards two across on a wide screen and one across below 1025px.

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

### Tables and alerts

```html
<div class="table-wrap">
    <table class="data-table">...</table>
</div>

<div class="alert alert-warning">Something to check before continuing.</div>
```

## Financial documents

The tax invoice, proforma invoice, quotation, purchase order and receipt share one sheet and one line-item builder. The markup looks like this:

```html
<link rel="stylesheet" href="../../global/styles/financial-document.css">
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
    <link rel="stylesheet" href="../../global/styles/base.css">
    <link rel="stylesheet" href="../../global/styles/navigation.css">
    <link rel="stylesheet" href="../../global/styles/components.css">
    <link rel="stylesheet" href="../../global/styles/responsive.css">
    <link rel="stylesheet" href="my-tool.css">
    <script src="../../global/scripts/theme.js"></script>
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

    <script src="../../global/scripts/tools.js"></script>
    <script src="../../global/scripts/auth.js" data-tool-id="my-tool"></script>
    <script src="../../global/scripts/navigation.js"></script>
    <script src="my-tool.js"></script>
</body>

</html>
```

4. **Check.** Run `node --test tests/*.test.js`. `codebase-structure.test.js` fails if the registry and the folders disagree, and `auth.test.js` fails if the page loads its scripts in the wrong order. Then look at the tool at 1440px and 375px, in light and dark, and print it.

## Rules the tests hold

- No file over 1,000 lines.
- Tool CSS doesn't restyle the scrollbar. There is one 6px grey pill, in `base.css`.
- Documents never use chrome tokens (`var(--bg-*)`, `var(--text-*)`, …). A themed token inside a document is how a dark A4 page would get printed.
- Below 769px: 44px tap targets and 16px inputs. The sidebar rows are the one exception.
