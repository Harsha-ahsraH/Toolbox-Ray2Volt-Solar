const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'margin-breakdown');

const html = fs.readFileSync(path.join(toolRoot, 'margin-breakdown.html'), 'utf8');
const controllerJs = fs.readFileSync(path.join(toolRoot, 'margin-breakdown.js'), 'utf8');
const renderJs = fs.readFileSync(path.join(toolRoot, 'margin-breakdown-render.js'), 'utf8');
const css = fs.readdirSync(toolRoot)
    .filter(file => file.endsWith('.css'))
    .map(file => fs.readFileSync(path.join(toolRoot, file), 'utf8'))
    .join('\n');

// Both browser scripts publish onto the global rather than exporting, and
// neither touches the DOM at load time, so they can be required as-is.
require(path.join(toolRoot, 'margin-breakdown-render.js'));
require(path.join(toolRoot, 'margin-breakdown-paginate.js'));
const render = globalThis.Ray2VoltMarginRender;
const paginate = globalThis.Ray2VoltMarginPaginate;

function cssRule(selector, within = css) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = within.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(match, `Missing CSS rule for ${selector}`);
    return match[1];
}

/* --- Formatting -------------------------------------------------------- */

assert.equal(render.rupees(125000), '₹ 1,25,000', 'amounts use Indian digit grouping');
assert.equal(render.rupees(0), '₹ 0');
assert.equal(render.rupees(1234.6), '₹ 1,235', 'the house documents print whole rupees');
assert.equal(render.rupees(''), '₹ 0', 'a blank amount must not print NaN');
assert.equal(render.rupees(undefined), '₹ 0');

assert.equal(render.serial(0), '01', 'serials are zero-padded, as in the reference table');
assert.equal(render.serial(11), '12');

assert.equal(
    render.plantDescription({ capacity: '75', projectTypeLabel: 'Hybrid' }),
    '75 kWp Hybrid'
);
assert.equal(
    render.plantDescription({ capacity: '', projectTypeLabel: 'On-Grid' }),
    'On-Grid',
    'a missing capacity must not leave a stray unit behind'
);

/* --- Pagination -------------------------------------------------------- */

// The paginator groups rows by attribute, so a plain object is enough to prove
// the rule that keeps the sub-total and the margin on one page.
const fakeRow = (group) => ({ getAttribute: () => group });
const groupedRows = [fakeRow(null), fakeRow('summary'), fakeRow('summary')];

assert.equal(paginate.groupAt(groupedRows, 0).length, 1, 'an ungrouped row travels alone');
assert.equal(paginate.groupAt(groupedRows, 1).length, 2, 'the two closing rows travel together');
assert.equal(paginate.GROUP_ATTRIBUTE, 'data-mb-group');

assert.match(
    renderJs,
    /mb-subtotal-row"\s+data-mb-group="summary"/,
    'the sub-total row must be marked as part of the closing group'
);
assert.match(
    renderJs,
    /mb-margin-row"\s+data-mb-group="summary"/,
    'the margin row must be marked as part of the closing group'
);

// The Markdown class lands on each top-level node; a wrapper would be one
// indivisible block the height of the whole note.
assert.match(renderJs, /node\.classList\.add\('mb-notes'\)/);
assert.match(css, /h1\.mb-notes,/, 'notes typography must be keyed on the node itself');

/* --- The page canvas --------------------------------------------------- */

assert.match(html, /<template id="mbPageTemplate">/);
assert.match(html, /class="mb-page"/);
assert.ok(
    html.indexOf('tool-responsive.css') < html.indexOf('margin-breakdown.css'),
    'the tool stylesheet must load after the shared responsive one'
);

const pageRule = cssRule('.mb-page');
for (const property of [
    /width:\s*210mm/,
    /height:\s*297mm/,
    /min-height:\s*297mm/,
    /max-height:\s*297mm/,
    // The fixed height plus hidden overflow is what makes an over-long page
    // measurable; without it the paginator cannot tell that a block spilled.
    /overflow:\s*hidden/
]) {
    assert.match(pageRule, property);
}

assert.match(cssRule('.mb-page-main'), /overflow:\s*hidden/);
assert.match(cssRule('.mb-page-main'), /flex:\s*1\s+1\s+auto/);
assert.match(cssRule('.mb-page-body'), /flex:\s*0\s+0\s+auto/);

// Header and footer are inside the cloned template, which is the only reason
// every continuation page can carry identical furniture.
const template = html.slice(html.indexOf('<template id="mbPageTemplate">'), html.indexOf('</template>'));
assert.match(template, /class="mb-header"/);
assert.match(template, /class="mb-footer"/);
assert.match(template, /data-mb-page-body/);
assert.match(template, /data-mb-page-number/);
assert.match(template, /data-mb-subtitle/);

/* --- House document style ---------------------------------------------- */

// One navy accent, matching the Quote Generator's proposal tokens.
const tokens = cssRule('#marginBreakdown');
assert.match(tokens, /--mb-navy:\s*#1F4E79/);
assert.match(tokens, /--mb-tint:\s*#EDF3FA/);
assert.match(tokens, /font-family:\s*'Google Sans Flex'/);
assert.match(html, /family=Google\+Sans\+Flex/, 'the document font must be loaded');

// Table headers take a light tint with navy text. A dark header band was tried
// on the Comparison Sheet and rejected; it must not come back here.
const headRule = cssRule('.mb-doc-table thead th');
assert.match(headRule, /background-color:\s*var\(--mb-tint\)/);
assert.match(headRule, /color:\s*var\(--mb-navy\)/);
assert.doesNotMatch(headRule, /background-color:\s*var\(--mb-navy/);

// Chart libraries are forbidden in printed documents, and so are emoji.
assert.doesNotMatch(css + controllerJs + renderJs, /chart\.js|Chart\(/i);
assert.doesNotMatch(
    renderJs,
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    'documents use inline SVG or plain text, never emoji'
);

/* --- The document says what it is --------------------------------------- */

assert.match(template, /Confidential/, 'the footer must mark the document confidential');
assert.match(renderJs, /Add-on sub-total/);
assert.match(renderJs, /Ray2Volt Project Margin/);

// The sub-total is the sum of the rows; the margin is typed. Neither is
// derived from capacity or project type.
assert.match(controllerJs, /lines\.reduce\(/);
assert.doesNotMatch(controllerJs, /subtotal\(\)\s*\*/, 'the margin is never a percentage of the sub-total');

/* --- Filename ----------------------------------------------------------- */

const filenameFn = controllerJs.match(/function filename\(data\)\s*\{([\s\S]*?)\n    \}/);
assert.ok(filenameFn, 'the download filename must be built in one place');
assert.match(filenameFn[1], /customerName/);
assert.match(filenameFn[1], /kWp/);
assert.match(filenameFn[1], /projectTypeLabel/);
assert.match(filenameFn[1], /Margin Breakdown/);
assert.match(filenameFn[1], /join\('_'\)/, 'the parts are underscore-separated, as specified');

/* --- Toolbox wiring ----------------------------------------------------- */

const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
assert.match(indexHtml, /tools\/margin-breakdown\/margin-breakdown\.html" class="nav-link/);
assert.match(indexHtml, /tools\/margin-breakdown\/margin-breakdown\.html" class="tool-card/);

const auth = fs.readFileSync(path.join(repoRoot, 'global', 'scripts', 'auth.js'), 'utf8');
assert.match(auth, /'margin-breakdown':\s*2/, 'the tool must be limited to Admin and above');
assert.match(html, /data-tool-id="margin-breakdown"/);

// Every tool page carries the same sidebar, so the new entry belongs on all.
const toolPages = fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(repoRoot, 'tools', entry.name, `${entry.name}.html`))
    .filter(file => fs.existsSync(file));

for (const page of toolPages) {
    assert.match(
        fs.readFileSync(page, 'utf8'),
        /margin-breakdown\/margin-breakdown\.html" class="nav-link/,
        `${path.relative(repoRoot, page)} is missing the Margin Breakdown sidebar link`
    );
}

console.log('margin breakdown tests passed');
