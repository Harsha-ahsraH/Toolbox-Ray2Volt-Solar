const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

// A comment that loses its closing */ does not fail loudly: it runs on to the
// next comment's */ and silently swallows every rule in between. That is how
// the collapsed sidebar once lost its width and kept its header. A /* opening
// inside a comment is the tell, so every stylesheet is checked for one.
const stylesheets = ['global/styles', ...fs.readdirSync(path.join(repoRoot, 'tools')).map((tool) => `tools/${tool}`)]
    .flatMap((dir) =>
        fs
            .readdirSync(path.join(repoRoot, dir))
            .filter((file) => file.endsWith('.css'))
            .map((file) => `${dir}/${file}`)
    );

assert.ok(stylesheets.length > 20, 'the shared and tool stylesheets should all be covered');

for (const sheet of stylesheets) {
    const css = fs.readFileSync(path.join(repoRoot, sheet), 'utf8');
    let at = 0;

    while ((at = css.indexOf('/*', at)) !== -1) {
        const end = css.indexOf('*/', at + 2);
        const line = css.slice(0, at).split('\n').length;

        assert.notEqual(end, -1, `${sheet}:${line} opens a comment that never closes`);

        const nested = css.indexOf('/*', at + 2);
        assert.ok(
            nested === -1 || nested > end,
            `${sheet}:${line} opens a comment that runs into another one - is its */ missing?`
        );

        at = end + 2;
    }
}

console.log('css comment tests passed');
