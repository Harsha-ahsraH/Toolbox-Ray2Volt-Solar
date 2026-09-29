// The values the redesigned Comprehensive pages read from derived.insights.
// Renderers never calculate a business number, so each one is checked here.
const assert = require('node:assert/strict');
const path = require('node:path');

const tool = path.resolve(__dirname, '../tools/quote-generator');
const Config = require(path.join(tool, 'quote-generator-config.js'));
const Model = require(path.join(tool, 'quote-generator-model.js'));
const Calc = require(path.join(tool, 'quote-generator-calc.js'));
const Insights = require(path.join(tool, 'quote-generator-insights.js'));

function comprehensive(preset) {
    const state = Model.createInitialState({ mode: 'comprehensive', preset });
    Object.assign(state.project, { dcCapacityKwp: 250, acCapacityKw: 210 });
    state.commercial.actualProjectCost = 11500000;
    state.savings.monthlyConsumptionKwh = 40000;
    Model.resetBom(state);
    return state;
}

// --- Excerpts -----------------------------------------------------------------
{
    assert.equal(Insights.excerpt('Short text.', 100), 'Short text.');
    const sentences = 'First sentence is here. Second sentence runs on a little longer. Third.';
    assert.equal(Insights.excerpt(sentences, 30), 'First sentence is here.',
        'a full stop late enough in the cut ends the excerpt');
    const words = 'word '.repeat(40).trim();
    const cut = Insights.excerpt(words, 50);
    assert.ok(cut.endsWith('…') && cut.length <= 51 && !/\s…$/.test(cut), 'otherwise it ends at a word');

    const state = comprehensive();
    const long = 'The customer wants to cut daytime grid use. '.repeat(40).trim();
    Model.setNarrativeField(state, 'objective', long);
    const narrative = Insights.narrative(state);
    assert.equal(narrative.excerpted, true);
    assert.equal(narrative.fields.objective.text, long, 'the full text is kept for Annexure C');
    assert.ok(narrative.fields.objective.excerpt.length <= Config.NARRATIVE_EXCERPTS.objective);
}

// --- Internal rate of return ----------------------------------------------------
{
    // 100 now, 110 in a year: exactly 10%.
    assert.equal(Insights.irr(100, [110]), 10);
    // A level annuity of 25 a year for 5 years on 100 returns about 7.9%.
    assert.equal(Insights.irr(100, [25, 25, 25, 25, 25]), 7.9);
    assert.equal(Insights.irr(100, [10, 10]), null, 'no return when the savings never repay the price');
    assert.equal(Insights.irr(0, [10]), null);
}

// --- Returns, energy and projection totals from one derivation -----------------
{
    const state = comprehensive();
    const derived = Calc.derived(state);
    const insights = derived.insights;
    const rows = derived.projection.rows;

    assert.equal(insights.returns.investment, derived.commercial.finalPrice);
    assert.equal(insights.returns.recovery.length, rows.length);
    assert.equal(insights.returns.recovery[rows.length - 1].position,
        Math.round(rows[rows.length - 1].cumulativeNet - derived.commercial.finalPrice));

    const monthly = insights.monthlyGeneration.reduce((sum, value) => sum + value, 0);
    assert.ok(Math.abs(monthly - rows[0].generationKwh) <= 12, 'the months add up to year 1');
    assert.equal(insights.monthlyGeneration.length, 12);

    const energy = insights.energy;
    assert.equal(energy.selfPercent + energy.exportPercent, 100);
    assert.ok(energy.site && energy.site.consumptionKwh === 480000);
    assert.equal(energy.site.fromSolarKwh + energy.site.fromGridKwh, energy.site.consumptionKwh);

    const totals = insights.projectionTotals;
    const sum = key => Math.round(rows.reduce((total, row) => total + row[key], 0));
    assert.deepEqual(totals, { selfSavings: sum('selfSavings'), exportCredit: sum('exportCredit'),
        grossSavings: sum('grossSavings') });

    assert.deepEqual(insights.milestoneRows.map(row => row.year).slice(0, 3), [1, 5, 10]);
    assert.equal(insights.milestoneRows[insights.milestoneRows.length - 1].year, rows.length);
    assert.equal(insights.co2ByYear.length, rows.length);

    // Without the site's consumption there is no source split to draw.
    state.savings.monthlyConsumptionKwh = 0;
    assert.equal(Calc.derived(state).insights.energy.site, null);
}

// --- Schedule -----------------------------------------------------------------
{
    const small = Insights.schedule(50);
    const large = Insights.schedule(5000);
    assert.ok(large.weeks >= small.weeks, 'a larger plant never gets a shorter schedule');
    for (const plan of [small, large]) {
        plan.phases.forEach(phase => {
            assert.ok(phase.start >= 0 && phase.end > phase.start && phase.end <= plan.weeks,
                `${phase.title} sits inside the ${plan.weeks}-week schedule`);
        });
    }
}

// --- Warranties and the BOM summary ---------------------------------------------
{
    assert.deepEqual(Insights.warrantyTerms('12 years product / 30 years performance'),
        [{ years: 12, label: 'product' }, { years: 30, label: 'performance' }]);
    assert.deepEqual(Insights.warrantyTerms('As per manufacturer'), []);
    assert.deepEqual(Insights.warrantyTerms('—'), []);

    const state = comprehensive();
    const modules = Model.getBomCategory(state, 'modules');
    modules.rows = [
        { id: 'a', name: 'Module', specification: 'Mono PERC', make: 'Adani / Waaree', quantity: 400, unit: 'Nos',
            warranty: '12 years product / 30 years performance' },
        { id: 'b', name: 'Module', specification: 'Bifacial', make: 'Waaree, Vikram', quantity: 27, unit: 'Nos', warranty: '—' }
    ];
    const summary = Insights.bomSummary(state).find(entry => entry.id === 'modules');
    assert.deepEqual(summary.makes, ['Adani', 'Waaree', 'Vikram'], 'makes are split and listed once each');
    assert.deepEqual(summary.quantity, { amount: 427, unit: 'Nos' }, 'counted rows add up');
    assert.equal(summary.itemCount, 2);
    assert.equal(summary.lead, 'Mono PERC');
    assert.equal(summary.warranty, '12 years product / 30 years performance');

    modules.rows[1].unit = 'Lot';
    assert.equal(Insights.bomSummary(state).find(entry => entry.id === 'modules').quantity, null,
        'a Lot does not add to a count of Nos');

    const lines = Insights.warranties(state).filter(line => line.categoryId === 'modules');
    assert.deepEqual(lines.map(line => [line.term, line.years]), [['product', 12], ['performance', 30]]);

    Model.getBomCategory(state, 'civil').rows = [];
    assert.ok(!Insights.bomSummary(state).some(entry => entry.id === 'civil'), 'an empty category is left out');
}

// --- Annexures and the page plan -------------------------------------------------
{
    const state = comprehensive();
    Model.selectAllSections(state);
    const list = Calc.annexureList(state);
    assert.deepEqual(list.map(entry => [entry.letter, entry.ref]),
        [['A', 'bill-of-materials'], ['B', 'savings-projection']]);

    Model.setNarrativeField(state, 'siteConditions', 'Long site notes. '.repeat(60));
    Model.addAnnexure(state, { title: 'Roof layout', fileName: 'layout.pdf', pageCount: 2 });
    const lettered = Calc.annexureList(state);
    assert.deepEqual(lettered.map(entry => entry.letter), ['A', 'B', 'C', 'D']);
    assert.equal(lettered[2].ref, 'project-background');

    const plan = Calc.planPages(state);
    assert.deepEqual(plan.map(page => page.pageNumber), plan.map((page, index) => index + 1));
    assert.equal(plan.filter(page => page.sectionId === 'annexures').length, 2, 'an attached PDF plans its pages');
    assert.equal(plan.filter(page => page.sectionId === 'executive-summary').length, 2);
    ['site-today', 'system-overview', 'generation', 'returns', 'key-equipment', 'scope', 'why-ray2volt',
        'commercial-offer', 'acceptance'].forEach(pageId => {
        assert.ok(plan.some(page => page.sectionId === pageId), `${pageId} is planned when every chapter is selected`);
    });
}

// --- Legacy drafts --------------------------------------------------------------
// A draft saved against the old section list opens with the chapters that
// replaced those sections.
{
    const state = comprehensive();
    const saved = JSON.parse(Model.serialize(state));
    saved.selectedSectionIds = ['cover', 'project-objectives', 'pv-module-technology', 'payment-milestones'];
    const restored = Model.deserialize(JSON.stringify(saved));
    assert.ok(restored.ok, 'the legacy draft loads');
    assert.deepEqual(restored.state.selectedSectionIds.filter(id => Config.getSection(id)),
        restored.state.selectedSectionIds, 'only current section ids survive');
    ['site', 'equipment', 'commercial'].forEach(id =>
        assert.ok(restored.state.selectedSectionIds.includes(id), `${id} replaces its old sections`));
}

console.log('Comprehensive insights checks passed');
