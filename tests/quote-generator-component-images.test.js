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
    'quote-generator-comprehensive-pages.js', 'quote-generator-comprehensive-charts.js',
    'quote-generator-comprehensive-front.js', 'quote-generator-comprehensive-project.js',
    'quote-generator-comprehensive-equipment.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(tool, file), 'utf8'), context, { filename: file });
}

const html = fs.readFileSync(path.join(tool, 'quote-generator.html'), 'utf8');
assert.ok(html.indexOf('quote-generator-component-images.js') < html.indexOf('quote-generator-comprehensive-front.js'),
    'image metadata must load before the page renderers');
for (const photo of Object.values(context.QuoteGeneratorComponentImages)) {
    assert.ok(fs.existsSync(path.join(tool, 'assets/components', photo.file)), 'export must use bundled equipment visuals');
    assert.ok(photo.alt && photo.description, 'every component needs an accessible description and explanation');
}

const state = Model.createInitialState({ mode: 'comprehensive' });
Model.resetBom(state);
Model.selectAllSections(state);
const render = sectionId => {
    const plan = Calc.planPages(state);
    return context.QuoteGeneratorPages.renderers[sectionId]({
        state, derived: Calc.derived(state), pagePlan: plan,
        page: plan.find(item => item.sectionId === sectionId) || { sectionId }
    }).body;
};
const before = JSON.stringify(state);
const components = render('system-components');
for (const key of ['mounting', 'connectors', 'dcdb', 'metering']) {
    assert.ok(components.includes(`assets/components/${key}.png`), `${key} must be illustrated on the components page`);
}
assert.doesNotMatch(render('bom-summary'), /assets\/components\//, 'the summary table numbers its rows instead of picturing them');
assert.equal(JSON.stringify(state), before, 'illustration must not change offered equipment');

// The system overview shows the energy-flow render for its configuration.
assert.match(render('system-overview'), /assets\/commercial-ongrid-architecture\.png/);
assert.doesNotMatch(render('system-overview'), /hybrid-architecture/, 'an on-grid plant shows no battery');
assert.ok(fs.existsSync(path.join(tool, 'assets/commercial-ongrid-architecture.png'))
    && fs.existsSync(path.join(tool, 'assets/commercial-hybrid-architecture.png')), 'both renders are bundled');
for (const id of ['cover', 'system-overview', 'key-equipment', 'system-components', 'bom-summary']) {
    assert.doesNotMatch(render(id), /Wikimedia|creativecommons|Photo:|AI-generated|Representative photograph|cq-component-credit/i,
        'the proposal contains equipment explanations without image credits or generation labels');
}

state.project.systemConfiguration = 'Hybrid';
Model.resetBom(state);
assert.match(render('system-overview'), /assets\/commercial-hybrid-architecture\.png/);
assert.match(render('system-overview'), /designated backup circuit/);
assert.match(render('key-equipment'), /assets\/components\/battery\.png/, 'the hybrid battery is illustrated');
for (const id of ['key-equipment', 'system-overview']) {
    assert.doesNotMatch(render(id), /Wikimedia|creativecommons|Photo:|AI-generated|Representative photograph|cq-component-credit/i,
        'hybrid equipment explanations must also omit image credits and generation labels');
}

// A family the offer does not list keeps its card, says so, and shows no photograph.
for (const id of ['dc-cables', 'ac-cables', 'protection', 'metering']) {
    Model.getBomCategory(state, id).rows = [];
}
const empty = render('system-components');
for (const key of ['connectors', 'dcdb', 'metering']) {
    assert.ok(!empty.includes(`assets/components/${key}.png`), `an unlisted ${key} family must not be photographed`);
}
assert.match(empty, /Not listed in the bill of materials/);
console.log('Component imagery and configuration checks passed');
