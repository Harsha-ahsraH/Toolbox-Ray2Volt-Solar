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
    /--scrollbar-size:\s*\d+px;/,
    'the shared scrollbar width should live in a token'
);

assert.match(
    baseCss,
    /::-webkit-scrollbar\s*{\s*width:\s*var\(--scrollbar-size\);\s*height:\s*var\(--scrollbar-size\);\s*}/,
    'both axes should draw the bar at the tokenised width'
);

// The thumb is painted in the resting rule, not in a :hover one: a scrollable
// area has to look scrollable before the pointer ever reaches it.
const restingThumb = baseCss.match(/\n::-webkit-scrollbar-thumb\s*{([^}]*)}/);

assert.ok(restingThumb, 'the thumb should carry a resting rule of its own');

assert.match(
    restingThumb[1],
    /background:\s*var\(--scrollbar-thumb\);/,
    'the resting thumb should be filled, not transparent'
);

// The pill is a solid grey that has to separate from whichever surface it sits
// on: a mid grey under the light theme, a lighter one under the dark theme.
const brightness = (hex) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const thumbs = [...baseCss.matchAll(/--scrollbar-thumb:\s*#([0-9A-Fa-f]{6});/g)].map(
    (match) => match[1]
);

assert.equal(thumbs.length, 2, 'both themes should name their own resting thumb');

const [lightThumb, darkThumb] = thumbs;

assert.ok(
    brightness(lightThumb) > 0.25 && brightness(lightThumb) < 0.55,
    `--scrollbar-thumb: #${lightThumb} should be a mid grey on the light theme`
);

assert.ok(
    brightness(darkThumb) > 0.15 && brightness(darkThumb) < brightness(lightThumb),
    `--scrollbar-thumb: #${darkThumb} should lift off the dark theme's surfaces`
);

assert.doesNotMatch(
    baseCss,
    /:hover::-webkit-scrollbar-thumb|:focus-within::-webkit-scrollbar-thumb/,
    'the thumb should never be hidden until the area is hovered or focused'
);

// Firefox has no ::-webkit-scrollbar, so it needs the standard properties -
// but only Firefox: Chromium drops the styled bar above for any element that
// sets scrollbar-width or scrollbar-color.
const firefoxOnly = baseCss.match(
    /@supports not selector\(::-webkit-scrollbar\)\s*{([\s\S]*?)\n}/
);

assert.ok(firefoxOnly, 'the standard properties should sit behind a Firefox-only guard');

assert.match(
    firefoxOnly[1],
    /scrollbar-color:\s*var\(--scrollbar-thumb\) transparent;/,
    'Firefox should colour its bar at rest too'
);

const stylesheets = [
    ['global/styles/base.css', baseCss],
    ['global/styles/navigation.css', navigationCss],
    ['global/styles/responsive.css', responsiveCss],
    ...toolStylesheets.map((stylesheet) => [
        path.relative(repoRoot, stylesheet).replace(/\\/g, '/'),
        readCss(path.relative(repoRoot, stylesheet))
    ])
];

// One scrollbar across the toolbox: no element hides its own, and no element
// paints a second look over the shared one.
for (const [name, css] of stylesheets) {
    const outsideGuard =
        name === 'global/styles/base.css' ? css.replace(firefoxOnly[0], '') : css;

    assert.doesNotMatch(
        outsideGuard,
        /scrollbar-width:|scrollbar-color:/,
        `${name} should leave the standard scrollbar properties to the Firefox guard in base.css`
    );

    if (name === 'global/styles/base.css') continue;

    const thumbRules = css.match(/::-webkit-scrollbar(-thumb|-track|-corner)?[^{]*{[^}]*}/g) || [];
    const repainted = thumbRules.filter((rule) => !/margin-block/.test(rule));

    assert.deepEqual(
        repainted,
        [],
        `${name} should not restyle the shared scrollbar with ${repainted.join(' ')}`
    );
}

console.log('scrollbar tests passed');
