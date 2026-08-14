const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const navigationCss = fs.readFileSync(
    path.join(repoRoot, 'global', 'styles', 'navigation.css'),
    'utf8'
);
const responsiveCss = fs.readFileSync(
    path.join(repoRoot, 'global', 'styles', 'responsive.css'),
    'utf8'
);
const navigationJs = fs.readFileSync(
    path.join(repoRoot, 'global', 'scripts', 'navigation.js'),
    'utf8'
);
const mobileRulesStart = responsiveCss.indexOf('@media screen and (max-width: 768px)');
const mobileRulesEnd = responsiveCss.indexOf('@media screen and (max-width: 480px)');

assert.notEqual(mobileRulesStart, -1, 'the shared mobile breakpoint should exist');
assert.ok(mobileRulesEnd > mobileRulesStart, 'the mobile breakpoint should precede the narrow breakpoint');

const mobileNavigationCss = responsiveCss.slice(mobileRulesStart, mobileRulesEnd);

assert.match(
    navigationCss,
    /\.sidebar\.collapsed \.logo-header\s*{[^}]*display:\s*none;/,
    'the complete desktop logo header should be hidden when the sidebar is collapsed'
);

assert.match(
    navigationCss,
    /\.sidebar > div:not\(\.sidebar-mobile-header\)\s*{[^}]*min-height:\s*0;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*overflow:\s*hidden;/,
    'the sidebar content wrapper should constrain the navigation to the viewport'
);

assert.match(
    navigationCss,
    /\.main-nav\s*{[^}]*flex:\s*1;[^}]*overflow-y:\s*auto;[^}]*min-height:\s*0;[^}]*scrollbar-gutter:\s*stable;/,
    'the tool list should own a stable vertical scrollbar when its links overflow'
);

assert.match(
    mobileNavigationCss,
    /\.sidebar\s*{[^}]*height:\s*100dvh;[^}]*max-height:\s*100dvh;/,
    'the mobile sidebar should be constrained to the dynamic viewport height'
);

assert.match(
    mobileNavigationCss,
    /\.main-nav\s*{[^}]*-webkit-overflow-scrolling:\s*touch;[^}]*touch-action:\s*pan-y pinch-zoom;/,
    'the mobile tool list should support touch scrolling'
);

assert.match(
    navigationJs,
    /collapsed\s*\?\s*'chevron_right'\s*:\s*'chevron_left'/,
    'the collapse control should use left and right Material chevrons'
);

console.log('sidebar navigation tests passed');
