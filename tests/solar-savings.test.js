const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'solar-savings');
const html = fs.readFileSync(path.join(toolRoot, 'solar-savings.html'), 'utf8');
const reportCss = fs.readFileSync(path.join(toolRoot, 'solar-savings-report.css'), 'utf8');
const quoteCss = fs.readFileSync(
    path.join(repoRoot, 'tools', 'quote-generator', 'quote-generator-preview-layout.css'),
    'utf8'
);

function cssRule(selector, within = reportCss) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = within.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(match, `Missing CSS rule for ${selector}`);
    return match[1];
}

// The report is a customer document, so it uses the Proposal's design tokens.
const page = cssRule('.ssc-report-page');
const quotePage = cssRule('#quotePreview', quoteCss);

for (const token of ['#1F4E79', '#17395A', '#EDF3FA', '#1A1A1A', '#555555', '#777777', '#D8DEE6', '#F7F9FC']) {
    assert.ok(page.includes(token), `Report page should carry Proposal token ${token}`);
    assert.ok(quotePage.includes(token), `Proposal should still define ${token} — tokens drifted`);
}

assert.match(page, /font-family:\s*'Google Sans Flex'/);
assert.match(page, /font-size:\s*10pt/);
assert.match(page, /border-top:\s*5px solid var\(--sr-navy\)/);

// Fixed A4 geometry, matching .quote-page, so preview and print agree.
assert.match(page, /width:\s*210mm/);
assert.match(page, /height:\s*297mm/);
assert.match(page, /padding:\s*12mm 14mm 24mm 14mm/);
assert.match(page, /overflow:\s*hidden/);

// Header, section titles and footer follow the Proposal's patterns.
assert.match(cssRule('.ssc-report-header'), /border-bottom:\s*2px solid var\(--sr-navy\)/);
assert.match(cssRule('.ssc-report-page .ssc-report-title-section h1'), /font-size:\s*15pt/);
assert.match(cssRule('.ssc-report-page .ssc-report-title-section h1'), /text-transform:\s*uppercase/);
assert.match(cssRule('.ssc-report-logo'), /width:\s*170px/);
assert.match(cssRule('.ssc-report-page .ssc-report-section h3'), /color:\s*var\(--sr-navy\)/);
assert.match(cssRule('.ssc-report-page .ssc-table thead th'), /background-color:\s*var\(--sr-tint\)/);
assert.match(cssRule('.ssc-report-page-footer'), /bottom:\s*8mm/);

// The report stays exactly two pages.
const pages = html.match(/<div class="ssc-report-page"/g) || [];
assert.equal(pages.length, 2, 'Report must be exactly two A4 pages');
assert.match(html, /Page 1 of 2/);
assert.match(html, /Page 2 of 2/);

const printBlock = reportCss.slice(reportCss.indexOf('@media print'));
assert.match(printBlock, /size:\s*A4/);
assert.match(printBlock, /margin:\s*0/);
assert.match(printBlock, /zoom:\s*1\s*!important/, 'Print must undo the preview zoom');
assert.match(printBlock, /page-break-inside:\s*avoid\s*!important/);

console.log('solar savings report tests passed');
