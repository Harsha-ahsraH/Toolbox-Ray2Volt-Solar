const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const read = (...segments) =>
    fs.readFileSync(path.join(repoRoot, ...segments), 'utf8').replace(/\r\n/g, '\n');

const baseCss = read('global', 'styles', 'base.css');
const themeJs = read('global', 'scripts', 'theme.js');
const authJs = read('global', 'scripts', 'auth.js');
const navigationCss = read('global', 'styles', 'navigation.css');

const block = (css, selector) => {
    const start = css.indexOf(selector + ' {');
    assert.notEqual(start, -1, `${selector} should exist in base.css`);
    return css.slice(start, css.indexOf('\n}', start));
};

const declarations = (source) => {
    const found = new Map();
    for (const [, name, value] of source.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
        found.set(name, value.trim());
    }
    return found;
};

const light = declarations(block(baseCss, ':root'));
const dark = declarations(block(baseCss, ':root[data-theme="dark"]'));
const printed = declarations(block(baseCss, '@media print'));

const isColour = (value) => /^#[0-9A-Fa-f]{3,8}$/.test(value) || /\brgba?\(/.test(value);

// The failure this catches: a colour token added to the light theme and
// forgotten in the dark one, which then inherits a light value onto a dark
// surface. Sizes, radii and durations are deliberately shared.
const lightColours = [...light].filter(([, value]) => isColour(value)).map(([name]) => name);

assert.ok(lightColours.length > 20, 'the light theme should carry the colour tokens');

const missing = lightColours.filter((name) => !dark.has(name));
assert.deepEqual(missing, [], `the dark theme should re-declare ${missing.join(', ')}`);

assert.match(
    block(baseCss, ':root[data-theme="dark"]'),
    /color-scheme:\s*dark;/,
    'the dark theme should tell the browser its own form controls are dark'
);

// Printing is always on paper, whichever theme the screen is in.
for (const surface of ['--bg-body', '--bg-card', '--bg-sidebar', '--viewer-bg']) {
    assert.equal(
        printed.get(surface),
        '#FFFFFF',
        `${surface} should come back to white for print`
    );
}

assert.equal(printed.get('--text-primary'), '#111827', 'printed text should be ink');

// theme.js decides the theme before the body paints, so every page has to load
// it in the head rather than with the scripts at the end.
const pages = [
    'index.html',
    ...fs
        .readdirSync(path.join(repoRoot, 'tools'))
        .flatMap((tool) =>
            fs
                .readdirSync(path.join(repoRoot, 'tools', tool))
                .filter((file) => file.endsWith('.html'))
                .map((file) => path.join('tools', tool, file))
        )
];

assert.ok(pages.length > 15, 'every tool page should be covered');

for (const page of pages) {
    const html = read(page);
    const head = html.slice(0, html.indexOf('</head>'));

    assert.match(
        head,
        /<script src="[^"]*global\/scripts\/theme\.js"><\/script>/,
        `${page} should load theme.js in its head`
    );
}

// The toggle lives in the compact navigation controls beside sign out. Account
// identity is deliberately not repeated in a persistent sidebar badge.
const controlsStart = authJs.indexOf('function renderSessionControls');
const controlsEnd = authJs.indexOf('\n    const session =', controlsStart);
assert.notEqual(controlsStart, -1, 'auth.js should render navigation controls');
assert.notEqual(controlsEnd, -1, 'the navigation controls function should be bounded');
const controlsSource = authJs.slice(controlsStart, controlsEnd);

assert.doesNotMatch(
    controlsSource,
    /nav-session-(?:avatar|text|label|role)|Signed in as/,
    'navigation controls should not render a signed-in identity badge'
);

assert.match(
    authJs,
    /class="nav-session-theme"/,
    'the navigation controls should carry the theme toggle'
);

assert.match(
    authJs,
    /Ray2VoltTheme\.attachToggle\(controls\.querySelector\('\.nav-session-theme'\)\)/,
    'theme.js should own the toggle button once auth.js has built it'
);

assert.ok(
    authJs.indexOf('nav-session-theme') < authJs.indexOf('nav-session-out'),
    'the theme toggle should sit before the sign-out button'
);

assert.match(
    navigationCss,
    /\.nav-session-theme[\s\S]{0,200}\.nav-session-out\s*{/,
    'both navigation-control buttons should share one set of styles'
);

assert.match(themeJs, /localStorage/, 'a chosen theme should survive a reload');
assert.match(
    themeJs,
    /return readChoice\(\) \|\| 'light';/,
    'with no choice stored the toolbox should default to light'
);
assert.doesNotMatch(
    themeJs,
    /prefers-color-scheme/,
    'the operating-system preference should not override the light default'
);

// Documents are not themed: they carry their own palettes and print on paper.
// A chrome token appearing in one is how a dark A4 page would get shipped.
const documentSheets = [
    ['comparison-sheet', 'comparison-sheet-document.css'],
    ['comparison-sheet', 'comparison-sheet-print.css'],
    ['margin-breakdown', 'margin-breakdown-document.css'],
    ['margin-breakdown', 'margin-breakdown-print.css'],
    ['quote-generator', 'quote-generator-preview-layout.css'],
    ['quote-generator', 'quote-generator-preview-details.css'],
    ['quote-generator', 'quote-generator-preview-terms.css'],
    ['quote-generator', 'quote-generator-proposal-comprehensive.css'],
    ['quote-generator', 'quote-generator-print.css']
];

for (const [tool, sheet] of documentSheets) {
    const css = read('tools', tool, sheet);
    const chrome = css.match(
        /var\(--(bg|text|border|primary|on-primary|row-stripe|table-head|viewer|danger|warning|success|info)[a-z-]*\)/g
    );

    assert.equal(
        chrome,
        null,
        `${sheet} should keep its own palette rather than the themed chrome's ${chrome}`
    );
}

console.log('theme tests passed');
