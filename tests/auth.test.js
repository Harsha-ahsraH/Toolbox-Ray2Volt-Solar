const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRegistry, toolFolders } = require('./helpers/registry');

const repoRoot = path.resolve(__dirname, '..');
const auth = fs.readFileSync(path.join(repoRoot, 'global', 'scripts', 'auth.js'), 'utf8');

// --- Who can sign in, under what name, at what level ----------------------
const accounts = [...auth.matchAll(
    /\{ id: '([\w-]+)', name: '([^']*)', level: (\d), password: '([^']*)' \}/g
)].map(([, id, name, level, password]) => ({ id, name, level: Number(level), password }));

assert.deepEqual(accounts, [
    { id: 'everyone', name: 'Everyone', level: 0, password: '' },
    { id: 'sales', name: 'Sales', level: 1, password: 'sales@ray2volt' },
    { id: 'truewatt', name: 'TrueWatt Solar', level: 1, password: 'truewatt' },
    { id: 'admin', name: 'Admin', level: 2, password: 'admin@ray2volt' },
    { id: 'owner', name: 'Owner', level: 3, password: 'fjfj' }
], 'the sign-in list must match the agreed accounts');

// Everyone signs in with an empty password, so a blank box is a valid sign-in,
// and it has to come first or another account could claim the blank.
assert.equal(accounts[0].password, '', 'Everyone needs no password');
assert.equal(accounts[0].id, 'everyone', 'Everyone must be the first account matched');

// The first account holding a typed password wins, so two must never share one.
const passwords = accounts.map((account) => account.password);
assert.equal(new Set(passwords).size, passwords.length, 'every account needs a distinct password');

// Named accounts ride on a level rather than inventing their own access.
const levelLabels = [...auth.matchAll(/\{ level: (\d), label: '([^']+)'/g)]
    .map(([, level, label]) => ({ level: Number(level), label }));
assert.deepEqual(levelLabels, [
    { level: 0, label: 'Everyone' },
    { level: 1, label: 'Sales' },
    { level: 2, label: 'Admin' },
    { level: 3, label: 'Owner' }
], 'the four access levels are fixed');

for (const account of accounts) {
    assert.ok(
        levelLabels.some((entry) => entry.level === account.level),
        `${account.id} names a level that exists`
    );
}

// TrueWatt Solar signs in under its own name with Sales access.
const truewatt = accounts.find((account) => account.id === 'truewatt');
assert.equal(truewatt.name, 'TrueWatt Solar');
assert.equal(truewatt.password, 'truewatt');
assert.equal(truewatt.level, accounts.find((a) => a.id === 'sales').level, 'same access as Sales');

/// --- Which level may open which tool --------------------------------------
// The levels live in the tool registry; auth.js reads them from there.
const registry = loadRegistry();
const declaredLevels = Object.fromEntries(registry.list.map((tool) => [tool.id, tool.level]));

const expectedLevels = {
    'emi-calculator': 0,
    'gst-calculator': 0,
    'package-prices': 0,
    'sales-sop': 0,
    'solar-savings': 0,
    'comparison-sheet': 1,
    'letterheadify': 1,
    'proforma-invoice': 1,
    'quotation': 1,
    'quote-generator': 1,
    'resource-library': 1,
    'invoice-generator': 2,
    'margin-breakdown': 2,
    'pricing-desk': 2,
    'purchase-order': 2,
    'receipt-generator': 2,
    'request-for-quotation': 2,
    'warranty-card': 2,
    'payslip-generator': 3
};

assert.deepEqual(declaredLevels, expectedLevels, 'tool access levels must match the agreed matrix');

// Payslip is the one tool Admin is kept out of.
assert.equal(declaredLevels['payslip-generator'], 3, 'only the Owner sees payslips');

// An unlisted tool must fail closed rather than fall open to Everyone.
assert.match(auth, /const OWNER_ONLY = 3;/);
assert.match(auth, /return tool \? tool\.level : OWNER_ONLY;/, 'unknown pages are Owner-only');

// --- Every page loads the registry, then the gate, then the navigation ----
for (const toolId of toolFolders()) {
    const html = fs.readFileSync(path.join(repoRoot, 'tools', toolId, `${toolId}.html`), 'utf8');

    assert.match(
        html,
        new RegExp(`<script src="\\.\\./\\.\\./global/scripts/auth\\.js(?:\\?[^"]*)?" data-tool-id="${toolId}">`),
        `${toolId} must load auth.js under its folder name`
    );

    const order = ['global/scripts/tools.js', 'global/scripts/auth.js', 'global/scripts/navigation.js']
        .map((script) => html.indexOf(script));
    assert.ok(order[0] >= 0 && order[0] < order[1] && order[1] < order[2],
        `${toolId} must load tools.js, auth.js and navigation.js in that order`);

    assert.ok(declaredLevels[toolId] !== undefined, `${toolId} needs an entry in the tool registry`);
}

const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
assert.match(indexHtml, /<script src="global\/scripts\/auth\.js(?:\?[^"]*)?"><\/script>/, 'the dashboard is gated too');
assert.ok(
    indexHtml.indexOf('global/scripts/tools.js') < indexHtml.indexOf('global/scripts/auth.js') &&
    indexHtml.indexOf('global/scripts/auth.js') < indexHtml.indexOf('global/scripts/navigation.js'),
    'the dashboard must load tools.js, auth.js and navigation.js in that order'
);

// --- The old per-tool password gate is gone -------------------------------
for (const retired of ['global/scripts/tool-lock.js', 'global/scripts/passwords.js']) {
    assert.ok(!fs.existsSync(path.join(repoRoot, retired)), `${retired} must not come back`);
}

const pagePaths = [path.join(repoRoot, 'index.html')].concat(
    toolFolders().map((toolId) => path.join(repoRoot, 'tools', toolId, `${toolId}.html`))
);

for (const pagePath of pagePaths) {
    const html = fs.readFileSync(pagePath, 'utf8');
    const relativePath = path.relative(repoRoot, pagePath);
    assert.ok(!html.includes('tool-lock.js'), `${relativePath} still references the retired tool-lock.js`);
    assert.ok(!html.includes('passwords.js'), `${relativePath} still references the retired passwords.js`);
}

console.log('auth tests passed');
