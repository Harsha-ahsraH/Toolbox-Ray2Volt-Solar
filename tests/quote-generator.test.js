const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'quote-generator');
const html = fs.readFileSync(path.join(toolRoot, 'quote-generator.html'), 'utf8');
const pageTemplates = [
    'quote-generator-pages-3-5.js',
    'quote-generator-pages-6-8.js'
].map(file => fs.readFileSync(path.join(toolRoot, file), 'utf8')).join('\n');
const markup = `${html}\n${pageTemplates}`;
const css = fs.readdirSync(toolRoot)
    .filter(file => file.startsWith('quote-generator') && file.endsWith('.css'))
    .sort()
    .map(file => fs.readFileSync(path.join(toolRoot, file), 'utf8'))
    .join('\n');
const js = fs.readFileSync(path.join(toolRoot, 'quote-generator.js'), 'utf8');

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
    assert.match(markup, new RegExp(`Page ${page} of 8`));
}

assert.equal((markup.match(/class="quote-page/g) || []).length, 8);
assert.ok(
    html.indexOf('tool-responsive.css') < html.indexOf('quote-generator.css'),
    'Quote generator CSS must load after shared responsive CSS so the proposal layout wins.'
);

// No chart libraries — the document stays dependency-free.
assert.doesNotMatch(html, /chart\.umd|Chart\.js/i);

// Off-Grid was dropped as an offering (see CONTEXT.md) — only
// On-Grid and Hybrid exist, each with its own schematic from assets.
assert.doesNotMatch(markup, /Off-Grid/);
assert.doesNotMatch(js, /Off-Grid/);
assert.match(markup, /assets\/On-Grid Schematic Diagram\.png/);
assert.match(js, /assets\/Hybrid Solar Schemartic Diagram\.png/);

// Technical overview pages exist and are populated per installation type.
assert.match(markup, /How Your System Works/);
assert.match(markup, /Technology &amp; Installation/);
assert.match(js, /function populateTechnicalPages\(/);

assert.match(html, /<script src="quote-generator\.js(?:\?[^"]+)?"><\/script>/);
assert.match(css, /QUOTE PREVIEW - 8 Page A4 Document/);
assert.match(js, /Generate the 8-page preview/);
assert.match(js, /function generatePreview\(\)/);

// A new On-Grid Proposal starts with the approved editable BOM shown to Sales.
const approvedOnGridBom = [
    "{ item: 'Solar PV Module (Mono PERC DCR/Non-DCR) 540/550 Wp', qty: 6, unit: 'Nos', make: 'Adani/Vikram/Waaree' }",
    "{ item: 'On-Grid Inverter', qty: 1, unit: 'Nos', make: 'Polycab/Growatt/Deye' }",
    "{ item: 'Module Mounting Structure (HDG/GI)', qty: 1, unit: 'Set', make: 'JSW/Custom' }",
    "{ item: 'AC Distribution Box (ACDB)', qty: 1, unit: 'Nos', make: 'Havells/Schnider/Reputed' }",
    "{ item: 'DC Distribution Box (DCDB)', qty: 1, unit: 'Nos', make: 'Havells/Schnider/Reputed' }",
    "{ item: 'DC Cable (4 sq mm)', qty: 50, unit: 'Mtrs', make: 'Polycab/Reputed' }",
    "{ item: 'Lightning Arrester (LA)', qty: 1, unit: 'Nos', make: 'Reputed' }",
    "{ item: 'Earthing Kit (Chemical/Rod)', qty: 3, unit: 'Set', make: 'Reputed' }",
    "{ item: 'MC4 Connectors', qty: 4, unit: 'Pairs', make: 'Reputed' }",
    "{ item: 'AC Cable (Service Wire)', qty: 20, unit: 'Mtrs', make: 'Polycab/Reputed' }",
    "{ item: 'Installation & Commissioning', qty: 1, unit: 'Job', make: 'Ray2Volt Solar' }",
    "{ item: 'Transportation & Handling', qty: 1, unit: 'Trip', make: 'Ray2Volt Solar' }"
];

approvedOnGridBom.forEach(row => {
    assert.ok(js.includes(row), `Missing approved On-Grid BOM default: ${row}`);
});

// Module warranty is 30 years, so all proposal lifetime savings and impact
// projections use a 30-year horizon.
assert.match(markup, /System Warranty[\s\S]*30 Years/);
assert.match(markup, /30-Year Savings Projection/);
assert.match(markup, /Lifetime Savings \(30 Years\)/);
assert.match(markup, /Trees planted equivalent over 30 years/);
assert.match(js, /Environmental Impact \(30 years\)/);
assert.match(js, /const totalUnits30yr = annualUnits \* 30/);
assert.match(js, /const milestones = \[1, 5, 10, 30\]/);
assert.doesNotMatch(markup, /25-Year Savings Projection|Lifetime Savings \(25 Years\)|Trees planted equivalent over 25 years|>25 Years</);
assert.doesNotMatch(js, /Environmental Impact \(25 years\)|totalUnits25yr|const milestones = \[1, 5, 10, 25\]/);

// Page 5 fills the previous empty lower area with a compact quality/warranty
// assurance band.
assert.match(markup, /Quality &amp; Warranty Assurance/);
assert.match(markup, /Commissioning Checked/);
assert.match(markup, /Warranty Records/);
assert.match(markup, /class="quote-page qp-page-bom"/);
assert.match(css, /\.qp-quality-assurance\s*\{/);
assert.match(css, /\.qp-quality-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);

// Page 6 commercial offer supports an explicit discount. The entered project
// cost remains the actual inclusive cost; the quote total is cost minus discount.
assert.match(html, /id="qgDiscountAmount"/);
assert.match(markup, /id="qpActualProjectCost"/);
assert.match(markup, /id="qpDiscountAmount"/);
assert.match(markup, /Actual Project Cost \(Incl\. GST\)/);
assert.match(markup, /Less: Discount/);
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

// --- ROI & IRR on the Savings page -------------------------------------------
assert.match(html, /solar-returns\.js/, 'the shared returns module must be loaded');
assert.match(js, /Ray2VoltSolarReturns\.projectReturns/, 'the proposal must compute ROI and IRR');
assert.match(markup, /id="qpRoiPercent"/);
assert.match(markup, /id="qpIrrPercent"/);

// Both sit in the existing highlight band beside Lifetime Savings. A separate
// block would push page 7 past its fixed A4 height.
assert.match(markup, /qp-highlight-box qp-returns-box/);
const returnsBox = cssRule('.qp-returns-box');
assert.match(returnsBox, /grid-template-columns:\s*repeat\(3, 1fr\)/);

// The 30-year IRR must run off the same escalating tariff as the savings table.
assert.match(js, /function savingsSeries/);
assert.match(js, /Math\.pow\(1 \+ escalationPct \/ 100, year - 1\)/);

console.log('quote-generator tests passed');
