const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'warranty-card');

// Git checks these files out with CRLF on Windows, so every pattern below
// would have to spell out `\r?\n`. Normalise once instead.
function read(...segments) {
    return fs.readFileSync(path.join(...segments), 'utf8').replace(/\r\n/g, '\n');
}

const baseCss = read(repoRoot, 'global', 'styles', 'base.css');
const componentsCss = read(repoRoot, 'global', 'styles', 'components.css');
const html = read(toolRoot, 'warranty-card.html');
const css = read(toolRoot, 'warranty-card.css');
const js = read(toolRoot, 'warranty-card.js');

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
// Width and centering now come from the shared tool shell, not this stylesheet.
assert.match(cssRule('.main-content > .content-section', componentsCss), /max-width:\s*var\(--tool-width\)/);
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

// --- Consistency with the Short Proposal ------------------------------------
//
// The certificate and the quotation are one house document set, so the shared
// values are asserted against the Short Proposal's own stylesheets rather than
// against copies of the numbers. If the proposal moves, this test fails and
// the certificate has to move with it.

const shortProposalCss = ['quote-generator-preview-layout.css', 'quote-generator-preview-terms.css']
    .map(file => read(repoRoot, 'tools', 'quote-generator', file))
    .join('\n');

/**
 * The body of a rule whose selector starts a selector list, so that looking up
 * `.qp-section` cannot land inside `.qp-page1 .qp-section`.
 */
function exactRule(selector, within) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = within.match(new RegExp(`(?:^|[}])\\s*(?:/\\*[\\s\\S]*?\\*/\\s*)*${escaped}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(match, `Missing CSS rule for ${selector}`);
    return match[1];
}

/** A declaration's value inside a rule, e.g. decl('.qp-section h3', 'font-size'). */
function decl(selector, property, within) {
    const body = exactRule(selector, within);
    const match = body.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'm'));
    assert.ok(match, `${selector} declares no ${property}`);
    return match[1].trim();
}

/** The certificate rule must resolve to the same value as the proposal rule. */
function sameAsProposal(warrantySelector, proposalSelector, properties) {
    for (const property of properties) {
        assert.equal(
            decl(warrantySelector, property, css).replace(/--warranty-/g, '--qp-'),
            decl(proposalSelector, property, shortProposalCss).replace(/--qp-/g, '--qp-'),
            `${warrantySelector} { ${property} } should match ${proposalSelector}`
        );
    }
}

// Tokens: same names, same hexes, including the navy-dark the proposal uses for
// emphasis values.
for (const token of ['navy: #1F4E79', 'navy-dark: #17395A', 'tint: #EDF3FA', 'ink: #1A1A1A',
    'gray: #555555', 'muted: #777777', 'line: #D8DEE6', 'soft: #F7F9FC']) {
    const [name, value] = token.split(': ');
    assert.match(cssRule('#warrantyPreview'), new RegExp(`--warranty-${name}:\\s*${value}`, 'i'),
        `--warranty-${name} should be ${value}, as in the proposal`);
}

// Typography, page furniture and the shared components.
sameAsProposal('.combined-header', '.qp-header', ['border-bottom', 'padding-bottom', 'margin-bottom']);
sameAsProposal('.combined-title', '.qp-title-section h1', ['font-size', 'font-weight', 'letter-spacing', 'text-transform']);
sameAsProposal('.combined-subtitle', '.qp-subtitle', ['font-size', 'font-weight', 'letter-spacing']);
sameAsProposal('.warranty-section', '.qp-section', ['margin-bottom']);
sameAsProposal('.warranty-section h3', '.qp-section h3',
    ['font-size', 'font-weight', 'letter-spacing', 'text-transform', 'padding-bottom', 'border-bottom']);
sameAsProposal('.warranty-specs-table th', '.qp-specs-table th', ['background-color', 'font-weight', 'color', 'width']);
sameAsProposal('.warranty-overview-item', '.qp-benefit-item', ['padding', 'gap', 'align-items', 'border', 'border-radius']);
sameAsProposal('.warranty-page-footer', '.qp-page-footer', ['bottom', 'left', 'right', 'padding-top', 'font-size', 'border-top']);
sameAsProposal('.cover-footer', '.qp-cover-footer', ['font-size', 'text-align', 'padding', 'border-top', 'line-height']);

// Header bars on the terms and contact cards are the proposal's `.qp-prep-header`.
assert.match(cssRule('.warranty-terms-box .terms-header,\n.warranty-contact-section .contact-header'), /font-size:\s*8pt/);
assert.match(cssRule('.warranty-terms-box .terms-header,\n.warranty-contact-section .contact-header'), /letter-spacing:\s*1px/);
assert.match(cssRule('.warranty-terms-box .terms-header,\n.warranty-contact-section .contact-header'), /text-transform:\s*uppercase/);
assert.match(cssRule('.warranty-terms-box,\n.warranty-contact-section'), /border-top:\s*3px solid var\(--warranty-navy\)/);

// --- Icon language ----------------------------------------------------------
//
// The printed document draws the proposal's Feather stroke icons inline; the
// toolbox UI around it keeps Material Symbols. Mixing the two inside the
// document is what made the certificate look unlike the quotation.
const documentSvgs = html.match(/<svg\b[^>]*>/g) || [];
assert.equal(documentSvgs.length, 11, 'document should draw 11 inline icons');
for (const tag of documentSvgs) {
    assert.match(tag, /viewBox="0 0 24 24"/, 'document icons share the proposal 24-unit grid');
    assert.match(tag, /stroke="currentColor"/, 'document icons inherit their colour');
    assert.match(tag, /stroke-width="2"/);
}
assert.match(cssRule('#warrantyPreview svg'), /width:\s*100%/);

const shellIcons = html.match(/class="material-symbols-rounded[^"]*"[^>]*>\s*([a-z_]+)</g) || [];
assert.equal(shellIcons.length, 5, 'only the tool shell and form titles use Material Symbols');
for (const icon of ['menu', 'close', 'info', 'solar_power', 'contact_phone']) {
    assert.match(html, new RegExp(`>${icon}<`));
}
assert.doesNotMatch(html, /material-symbols-rounded[^"]*"[^>]*aria-hidden="true">(call|mail|location_on|verified_user|contact_support|electric_bolt|construction|support_agent)</,
    'document icons must not fall back to the icon font');
assert.doesNotMatch(html, /\p{Extended_Pictographic}/u);
assert.match(cssRule('.material-symbols-rounded', baseCss), /font-family:\s*'Material Symbols Rounded'/);
assert.match(cssRule('.material-symbols-rounded', baseCss), /font-variation-settings:/);

// Document colour comes from the navy token set only — no inline hex, and no
// third light surface competing with the tint used by the banner and headers.
assert.doesNotMatch(html, /style="/, 'document markup should carry no inline styles');
assert.doesNotMatch(js, /style="color/, 'injected serial markup should style itself from CSS');
assert.doesNotMatch(cssRule('.warranty-section h3'), /background/);
assert.doesNotMatch(cssRule('.warranty-terms-box .terms-content h4'), /text-decoration/);
assert.match(cssRule('.cover-footer'), /background:\s*none/);

// Contact details are fields on the form, not text baked into the certificate.
for (const id of ['warrantyContactPhone', 'warrantyContactEmail', 'warrantyContactAddress']) {
    assert.match(html, new RegExp(`id="${id}"`), `form should expose ${id}`);
    assert.match(js, new RegExp(`getElementById\\('${id}'\\)`), `${id} should be read when generating`);
}
for (const id of ['contactPhone', 'contactEmail', 'contactAddress', 'coverFooterAddress', 'coverFooterPhone', 'coverFooterEmail']) {
    assert.match(html, new RegExp(`id="${id}"`), `certificate should expose ${id}`);
    assert.match(js, new RegExp(`getElementById\\('${id}'\\)`), `${id} should be populated when generating`);
}

// A fixed A4 page cannot scroll, so a long serial list steps down a density
// tier and then summarises the remainder rather than being clipped in silence.
assert.match(js, /SERIALS_COMFORTABLE\s*=\s*24/);
assert.match(js, /SERIALS_MAX\s*=\s*44/);
assert.match(js, /classList\.toggle\('is-dense'/);
assert.match(cssRule('.serial-numbers-grid.is-dense'), /grid-template-columns:/);

console.log('warranty-card tests passed');
