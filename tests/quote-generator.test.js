const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'tools', 'quote-generator.html'), 'utf8');
const css = fs.readFileSync(path.join(repoRoot, 'css', 'quote-generator.css'), 'utf8');
const js = fs.readFileSync(path.join(repoRoot, 'js', 'quote-generator.js'), 'utf8');

assert.match(html, /Generate professional 5-page solar project proposals/);
assert.doesNotMatch(html, /7-page|Page 6 of 7|Page 7 of 7|chart\.umd|Chart\.js/i);

for (let page = 1; page <= 5; page++) {
    assert.match(html, new RegExp(`Page ${page} of 5`));
}

assert.equal((html.match(/class="quote-page/g) || []).length, 5);
assert.match(html, /<script src="\.\.\/js\/quote-generator\.js"><\/script>/);
assert.match(css, /QUOTE PREVIEW - 5 Page A4 Document/);
assert.match(js, /Generate the 5-page preview/);
assert.match(js, /function generatePreview\(\)/);

console.log('quote-generator tests passed');
