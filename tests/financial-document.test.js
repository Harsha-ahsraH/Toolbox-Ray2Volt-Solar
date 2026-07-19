const assert = require('node:assert/strict');
const Docs = require('../global/scripts/financial-document.js');

function fakeRow(values) {
    return {
        querySelector(selector) {
            const value = values[selector];
            return value === undefined ? null : { value };
        }
    };
}

const selectors = {
    description: '.item-description',
    hsnCode: '.item-hsn-code',
    quantity: '.item-quantity',
    totalAmount: '.item-total-amount',
    gstRate: '.item-gst-rate'
};

const rows = [
    fakeRow({
        '.item-description': 'Solar panel',
        '.item-hsn-code': '8541',
        '.item-quantity': '2',
        '.item-total-amount': '2100',
        '.item-gst-rate': '5'
    }),
    fakeRow({
        '.item-description': '<script>alert(1)</script>',
        '.item-quantity': '1',
        '.item-total-amount': '1000',
        '.item-gst-rate': '0'
    })
];

const items = Docs.collectInclusiveGstItems(rows, selectors, { includeHsn: true });

assert.equal(items.length, 2);
assert.equal(items[0].sn, 1);
assert.equal(items[0].description, 'Solar panel');
assert.equal(items[0].hsnCode, '8541');
assert.equal(items[0].qty, 2);
assert.equal(items[0].gstRate, 5);
assert.equal(items[0].taxableValue, 2000);
assert.equal(items[0].pricePerUnit, 1000);

assert.equal(items[1].gstRate, 0);
assert.equal(items[1].taxableValue, 1000);
assert.equal(Docs.totalAmount(items), 3100);

const rendered = Docs.renderItemsTable(items, { includeHsn: true });
assert.match(rendered, /Solar panel/);
assert.match(rendered, /8541/);
assert.match(rendered, /0%/);
assert.doesNotMatch(rendered, /<script>/);
assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);

assert.equal(Docs.formatNumber(123456.5), '1,23,456.50');
assert.equal(Docs.formatRupeeTotal(1234), '\u20b9 1,234.00');
assert.equal(Docs.numberToWords(3100), 'Three Thousand One Hundred Rupees Only');
assert.equal(
    Docs.generateDocumentNumber('R2VINV', new Date('2026-06-18T00:00:00'), () => 0),
    'R2VINV0626-1000'
);

console.log('financial-document tests passed');
