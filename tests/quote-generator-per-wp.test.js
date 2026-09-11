const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tool = path.resolve(__dirname, '../tools/quote-generator');
const Config = require(path.join(tool, 'quote-generator-config.js'));
const Model = require(path.join(tool, 'quote-generator-model.js'));
const Calc = require(path.join(tool, 'quote-generator-calc.js'));
const state = Model.createInitialState({ mode: 'comprehensive' });
state.project.dcCapacityKwp = 100;
state.commercial.gstRate = 5;
state.commercial.actualProjectCost = Calc.totalFromPricePerWp(state, 40);
assert.equal(state.commercial.actualProjectCost, 4200000);
assert.equal(Calc.commercialTotals(state).projectPricePerWp, 40);
assert.equal(Calc.commercialTotals(state).finalPricePerWp, 40);
assert.equal(Calc.commercialTotals(state).taxableValue, 4000000);

state.commercial.actualProjectCost = 4226250;
assert.equal(Calc.commercialTotals(state).projectPricePerWp, 40.25);
assert.equal(Calc.totalFromPricePerWp(state, 40.25), 4226250);
state.commercial.discounts = [{ id: 'discount', name: 'Discount', amount: 26250 }];
assert.equal(Calc.commercialTotals(state).projectPricePerWp, 40.25);
assert.equal(Calc.commercialTotals(state).finalPricePerWp, 40);
assert.equal(Calc.commercialTotals(state).finalPrice, 4200000);

state.commercial.gstRate = 12;
assert.equal(Calc.totalFromPricePerWp(state, 40), 4480000);
assert.ok(Math.abs(Calc.pricePerWp(state, 4480000) - 40) < 1e-10);
state.commercial.gstRate = 0;
assert.equal(Calc.totalFromPricePerWp(state, 40), 4000000);
assert.equal(Calc.pricePerWp(state, 4000000), 40);
state.commercial.gstRate = 5;
for (const capacity of [0, '', -1]) {
    state.project.dcCapacityKwp = capacity;
    assert.equal(Calc.totalFromPricePerWp(state, 40), null);
    assert.equal(Calc.commercialTotals(state).finalPricePerWp, null);
}
state.project.dcCapacityKwp = 99.75;
const fractionalTotal = Calc.totalFromPricePerWp(state, 40.1234);
assert.ok(Math.abs(Calc.pricePerWp(state, fractionalTotal) - 40.1234) < 0.000001);
state.project.dcCapacityKwp = 100;

assert.equal(state.commercial.showPricePerWp, false);
state.commercial.showPricePerWp = true;
const restored = Model.deserialize(Model.serialize(state));
assert.equal(restored.state.commercial.showPricePerWp, true);
assert.equal(Calc.commercialTotals(restored.state).finalPricePerWp, 40);
const legacy = JSON.parse(Model.serialize(state));
delete legacy.commercial.showPricePerWp;
assert.equal(Model.deserialize(JSON.stringify(legacy)).state.commercial.showPricePerWp, false);

const context = { console, QuoteGeneratorConfig: Config, QuoteGeneratorModel: Model, QuoteGeneratorCalc: Calc };
context.self = context;
for (const file of ['quote-generator-content.js', 'quote-generator-comprehensive-pages.js',
    'quote-generator-comprehensive-pages-a.js', 'quote-generator-comprehensive-pages-b.js',
    'quote-generator-comprehensive-pages-c.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(tool, file), 'utf8'), context, { filename: file });
}
Model.selectAllSections(state);
for (const sectionId of ['executive-summary', 'commercial-offer', 'acceptance']) {
    const render = () => context.QuoteGeneratorPages.renderers[sectionId]({ state,
        derived: Calc.derived(state), page: Calc.planPages(state).find(page => page.sectionId === sectionId) }).body;
    state.commercial.showPricePerWp = true;
    assert.match(render(), /₹40\.00\/Wp/);
    assert.match(render(), /excl\. GST/);
    state.commercial.showPricePerWp = false;
    assert.doesNotMatch(render(), /₹40\.00\/Wp/);
}
state.commercial.showPricePerWp = true;
state.project.dcCapacityKwp = 0;
assert.equal(context.QuoteGeneratorPages.helpers.offeredRate(state, Calc.derived(state)), '');
console.log('Per-Wp conversions, discounts, saved drafts and proposal display checks passed');
