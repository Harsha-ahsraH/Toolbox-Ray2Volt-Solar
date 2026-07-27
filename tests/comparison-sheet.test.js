const assert = require('node:assert/strict');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const model = require(path.join(repoRoot, 'tools', 'comparison-sheet', 'comparison-sheet-model.js'));

function close(actual, expected, tolerance, message) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `${message}: expected ${expected} ± ${tolerance}, got ${actual}`
    );
}

// --- Earth pits ---------------------------------------------------------
// Option 3 follows the stated schedule; Options 1 and 2 take two fewer with a
// floor of three, which is why the three converge below 20 kWp.
const earthingCases = [
    [8, [3, 3, 3]],
    [10, [3, 3, 3]],
    [15, [3, 3, 4]],
    [20, [3, 3, 4]],
    [50, [4, 4, 6]],
    [75, [6, 6, 8]],
    [250, [6, 6, 8]],
    [400, [8, 8, 10]],
    [500, [8, 8, 10]],
    [1000, [10, 10, 12]]
];

for (const [capacity, expected] of earthingCases) {
    assert.deepEqual(
        model.earthingCounts(capacity),
        expected,
        `${capacity} kWp should give pits ${expected.join('/')}`
    );
}

// Above 1 MWp the schedule adds two pits per additional MWp band.
assert.deepEqual(model.earthingCounts(1500), [12, 12, 14], '1.5 MWp sits in the first band above 1 MWp');
assert.deepEqual(model.earthingCounts(2000), [12, 12, 14], '2 MWp closes that band');
assert.deepEqual(model.earthingCounts(2001), [14, 14, 16], 'just past 2 MWp opens the next band');
assert.deepEqual(model.earthingCounts(3000), [14, 14, 16], '3 MWp closes the second band');

// No option ever drops below the floor, at any capacity.
for (const capacity of [0.5, 3, 8, 10, 12, 20, 75, 900, 5000]) {
    for (const count of model.earthingCounts(capacity)) {
        assert.ok(count >= model.MINIMUM_PITS, `${capacity} kWp must not fall below ${model.MINIMUM_PITS} pits`);
    }
}

// The count is shared between Options 1 and 2, so electrode type is what has
// to tell them apart.
const earthingText = model.earthingText(75);
assert.equal(earthingText[0], '6 GI rod pits');
assert.equal(earthingText[1], '6 chemical electrodes');
assert.equal(earthingText[2], '8 chemical electrodes with backfill compound');

assert.notEqual(earthingText[0], earthingText[1], 'Options 1 and 2 must not read identically');

// Singular wording is guarded even though the table never reaches one pit.
assert.match(model.earthingText(0)[0], /pits$/, 'the floor keeps the plural correct at zero capacity');

// --- Worked case: 75 kWp on-grid at 34 / 37.50 / 40 per Wp --------------
const onGrid = model.compute({
    capacityKwp: 75,
    systemType: 'on-grid',
    priceMode: 'rate',
    prices: [34, 37.5, 40]
});

assert.equal(onGrid.years, 30, 'the analysis period is 30 years');
assert.equal(onGrid.tariff, 8, 'the tariff is held at Rs 8.00 per kWh');
assert.ok(onGrid.ascending, 'these prices ascend from Option 1 to Option 3');

assert.deepEqual(
    onGrid.options.map(option => option.capitalCost),
    [2550000, 2812500, 3000000],
    'rate x capacity x 1000 gives the capital cost'
);

// Maintenance: rate x capacity x years, less Option 3's free first year.
assert.deepEqual(
    onGrid.options.map(option => option.maintenance),
    [1912500, 1620000, 1305000],
    '30 years of AMC, with Year 1 free on Option 3'
);

// Repairs on the 30-year replacement basis.
assert.deepEqual(
    onGrid.options.map(option => option.repairs),
    [958050, 600000, 525000],
    'repairs scale per kWp'
);

assert.deepEqual(
    onGrid.options.map(option => option.totalCostOfOwnership),
    [5420550, 5032500, 4830000],
    'total cost of ownership is capital + maintenance + repairs'
);

// Option 3 remains the cheapest plant to own, which is the sheet's argument.
assert.ok(
    onGrid.options[2].totalCostOfOwnership < onGrid.options[0].totalCostOfOwnership,
    'Option 3 should cost less to own than Option 1'
);
assert.ok(onGrid.ownershipDelta > 0, 'ownershipDelta is positive when Option 3 is cheaper to own');

// --- Generation ---------------------------------------------------------
// Year 1 is nameplate yield plus rear-side gain, with no degradation applied —
// the figure a customer can check against the module datasheet.
close(onGrid.options[0].yearOneGeneration, 75 * 1500 * 1.045, 0.01, 'Option 1 year-1 generation');
close(onGrid.options[1].yearOneGeneration, 75 * 1550 * 1.045, 0.01, 'Option 2 year-1 generation');
close(onGrid.options[2].yearOneGeneration, 75 * 1550 * 1.07, 0.01, 'Option 3 year-1 generation');

// All three now earn rear-side gain, but Option 3 earns more of it.
assert.ok(
    model.BIFACIAL_GAIN[0] > 0 && model.BIFACIAL_GAIN[1] > 0,
    'Options 1 and 2 are bifacial and must earn rear-side gain'
);
assert.ok(
    model.BIFACIAL_GAIN[2] > model.BIFACIAL_GAIN[0],
    'TopCon should out-earn PERC on rear-side gain'
);
for (const text of model.BIFACIAL_TEXT) {
    assert.doesNotMatch(text, /^None$/, 'no option prints "None" for rear-side generation');
}

// The first-year drop lands on year 2, then the annual rate takes over.
const series = model.generationSeries(75, 0, 4);
close(series[1], series[0] * (1 - model.DEGRADATION_YEAR_1[0] / 100), 0.01, 'year 2 takes the year-one drop');
close(series[2], series[1] * (1 - model.DEGRADATION_ANNUAL[0] / 100), 0.01, 'year 3 takes the annual rate');
assert.equal(model.generationSeries(75, 0, 30).length, 30, 'the series covers the whole horizon');

// Option 3 out-generates Option 1 over the horizon despite five extra years of
// degradation on both.
assert.ok(
    onGrid.options[2].totalGeneration > onGrid.options[0].totalGeneration,
    'Option 3 should generate more over the horizon'
);

// --- Derived figures ----------------------------------------------------
onGrid.options.forEach((option, index) => {
    close(
        option.payback,
        option.capitalCost / (option.yearOneGeneration * 8),
        0.0001,
        `Option ${index + 1} simple payback ignores AMC`
    );
    close(
        option.lcoe,
        option.totalCostOfOwnership / option.totalGeneration,
        0.0001,
        `Option ${index + 1} levelised cost`
    );
    close(
        option.netBenefit,
        option.totalGeneration * 8 - option.totalCostOfOwnership,
        0.01,
        `Option ${index + 1} net benefit`
    );
});

// Option 3 has the lowest levelised cost — the number the sheet leads on.
assert.ok(onGrid.options[2].lcoe < onGrid.options[1].lcoe, 'Option 3 should have the lowest levelised cost');
assert.ok(onGrid.options[1].lcoe < onGrid.options[0].lcoe, 'Option 2 should beat Option 1 on levelised cost');

assert.equal(onGrid.capitalDelta, 3000000 - 2550000, 'capitalDelta is Option 3 less Option 1');
assert.ok(onGrid.paybackSpread >= 0, 'the payback spread is never negative');

// --- Price modes agree --------------------------------------------------
const byTotal = model.compute({
    capacityKwp: 75,
    systemType: 'on-grid',
    priceMode: 'total',
    prices: [2550000, 2812500, 3000000]
});

assert.deepEqual(
    byTotal.options.map(option => option.capitalCost),
    onGrid.options.map(option => option.capitalCost),
    'entering totals must match entering rates'
);
assert.deepEqual(
    byTotal.options.map(option => Number(option.ratePerWp.toFixed(4))),
    [34, 37.5, 40],
    'the rate is recovered from the total'
);

// Both conversions are inverses of one another.
close(model.rateFromTotal(model.totalFromRate(37.5, 75), 75), 37.5, 1e-9, 'rate round-trips through total');
assert.equal(model.rateFromTotal(1000, 0), 0, 'a zero-capacity plant reports a zero rate rather than Infinity');

// --- Hybrid -------------------------------------------------------------
const hybrid = model.compute({
    capacityKwp: 75,
    systemType: 'hybrid',
    batteryKwh: 100,
    priceMode: 'rate',
    prices: [34, 37.5, 40]
});

assert.equal(hybrid.isHybrid, true);
assert.equal(hybrid.batteryKwh, 100);

const expectedBattery = 100 * model.BATTERY_REPLACEMENT_RATE * model.BATTERY_REPLACEMENTS;
assert.equal(model.BATTERY_REPLACEMENTS, 1, 'one battery replacement is costed inside the horizon');

hybrid.options.forEach((option, index) => {
    assert.equal(option.batteryCost, expectedBattery, `Option ${index + 1} carries one battery replacement`);
    assert.equal(
        option.repairs,
        onGrid.options[index].repairs + expectedBattery,
        `Option ${index + 1} hybrid repairs add the battery to the on-grid figure`
    );
});

// On-grid must never carry a battery cost.
for (const option of onGrid.options) {
    assert.equal(option.batteryCost, 0, 'an on-grid plant has no battery replacement');
}

// A hybrid with no battery entered must not silently invent one.
const hybridNoBattery = model.compute({
    capacityKwp: 75,
    systemType: 'hybrid',
    batteryKwh: 0,
    priceMode: 'rate',
    prices: [34, 37.5, 40]
});
assert.equal(hybridNoBattery.options[0].batteryCost, 0, 'no battery entered means no battery cost guessed');

// --- Degenerate inputs --------------------------------------------------
const empty = model.compute({});
assert.equal(empty.capacityKwp, 0);
assert.equal(empty.systemType, 'on-grid', 'an unrecognised type falls back to on-grid');
assert.equal(empty.options.length, 3, 'there are always three options');
for (const option of empty.options) {
    assert.ok(Number.isFinite(option.totalCostOfOwnership), 'no NaN reaches the document');
    assert.ok(Number.isFinite(option.lcoe), 'a zero-generation plant reports a finite levelised cost');
}

const unknownType = model.compute({ capacityKwp: 10, systemType: 'off-grid', priceMode: 'rate', prices: [1, 2, 3] });
assert.equal(unknownType.isHybrid, false, 'only "hybrid" turns on the battery maths');

// Non-ascending prices are reported, not silently accepted.
const flat = model.compute({ capacityKwp: 75, priceMode: 'rate', prices: [40, 40, 40] });
assert.equal(flat.ascending, false, 'equal prices are not ascending');
assert.equal(flat.capitalDelta, 0, 'equal prices give a zero capital delta');

const inverted = model.compute({ capacityKwp: 75, priceMode: 'rate', prices: [40, 37.5, 34] });
assert.equal(inverted.ascending, false, 'descending prices are not ascending');
assert.ok(inverted.capitalDelta < 0, 'a cheaper Option 3 gives a negative capital delta');

console.log('comparison sheet model tests passed');
