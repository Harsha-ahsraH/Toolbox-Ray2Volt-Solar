const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function collectFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory() && ['.git', 'tmp', 'node_modules'].includes(entry.name)) return [];
        const absolutePath = path.join(directory, entry.name);
        return entry.isDirectory() ? collectFiles(absolutePath) : [absolutePath];
    });
}

const referenceFiles = collectFiles(repoRoot).filter(file =>
    file.endsWith('.html') || /quote-generator-pages-\d-\d\.js$/.test(file)
);

for (const sourceFile of referenceFiles) {
    const contents = fs.readFileSync(sourceFile, 'utf8');
    const references = contents.matchAll(/(?:href|src)="([^"]+)"/g);

    for (const [, reference] of references) {
        if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;

        const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
        if (!cleanReference) continue;

        const target = path.resolve(path.dirname(sourceFile), cleanReference);
        assert.ok(
            fs.existsSync(target),
            `${path.relative(repoRoot, sourceFile)} references missing ${cleanReference}`
        );
    }
}

for (const asset of [
    'tools/quote-generator/assets/Hybrid Solar Schemartic Diagram.png',
    'tools/quote-generator/assets/On-Grid Schematic Diagram.png',
    'tools/letterheadify/assets/Letterhead (Latest) Ray2Volt Solar PNG.png'
]) {
    assert.ok(fs.existsSync(path.join(repoRoot, asset)), `Missing runtime asset ${asset}`);
}

console.log('local link tests passed');
