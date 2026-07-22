const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'warranty-card');
const baseCss = fs.readFileSync(path.join(repoRoot, 'global', 'styles', 'base.css'), 'utf8');
const html = fs.readFileSync(path.join(toolRoot, 'warranty-card.html'), 'utf8');
const css = fs.readFileSync(path.join(toolRoot, 'warranty-card.css'), 'utf8');
const js = fs.readFileSync(path.join(toolRoot, 'warranty-card.js'), 'utf8');

function cssRule(selector, within = css) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = within.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(match, `Missing CSS rule for ${selector}`);
    return match[1];
}

function mediaBlock(query) {
    const start = css.indexOf(query);
    assert.notEqual(start, -1, `Missing media block ${query}`);
    const open = css.indexOf('{', start);
    let depth = 0;

    for (let i = open; i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}') depth--;
        if (depth === 0) return css.slice(open + 1, i);
    }

    assert.fail(`Unclosed media block ${query}`);
}

// The authoring UI follows the Quote Generator's centered, mobile-first system.
assert.ok(
    html.indexOf('tool-responsive.css') < html.indexOf('warranty-card.css'),
    'Warranty Card CSS must load after shared responsive CSS so its A4 preview rules win.'
);
assert.match(cssRule('.no-print-area'), /max-width:\s*1100px/);
assert.match(cssRule('.warranty-form-grid'), /grid-template-columns:\s*1fr/);
assert.match(cssRule('.warranty-actions'), /flex-direction:\s*column/);
assert.match(cssRule('.warranty-btn-secondary'), /border:\s*1px solid var\(--primary\)/);
assert.match(cssRule('.warranty-btn-secondary'), /background:\s*transparent/);
assert.match(cssRule('.warranty-btn-secondary'), /color:\s*var\(--primary\)/);

const desktop = mediaBlock('@media screen and (min-width: 1025px)');
assert.match(cssRule('.warranty-form-grid', desktop), /grid-template-columns:\s*1fr 1fr/);

// Preview and print share the quotation's fixed A4 canvas and navy document tokens.
assert.match(cssRule('#warrantyPreview'), /--warranty-navy:\s*#1F4E79/i);
assert.match(cssRule('#warrantyPreview'), /--warranty-preview-scale:\s*1/);
assert.match(cssRule('.warranty-page'), /width:\s*210mm/);
assert.match(cssRule('.warranty-page'), /height:\s*297mm/);
assert.match(cssRule('.warranty-page'), /padding:\s*12mm 14mm 24mm 14mm/);
assert.match(cssRule('.warranty-page'), /zoom:\s*var\(--warranty-preview-scale\)/);
assert.match(cssRule('.combined-header'), /border-bottom:\s*2px solid var\(--warranty-navy\)/);
assert.match(cssRule('#warrantyPreview .warranty-page'), /width:\s*210mm\s*!important/);
assert.match(cssRule('#warrantyPreview .warranty-page'), /max-width:\s*none\s*!important/);
assert.match(cssRule('#warrantyPreview .warranty-page'), /height:\s*297mm\s*!important/);
assert.match(cssRule('#warrantyPreview .combined-header'), /flex-direction:\s*row\s*!important/);

const printCss = mediaBlock('@media print');
assert.match(cssRule('.warranty-page', printCss), /width:\s*210mm\s*!important/);
assert.match(cssRule('.warranty-page', printCss), /height:\s*297mm\s*!important/);
assert.doesNotMatch(cssRule('.warranty-page', printCss), /100vh|width:\s*100%/);

assert.match(js, /function updatePreviewScale\(\)/);
assert.match(js, /--warranty-preview-scale/);
assert.match(js, /window\.addEventListener\('resize', updatePreviewScale\)/);
assert.match(js, /window\.addEventListener\('orientationchange', updatePreviewScale\)/);

// Warranty uses the toolbox's Material 3 icon language, never custom SVGs or emojis.
assert.doesNotMatch(html, /<svg\b/i);
assert.equal((html.match(/class="material-symbols-rounded/g) || []).length, 12);
for (const icon of ['menu', 'close', 'info', 'solar_power', 'electric_bolt', 'construction', 'support_agent', 'description', 'contact_support']) {
    assert.match(html, new RegExp(`>${icon}<`));
}
assert.doesNotMatch(html, /\p{Extended_Pictographic}/u);
assert.match(cssRule('.material-symbols-rounded', baseCss), /font-family:\s*'Material Symbols Rounded'/);
assert.match(cssRule('.material-symbols-rounded', baseCss), /font-variation-settings:/);

console.log('warranty-card tests passed');
