const assert = require('node:assert/strict');
const path = require('node:path');

const toolRoot = path.resolve(__dirname, '..', 'tools', 'quote-generator');
const model = require(path.join(toolRoot, 'quote-generator-model.js'));
const calc = require(path.join(toolRoot, 'quote-generator-calc.js'));

function matchingHybridState() {
    const state = model.createInitialState({
        mode: 'comprehensive',
        preset: 'ci-hybrid',
        quoteDate: '2026-08-11',
        quoteNumber: 'R2VQ0826-0002'
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
        acCapacityKw: 100,
        batteryEnergyKwh: 50,
        batteryPowerKw: 50
    });
    state.commercial.actualProjectCost = 1000000;

    model.getBomCategory(state, 'modules').rows = [
        { id: 'module', name: 'Module', quantity: 200, rating: 500, ratingUnit: 'Wp' }
    ];
    model.getBomCategory(state, 'inverters').rows = [
        { id: 'inverter', name: 'Inverter', quantity: 2, rating: 50, ratingUnit: 'kW' }
    ];
    model.getBomCategory(state, 'battery').rows = [
        { id: 'battery-energy', name: 'Battery energy', quantity: 10, rating: 5, ratingUnit: 'kWh' },
        { id: 'battery-power', name: 'Battery power', quantity: 5, rating: 10, ratingUnit: 'kW' }
    ];

    return state;
}

function criticalFields(state) {
    return calc.validate(state).criticalIssues.map(issue => issue.field);
}

// Each authoritative equipment capacity must turn a beyond-tolerance BOM
// mismatch into a critical validation error.
{
    const modules = matchingHybridState();
    modules.project.dcCapacityKwp = 101;
    assert.ok(criticalFields(modules).includes('modules'), 'module mismatch must be critical');

    const inverters = matchingHybridState();
    inverters.project.acCapacityKw = 101;
    assert.ok(criticalFields(inverters).includes('inverters'), 'inverter mismatch must be critical');

    const batteryEnergy = matchingHybridState();
    batteryEnergy.project.batteryEnergyKwh = 51;
    assert.ok(criticalFields(batteryEnergy).includes('battery'), 'battery energy mismatch must be critical');

    const batteryPower = matchingHybridState();
    batteryPower.project.batteryPowerKw = 40;
    assert.equal(
        calc.capacityReconciliation(batteryPower).batteryPower.mismatch,
        true,
        'the battery power reconciliation must detect the mismatch'
    );
    assert.ok(
        calc.validate(batteryPower).criticalIssues.some(issue =>
            issue.panel === 'bom' && /battery power/i.test(issue.message)),
        'battery power mismatch must be a critical BOM validation error'
    );
}

console.log('quote-generator comprehensive capacity validation tests passed');
