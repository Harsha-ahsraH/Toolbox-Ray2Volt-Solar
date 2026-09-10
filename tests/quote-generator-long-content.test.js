const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const tool = path.join(root, 'tools/quote-generator');
const Model = require(path.join(tool, 'quote-generator-model.js'));
const Config = require(path.join(tool, 'quote-generator-config.js'));
const Calc = require(path.join(tool, 'quote-generator-calc.js'));
const Pagination = require(path.join(tool, 'quote-generator-pagination.js'));

const state = Model.createInitialState({ mode: 'comprehensive' });
Object.assign(state.project, { dcCapacityKwp: 250, acCapacityKw: 210 });
Model.resetBom(state);
const row = Model.getBomCategory(state, 'modules').rows[0];
row.specification = 'PV specification retained in full. '.repeat(250).trim();
row.remarks = 'Install only within the approved array area. '.repeat(90).trim();
const saved = JSON.stringify(state);
const lines = Pagination.bomLines(state);
const fragments = lines.filter(line => line.kind === 'row' && line.row.id === row.id);

assert.ok(fragments.length > 1, 'an oversized equipment item must continue across pages');
assert.equal(fragments.map(line => line.row.specification).filter(Boolean).join(' '), row.specification);
assert.equal(fragments.map(line => line.row.remarks).filter(Boolean).join(' '), row.remarks);
assert.ok(fragments.every(line => line.number === 1), 'continuations must retain the original item number');
assert.equal(fragments[0].row.quantity, row.quantity);
assert.ok(fragments.slice(1).every(line => line.row.quantity === ''), 'continuations must not duplicate quantities');
assert.ok(JSON.stringify(state) === saved, 'page planning must not change saved equipment or capacity inputs');

const chunks = Pagination.sectionChunks(state, 'bill-of-materials');
const heights = Pagination.bomLineHeights(state);
assert.equal(chunks[0].start, 0);
assert.equal(chunks[chunks.length - 1].end, lines.length);
chunks.forEach((chunk, index) => {
    if (index) assert.equal(chunk.start, chunks[index - 1].end);
    assert.notEqual(lines[chunk.end - 1].kind, 'category', 'a category heading must stay with its first equipment row');
    const budget = (index ? Config.PAGINATION.bom.continuationBudgetPx : Config.PAGINATION.bom.budgetPx)
        - Config.PAGINATION.bom.theadPx;
    assert.ok(heights.slice(chunk.start, chunk.end).reduce((sum, h) => sum + h, 0) <= budget);
});

const context = { console, QuoteGeneratorConfig: Config, QuoteGeneratorModel: Model, QuoteGeneratorCalc: Calc };
context.self = context;
for (const file of ['quote-generator-content.js', 'quote-generator-comprehensive-pages.js',
    'quote-generator-comprehensive-pages-a.js', 'quote-generator-comprehensive-pages-b.js',
    'quote-generator-comprehensive-pages-c.js', 'quote-generator-equipment-pages.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(tool, file), 'utf8'), context, { filename: file });
}
const plan = Calc.planPages(state);
const render = page => context.QuoteGeneratorPages.renderers[page.sectionId]({
    state, page, pagePlan: plan, toc: Calc.tableOfContents(plan), derived: Calc.derived(state)
}).body;
const technology = plan.filter(page => page.sectionId === 'pv-module-technology');
assert.ok(technology.length > 1, 'technology equipment must paginate as well as the BOM');
const units = Calc.equipmentUnits(state, 'pv-module-technology');
const technologyHtml = technology.map(render).join('');
assert.ok(technology.every(page => render(page).includes('>Rating</th>')),
    'technology continuation tables must retain the first page rating column');
assert.ok(context.QuoteGeneratorPages.blocks.specCell({
    specification: 'Keep the entire approved specification.', remarks: 'approved'
}).includes('Keep the entire approved specification.'),
    'a remark also found within the specification must not erase specification text');
for (const unit of units) {
    if (unit.row.specification) assert.ok(technologyHtml.includes(unit.row.specification));
    if (unit.row.remarks) assert.ok(technologyHtml.includes(unit.row.remarks));
}
const bomHtml = plan.filter(page => page.sectionId === 'bill-of-materials').map(render).join('');
assert.ok(bomHtml.includes('Remarks:'), 'customer-facing BOM must include entered scope notes');
for (const fragment of fragments) {
    if (fragment.row.remarks) assert.ok(bomHtml.includes(fragment.row.remarks));
}
assert.ok(JSON.stringify(state) === saved, 'rendering continuation pages must leave the draft intact');
const source = fs.readFileSync(path.join(tool, 'quote-generator.html'), 'utf8');
assert.ok(source.indexOf('src="quote-generator-equipment-pages.js') > source.indexOf('src="quote-generator-comprehensive-pages-c.js'));
console.log('Long quotation content and continuation tests passed');
