const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const readCss = (...segments) =>
    fs.readFileSync(path.join(repoRoot, ...segments), 'utf8').replace(/\r\n/g, '\n');

const baseCss = readCss('global', 'styles', 'base.css');
const navigationCss = readCss('global', 'styles', 'navigation.css');

assert.match(
    baseCss,
    /--scrollbar-size:\s*\d+px;/,
    'the shared scrollbar width should live in a token'
);

assert.match(
    baseCss,
    /::-webkit-scrollbar\s*{[^}]*width:\s*var\(--scrollbar-size\);[^}]*height:\s*var\(--scrollbar-size\);/,
    'every scrollbar should take its width and height from the shared token'
);

assert.match(
    baseCss,
    /::-webkit-scrollbar-thumb\s*{[^}]*background:\s*transparent;[^}]*border-radius:\s*999px;/,
    'the resting thumb should be an invisible pill'
);

assert.match(
    baseCss,
    /:hover::-webkit-scrollbar-thumb,\s*:focus-within::-webkit-scrollbar-thumb\s*{[^}]*background:\s*var\(--scrollbar-thumb\);[^}]*border-color:\s*var\(--scrollbar-thumb-border\);/,
    'the thumb should appear when the pointer or focus is inside the scrolling area'
);

assert.match(
    baseCss,
    /@media \(hover: none\)\s*{\s*::-webkit-scrollbar-thumb\s*{[^}]*background:\s*var\(--scrollbar-thumb\);/,
    'touch devices cannot hover, so their thumb should stay visible'
);

assert.match(
    baseCss,
    /@supports not selector\(::-webkit-scrollbar\)\s*{[\s\S]*?\*\s*{[^}]*scrollbar-width:\s*thin;[^}]*scrollbar-color:\s*transparent transparent;/,
    'browsers without the WebKit scrollbar pseudo-elements should hide the thumb through the standard properties'
);

// Chromium abandons the styled scrollbar above the moment either standard
// property is set, so both may only appear inside the @supports guard.
const supportsGuardStart = baseCss.indexOf('@supports not selector(::-webkit-scrollbar)');

assert.notEqual(supportsGuardStart, -1, 'the @supports guard should exist');

for (const property of ['scrollbar-width:', 'scrollbar-color:']) {
    const firstUse = baseCss.indexOf(property);
    assert.ok(
        firstUse === -1 || firstUse > supportsGuardStart,
        `${property} should only be used inside the @supports guard, so Chromium keeps the styled scrollbar`
    );
}

assert.match(
    navigationCss,
    /\.main-nav\s*{[^}]*scrollbar-gutter:\s*stable;/,
    'the tool list should still reserve its scrollbar gutter'
);

assert.doesNotMatch(
    navigationCss,
    /\.main-nav[^{]*::-webkit-scrollbar-thumb/,
    'the sidebar should inherit the shared thumb rather than restyle it'
);

assert.doesNotMatch(
    navigationCss,
    /\.main-nav\s*{[^}]*scrollbar-color:/,
    'pinning scrollbar-color on the sidebar would keep its scrollbar permanently visible'
);

console.log('scrollbar tests passed');
