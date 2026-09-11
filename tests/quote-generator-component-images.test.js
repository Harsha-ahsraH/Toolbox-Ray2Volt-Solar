const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tool = path.resolve(__dirname, '../tools/quote-generator');
const Config = require(path.join(tool, 'quote-generator-config.js'));
const Model = require(path.join(tool, 'quote-generator-model.js'));
const Calc = require(path.join(tool, 'quote-generator-calc.js'));
const context = { console, QuoteGeneratorConfig: Config, QuoteGeneratorModel: Model, QuoteGeneratorCalc: Calc };
context.self = context;
for (const file of ['quote-generator-content.js', 'quote-generator-component-images.js',
    'quote-generator-comprehensive-pages.js', 'quote-generator-comprehensive-pages-a.js',
    'quote-generator-comprehensive-pages-c.js', 'quote-generator-equipment-pages.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(tool, file), 'utf8'), context, { filename: file });
}

const html = fs.readFileSync(path.join(tool, 'quote-generator.html'), 'utf8');
assert.ok(html.indexOf('quote-generator-component-images.js') < html.indexOf('quote-generator-comprehensive-pages-a.js'),
    'image metadata must load before the page renderers');
for (const photo of Object.values(context.QuoteGeneratorComponentImages)) {
    assert.ok(fs.existsSync(path.join(tool, 'assets/components', photo.file)), 'export must use bundled equipment visuals');
    assert.ok(photo.alt && photo.description, 'every component needs an accessible description and explanation');
}

const state = Model.createInitialState({ mode: 'comprehensive' });
Model.resetBom(state);
Model.selectAllSections(state);
const render = (sectionId, page) => context.QuoteGeneratorPages.renderers[sectionId]({
    state, derived: Calc.derived(state), page: page || Calc.planPages(state).find(item => item.sectionId === sectionId)
}).body;
const before = JSON.stringify(state);
const bos = render('balance-of-system');
for (const key of ['connectors', 'dcdb', 'acdb', 'metering']) {
    assert.ok(bos.includes(`assets/components/${key}.png`),
        `${key} must be illustrated even when its equipment table continues onto another source page`);
}
assert.equal(JSON.stringify(state), before, 'illustration must not change offered equipment');
assert.match(render('system-architecture'), /commercial-ongrid-architecture\.png/);
for (const id of ['cover', 'pv-module-technology', 'inverter-technology', 'mounting-structure',
    'balance-of-system', 'system-architecture']) {
    assert.doesNotMatch(render(id), /Wikimedia|creativecommons|Photo:|AI-generated|Representative photograph|cq-component-credit/i,
        'the proposal contains equipment explanations without image credits or generation labels');
}
state.project.systemConfiguration = 'Hybrid';
assert.match(render('system-architecture'), /commercial-hybrid-architecture\.png/);
assert.match(render('system-architecture'), /designated backup circuits/);
for (const id of ['battery-technology', 'system-architecture']) {
    assert.doesNotMatch(render(id, { sectionId: id }), /Wikimedia|creativecommons|Photo:|AI-generated|Representative photograph|cq-component-credit/i,
        'hybrid equipment explanations must also omit image credits and generation labels');
}
for (const id of ['dc-cables', 'protection', 'metering']) {
    Model.getBomCategory(state, id).rows = [];
}
assert.doesNotMatch(render('balance-of-system'), /assets\/components\//,
    'empty equipment families must not be presented as supplied components');
console.log('Component imagery and configuration checks passed');
