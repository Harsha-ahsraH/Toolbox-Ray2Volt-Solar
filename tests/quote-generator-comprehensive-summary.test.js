const assert = require('node:assert/strict');
const path = require('node:path');

const toolRoot = path.resolve(__dirname, '..', 'tools', 'quote-generator');
const config = require(path.join(toolRoot, 'quote-generator-config.js'));
const content = require(path.join(toolRoot, 'quote-generator-content.js'));
const model = require(path.join(toolRoot, 'quote-generator-model.js'));
const calc = require(path.join(toolRoot, 'quote-generator-calc.js'));

const FACTOR = content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh;

/**
 * A 100 kWp plant on round numbers: 1,500 kWh/kWp, no degradation or
 * escalation, 80% self-used at ₹8 and 20% exported at ₹3, so year 1 is
 * 150,000 kWh, ₹9,60,000 self savings and ₹90,000 export credit.
 */
function plant(monthlyKwh) {
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    Object.assign(state.project, { dcCapacityKwp: 100, acCapacityKw: 85 });
    Object.assign(state.savings, {
        monthlyConsumptionKwh: monthlyKwh,
        tariffRate: 8,
        annualGenerationPerKwp: 1500,
        tariffEscalationPercent: 0,
        degradationPercent: 0,
        projectionYears: 25,
        selfConsumptionPercent: 80,
        exportPercent: 20,
        exportCreditRate: 3,
        futureCosts: [{ id: 'om', name: 'O&M', amount: 50000, startYear: 1, endYear: 25, escalationPercent: 0 }]
    });
    state.commercial.actualProjectCost = 5000000;
    state.commercial.gstRate = 0;
    return state;
}

// Before / after: every figure follows from consumption and the projection.
{
    const state = plant(20000); // 240,000 kWh a year, ₹19,20,000 bill
    const derived = calc.derived(state);
    const summary = derived.beforeAfter;

    assert.deepEqual(summary.annualBill, { today: 1920000, withSolar: 870000 },
        'the bill after solar is today\'s bill less year-1 gross savings');
    assert.equal(summary.billReductionPercent, 55, 'gross 10,50,000 of a 19,20,000 bill is 55%');

    assert.equal(summary.costPerUnit.today, 8, 'today\'s cost per unit is the average tariff');
    // (₹50,00,000 price + 25 × ₹50,000 O&M) ÷ 3,750,000 kWh = ₹1.67
    assert.equal(summary.costPerUnit.withSolar, 1.67);

    // 240,000 − 120,000 self-used = 120,000 still drawn = 50%.
    assert.deepEqual(summary.gridShare, { today: 100, withSolar: 50 });
    assert.deepEqual(summary.co2Tonnes, {
        today: Math.round(240000 * FACTOR / 100) / 10,
        withSolar: Math.round(120000 * FACTOR / 100) / 10
    });
}

// No consumption entered: only the cost-per-unit row survives; nothing invented.
{
    const summary = calc.derived(plant(0)).beforeAfter;
    assert.equal(summary.annualBill, null);
    assert.equal(summary.billReductionPercent, null);
    assert.equal(summary.gridShare, null);
    assert.equal(summary.co2Tonnes, null);
    assert.ok(summary.costPerUnit && summary.costPerUnit.withSolar > 0);
}

// Solar that covers more than the whole load never shows a negative bill or grid share.
{
    const summary = calc.derived(plant(2000)).beforeAfter; // 24,000 kWh a year
    assert.equal(summary.annualBill.withSolar, 0);
    assert.equal(summary.billReductionPercent, 100);
    assert.equal(summary.gridShare.withSolar, 0);
    assert.equal(summary.co2Tonnes.withSolar, 0);
}

// Transformation bars: year-1 energy and bill split, and the lifetime spend with and without solar.
{
    const state = plant(20000);
    const derived = calc.derived(state);
    const shift = derived.transformation;
    const years = derived.projection.years;

    assert.deepEqual(shift.energy, { totalKwh: 240000, solarKwh: 120000, gridKwh: 120000 },
        '80% of 150,000 kWh is used on site; the rest of the load still comes from the grid');
    assert.deepEqual(shift.bill, { today: 1920000, withSolar: 870000, saved: 1050000 });
    assert.equal(shift.bill.withSolar, derived.beforeAfter.annualBill.withSolar, 'bars and table agree');

    const life = shift.lifetime;
    assert.equal(life.basis, 'bill');
    assert.equal(life.years, years);
    assert.equal(life.gridOnly, 1920000 * years);
    assert.equal(life.plant, 5000000);
    assert.equal(life.gridBills, 870000 * years);
    assert.equal(life.costs, 50000 * years);
    assert.equal(life.withSolar, life.plant + life.gridBills + life.costs);
    assert.equal(life.kept, derived.projection.totalNetSavings - derived.commercial.finalPrice,
        'what is kept is what the plant returns after paying for itself');
}

// Tariff escalation lifts the grid-only spend exactly as it lifts the projection's tariff.
{
    const state = plant(20000);
    state.savings.tariffEscalationPercent = 5;
    state.savings.projectionYears = 2;
    const life = calc.derived(state).transformation.lifetime;
    assert.equal(life.gridOnly, 1920000 + Math.round(1920000 * 1.05));
}

// Without consumption the lifetime view prices the plant's own energy at the grid rate.
{
    const derived = calc.derived(plant(0));
    const shift = derived.transformation;
    assert.equal(shift.energy, null);
    assert.equal(shift.bill, null);
    assert.equal(shift.lifetime.basis, 'energy');
    assert.equal(shift.lifetime.gridBills, 0);
    assert.equal(shift.lifetime.gridOnly,
        derived.projection.rows.reduce((sum, row) => sum + row.grossSavings, 0));
    assert.equal(shift.lifetime.kept, derived.projection.totalNetSavings - derived.commercial.finalPrice);
}

// Solar beyond the whole load: no negative bill, grid share or remaining bills.
{
    const shift = calc.derived(plant(2000)).transformation; // 24,000 kWh a year
    assert.deepEqual(shift.energy, { totalKwh: 24000, solarKwh: 24000, gridKwh: 0 });
    assert.equal(shift.bill.withSolar, 0);
    assert.equal(shift.bill.saved, shift.bill.today);
    assert.equal(shift.lifetime.gridBills, 0);
}

// Contents: chapters numbered in page order, each at its first page.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    model.resetBom(state);
    const plan = calc.planPages(state);
    const chapters = calc.chapterContents(plan);

    assert.equal(chapters[0].id, 'summary');
    assert.equal(chapters[0].number, '01');
    assert.equal(chapters[0].pageNumber, plan.find(page => page.sectionId === 'executive-summary').pageNumber);
    chapters.slice(1).forEach((chapter, index) => {
        assert.ok(chapter.pageNumber > chapters[index].pageNumber, `${chapter.title} follows the chapter before it`);
    });
    assert.ok(chapters.every(chapter => chapter.summary), 'every chapter carries a one-line description');
    // The full bill of materials is always Annexure A, so the annexures
    // entry is always listed and opens at that page.
    const annexures = chapters.find(chapter => chapter.id === 'annexures');
    assert.ok(annexures, 'the annexures are listed');
    assert.equal(annexures.pageNumber, plan.find(page => page.sectionId === 'bill-of-materials').pageNumber);

    // The composed plan carries sectionIds rather than a single sectionId.
    const composed = plan.map(page => Object.assign({}, page, { sectionIds: [page.sectionId] }));
    assert.deepEqual(calc.chapterContents(composed), chapters);
}

// The executive summary is two fixed pages; contents and document control share one.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    const plan = calc.planPages(state);
    assert.deepEqual(plan.slice(0, 4).map(page => [page.sectionId, page.part]),
        [['cover', 0], ['contents', 0], ['executive-summary', 0], ['executive-summary', 1]]);
    assert.equal(config.getSection('document-control'), null);
}

console.log('Comprehensive summary derived values and contents chapters');
