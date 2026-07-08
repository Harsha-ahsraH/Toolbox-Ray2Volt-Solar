const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'tools', 'quote-generator.html'), 'utf8');
const css = fs.readFileSync(path.join(repoRoot, 'css', 'quote-generator.css'), 'utf8');
const js = fs.readFileSync(path.join(repoRoot, 'js', 'quote-generator.js'), 'utf8');

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

// 8-page proposal: Cover, Overview, How It Works, Technology & Installation,
// BOM, Commercial Offer, Savings & ROI, Terms & Conditions.
assert.match(html, /Generate professional 8-page solar project proposals/);

for (let page = 1; page <= 8; page++) {
    assert.match(html, new RegExp(`Page ${page} of 8`));
}

assert.equal((html.match(/class="quote-page/g) || []).length, 8);
assert.ok(
    html.indexOf('tool-responsive.css') < html.indexOf('quote-generator.css'),
    'Quote generator CSS must load after shared responsive CSS so the proposal layout wins.'
);

// No chart libraries — the document stays dependency-free.
assert.doesNotMatch(html, /chart\.umd|Chart\.js/i);

// Off-Grid was dropped as an offering (see CONTEXT.md) — only
// On-Grid and Hybrid exist, each with its own schematic from assets.
assert.doesNotMatch(html, /Off-Grid/);
assert.doesNotMatch(js, /Off-Grid/);
assert.match(html, /assets\/On-Grid Schematic Diagram\.png/);
assert.match(js, /assets\/Hybrid Solar Schemartic Diagram\.png/);

// Technical overview pages exist and are populated per installation type.
assert.match(html, /How Your System Works/);
assert.match(html, /Technology &amp; Installation/);
assert.match(js, /function populateTechnicalPages\(/);

assert.match(html, /<script src="\.\.\/js\/quote-generator\.js(?:\?[^"]+)?"><\/script>/);
assert.match(css, /QUOTE PREVIEW - 8 Page A4 Document/);
assert.match(js, /Generate the 8-page preview/);
assert.match(js, /function generatePreview\(\)/);

// Module warranty is 30 years, so all proposal lifetime savings and impact
// projections use a 30-year horizon.
assert.match(html, /System Warranty[\s\S]*30 Years/);
assert.match(html, /30-Year Savings Projection/);
assert.match(html, /Lifetime Savings \(30 Years\)/);
assert.match(html, /Trees planted equivalent over 30 years/);
assert.match(js, /Environmental Impact \(30 years\)/);
assert.match(js, /const totalUnits30yr = annualUnits \* 30/);
assert.match(js, /const milestones = \[1, 5, 10, 30\]/);
assert.doesNotMatch(html, /25-Year Savings Projection|Lifetime Savings \(25 Years\)|Trees planted equivalent over 25 years|>25 Years</);
assert.doesNotMatch(js, /Environmental Impact \(25 years\)|totalUnits25yr|const milestones = \[1, 5, 10, 25\]/);

// Page 5 fills the previous empty lower area with a compact quality/warranty
// assurance band.
assert.match(html, /Quality &amp; Warranty Assurance/);
assert.match(html, /Commissioning Checked/);
assert.match(html, /Warranty Records/);
assert.match(html, /class="quote-page qp-page-bom"/);
assert.match(css, /\.qp-quality-assurance\s*\{/);
assert.match(css, /\.qp-quality-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);

// Page 6 commercial offer supports an explicit discount. The entered project
// cost remains the actual inclusive cost; the quote total is cost minus discount.
assert.match(html, /id="qgDiscountAmount"/);
assert.match(html, /id="qpActualProjectCost"/);
assert.match(html, /id="qpDiscountAmount"/);
assert.match(html, /Actual Project Cost \(Incl\. GST\)/);
assert.match(html, /Less: Discount/);
assert.match(js, /const qgDiscountAmount = document\.getElementById\('qgDiscountAmount'\)/);
assert.match(js, /const actualProjectCost = Math\.max\(0, parseFloat\(val\(qgTotalPrice\)\) \|\| 0\)/);
assert.match(js, /const discountAmount = Math\.min\(requestedDiscount, actualProjectCost\)/);
assert.match(js, /const grandTotal = Math\.max\(0, actualProjectCost - discountAmount\)/);
assert.match(js, /setText\('qpActualProjectCost', formatCurrency\(actualProjectCost\)\)/);
assert.match(js, /setText\('qpDiscountAmount', discountAmount > 0 \? `- \$\{formatCurrency\(discountAmount\)\}` : formatCurrency\(0\)\)/);

// Preview and print must use the same A4 page model. Mobile preview scales this
// same page instead of reflowing into a different layout.
const quotePageRule = cssRule('.quote-page');
assert.match(quotePageRule, /width:\s*210mm/);
assert.match(quotePageRule, /height:\s*297mm/);
assert.match(quotePageRule, /min-height:\s*297mm/);

const printCss = mediaBlock('@media print');
const printQuotePageRule = cssRule('.quote-page', printCss);
assert.match(printQuotePageRule, /width:\s*210mm\s*!important/);
assert.match(printQuotePageRule, /height:\s*297mm\s*!important/);
assert.match(printQuotePageRule, /min-height:\s*297mm\s*!important/);
assert.doesNotMatch(printQuotePageRule, /100vh|width:\s*100%/);

assert.match(css, /--qp-preview-scale/);
assert.match(css, /zoom:\s*var\(--qp-preview-scale\)/);
assert.match(js, /function updatePreviewScale\(\)/);
assert.match(css, /#quotePreview \.quote-page\s*\{[\s\S]*padding:\s*12mm\s+14mm\s+24mm\s+14mm\s*!important/);
assert.match(css, /#quotePreview \.qp-page-footer\s*\{[\s\S]*bottom:\s*8mm\s*!important[\s\S]*left:\s*14mm\s*!important[\s\S]*right:\s*14mm\s*!important/);
assert.match(css, /#quotePreview \.qp-address-grid\s*\{[\s\S]*margin-bottom:\s*4mm\s*!important/);
assert.match(css, /#quotePreview \.qp-financial-strip\s*\{[\s\S]*margin:\s*3mm\s+0\s+2mm\s*!important/);
assert.match(css, /#quotePreview \.qp-bank-flex\s*\{[\s\S]*grid-template-columns:\s*1fr\s+1fr\s*!important/);

// Cover bottom content stays anchored the same way in preview and print.
const printCoverMetaRule = cssRule('.qp-cover-footer-meta', printCss);
assert.match(printCoverMetaRule, /margin-top:\s*auto\s*!important/);
assert.doesNotMatch(printCoverMetaRule, /margin-top:\s*0/);

// The cover metadata cards must not slide underneath the company footer.
const coverImageWrapRule = cssRule('.qp-cover-image-wrap');
assert.doesNotMatch(coverImageWrapRule, /margin:\s*0\s+0\s+auto\s+0/);
const coverFooterRule = cssRule('.qp-cover-footer');
assert.match(coverFooterRule, /position:\s*static\s*!important/);
assert.doesNotMatch(coverFooterRule, /position:\s*absolute/);
assert.match(css, /#quotePreview \.qp-cover-footer,\s*#quotePreview \.qp-page1 \.qp-cover-footer\s*\{[\s\S]*position:\s*static\s*!important/);
assert.doesNotMatch(cssRule('.qp-cover-footer', printCss), /position:\s*absolute/);

console.log('quote-generator tests passed');
