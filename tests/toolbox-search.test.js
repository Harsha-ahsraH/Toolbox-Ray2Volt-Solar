const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRegistry } = require('./helpers/registry');

const repoRoot = path.resolve(__dirname, '..');
const readRepoFile = (...segments) => fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');

const navigationJs = readRepoFile('global', 'scripts', 'navigation.js');
const navigationCss = readRepoFile('global', 'styles', 'navigation.css');
const responsiveCss = readRepoFile('global', 'styles', 'responsive.css');

/* --- Every tool in the sidebar is searchable --- */

// The sidebar, the cards and the search all come from the registry, so a tool
// is findable by its label plus the keywords on its entry.
const registry = loadRegistry();
assert.ok(registry.list.length >= 17, 'the registry should still list every tool');

for (const tool of registry.list) {
    assert.ok(tool.keywords && tool.keywords.trim(), `${tool.id} needs search keywords in tools.js`);
}

assert.match(navigationJs, /data-keywords="\$\{escapeHtml\(tool\.keywords/, 'nav links carry their keywords');
assert.match(navigationJs, /element\.dataset\.keywords/, 'the search matches the keywords as well as the label');
assert.doesNotMatch(navigationJs, /TOOL_SEARCH_KEYWORDS/, 'keywords live in the registry, not a second list');

/* --- The search itself --- */

assert.match(
    navigationJs,
    /id="toolSearch"[\s\S]*placeholder="Search tools"/,
    'the sidebar should build a labelled tool search field'
);

assert.ok(
    navigationJs.includes("mainNav.parentNode.insertBefore(searchWrap, mainNav)"),
    'the search field should sit above the tool list, at the top of the sidebar'
);

assert.ok(
    navigationJs.includes(".tool-grid .tool-card"),
    'the dashboard card grid should narrow with the same query'
);

assert.match(
    navigationJs,
    /'ArrowDown'/,
    'the search should hand keyboard focus down into the results'
);

/* --- Mobile reach: the sidebar is behind the hamburger --- */

assert.match(
    navigationJs,
    /className = 'mobile-search-toggle'/,
    'the fixed mobile header should carry its own search control'
);

assert.match(
    navigationJs,
    /searchToggle\.addEventListener\('click', \(\) => \{\s*openSidebar\(\);\s*searchInput\.focus\(\);/,
    'the mobile search control should open the drawer straight into the search field'
);

assert.match(
    navigationCss,
    /\.mobile-nav-toggle,\s*\.mobile-search-toggle\s*{[^}]*width:\s*42px;/,
    'both mobile header controls should keep a touch-sized target'
);

assert.match(
    responsiveCss,
    /\.sidebar\.open \.main-nav\.is-filtering \.nav-link\s*{[^}]*animation:\s*none;/,
    'filtered results must not replay the staggered drawer animation on each keystroke'
);

const mobileRulesStart = responsiveCss.indexOf('@media screen and (max-width: 768px)');
const narrowMobileRulesStart = responsiveCss.indexOf('@media screen and (max-width: 480px)');
assert.notEqual(mobileRulesStart, -1, 'the mobile breakpoint should exist');
assert.notEqual(narrowMobileRulesStart, -1, 'the narrow mobile breakpoint should exist');
const mobileRules = responsiveCss.slice(mobileRulesStart, narrowMobileRulesStart);

assert.match(
    mobileRules,
    /\.nav-search-clear\s*{[^}]*position:\s*absolute;[^}]*top:\s*50%;[^}]*transform:\s*translateY\(-50%\);/,
    'the mobile search clear button should stay pinned and vertically centred inside the field'
);

/* --- Collapsed desktop sidebar keeps a usable search --- */

const desktopRulesStart = navigationCss.indexOf('@media screen and (min-width: 769px)');
assert.notEqual(desktopRulesStart, -1, 'the desktop breakpoint should exist');
const desktopRules = navigationCss.slice(desktopRulesStart);

assert.match(
    desktopRules,
    /\.sidebar\.collapsed \.nav-search-icon\s*{[^}]*left:\s*50%;/,
    'the collapsed sidebar should show the search as a centred icon'
);

assert.ok(
    navigationJs.includes("if (sidebar.classList.contains('collapsed')) setSidebarCollapsed(false);"),
    'clicking the collapsed search should expand the sidebar first'
);

/* --- No company logos in the toolbox interface --- */

// navigation.js builds the header and sidebar, so pages carry none of it.
const shellPages = ['index.html', ...fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `tools/${entry.name}/${entry.name}.html`)
    .filter(file => fs.existsSync(path.join(repoRoot, file)))];

for (const file of shellPages) {
    const html = readRepoFile(file);
    assert.doesNotMatch(html, /<aside class="sidebar"|<header class="mobile-header"|class="overlay"/,
        `${file} should leave the shell to navigation.js`);
    assert.match(html, /<div class="app-container">/, `${file} needs the .app-container the shell mounts into`);
    // The tab icon matches the website's: the same three sizes, from global/assets.
    for (const icon of ['favicon-32.png', 'favicon-512.png', 'apple-touch-icon.png']) {
        assert.ok(html.includes(`global/assets/${icon}?v=`), `${file} should link ${icon}`);
    }
}

const shellSource = navigationJs.slice(0, navigationJs.indexOf('/* --- Who is signed in'));
assert.match(shellSource, /<span class="sidebar-brand mobile-brand">Toolbox<\/span>/,
    'the mobile header should show the Toolbox text title');
assert.match(shellSource, /class="sidebar-mobile-header"><h2 class="sidebar-brand">Toolbox<\/h2>/,
    'the drawer should use the compact Toolbox heading');
assert.doesNotMatch(shellSource, /<img\b/, 'the interface should contain no logo images');

console.log('toolbox search tests passed');
