const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const readCss = (...segments) =>
    fs.readFileSync(path.join(repoRoot, ...segments), 'utf8').replace(/\r\n/g, '\n');

const baseCss = readCss('global', 'styles', 'base.css');
const navigationCss = readCss('global', 'styles', 'navigation.css');
const responsiveCss = readCss('global', 'styles', 'responsive.css');
const toolStylesheets = fs
    .readdirSync(path.join(repoRoot, 'tools'))
    .map((tool) => path.join(repoRoot, 'tools', tool, `${tool}.css`))
    .filter((stylesheet) => fs.existsSync(stylesheet));

assert.match(
    baseCss,
    /\*\s*{\s*scrollbar-width:\s*none;\s*}/,
    'no scrolling area should draw a scrollbar in Firefox or current Chromium'
);

assert.match(
    baseCss,
    /::-webkit-scrollbar\s*{\s*display:\s*none;\s*}/,
    'older WebKit should hide its scrollbar too'
);

// A single element re-declaring either property brings its scrollbar back,
// which is exactly the inconsistency this treatment exists to remove.
const stylesheets = [
    ['global/styles/base.css', baseCss],
    ['global/styles/navigation.css', navigationCss],
    ['global/styles/responsive.css', responsiveCss],
    ...toolStylesheets.map((stylesheet) => [
        path.relative(repoRoot, stylesheet).replace(/\\/g, '/'),
        readCss(path.relative(repoRoot, stylesheet))
    ])
];

for (const [name, css] of stylesheets) {
    const scrollbarWidths = css.match(/scrollbar-width:\s*[^;]+;/g) || [];
    const unhidden = scrollbarWidths.filter((rule) => !/none/.test(rule));

    assert.deepEqual(
        unhidden,
        [],
        `${name} should not re-enable a scrollbar with ${unhidden.join(' ')}`
    );

    assert.doesNotMatch(
        css,
        /scrollbar-color:/,
        `${name} should not colour a scrollbar that is never drawn`
    );

    assert.doesNotMatch(
        css,
        /::-webkit-scrollbar(-track|-thumb|-corner)/,
        `${name} should not style the parts of a hidden WebKit scrollbar`
    );
}

console.log('scrollbar tests passed');
