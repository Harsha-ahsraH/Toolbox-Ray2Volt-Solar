const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'tools', 'request-for-quotation.html'), 'utf8');
const css = fs.readFileSync(path.join(repoRoot, 'css', 'request-for-quotation.css'), 'utf8');
const js = fs.readFileSync(path.join(repoRoot, 'js', 'request-for-quotation.js'), 'utf8');

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

// The preview is a stack of real A4 sheets, never one indefinitely tall box.
assert.match(html, /<template id="rfqPageTemplate">/);
assert.match(html, /class="rfq-page"/);
assert.ok(
    html.indexOf('tool-responsive.css') < html.indexOf('request-for-quotation.css'),
    'RFQ page styles must load after the shared responsive stylesheet.'
);

const pageRule = cssRule('.rfq-page');
assert.match(pageRule, /width:\s*210mm/);
assert.match(pageRule, /height:\s*297mm/);
assert.match(pageRule, /min-height:\s*297mm/);
assert.match(pageRule, /max-height:\s*297mm/);
assert.match(pageRule, /overflow:\s*hidden/);

const previewRule = cssRule('#rfqPreview');
assert.doesNotMatch(previewRule, /min-height:\s*297mm/);
assert.match(cssRule('.rfq-body-content'), /flex:\s*0\s+0\s+auto/);

// Pagination must use rendered height, so arbitrary Markdown is split at the
// page boundary instead of relying on one continuous browser print flow.
assert.match(js, /function paginateRfqDocument\(/);
assert.match(js, /scrollHeight/);
assert.match(js, /clientHeight/);
assert.match(js, /function createRfqPage\(/);

// Every generated sheet owns its header and footer, including page numbering.
assert.match(html, /class="invoice-header rfq-page-header"/);
assert.match(html, /class="rfq-document-footer rfq-page-footer"/);
assert.match(js, /Page \$\{pageNumber\} of \$\{totalPages\}/);

// Printing preserves the same page model shown in the preview.
const printCss = mediaBlock('@media print');
const printPageRule = cssRule('.rfq-page', printCss);
assert.match(printPageRule, /width:\s*210mm\s*!important/);
assert.match(printPageRule, /height:\s*297mm\s*!important/);
assert.match(printPageRule, /break-after:\s*page/);
assert.doesNotMatch(printCss, /@bottom-(?:left|center|right)/);

console.log('request-for-quotation tests passed');
