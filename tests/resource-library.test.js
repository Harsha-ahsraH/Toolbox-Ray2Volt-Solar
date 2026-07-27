const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'resource-library');

const catalogue = require(path.join(toolRoot, 'resource-library-catalogue.js'));

const html = fs.readFileSync(path.join(toolRoot, 'resource-library.html'), 'utf8');
const css = fs.readFileSync(path.join(toolRoot, 'resource-library.css'), 'utf8');

// --- The catalogue is internally valid -----------------------------------
assert.deepEqual(
    catalogue.problems(),
    [],
    'the shipped catalogue must have no problems'
);

// The validator has to actually catch things, or the assertion above is empty.
assert.ok(
    catalogue.problems([{ title: 'No category', place: 'toolbox', path: 'downloads/x.pdf' }]).length,
    'a missing category is a problem'
);
assert.ok(
    catalogue.problems([{ title: 'Bad category', category: 'Nope', place: 'link', url: 'https://x.test/a' }]).length,
    'an unknown category is a problem'
);
assert.ok(
    catalogue.problems([{ title: 'No place', category: 'Templates' }]).length,
    'a missing place is a problem'
);
assert.ok(
    catalogue.problems([{ title: 'Toolbox, no path', category: 'Templates', place: 'toolbox' }]).length,
    'a toolbox entry without a path is a problem'
);
assert.ok(
    catalogue.problems([{ title: 'Insecure link', category: 'Templates', place: 'link', url: 'http://x.test/a' }]).length,
    'a link must be https'
);
assert.ok(
    catalogue.problems([
        { title: 'Same name', category: 'Templates', place: 'toolbox', path: 'a.pdf' },
        { title: 'Same name', category: 'Templates', place: 'toolbox', path: 'b.pdf' }
    ]).length,
    'duplicate titles are a problem'
);
assert.equal(
    catalogue.problems([{ title: 'Fine', category: 'Templates', place: 'link', url: 'https://x.test/a' }]).length,
    0,
    'a well-formed entry raises nothing'
);

// --- Every toolbox file the catalogue claims actually exists -------------
const toolboxEntries = catalogue.RESOURCES.filter(resource => resource.place === 'toolbox');

for (const resource of toolboxEntries) {
    const target = path.join(repoRoot, resource.path);
    assert.ok(
        fs.existsSync(target),
        `"${resource.title}" points at ${resource.path}, which does not exist`
    );
    assert.ok(
        fs.statSync(target).isFile(),
        `"${resource.title}" points at a directory, not a file`
    );
}

/**
 * ...and nothing sits in downloads/ without being listed.
 *
 * This is the guard that matters. The repository is public, so a file committed
 * into downloads/ is published to the internet the moment it lands on main.
 * Requiring it to be listed in the catalogue means publishing is always a
 * deliberate act with a human-readable description attached, never a stray file
 * that nobody remembers adding.
 */
const downloadsRoot = path.join(repoRoot, 'downloads');
const IGNORED = new Set(['README.md', '.gitkeep']);

function filesUnder(directory) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return filesUnder(absolute);
        if (IGNORED.has(entry.name)) return [];
        return [path.relative(repoRoot, absolute).split(path.sep).join('/')];
    });
}

const listedPaths = new Set(toolboxEntries.map(resource => resource.path));

for (const file of filesUnder(downloadsRoot)) {
    assert.ok(
        listedPaths.has(file),
        `${file} is in downloads/ but not listed in the catalogue. ` +
        'Add an entry for it, or move it out — the repository is public, so an ' +
        'unlisted file here is published without anyone having described it.'
    );
}

// The warning that tells whoever adds a file what they are doing must stay.
const downloadsReadme = fs.readFileSync(path.join(downloadsRoot, 'README.md'), 'utf8');
assert.match(downloadsReadme, /public/i, 'downloads/README.md must say the repository is public');
assert.match(downloadsReadme, /git history/i, 'downloads/README.md must warn that history is permanent');
assert.match(downloadsReadme, /Drive link/i, 'downloads/README.md must point at the safer alternative');

// So must the same warning in the tool, since that is where people actually look.
assert.match(html, /repository is public/i, 'the tool must state that the repository is public');
assert.match(html, /Drive link/i, 'the tool must explain the Drive link alternative');
assert.match(
    html,
    /not sure which to use, use a Drive link/i,
    'the tool must give a default for the unsure'
);

// --- Links open safely ---------------------------------------------------
const controller = fs.readFileSync(path.join(toolRoot, 'resource-library.js'), 'utf8');
assert.match(
    controller,
    /rel="noopener noreferrer"/,
    'external links must not hand the opener to the target page'
);

// --- Categories ----------------------------------------------------------
// Every used category is a declared one, and the filter order follows the
// declared order rather than insertion order.
const used = catalogue.usedCategories();
for (const category of used) {
    assert.ok(catalogue.CATEGORIES.includes(category), `${category} should be declared`);
}
assert.deepEqual(
    used,
    catalogue.CATEGORIES.filter(category => used.includes(category)),
    'used categories keep the declared order'
);
assert.deepEqual(
    catalogue.usedCategories([]),
    [],
    'an empty catalogue has no categories'
);

// --- Target resolution ---------------------------------------------------
// Paths are stored relative to the site root but the tool sits two levels down.
assert.equal(
    catalogue.target({ place: 'toolbox', path: 'downloads/a.pdf' }),
    '../../downloads/a.pdf',
    'a toolbox path resolves relative to the tool page'
);
assert.equal(
    catalogue.target({ place: 'link', url: 'https://drive.google.com/x' }),
    'https://drive.google.com/x',
    'a link is used as given'
);

// Spaces and other awkward characters in filenames have to survive, since the
// files already in this repository have them.
assert.equal(
    catalogue.target({ place: 'toolbox', path: 'Samples/Ray2Volt Solar Prices.html' }),
    '../../Samples/Ray2Volt%20Solar%20Prices.html',
    'spaces in a path are encoded, and the separators are not'
);

assert.equal(catalogue.slug('Waaree 550 Wp — datasheet'), 'waaree-550-wp-datasheet');
assert.equal(catalogue.slug('  Leading and trailing  '), 'leading-and-trailing');

// --- Page wiring ---------------------------------------------------------
assert.match(html, /family=Google\+Sans:/, 'the page loads Google Sans for its headings');
assert.match(html, /data-tool-id="resource-library"/, 'the page is password gated');
assert.ok(
    html.lastIndexOf('resource-library.js') > html.lastIndexOf('resource-library-catalogue.js'),
    'the controller loads after the catalogue'
);

for (const id of ['rlSearch', 'rlFilters', 'rlGrid', 'rlCount', 'rlEmpty', 'rlProblems']) {
    assert.ok(html.includes(`id="${id}"`), `the page must contain #${id}`);
}

// House style: the shared shell owns the width, and sections space themselves
// off the shared token.
assert.doesNotMatch(css, /\.content-section\s*\{[^}]*max-width:\s*\d/, 'no tool-level page width');
for (const selector of ['.rl-controls-card', '.rl-grid', '.rl-help']) {
    const rule = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`));
    assert.ok(rule, `missing CSS rule for ${selector}`);
    assert.match(
        rule[1],
        /margin-bottom:\s*var\(--section-gap, 1\.5rem\)/,
        `${selector} should space itself off --section-gap`
    );
}

// Headers stay light, per house style — no dark fills anywhere in this tool.
for (const dark of ['#1F4E79', '#17395A']) {
    assert.ok(
        !new RegExp(`background(-color)?:\\s*${dark}`, 'i').test(css),
        `${dark} must not be used as a background fill`
    );
}

// Red and green are reserved for good/bad verdicts. A badge saying where a file
// lives is not a verdict, so the place badges must not use them.
const badgeRules = (css.match(/\.rl-badge-(toolbox|link)\s*\{[^}]*\}/g) || []).join('\n');
assert.ok(badgeRules, 'the place badges should be styled');
assert.doesNotMatch(badgeRules, /#DC2626|#16A34A|#991B1B|#166534/, 'place badges are not verdicts');

console.log('resource library tests passed');
