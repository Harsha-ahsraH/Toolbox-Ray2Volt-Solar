const assert = require('node:assert/strict');
const path = require('node:path');

const toolRoot = path.resolve(__dirname, '..', 'tools', 'quote-generator');
const config = require(path.join(toolRoot, 'quote-generator-config.js'));
const model = require(path.join(toolRoot, 'quote-generator-model.js'));
const calc = require(path.join(toolRoot, 'quote-generator-calc.js'));

function issuesFor(validation, field) {
    return validation.issues.filter(item => item.field === field);
}

function replaceRows(state, categoryId, rows) {
    model.getBomCategory(state, categoryId).rows = rows.map((row, index) => Object.assign({
        id: `${categoryId}-${index + 1}`,
        name: `${categoryId} row ${index + 1}`,
        specification: '',
        make: '',
        quantity: 1,
        unit: 'Nos',
        warranty: '',
        remarks: '',
        rating: 0,
        ratingUnit: ''
    }, row));
}

function validComprehensiveState(preset = 'ci-on-grid-rooftop') {
    const state = model.createInitialState({
        mode: config.MODES.COMPREHENSIVE,
        preset,
        quoteDate: '2026-08-11',
        quoteNumber: 'R2VQ0826-0001'
    });

    Object.assign(state.customer, {
        companyName: 'Example Industries Pvt Ltd',
        contactPerson: 'Anita Rao',
        phone: '9000000000',
        billingAddress: 'Visakhapatnam',
        sameAsBilling: true
    });
    Object.assign(state.project, {
        dcCapacityKwp: 100,
        acCapacityKw: 100
    });
    state.commercial.actualProjectCost = 1000000;

    replaceRows(state, 'modules', [{ rating: 500, ratingUnit: 'Wp', quantity: 200 }]);
    replaceRows(state, 'inverters', [{ rating: 50, ratingUnit: 'kW', quantity: 2 }]);

    return state;
}

// Mixed installation allocations are a derived sum, including decimal and
// string values entered through repeatable rows.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    state.project.installationLocation = 'mixed';
    model.addMixedLocation(state, { locationType: 'rcc-rooftop', capacityKwp: 125.5 });
    model.addMixedLocation(state, { locationType: 'ground-mounted', capacityKwp: '74.5' });

    assert.equal(calc.mixedLocationTotalKwp(state), 200, 'mixed-location capacity must sum all allocations');
    state.project.dcCapacityKwp = 200;
    assert.equal(issuesFor(calc.validate(state), 'mixedLocations').length, 0);
}

// Equipment capacity totals use the approved rating units and quantities.
{
    const state = validComprehensiveState('ci-hybrid');
    Object.assign(state.project, {
        dcCapacityKwp: 100.035,
        acCapacityKw: 100,
        batteryEnergyKwh: 51.2,
        batteryPowerKw: 50
    });
    replaceRows(state, 'modules', [{ rating: 585, ratingUnit: 'Wp', quantity: 171 }]);
    replaceRows(state, 'inverters', [{ rating: 50000, ratingUnit: 'W', quantity: 2 }]);
    replaceRows(state, 'battery', [
        { rating: 5.12, ratingUnit: 'kWh', quantity: 10 },
        { rating: 10, ratingUnit: 'kW', quantity: 5 }
    ]);

    assert.equal(calc.bomModuleKwp(state), 100.035);
    assert.equal(calc.bomInverterKw(state), 100);
    assert.equal(calc.bomBatteryEnergyKwh(state), 51.2);
    assert.equal(calc.bomBatteryPowerKw(state), 50);

    const reconciliation = calc.capacityReconciliation(state);
    assert.equal(reconciliation.modules.mismatch, false);
    assert.equal(reconciliation.inverters.mismatch, false);
    assert.equal(reconciliation.batteryEnergy.mismatch, false);
    assert.equal(reconciliation.batteryPower.mismatch, false);
    assert.equal(reconciliation.appliesBattery, true);
}

// The tolerance is max(0.1, 0.5% of approved). A difference on the boundary
// passes; a value immediately beyond it fails, for both absolute and relative
// branches and on either side of the approved value.
{
    assert.equal(calc.capacityTolerance(10), 0.1);
    assert.equal(calc.reconcileCapacity(10, 10.1).mismatch, false, '+0.1 must be inside tolerance');
    assert.equal(calc.reconcileCapacity(10, 9.9).mismatch, false, '-0.1 must be inside tolerance');
    assert.equal(calc.reconcileCapacity(10, 10.101).mismatch, true, '+0.101 must be a mismatch');
    assert.equal(calc.reconcileCapacity(10, 9.899).mismatch, true, '-0.101 must be a mismatch');

    assert.equal(calc.capacityTolerance(100), 0.5);
    assert.equal(calc.reconcileCapacity(100, 100.5).mismatch, false, '+0.5% must be inside tolerance');
    assert.equal(calc.reconcileCapacity(100, 99.5).mismatch, false, '-0.5% must be inside tolerance');
    assert.equal(calc.reconcileCapacity(100, 100.501).mismatch, true, '+0.501% must be a mismatch');
    assert.equal(calc.reconcileCapacity(100, 99.499).mismatch, true, '-0.501% must be a mismatch');
}

// Multiple named discounts contribute to one final price, GST split and each
// read-only milestone amount.
{
    const state = validComprehensiveState();
    state.commercial.actualProjectCost = 100000;
    state.commercial.gstRate = 5;
    state.commercial.discounts = [
        { id: 'd1', name: 'Early order', amount: 5000 },
        { id: 'd2', name: 'Partner support', amount: 2500 },
        { id: 'd3', name: '', amount: 0 }
    ];

    const totals = calc.commercialTotals(state);
    assert.equal(totals.discountTotal, 7500);
    assert.equal(totals.finalPrice, 92500);
    assert.equal(totals.taxableValue, 88095.24);
    assert.equal(totals.gstAmount, 4404.76);
    assert.deepEqual(
        totals.milestones.map(row => row.amount),
        [27750, 37000, 18500, 9250],
        'milestone amounts must use the final price after every discount'
    );

    state.commercial.discounts[1].amount = 96000;
    assert.ok(
        issuesFor(calc.validate(state), 'discounts').some(item => item.severity === 'critical'),
        'discounts exceeding Actual Project Cost must be critical'
    );
}

// Filtering sections recalculates a gap-free Page X of Y sequence and TOC
// start pages from the same plan. Long BOM data creates continuation pages.
{
    const state = validComprehensiveState();
    state.selectedSectionIds = ['terms-conditions', 'cover', 'bill-of-materials'];
    const modules = model.getBomCategory(state, 'modules');
    modules.rows = [];

    for (let index = 0; index < 60; index++) {
        model.addBomRow(state, 'modules', {
            name: `Module item ${index + 1}`,
            specification: 'A deliberately detailed technical specification that wraps across table lines',
            make: 'Approved make',
            quantity: 1,
            rating: 0,
            ratingUnit: 'Wp',
            warranty: 'As specified'
        });
    }

    const fullPlan = calc.planPages(state);
    const bomPages = fullPlan.filter(page => page.sectionId === 'bill-of-materials');
    assert.ok(bomPages.length > 1, 'a long BOM must create continuation pages');
    assert.equal(bomPages[0].isContinuation, false);
    assert.ok(bomPages.slice(1).every(page => page.isContinuation));
    assert.deepEqual(
        fullPlan.map(page => page.pageNumber),
        Array.from({ length: fullPlan.length }, (unused, index) => index + 1),
        'page numbers must be consecutive after selection and continuation expansion'
    );
    assert.ok(fullPlan.every(page => page.totalPages === fullPlan.length));

    const toc = calc.tableOfContents(fullPlan);
    for (const entry of toc) {
        assert.equal(
            entry.pageNumber,
            fullPlan.find(page => page.sectionId === entry.sectionId).pageNumber,
            `TOC page for ${entry.sectionId} must match its first planned page`
        );
    }

    model.toggleSection(state, 'bill-of-materials', false);
    const filteredPlan = calc.planPages(state);
    assert.ok(!filteredPlan.some(page => page.sectionId === 'bill-of-materials'));
    assert.deepEqual(filteredPlan.map(page => page.pageNumber), [1, 2]);
    assert.ok(filteredPlan.every(page => page.totalPages === 2));
}

// Critical validation is the public export gate signal. It must not suppress
// the page plan used by Preview, which continues to render placeholders.
{
    const state = validComprehensiveState();
    state.commercial.milestones[0].percent = 29;
    const validation = calc.validate(state);

    assert.equal(validation.hasCriticalErrors, true);
    assert.equal(validation.canExport, false, 'critical errors must block final output');
    assert.ok(calc.planPages(state).length > 0, 'critical errors must not block Preview planning');
}

// Payment milestone and utilization totals are valid at 100%, invalid outside
// the 0.01 percentage-point tolerance, and valid on the tolerance boundary.
// This block stays last so a boundary defect does not mask other coverage.
{
    const state = validComprehensiveState();
    state.commercial.milestones = [
        { id: 'm1', name: 'Advance', percent: 40 },
        { id: 'm2', name: 'Delivery', percent: 35 },
        { id: 'm3', name: 'Commissioning', percent: 25 }
    ];
    state.savings.selfConsumptionPercent = 82.5;
    state.savings.exportPercent = 17.5;

    let validation = calc.validate(state);
    assert.equal(issuesFor(validation, 'milestones').length, 0, '100% milestones must validate');
    assert.equal(issuesFor(validation, 'selfConsumptionPercent').length, 0, '100% utilization must validate');

    state.commercial.milestones[2].percent = 24.989;
    state.savings.exportPercent = 17.489;
    validation = calc.validate(state);
    assert.ok(issuesFor(validation, 'milestones').length > 0, '99.989% milestones must be critical');
    assert.ok(issuesFor(validation, 'selfConsumptionPercent').length > 0, '99.989% utilization must be critical');

    state.commercial.milestones[2].percent = 24.99;
    state.savings.exportPercent = 17.49;
    validation = calc.validate(state);
    assert.deepEqual(
        [
            issuesFor(validation, 'milestones').length,
            issuesFor(validation, 'selfConsumptionPercent').length
        ],
        [0, 0],
        '99.99% milestone and utilization totals are within the specified 0.01 tolerance'
    );
}

console.log('quote-generator comprehensive calculation tests passed');
