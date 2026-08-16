const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const baseCss = fs.readFileSync(path.join(repoRoot, 'global', 'styles', 'base.css'), 'utf8');
const componentsCss = fs.readFileSync(path.join(repoRoot, 'global', 'styles', 'components.css'), 'utf8');
const responsiveCss = fs.readFileSync(path.join(repoRoot, 'global', 'styles', 'responsive.css'), 'utf8');

function mediaBlock(query, within) {
    const start = within.indexOf(query);
    assert.notEqual(start, -1, `Missing media block ${query}`);
    const open = within.indexOf('{', start);
    let depth = 0;

    for (let i = open; i < within.length; i++) {
        if (within[i] === '{') depth++;
        if (within[i] === '}') depth--;
        if (depth === 0) return within.slice(open + 1, i);
    }

    assert.fail(`Unclosed media block ${query}`);
}

function cssRule(selector, within) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = within.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(match, `Missing CSS rule for ${selector}`);
    return match[1];
}

// Every tool shares one content width, taken from the Quote Generator.
assert.match(cssRule(':root', baseCss), /--tool-width:\s*1100px/);

const shell = cssRule('.main-content > .content-section', componentsCss);
assert.match(shell, /max-width:\s*var\(--tool-width\)/);
assert.match(shell, /margin-left:\s*auto/);
assert.match(shell, /margin-right:\s*auto/);

// The child selector is what outranks `.content-section { max-width: 100% }`
// in tool-responsive.css, so the shell must not be written as a bare class.
assert.ok(
    !/^\s*\.content-section\s*\{[^}]*max-width:\s*var\(--tool-width\)/m.test(componentsCss),
    'Tool shell must stay scoped to .main-content > .content-section'
);

// The dashboard keeps two cards per row on phones.
assert.match(cssRule(':root', baseCss), /--section-gap:\s*1\.5rem/);

const mobile = mediaBlock('@media screen and (max-width: 768px)', responsiveCss);
assert.match(cssRule('.tool-grid', mobile), /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);

const narrow = mediaBlock('@media screen and (max-width: 480px)', responsiveCss);
assert.match(cssRule('.tool-grid', narrow), /gap:/, 'the narrow breakpoint should tighten the two-column gap');

const toolDirs = fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

// Sections that stack on mobile must space themselves off the shared token.
// A bare `margin-bottom: 0` on a card is what let the Quote Generator's
// standalone card collide with the grid below it.
const sectionSpacing = {
    'quote-generator': ['.qg-form-grid', '.qg-form-card', '.qg-components-card'],
    'warranty-card': ['.warranty-form-grid'],
    'solar-savings': ['.ssc-actions']
};

for (const [tool, selectors] of Object.entries(sectionSpacing)) {
    const cssFiles = fs.readdirSync(path.join(repoRoot, 'tools', tool))
        .filter(file => file.endsWith('.css'))
        .map(file => fs.readFileSync(path.join(repoRoot, 'tools', tool, file), 'utf8'))
        .join('\n');

    for (const selector of selectors) {
        assert.match(
            cssRule(selector, cssFiles),
            /margin-bottom:\s*var\(--section-gap, 1\.5rem\)/,
            `${tool} ${selector} should space itself off --section-gap`
        );
    }
}

// No tool may reintroduce its own page-level width — that is what made the
// tools disagree with one another in the first place.
const ownContainerWidth = {
    'package-prices': /\.pkg-system-group\s*\{[^}]*max-width/,
    'sales-sop': /\.sop-page\s*\{[^}]*width:\s*min\(/,
    'letterheadify': /\.lhd-tool\s*\{[^}]*max-width/,
    'quote-generator': /\.no-print-area\s*\{[^}]*max-width:\s*1100px/,
    'warranty-card': /\.no-print-area\s*\{[^}]*max-width:\s*1100px/
};

for (const [tool, pattern] of Object.entries(ownContainerWidth)) {
    const cssFiles = fs.readdirSync(path.join(repoRoot, 'tools', tool))
        .filter(file => file.endsWith('.css'))
        .map(file => fs.readFileSync(path.join(repoRoot, 'tools', tool, file), 'utf8'))
        .join('\n');

    assert.ok(!pattern.test(cssFiles), `${tool} should take its width from the shared tool shell`);
}

// Page headings are one size and weight across every tool.
for (const tool of toolDirs) {
    const cssFiles = fs.readdirSync(path.join(repoRoot, 'tools', tool))
        .filter(file => file.endsWith('.css'))
        .map(file => fs.readFileSync(path.join(repoRoot, 'tools', tool, file), 'utf8'))
        .join('\n');

    const headerRules = cssFiles.match(/\.[a-z-]*page-header[a-z-]*\s+h1\s*\{[^}]*\}/g) || [];
    const outsideMediaQuery = headerRules.filter(rule => /font-size/.test(rule));

    for (const rule of outsideMediaQuery) {
        if (!/font-size:\s*1\.75rem/.test(rule)) continue; // mobile overrides are allowed to differ
        assert.ok(
            !/font-family/.test(rule),
            `${tool} page heading should inherit the shared heading font, not override it`
        );
    }

    const baseHeader = outsideMediaQuery.find(rule => /font-size:\s*1\.75rem/.test(rule));
    if (baseHeader) {
        assert.match(baseHeader, /font-weight:\s*700/, `${tool} page heading should be 700 weight`);
    }
}

// Every tool page loads Google Sans, the family base.css puts first for headings.
for (const tool of toolDirs) {
    const htmlPath = path.join(repoRoot, 'tools', tool, `${tool}.html`);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(
        html,
        /family=Google\+Sans:/,
        `${tool} must load Google Sans so its headings match the other tools`
    );
}

// Saving is the browser's job. A tool offers Generate Preview and
// Print / Save as PDF; the html2canvas/jsPDF capture route is gone, and with it
// the shared helper that loaded those two libraries from a CDN. Letterheadify is
// exempt — its output *is* a file it hands back, so it has no preview to print.
for (const tool of toolDirs) {
    if (tool === 'letterheadify') continue;

    const htmlPath = path.join(repoRoot, 'tools', tool, `${tool}.html`);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.doesNotMatch(
        html,
        />Download PDF</,
        `${tool} must not offer a Download PDF action`
    );
    assert.doesNotMatch(
        html,
        /pdf-download\.js/,
        `${tool} must not load the removed shared PDF helper`
    );
}

assert.ok(
    !fs.existsSync(path.join(repoRoot, 'global', 'scripts', 'pdf-download.js')),
    'the shared PDF download helper should stay deleted'
);

console.log('tool shell tests passed');
