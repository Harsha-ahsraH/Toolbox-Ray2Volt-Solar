const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const readRepoFile = (...segments) => fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');

const navigationJs = readRepoFile('global', 'scripts', 'navigation.js');
const navigationCss = readRepoFile('global', 'styles', 'navigation.css');
const responsiveCss = readRepoFile('global', 'styles', 'responsive.css');
const indexHtml = readRepoFile('index.html');

/* --- Every tool the sidebar links to must be searchable --- */

const keywordBlock = navigationJs.slice(
    navigationJs.indexOf('const TOOL_SEARCH_KEYWORDS'),
    navigationJs.indexOf('document.addEventListener')
);
const keywordKeys = new Set(
    Array.from(keywordBlock.matchAll(/'([a-z0-9.-]+)':/g), match => match[1])
);
const linkedPages = new Set();

// Mirrors toolKey() in navigation.js: an external tool is keyed by host, so the
// trailing slash has to come off before the last segment is taken.
const toolKey = (href) => {
    const withoutQuery = href.split(/[?#]/)[0].replace(/\/+$/, '');
    return withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1).toLowerCase();
};

for (const match of indexHtml.matchAll(/<a href="([^"]+)" class="nav-link/g)) {
    const page = toolKey(match[1]);
    linkedPages.add(page);
    assert.ok(
        keywordKeys.has(page),
        `${page} is in the sidebar but has no search keywords in navigation.js`
    );
}

assert.ok(linkedPages.size >= 17, 'the sidebar should still list every tool');

for (const key of keywordKeys) {
    assert.ok(
        linkedPages.has(key),
        `${key} has search keywords but is no longer linked from the sidebar`
    );
}

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

/* --- Mobile logo sizing --- */

const logoHeight = (selector) => {
    const rule = navigationCss.match(new RegExp(`${selector}\\s*{[^}]*}`));
    assert.ok(rule, `${selector} should be styled`);
    const height = rule[0].match(/height:\s*(\d+)px/);
    assert.ok(height, `${selector} should set an explicit height`);
    return Number(height[1]);
};

assert.ok(
    logoHeight('\\.mobile-logo') <= 24,
    'the fixed mobile header logo should stay small next to the page content'
);

assert.ok(
    logoHeight('\\.sidebar-mobile-header \\.sidebar-mobile-logo') <= 24,
    'the drawer logo should match the header logo'
);

console.log('toolbox search tests passed');
