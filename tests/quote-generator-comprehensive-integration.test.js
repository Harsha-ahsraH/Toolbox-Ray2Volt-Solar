const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'quote-generator');
const html = fs.readFileSync(path.join(toolRoot, 'quote-generator.html'), 'utf8');
const workspace = fs.readFileSync(path.join(toolRoot, 'quote-generator-workspace-template.js'), 'utf8');
const formJs = fs.readFileSync(path.join(toolRoot, 'quote-generator-form.js'), 'utf8');
const previewJs = fs.readFileSync(path.join(toolRoot, 'quote-generator-preview.js'), 'utf8');
const comprehensiveCss = fs.readFileSync(
    path.join(toolRoot, 'quote-generator-proposal-comprehensive.css'),
    'utf8'
);
const shortPages = [
    html,
    fs.readFileSync(path.join(toolRoot, 'quote-generator-pages-3-5.js'), 'utf8'),
    fs.readFileSync(path.join(toolRoot, 'quote-generator-pages-6-8.js'), 'utf8')
].join('\n');
const allCss = fs.readdirSync(toolRoot)
    .filter(file => file.startsWith('quote-generator') && file.endsWith('.css'))
    .sort()
    .map(file => fs.readFileSync(path.join(toolRoot, file), 'utf8'))
    .join('\n');

function openingTagById(markup, id) {
    const match = markup.match(new RegExp(`<[^>]+id=["']${id}["'][^>]*>`, 'i'));
    assert.ok(match, `Missing element #${id}`);
    return match[0];
}

function cssRule(selector, within) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = within.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(match, `Missing CSS rule for ${selector}`);
    return match[1];
}

function mediaBlock(css, query) {
    const start = css.indexOf(query);
    assert.notEqual(start, -1, `Missing media block ${query}`);
    const open = css.indexOf('{', start);
    let depth = 0;

    for (let index = open; index < css.length; index++) {
        if (css[index] === '{') depth++;
        if (css[index] === '}') depth--;
        if (depth === 0) return css.slice(open + 1, index);
    }

    assert.fail(`Unclosed media block ${query}`);
}

// Visible, keyboard-operable mode and workspace controls are present.
assert.match(openingTagById(html, 'qgModeShort'), /role="tab"/);
assert.match(openingTagById(html, 'qgModeShort'), /aria-selected="true"/);
assert.match(html, /id="qgModeShort"[\s\S]*?>Short Quotation<\/button>/);
assert.match(openingTagById(html, 'qgModeComprehensive'), /role="tab"/);
assert.match(html, /id="qgModeComprehensive"[\s\S]*?>\s*Comprehensive\s+Quotation<\/button>/);
assert.match(openingTagById(html, 'qgWorkspaceInputsTab'), /role="tab"/);
assert.match(html, /id="qgWorkspaceInputsTab"[\s\S]*?>Inputs<\/button>/);
assert.match(openingTagById(html, 'qgWorkspacePreviewTab'), /role="tab"/);
assert.match(html, /id="qgWorkspacePreviewTab"[\s\S]*?>Proposal\s+Preview<\/button>/);

// The legacy renderer remains exactly eight pages and no Comprehensive source
// pages are mixed into that fixed Short Proposal surface.
assert.equal(
    (shortPages.match(/class="quote-page/g) || []).length,
    8,
    'Short renderer must still contain exactly eight A4 pages'
);
for (let page = 1; page <= 8; page++) {
    assert.match(shortPages, new RegExp(`Page ${page} of 8`));
}

// Mode switching copies shared values in both directions before changing the
// visible workspace. Company/Individual visibility changes containers only.
const setModeBody = formJs.slice(
    formJs.indexOf('function setMode(mode, options)'),
    formJs.indexOf('function setWorkspace(workspace)')
);
assert.match(setModeBody, /if \(isComprehensive\) pullFromShortForm\(\); else pushToShortForm\(\);/);
assert.match(setModeBody, /state\.mode = mode/);

const visibilityBody = formJs.slice(
    formJs.indexOf('function syncConditionalVisibility()'),
    formJs.indexOf('function toggleAll(selector, visible)')
);
assert.match(visibilityBody, /toggleAll\('\.qg-customer-company', isCompany\)/);
assert.match(visibilityBody, /toggleAll\('\.qg-customer-individual', !isCompany\)/);
assert.doesNotMatch(
    visibilityBody,
    /(?:delete\s+state\.customer|state\.customer\.[A-Za-z]+\s*=(?!=))/,
    'visibility synchronization must not delete or overwrite hidden customer values'
);

// Comprehensive pages inherit the same exact A4 canvas in Preview and print.
const quotePageRule = cssRule('.quote-page', allCss);
assert.match(quotePageRule, /width:\s*210mm/);
assert.match(quotePageRule, /height:\s*297mm/);
assert.match(quotePageRule, /min-height:\s*297mm/);
assert.match(previewJs, /class="quote-page cq-page"/);

const comprehensivePrint = mediaBlock(comprehensiveCss, '@media print');
const comprehensivePageRule = cssRule('.cq-page', comprehensivePrint);
assert.match(comprehensivePageRule, /width:\s*210mm\s*!important/);
assert.match(comprehensivePageRule, /height:\s*297mm\s*!important/);
assert.match(comprehensivePageRule, /min-height:\s*297mm\s*!important/);
assert.doesNotMatch(comprehensivePageRule, /100vh|width:\s*100%/);

// Critical errors gate both final-output actions only. Preview remains an
// enabled workspace action and renders from the page plan.
assert.doesNotMatch(openingTagById(html, 'qgWorkspacePreviewTab'), /\bdisabled\b/);
assert.match(workspace, /id="qgComprehensivePrint"[\s\S]*?>Print \/ Save\s+as PDF<\/button>/);
assert.match(workspace, /id="qgComprehensiveDownload">Download PDF<\/button>/);

const exportGateBody = previewJs.slice(
    previewJs.indexOf('function applyExportGate(validation)'),
    previewJs.indexOf('function setPrintMode()')
);
assert.match(exportGateBody, /const blocked = validation \? validation\.hasCriticalErrors : true/);
assert.match(exportGateBody, /printButton\.disabled = blocked/);
assert.match(exportGateBody, /downloadButton\.disabled = blocked/);
assert.doesNotMatch(exportGateBody, /preview[^\n]*disabled|disabled[^\n]*preview/i);
assert.match(formJs, /refs\.previewTab\.addEventListener\('click', \(\) => setWorkspace\('preview'\)\)/);
assert.match(previewJs, /<span>Page \$\{page\.pageNumber\} of \$\{page\.totalPages\}<\/span>/);

console.log('quote-generator comprehensive integration tests passed');
