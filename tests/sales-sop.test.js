const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const salesSop = fs.readFileSync(
    path.join(repoRoot, 'tools', 'sales-sop', 'sales-sop.html'),
    'utf8'
);
const prices = fs.readFileSync(
    path.join(repoRoot, 'tools', 'package-prices', 'package-prices.html'),
    'utf8'
);

assert.match(salesSop, /Rooftop Solar Sales SOP/, 'Sales SOP title should be present');
assert.match(salesSop, /On-Grid Schematic Diagram\.png/, 'Sales SOP should use the global on-grid schematic');
assert.match(salesSop, /Hybrid Solar Schemartic Diagram\.png/, 'Sales SOP should use the global hybrid schematic');
assert.match(salesSop, /PM Surya Ghar Muft Bijli Yojana/, 'Sales SOP should include subsidy guidance');
assert.match(salesSop, /Easy Solar Loan Option/, 'Sales SOP should include loan guidance');
assert.match(salesSop, /Project Timeline/, 'Sales SOP should include the project timeline');

const pricingAccordions = prices.match(/<details class="pkg-accordion"/g) || [];
assert.equal(pricingAccordions.length, 4, 'Prices should expose four package accordions');

for (const currentPrice of ['1,73,600', '1,21,600', '4,34,000', '3,81,000']) {
    assert.match(prices, new RegExp(currentPrice), `Prices should retain toolbox value ${currentPrice}`);
}

const htmlFiles = [
    path.join(repoRoot, 'index.html'),
    ...fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(repoRoot, 'tools', entry.name, `${entry.name}.html`))
        .filter(file => fs.existsSync(file))
];

for (const htmlFile of htmlFiles) {
    const contents = fs.readFileSync(htmlFile, 'utf8');
    const pricesIndex = contents.indexOf('package-prices/package-prices.html');
    const sopIndex = contents.indexOf('sales-sop/sales-sop.html');
    assert.ok(pricesIndex >= 0, `${path.relative(repoRoot, htmlFile)} should link to Package Prices`);
    assert.ok(sopIndex > pricesIndex, `${path.relative(repoRoot, htmlFile)} should place Sales SOP after Package Prices`);
}

console.log('sales SOP and pricing tests passed');
