const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const auth = fs.readFileSync(path.join(repoRoot, 'global', 'scripts', 'auth.js'), 'utf8');

// --- The four roles and their passwords -----------------------------------
for (const [role, password] of [
    ['everyone', ''],
    ['sales', 'sales@ray2volt'],
    ['admin', 'admin@ray2volt'],
    ['owner', 'fjfj']
]) {
    const pattern = new RegExp(`id: '${role}'[^}]*password: '${password.replace(/[@.]/g, '\\$&')}'`);
    assert.match(auth, pattern, `${role} must sign in with its agreed password`);
}

// Everyone signs in with an empty password, so a blank box is a valid sign-in.
assert.match(auth, /id: 'everyone'[^}]*level: 0[^}]*password: ''/, 'Everyone needs no password');

// --- Which level may open which tool --------------------------------------
const declaredLevels = Object.fromEntries(
    [...auth.matchAll(/^\s*'([a-z-]+)':\s*(\d),?$/gm)].map(([, tool, level]) => [tool, Number(level)])
);

const expectedLevels = {
    'emi-calculator': 0,
    'gst-calculator': 0,
    'package-prices': 0,
    'sales-sop': 0,
    'solar-savings': 0,
    'comparison-sheet': 1,
    'letterhead-documents': 1,
    'proforma-invoice': 1,
    'quote-generator': 1,
    'request-for-quotation': 1,
    'resource-library': 1,
    'invoice-generator': 2,
    'margin-breakdown': 2,
    'pricing-desk': 2,
    'purchase-order': 2,
    'receipt-generator': 2,
    'warranty-card': 2,
    'payslip-generator': 3
};

assert.deepEqual(declaredLevels, expectedLevels, 'tool access levels must match the agreed matrix');

// Payslip is the one tool Admin is kept out of.
assert.equal(declaredLevels['payslip-generator'], 3, 'only the Owner sees payslips');

// An unlisted tool must fail closed rather than fall open to Everyone.
assert.match(auth, /in TOOL_LEVELS \? TOOL_LEVELS\[TOOL_ID\] : 3/, 'unknown pages are Owner-only');

// --- Every page loads the gate, before the navigation it filters ----------
const pageToolIds = {
    'emi-calculator': 'emi-calculator',
    'gst-calculator': 'gst-calculator',
    'package-prices': 'package-prices',
    'sales-sop': 'sales-sop',
    'solar-savings': 'solar-savings',
    'comparison-sheet': 'comparison-sheet',
    'invoice-generator': 'invoice-generator',
    letterheadify: 'letterhead-documents',
    'margin-breakdown': 'margin-breakdown',
    'payslip-generator': 'payslip-generator',
    'proforma-invoice': 'proforma-invoice',
    'purchase-order': 'purchase-order',
    'quote-generator': 'quote-generator',
    'receipt-generator': 'receipt-generator',
    'request-for-quotation': 'request-for-quotation',
    'resource-library': 'resource-library',
    'warranty-card': 'warranty-card'
};

for (const [toolName, toolId] of Object.entries(pageToolIds)) {
    const pagePath = path.join(repoRoot, 'tools', toolName, `${toolName}.html`);
    const html = fs.readFileSync(pagePath, 'utf8');

    assert.match(
        html,
        new RegExp(`<script src="\\.\\./\\.\\./global/scripts/auth\\.js" data-tool-id="${toolId}">`),
        `${toolName} must load auth.js under the id ${toolId}`
    );

    assert.ok(
        html.indexOf('global/scripts/auth.js') < html.indexOf('global/scripts/navigation.js'),
        `${toolName} must load auth.js before navigation.js so the sidebar is built already filtered`
    );

    assert.ok(declaredLevels[toolId] !== undefined, `${toolId} needs an entry in TOOL_LEVELS`);
}

const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
assert.match(indexHtml, /<script src="global\/scripts\/auth\.js"><\/script>/, 'the dashboard is gated too');
assert.ok(
    indexHtml.indexOf('global/scripts/auth.js') < indexHtml.indexOf('global/scripts/navigation.js'),
    'the dashboard must load auth.js before navigation.js'
);

// --- The old per-tool password gate is gone -------------------------------
for (const retired of ['global/scripts/tool-lock.js', 'global/scripts/passwords.js']) {
    assert.ok(!fs.existsSync(path.join(repoRoot, retired)), `${retired} must not come back`);
}

const pagePaths = [path.join(repoRoot, 'index.html')].concat(
    Object.keys(pageToolIds).map((toolName) => path.join(repoRoot, 'tools', toolName, `${toolName}.html`))
);

for (const pagePath of pagePaths) {
    const html = fs.readFileSync(pagePath, 'utf8');
    const relativePath = path.relative(repoRoot, pagePath);
    assert.ok(!html.includes('tool-lock.js'), `${relativePath} still references the retired tool-lock.js`);
    assert.ok(!html.includes('passwords.js'), `${relativePath} still references the retired passwords.js`);
}

console.log('auth tests passed');
