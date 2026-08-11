/**
 * Regression tests for defects found by review in the Comprehensive Quote
 * Generator. Each block names the behaviour that broke, so a future change that
 * reintroduces it fails here rather than in a customer's proposal.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'quote-generator');

const config = require(path.join(toolRoot, 'quote-generator-config.js'));
const model = require(path.join(toolRoot, 'quote-generator-model.js'));
const calc = require(path.join(toolRoot, 'quote-generator-calc.js'));
const pagination = require(path.join(toolRoot, 'quote-generator-pagination.js'));

function validState() {
    const state = model.createInitialState({
        mode: 'comprehensive',
        preset: 'ci-on-grid-rooftop',
        quoteDate: '2026-08-11',
        quoteNumber: 'R2VQ0826-0009'
    });

    Object.assign(state.customer, {
        companyName: 'Example Industries Pvt Ltd',
        contactPerson: 'Anita Rao',
        phone: '9000000000',
        billingAddress: 'Visakhapatnam',
        sameAsBilling: true
    });
    Object.assign(state.project, { dcCapacityKwp: 250, acCapacityKw: 210 });
    state.commercial.actualProjectCost = 11500000;
    model.resetBom(state);

    return state;
}

function fieldsOf(validation) {
    return validation.criticalIssues.map(item => item.field);
}

// --- Detailed C&I bills drive the savings ------------------------------------
// The Simple-mode tariff field is hidden on Detailed entry. Letting it drive the
// projection made every savings, payback, ROI and IRR figure disagree with the
// consumption page printed a few pages earlier.
{
    const state = validState();
    state.savings.consumptionMethod = 'detailed';
    state.savings.tariffRate = 7;
    state.savings.monthlyRows.forEach(row => {
        row.importedKwh = 10000;
        row.billAmount = 120000;
    });

    const derived = calc.derived(state);
    assert.equal(derived.consumption.averageTariff, 12,
        'twelve months of bills at 120000 for 10000 kWh average 12/kWh');
    assert.equal(derived.projection.rows[0].tariff, 12,
        'the projection must use the tariff derived from the bills, not the hidden Simple field');

    // Simple entry still uses the entered tariff.
    const simple = validState();
    simple.savings.consumptionMethod = 'simple';
    simple.savings.tariffRate = 8.5;
    assert.equal(calc.derived(simple).projection.rows[0].tariff, 8.5);
}

// --- The year-by-year projection ---------------------------------------------
{
    const state = validState();
    Object.assign(state.savings, {
        consumptionMethod: 'simple',
        tariffRate: 10,
        annualGenerationPerKwp: 1000,
        tariffEscalationPercent: 10,
        degradationPercent: 10,
        selfConsumptionPercent: 100,
        exportPercent: 0,
        projectionYears: 3,
        futureCosts: []
    });

    const rows = calc.derived(state).projection.rows;
    assert.equal(rows.length, 3);

    // 250 kWp x 1000 kWh/kWp, degrading 10% a year.
    assert.equal(rows[0].generationKwh, 250000);
    assert.equal(rows[1].generationKwh, 225000);
    assert.equal(rows[2].generationKwh, 202500);

    // Tariff escalates 10% a year from year one.
    assert.deepEqual(rows.map(row => row.tariff), [10, 11, 12.1]);

    // Fully self-consumed, so savings are generation x tariff.
    assert.equal(rows[0].netSavings, 2500000);
    assert.equal(rows[1].netSavings, 2475000);
    assert.equal(rows[2].cumulativeNet, rows[0].netSavings + rows[1].netSavings + rows[2].netSavings);

    // A future cost is subtracted only in the years it applies.
    const withCost = validState();
    Object.assign(withCost.savings, state.savings, {
        futureCosts: [{ id: 'c1', name: 'O&M', amount: 100000, escalationPercent: 0, startYear: 2, endYear: 2 }]
    });
    const costRows = calc.derived(withCost).projection.rows;
    assert.equal(costRows[0].costs, 0, 'a cost starting in year 2 must not appear in year 1');
    assert.equal(costRows[1].costs, 100000);
    assert.equal(costRows[2].costs, 0, 'a cost ending in year 2 must not appear in year 3');
}

// --- Payback ------------------------------------------------------------------
{
    const state = validState();
    Object.assign(state.savings, {
        tariffRate: 10,
        annualGenerationPerKwp: 1000,
        tariffEscalationPercent: 0,
        degradationPercent: 0,
        selfConsumptionPercent: 100,
        exportPercent: 0,
        projectionYears: 10,
        futureCosts: []
    });
    // 2,500,000 net saving a year against a 5,000,000 offer: two years exactly.
    state.commercial.actualProjectCost = 5000000;
    state.commercial.discounts = [];

    assert.equal(calc.derived(state).payback, 2);
}

// --- Every section that can grow must paginate --------------------------------
// Each of these used to render into one fixed A4 page, dropping everything past
// the bottom of it from preview, print and PDF alike.
{
    const state = validState();

    state.commercial.milestones = [];
    for (let index = 0; index < 40; index++) {
        model.addMilestone(state, {
            name: `Milestone ${index + 1} with a reasonably long payment trigger description`,
            percent: 2.5,
            note: `Due on completion of stage ${index + 1}`
        });
    }
    for (let index = 0; index < 30; index++) {
        model.addBreakdownRow(state, {
            description: `Price breakdown line item ${index + 1} covering a scope element`,
            amount: 100000
        });
    }
    for (let index = 0; index < 30; index++) {
        model.addAnnexure(state, {
            title: `Annexure document number ${index + 1}`,
            fileName: `doc${index}.pdf`
        });
    }
    model.setNarrativeField(state, 'objective', 'VERY LONG TEXT. '.repeat(1600));

    const plan = calc.planPages(state);
    const pagesFor = sectionId => plan.filter(page => page.sectionId === sectionId).length;

    assert.ok(pagesFor('payment-milestones') > 1, '40 milestones must span more than one page');
    assert.ok(pagesFor('commercial-offer') > 1, '30 price breakdown rows must span more than one page');
    assert.ok(pagesFor('annexure-index') > 1, '30 annexures must span more than one index page');
    assert.ok(pagesFor('project-objectives') > 1, 'a very long narrative must span more than one page');

    // Every row still reaches a page: the chunks tile the list exactly once.
    [
        ['payment-milestones', state.commercial.milestones.length],
        ['commercial-offer', state.commercial.priceBreakdown.length],
        ['annexure-index', model.includedAnnexures(state).length]
    ].forEach(([sectionId, expected]) => {
        const chunks = pagination.sectionChunks(state, sectionId);
        assert.equal(chunks[0].start, 0, `${sectionId} must start at the first row`);
        assert.equal(chunks[chunks.length - 1].end, expected,
            `${sectionId} must run to the last row`);
        chunks.forEach((chunk, index) => {
            if (index > 0) {
                assert.equal(chunk.start, chunks[index - 1].end,
                    `${sectionId} chunks must be contiguous, never skipping or repeating a row`);
            }
        });
    });

    // Narrative text is preserved in full across the split.
    const units = pagination.narrativeUnits(state, 'project-objectives');
    const rejoined = units
        .filter(unit => unit.heading.indexOf('Customer Objective') === 0)
        .map(unit => unit.text)
        .join(' ');
    assert.equal(rejoined.replace(/\s+/g, ' ').trim(),
        state.projectNarrative.objective.replace(/\s+/g, ' ').trim(),
        'splitting a long narrative field must not drop or duplicate any of it');
}

// --- Chunk arithmetic ---------------------------------------------------------
{
    // An item taller than a whole page still gets a chunk rather than looping.
    const chunks = pagination.chunkByHeight([2000, 10, 10], 500, 500);
    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0].start, 0);
    assert.equal(chunks[chunks.length - 1].end, 3);

    // An empty list still produces exactly one page.
    assert.deepEqual(pagination.chunkByHeight([], 500, 500), [{ start: 0, end: 0 }]);
}

// --- Missing versus invalid ---------------------------------------------------
{
    const fresh = model.createInitialState({ mode: 'comprehensive' });
    const validation = calc.validate(fresh);

    assert.equal(validation.panels.customer, 'incomplete',
        'a required field that has not been filled in yet leaves the panel Incomplete');
    assert.equal(validation.canExport, false, 'but it still blocks export');

    const invalid = validState();
    invalid.commercial.milestones[0].percent = 99;
    assert.equal(calc.validate(invalid).panels.commercial, 'error',
        'an entered value that conflicts leaves the panel in Error');
}

// --- Mixed installation with nothing allocated --------------------------------
{
    const state = validState();
    state.project.installationLocation = 'mixed';
    state.project.mixedLocations = [];

    const validation = calc.validate(state);
    assert.ok(fieldsOf(validation).includes('mixedLocations'),
        'a mixed installation with no areas must block export, not merely warn');
    assert.equal(validation.canExport, false);

    model.addMixedLocation(state, { locationType: 'rcc-rooftop', capacityKwp: 250 });
    assert.equal(calc.validate(state).canExport, true);
}

// --- Escalation bounds --------------------------------------------------------
{
    const state = validState();
    state.savings.tariffEscalationPercent = -150;
    assert.ok(fieldsOf(calc.validate(state)).includes('tariffEscalationPercent'),
        'escalation below -100% would make future tariffs negative');

    const costs = validState();
    costs.savings.futureCosts = [
        { id: 'c1', name: 'O&M', amount: 1000, escalationPercent: -150, startYear: 1, endYear: 5 }
    ];
    assert.ok(fieldsOf(calc.validate(costs)).includes('futureCosts'));
}

// --- Battery power reconciliation ---------------------------------------------
{
    const state = model.createInitialState({ mode: 'comprehensive', preset: 'ci-hybrid' });
    Object.assign(state.customer, {
        companyName: 'X', contactPerson: 'Y', phone: '1',
        billingAddress: 'Z', sameAsBilling: true
    });
    Object.assign(state.project, {
        quoteDate: '2026-08-11', quoteNumber: 'Q1',
        dcCapacityKwp: 100, acCapacityKw: 100, batteryEnergyKwh: 50, batteryPowerKw: 50
    });
    state.commercial.actualProjectCost = 1000000;

    model.getBomCategory(state, 'modules').rows = [
        { id: 'm', name: 'Module', quantity: 200, rating: 500, ratingUnit: 'Wp' }
    ];
    model.getBomCategory(state, 'inverters').rows = [
        { id: 'i', name: 'Inverter', quantity: 2, rating: 50, ratingUnit: 'kW' }
    ];
    model.getBomCategory(state, 'battery').rows = [
        { id: 'be', name: 'Battery energy', quantity: 10, rating: 5, ratingUnit: 'kWh' },
        { id: 'bp', name: 'Battery power', quantity: 5, rating: 10, ratingUnit: 'kW' }
    ];

    assert.equal(calc.validate(state).canExport, true, 'a matching hybrid BOM exports');

    state.project.batteryPowerKw = 40;
    assert.ok(calc.validate(state).criticalIssues.some(item =>
        item.panel === 'bom' && /battery power/i.test(item.message)),
        'a battery power mismatch is critical when the BOM carries kW-rated rows');

    // With no kW-rated rows there is nothing to reconcile against, so the
    // default hybrid bill of materials must not open in an error state.
    state.project.batteryPowerKw = 50;
    model.getBomCategory(state, 'battery').rows =
        model.getBomCategory(state, 'battery').rows.filter(row => row.ratingUnit === 'kWh');
    assert.equal(calc.validate(state).canExport, true,
        'battery power is not reconciled when the BOM does not rate it in kW');
}

// --- The percentage tolerance is inclusive ------------------------------------
{
    assert.equal(calc.withinPercentTolerance(100), true);
    assert.equal(calc.withinPercentTolerance(99.99), true,
        '99.99 is exactly on the specified 0.01 tolerance and must pass');
    assert.equal(calc.withinPercentTolerance(100.01), true);
    assert.equal(calc.withinPercentTolerance(99.98), false);
}

// --- The mode bridge ----------------------------------------------------------
// These are source assertions: the bridge is DOM code with no Node harness, and
// the defects it carried were all in the guards below.
{
    const form = fs.readFileSync(path.join(toolRoot, 'quote-generator-form.js'), 'utf8');

    assert.match(form, /let lastSync = null;/,
        'the bridge must remember what each side held, to tell an edit from its own write');
    assert.match(form, /if \(String\(previous\) !== String\(control\.value\)\) \{\s*\n\s*control\.dispatchEvent/,
        'a change event must fire only on a real change, or Short rebuilds its BOM from defaults');
    assert.match(form, /short: 'qgTariffEscalation'/,
        'the escalation choice must cross the mode bridge');
    assert.match(form, /short: 'qgDiscountAmount'/,
        'the discount total must cross the bridge as one collapsing entry, not compound');
    assert.match(form, /autosaveDisabled/,
        'a newer-schema draft must switch autosave off rather than be overwritten');
    assert.match(form, /aria-invalid/,
        'field errors must be associated with their control, not only listed in the summary');
}

console.log('quote-generator comprehensive regression tests passed');
