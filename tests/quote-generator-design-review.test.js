const assert = require('node:assert/strict');
const model = require('../tools/quote-generator/quote-generator-model.js');
const calc = require('../tools/quote-generator/quote-generator-calc.js');

const state = model.createInitialState({ mode: 'comprehensive' });
model.resetBom(state);
const term = state.contract.terms.find(row => /installation workmanship/i.test(row.text));
assert.match(term.text, /Bill of Materials/,
    'the standard workmanship term must refer to the configured warranty, not introduce another period');

term.text = 'Ray2Volt warrants installation workmanship against defective execution for one year from commissioning.';
const authored = JSON.stringify(state);
assert.ok(calc.validate(state).warnings.some(row => row.panel === 'contract' && /workmanship warranty/i.test(row.message)),
    'a historical or authored term conflicting with the configured installation warranty must be reported');
assert.equal(JSON.stringify(state), authored, 'reviewing a conflict must not rewrite authored terms or BOM data');

term.text = 'Ray2Volt warrants installation workmanship for five years from commissioning.';
assert.ok(!calc.validate(state).warnings.some(row => /workmanship warranty/i.test(row.message)),
    'matching periods written as words and digits must agree');
term.text = 'Ray2Volt warrants installation workmanship for one year from commissioning.';
term.include = false;
assert.ok(!calc.validate(state).warnings.some(row => /workmanship warranty/i.test(row.message)),
    'excluded clauses must not produce a conflict in the issued quotation');

console.log('Quote generator design review regressions passed');
