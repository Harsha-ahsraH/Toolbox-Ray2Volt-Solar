const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tool = path.resolve(__dirname, '../tools/quote-generator');
const Model = require(path.join(tool, 'quote-generator-model.js'));
const Calc = require(path.join(tool, 'quote-generator-calc.js'));
const context = { console, QuoteGeneratorModel: Model, QuoteGeneratorCalc: Calc,
    QuoteGeneratorConfig: require(path.join(tool, 'quote-generator-config.js')) };
context.self = context;
for (const file of ['quote-generator-content.js', 'quote-generator-component-images.js',
    'quote-generator-comprehensive-pages.js', 'quote-generator-comprehensive-pages-a.js',
    'quote-generator-comprehensive-pages-b.js', 'quote-generator-comprehensive-pages-c.js',
    'quote-generator-equipment-pages.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(tool, file), 'utf8'), context, { filename: file });
}
const original = { ...context.QuoteGeneratorPages.renderers };
vm.runInNewContext(fs.readFileSync(path.join(tool, 'quote-generator-section-guidance.js'), 'utf8'), context);
const state = Model.createInitialState({ mode: 'comprehensive' });
Model.resetBom(state);
Model.selectAllSections(state);
state.projectNarrative.objective = 'Customer-authored objective. '.repeat(120);
state.contract.inclusions[0].text = 'Customer-specific scope, retained verbatim.';
const before = JSON.stringify(state);
const plan = Calc.planPages(state);
const base = { state, derived: Calc.derived(state), pagePlan: plan,
    toc: Calc.tableOfContents(plan), validation: Calc.validate(state) };
for (const page of plan.filter(page => !['contents', 'annexures'].includes(page.sectionId))) {
    const source = original[page.sectionId]({ ...base, page }).body;
    const revised = context.QuoteGeneratorPages.renderers[page.sectionId]({ ...base, page }).body;
    assert.ok(revised.startsWith(source), `${page.sectionId}: retain all equipment, figures and authored clauses`);
    if (page.part < page.partCount - 1) assert.equal(revised, source, 'editorial guidance appears only once per section');
}
assert.equal(JSON.stringify(state), before, 'document composition must not alter the quotation inputs');
state.savings.consumptionMethod = 'detailed';
state.savings.monthlyRows.forEach((row, index) => { row.importedKwh = index * 1000; });
const consumption = context.QuoteGeneratorPages.renderers['consumption-profile']({
    ...base, derived: Calc.derived(state), page: plan.find(page => page.sectionId === 'consumption-profile')
}).body;
const heights = [...consumption.matchAll(/cq-bar-fill" style="height:([\d.]+)mm/g)].map(match => Number(match[1]));
assert.equal(heights.length, 12);
assert.equal(heights[0], 0, 'a zero-consumption month has no positive bar');
assert.equal(heights[11], 28);
assert.ok(heights.every((height, index) => !index || height > heights[index - 1]),
    'monthly bars must preserve their relative values within the fixed print area');
const html = fs.readFileSync(path.join(tool, 'quote-generator.html'), 'utf8');
assert.ok(html.indexOf('quote-generator-section-guidance.js') > html.indexOf('quote-generator-equipment-pages.js'));
assert.ok(html.includes('quote-generator-section-spacing.js'));
console.log('Section guidance preserves authored content and appears once per section');
