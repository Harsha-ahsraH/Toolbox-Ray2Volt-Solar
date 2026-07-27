const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'comparison-sheet');

const model = require(path.join(toolRoot, 'comparison-sheet-model.js'));
const content = require(path.join(toolRoot, 'comparison-sheet-content.js'));
const copy = require(path.join(toolRoot, 'comparison-sheet-copy.js'));

// The renderer is a browser script that publishes onto the global rather than
// exporting, and it reads its siblings off the global at load time. Wiring them
// up here lets the document markup be asserted without a DOM.
globalThis.Ray2VoltComparisonModel = model;
globalThis.Ray2VoltComparisonContent = content;
globalThis.Ray2VoltComparisonCopy = copy;
require(path.join(toolRoot, 'comparison-sheet-render.js'));
const render = globalThis.Ray2VoltComparisonRender;

const html = fs.readFileSync(path.join(toolRoot, 'comparison-sheet.html'), 'utf8');
const toolCss = fs.readdirSync(toolRoot)
    .filter(file => file.endsWith('.css'))
    .map(file => fs.readFileSync(path.join(toolRoot, file), 'utf8'))
    .join('\n');

// --- Specification rows -------------------------------------------------
const onGridRows = content.rowsFor('on-grid');
const hybridRows = content.rowsFor('hybrid');

assert.ok(onGridRows.length >= 13, 'the on-grid template should carry the full specification set');
assert.ok(hybridRows.length > onGridRows.length, 'hybrid adds battery and backup rows');

const onGridIds = onGridRows.map(row => row.id);
const hybridIds = hybridRows.map(row => row.id);

for (const id of ['module_technology', 'rear_side', 'earthing', 'amc', 'workmanship']) {
    assert.ok(onGridIds.includes(id), `the on-grid template must include the ${id} row`);
}

for (const id of ['battery_chemistry', 'battery_capacity', 'battery_warranty', 'changeover']) {
    assert.ok(hybridIds.includes(id), `hybrid must include the ${id} row`);
    assert.ok(!onGridIds.includes(id), `on-grid must not include the ${id} row`);
}

assert.equal(new Set(hybridIds).size, hybridIds.length, 'row ids are unique');

// Every row has exactly three option values, or a column would silently vanish.
for (const row of hybridRows) {
    assert.equal(row.values.length, 3, `${row.id} must carry three values`);
    assert.ok(row.label.length > 0, `${row.id} must have a label`);
}

// Derived rows ship blank and are filled from the inputs; templated rows must
// never ship blank, or the sheet prints an empty cell.
for (const row of hybridRows) {
    if (row.derived) continue;
    for (const value of row.values) {
        assert.ok(value.trim().length > 0, `${row.id} has an empty templated cell`);
    }
}

const derivedKinds = hybridRows.filter(row => row.derived).map(row => row.derived);
assert.deepEqual(
    derivedKinds.slice().sort(),
    ['amc', 'battery', 'bifacial', 'earthing'],
    'exactly four kinds of row are derived on hybrid'
);

// Mutating one call's rows must not poison the next.
onGridRows[0].values[0] = 'tampered';
assert.notEqual(content.rowsFor('on-grid')[0].values[0], 'tampered', 'rowsFor returns a fresh copy each time');

// All three options are bifacial, so no module row may say monofacial.
for (const value of content.rowsFor('on-grid').find(row => row.id === 'module_technology').values) {
    assert.match(value, /bifacial/i, 'every option is bifacial');
    assert.doesNotMatch(value, /monofacial/i, 'no option is monofacial');
}

// --- Good / bad flags ---------------------------------------------------
// Every cell carries a tone, and only the three known values are used.
for (const row of hybridRows) {
    assert.equal(row.tone.length, 3, `${row.id} must carry three tones`);
    for (const tone of row.tone) {
        assert.ok(['poor', 'fair', 'good'].includes(tone), `${row.id} has an unknown tone "${tone}"`);
    }
}

const toneById = id => content.rowsFor('hybrid').find(row => row.id === id).tone;

// Most rows climb poor -> fair -> good.
assert.deepEqual(toneById('corrosion'), ['poor', 'fair', 'good'], 'corrosion protection climbs across the builds');
assert.deepEqual(toneById('lightning'), ['poor', 'fair', 'good'], 'lightning protection climbs across the builds');

// Rows where all three are a legitimate choice must not paint Option 1 red.
assert.deepEqual(
    toneById('module_technology'),
    ['fair', 'fair', 'good'],
    'every module is ALMM-listed, so Option 1 is not flagged bad'
);
assert.deepEqual(toneById('rear_side'), ['fair', 'fair', 'good'], 'all three options earn rear-side gain');

// Where Options 2 and 3 are genuinely equal, both are good.
assert.deepEqual(toneById('liaisoning'), ['poor', 'good', 'good'], 'liaisoning is included on both upper builds');

// Option 3 is never flagged bad, and Option 1 is never flagged best.
for (const row of hybridRows) {
    assert.notEqual(row.tone[2], 'poor', `${row.id} must not flag the recommended build as bad`);
    assert.notEqual(row.tone[0], 'good', `${row.id} must not flag the basic build as best`);
}

// The numeric flags are computed from the figures, so they cannot go stale.
assert.deepEqual(
    render.numericTone([100, 50, 25], true),
    ['poor', 'fair', 'good'],
    'lower-is-better marks the smallest good'
);
assert.deepEqual(
    render.numericTone([100, 150, 200], false),
    ['poor', 'fair', 'good'],
    'higher-is-better marks the largest good'
);
assert.deepEqual(
    render.numericTone([70, 70, 70], true),
    ['fair', 'fair', 'fair'],
    'identical figures are not flagged at all'
);
assert.deepEqual(
    render.numericTone([50, 100, 50], true),
    ['good', 'poor', 'good'],
    'a tie for best marks both'
);

assert.equal(render.toneClass('poor'), ' cs-tone-poor');
assert.equal(render.toneClass('good'), ' cs-tone-good');
assert.equal(render.toneClass('fair'), '', 'a fair cell stays uncoloured');
assert.equal(render.toneClass(null), '', 'an absent tone stays uncoloured');

// An edited cell loses its flag: the wording is no longer ours to judge.
const editedRows = content.rowsFor('on-grid').map(row => ({ ...row, edited: [false, false, false] }));
const cablingRow = editedRows.find(row => row.id === 'ac_cabling');
cablingRow.edited[0] = true;
cablingRow.values[0] = 'Copper throughout, upgraded on site';

const editedMarkup = render.specificationTable(editedRows);
const cablingMarkup = editedMarkup
    .split('<tr>')
    .find(chunk => chunk.includes('AC cabling'));

assert.ok(cablingMarkup, 'the AC cabling row should render');
assert.ok(!cablingMarkup.includes('cs-tone-poor'), 'an edited cell must not keep its red flag');
assert.ok(cablingMarkup.includes('cs-tone-good'), 'the untouched Option 3 cell keeps its green flag');

// The header carries a real label per option, and marks the recommendation.
assert.match(editedMarkup, /cs-option-head-pick/, 'Option 3 column head is set apart');
assert.match(editedMarkup, /cs-corner">Specification</, 'the corner cell titles the first column');
for (const label of content.OPTION_SUBLABELS) {
    assert.ok(editedMarkup.includes(label), `the header should name "${label}"`);
}

// --- Vendor questions ---------------------------------------------------
assert.equal(content.questionsFor('on-grid').length, 8, 'on-grid asks eight questions');
assert.equal(content.questionsFor('hybrid').length, 9, 'hybrid adds a battery question');
assert.match(content.questionsHeading(8), /^Eight questions/, 'the heading spells the count');
assert.match(content.questionsHeading(9), /^Nine questions/, 'the heading spells the count');
assert.match(content.questionsFor('hybrid')[8], /batter/i, 'the extra question is about the battery');

for (const question of content.questionsFor('hybrid')) {
    assert.match(question, /\?/, 'every listed question is actually a question');
}

// --- Adaptive callout ---------------------------------------------------
function callout(prices) {
    return copy.calloutLines(model.compute({
        capacityKwp: 75,
        systemType: 'on-grid',
        priceMode: 'rate',
        prices
    }));
}

const normal = callout([34, 37.5, 40]);
assert.match(normal[0], /costs .* more today/, 'the usual case reads as a premium');
assert.match(normal[0], /for every additional rupee/, 'and quotes the return per extra rupee');

// Equal prices must not divide by zero.
const equal = callout([40, 40, 40]);
assert.match(equal[0], /costs the same as Option 1 today/, 'level pricing is stated plainly');
assert.doesNotMatch(equal[0], /for every additional rupee/, 'there is no extra rupee to divide by');

// A cheaper Option 3 must not print a negative premium.
const cheaper = callout([40, 37.5, 34]);
assert.match(cheaper[0], /costs .* less today/, 'a cheaper Option 3 is described as cheaper');
assert.doesNotMatch(cheaper[0], /-\s*₹/, 'no negative rupee figure reaches the page');

// Nothing degenerate escapes into any of the three sentences, in any case.
for (const prices of [[34, 37.5, 40], [40, 40, 40], [40, 37.5, 34], [0.01, 0.01, 0.01]]) {
    for (const line of callout(prices)) {
        assert.doesNotMatch(line, /NaN|Infinity|undefined|null/, `"${line}" must be clean prose`);
        assert.ok(line.trim().length > 0, 'no empty callout line');
    }
}

// --- Derived cell copy --------------------------------------------------
const hybridResult = model.compute({
    capacityKwp: 75,
    systemType: 'hybrid',
    batteryKwh: 100,
    priceMode: 'rate',
    prices: [34, 37.5, 40]
});

assert.match(copy.amcCell(hybridResult.options[0]), /850.*kWp.*year/, 'Option 1 AMC reads per kWp per year');
assert.match(copy.amcCell(hybridResult.options[2]), /Year 1 free/, 'Option 3 states its free first year');
assert.doesNotMatch(copy.amcCell(hybridResult.options[1]), /free/, 'Option 2 has no free year');

// Usable storage rises with the build standard, from the one installed figure.
const usable = [0, 1, 2].map(index => copy.batteryCell(hybridResult, index));
for (const cell of usable) {
    assert.match(cell, /of 100 kWh installed/, 'each cell states the installed capacity');
}
assert.notEqual(usable[0], usable[2], 'depth of discharge differentiates the options');

const onGridResult = model.compute({ capacityKwp: 75, priceMode: 'rate', prices: [34, 37.5, 40] });
assert.equal(copy.batteryCell(onGridResult, 0), '—', 'an on-grid sheet shows no storage figure');

// --- Basis of calculation states the assumptions we chose ---------------
const basis = copy.basisParagraph(hybridResult, model);
assert.match(basis, /30 years/, 'the horizon is stated');
assert.match(basis, /beyond the 25-year module performance warranty/, 'and flagged as beyond the warranty');
assert.match(basis, /three inverter replacements/, 'Option 1 repair basis is stated');
assert.match(basis, /two inverter replacements/, 'Options 2 and 3 repair basis is stated');
assert.match(basis, /Battery replacement is assumed once/, 'the single battery replacement is disclosed');
assert.match(basis, /no second replacement is costed/, 'and its limit is disclosed too');
assert.match(basis, /Rear-side gain/, 'the tiered bifacial gain is stated');

const onGridBasis = copy.basisParagraph(onGridResult, model);
assert.doesNotMatch(onGridBasis, /Battery/, 'an on-grid sheet says nothing about batteries');

// --- Page and print discipline -----------------------------------------
assert.match(toolCss, /\.cs-page\s*\{[^}]*height:\s*297mm/, 'the page is pinned to A4 height');
assert.match(toolCss, /\.cs-page\s*\{[^}]*overflow:\s*hidden/, 'overflow is hidden so it can be detected');
assert.match(toolCss, /@media print/, 'the tool ships print styles');

// The tool takes its width from the shared shell rather than setting its own.
// `max-width: none` in the print block is fine; a fixed width is what broke the
// tools' agreement with one another before.
assert.doesNotMatch(
    toolCss,
    /\.no-print-area\s*\{[^}]*max-width:\s*\d/,
    'no tool-level page width on .no-print-area'
);
assert.doesNotMatch(
    toolCss,
    /\.content-section\s*\{[^}]*max-width:\s*\d/,
    'no tool-level page width on .content-section'
);

// Sections that stack on mobile space themselves off the shared token.
for (const selector of ['.cs-form-grid', '.cs-form-card', '.cs-spec-card']) {
    const rule = toolCss.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`));
    assert.ok(rule, `missing CSS rule for ${selector}`);
    assert.match(
        rule[1],
        /margin-bottom:\s*var\(--section-gap, 1\.5rem\)/,
        `${selector} should space itself off --section-gap`
    );
}

// The edited-cell marker is what makes the permanent freeze visible.
assert.match(toolCss, /input\.cs-cell-edited/, 'edited cells are marked');

// The flags belong to the printed document only. The form stays plain — the
// editing surface is not where the customer-facing verdict is shown.
const documentCss = fs.readFileSync(path.join(toolRoot, 'comparison-sheet-document.css'), 'utf8');
const formCss = fs.readFileSync(path.join(toolRoot, 'comparison-sheet-form.css'), 'utf8');

for (const tone of ['poor', 'good']) {
    assert.match(documentCss, new RegExp(`td\\.cs-tone-${tone}`), `the document styles .cs-tone-${tone}`);
}
assert.doesNotMatch(formCss, /cs-tone-/, 'the form table must not carry the red/green flags');
assert.match(documentCss, /--cs-poor:\s*#DC2626/, 'red is a named token');
assert.match(documentCss, /--cs-good:\s*#16A34A/, 'green is a named token');
assert.doesNotMatch(toolCss, /\.cs-tone-fair/, 'a fair cell has no styling of its own');

/**
 * Table headers stay light. A dark fill was tried and rejected, so this guards
 * against reintroducing one in either the document or the form.
 */
const headRule = documentCss.match(/\.cs-doc-table thead th\s*\{([^}]*)\}/);
assert.ok(headRule, 'the document header rule should exist');
assert.match(headRule[1], /background-color:\s*var\(--cs-tint\)/, 'the document header is a light tint');
assert.match(headRule[1], /color:\s*var\(--cs-navy\)/, 'with navy text, not white');
assert.match(headRule[1], /padding:\s*8px/, 'the header sets its own padding, not the body fit budget');

const formHeadRule = formCss.match(/\.cs-spec-input-table th\s*\{([^}]*)\}/);
assert.ok(formHeadRule, 'the form header rule should exist');

for (const dark of ['#1F4E79', '#17395A', 'var(--cs-navy)', 'var(--cs-navy-dark)']) {
    assert.ok(
        !formHeadRule[1].includes(dark),
        `the form header must not use the dark fill ${dark}`
    );
}
assert.ok(
    !/color:\s*#fff/i.test(formHeadRule[1]),
    'no white-on-dark text in the form table header'
);
// Nor a dark fill anywhere else in that table.
assert.ok(
    !/\.cs-spec-input-table[^{]*\{[^}]*background[^;]*(#1F4E79|#17395A)/i.test(formCss),
    'no dark fill anywhere in the form specification table'
);

/**
 * Row spacing is two-tier because the row count is not fixed: 13 rows on-grid,
 * 18 on hybrid. The comfortable default is what the sheet should normally look
 * like; the dense variant exists only so an 18-row hybrid still fits page 1.
 *
 * Node cannot measure a rendered page, so these pin the values that were
 * measured to fit. 5px on the dense tier put an 18-row sheet 3mm over — if you
 * loosen either, re-measure a hybrid sheet in the browser.
 */
const specCellRule = documentCss.match(/\.cs-spec-doc-table th,\s*\n\.cs-spec-doc-table td\s*\{([^}]*)\}/);
assert.ok(specCellRule, 'the specification cell rule should exist');
assert.match(specCellRule[1], /padding:\s*8px 10px/, 'the default spacing is the comfortable one');

const denseRule = documentCss.match(/\.cs-spec-doc-table\.cs-spec-dense th,\s*\n\.cs-spec-doc-table\.cs-spec-dense td\s*\{([^}]*)\}/);
assert.ok(denseRule, 'the dense variant rule should exist');
assert.match(denseRule[1], /padding:\s*4px 9px/, '4px is the measured ceiling for 18 rows');

// The dense variant must be strictly tighter than the default, or it is pointless.
const padOf = rule => parseFloat(rule.match(/padding:\s*([\d.]+)px/)[1]);
assert.ok(padOf(denseRule[1]) < padOf(specCellRule[1]), 'the dense tier must be tighter than the default');

// The threshold has to sit between the two real row counts.
assert.ok(
    render.DENSE_ROW_THRESHOLD >= content.rowsFor('on-grid').length,
    'on-grid must get the comfortable spacing'
);
assert.ok(
    render.DENSE_ROW_THRESHOLD < content.rowsFor('hybrid').length,
    'hybrid must fall through to the dense spacing'
);

// And the class is only applied past it.
assert.doesNotMatch(
    render.specificationTable(content.rowsFor('on-grid')),
    /cs-spec-dense/,
    'a 13-row sheet is not dense'
);
assert.match(
    render.specificationTable(content.rowsFor('hybrid')),
    /cs-spec-dense/,
    'an 18-row sheet is dense'
);

// --- Page wiring --------------------------------------------------------
assert.match(html, /family=Google\+Sans:/, 'the page loads Google Sans for its headings');
assert.match(html, /data-tool-id="comparison-sheet"/, 'the page is password gated');
assert.match(html, /global\/scripts\/pdf-download\.js/, 'the shared PDF helper is loaded');

for (const script of ['content', 'model', 'copy', 'render']) {
    assert.ok(
        html.includes(`comparison-sheet-${script}.js`),
        `comparison-sheet-${script}.js must be loaded before the controller`
    );
}

// The controller must load last, or its globals are undefined.
assert.ok(
    html.lastIndexOf('comparison-sheet.js') > html.lastIndexOf('comparison-sheet-render.js'),
    'the controller loads after its dependencies'
);

// Battery capacity is present but hidden until Hybrid is chosen.
assert.match(html, /id="csBatteryGroup"[^>]*hidden/, 'the battery field starts hidden');

// Both price modes are offered, with rate as the default.
assert.match(html, /name="csPriceMode" value="rate" checked/, 'rupees per Wp is the default mode');
assert.match(html, /name="csPriceMode" value="total"/, 'total price is the alternative');

// Exactly two pages exist in the document.
assert.equal((html.match(/class="cs-page"/g) || []).length, 2, 'the document is two A4 pages');

// No Add row control — the row set may shrink but never grow.
assert.ok(!/id="csAddRowBtn"/.test(html), 'there is no Add row button');
assert.match(html, /id="csResetRowsBtn"/, 'Reset to template is offered');

// The sheet carries no customer, date or document number, by design.
for (const field of ['csCustomerName', 'csDate', 'csSheetNumber', 'csValidity']) {
    assert.ok(!html.includes(field), `the sheet must not collect ${field}`);
}

// --- Password registration ----------------------------------------------
const passwords = fs.readFileSync(path.join(repoRoot, 'global', 'scripts', 'passwords.js'), 'utf8');
assert.match(passwords, /"comparison-sheet":\s*\[/, 'the tool has a password entry');

// --- Nav link on every page that lists the tools ------------------------
const pagesWithNav = [path.join(repoRoot, 'index.html')].concat(
    fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(repoRoot, 'tools', entry.name, `${entry.name}.html`))
        .filter(fs.existsSync)
);

for (const page of pagesWithNav) {
    const contents = fs.readFileSync(page, 'utf8');
    assert.match(
        contents,
        /comparison-sheet\/comparison-sheet\.html" class="nav-link/,
        `${path.relative(repoRoot, page)} should link to the Comparison Sheet`
    );
}

// Exactly one page marks the link active — its own.
const activePages = pagesWithNav.filter(page =>
    /comparison-sheet\/comparison-sheet\.html" class="nav-link active"/.test(fs.readFileSync(page, 'utf8'))
);
assert.equal(activePages.length, 1, 'only the Comparison Sheet page marks its own nav link active');
assert.match(activePages[0], /comparison-sheet[\\/]comparison-sheet\.html$/, 'and it is the right page');

// The dashboard offers a card as well as a nav link.
const index = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
assert.match(
    index,
    /comparison-sheet\/comparison-sheet\.html" class="tool-card"/,
    'the dashboard should carry a Comparison Sheet card'
);

console.log('comparison sheet document tests passed');
