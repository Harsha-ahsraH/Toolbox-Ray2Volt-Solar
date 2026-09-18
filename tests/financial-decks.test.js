/**
 * Commercial financial decks — the guard.
 *
 * The decks are generated, not hand-written, so the thing worth testing is the
 * generator: that the assumptions are coherent, that the post-tax cash flow is
 * internally consistent (see the warning block in model.js), and that every
 * capacity is actually listed in the Resource Library and actually on disk.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const deckRoot = path.join(repoRoot, 'scripts', 'financial-decks');

const Assumptions = require(path.join(deckRoot, 'assumptions.js'));
const Model = require(path.join(deckRoot, 'model.js'));
const Build = require(path.join(deckRoot, 'build.js'));
const catalogue = require(path.join(repoRoot, 'tools', 'resource-library', 'resource-library-catalogue.js'));

const A = Assumptions.ASSUMPTIONS;

// --- The assumptions are coherent ----------------------------------------
assert.deepEqual(Assumptions.problems(), [], 'the shipped assumptions must have no problems');

// The validator has to actually bite, or the assertion above is empty.
const band = Assumptions.PRICE_BANDS[1];
const held = band.rupeesPerWp;
band.rupeesPerWp = 1;                       // makes 150 kW cost less than 100 kW
assert.ok(
    Assumptions.problems().some(problem => /costs no more in total than/.test(problem)),
    'a price band that makes a bigger plant cheaper overall is a problem'
);
band.rupeesPerWp = held;
assert.deepEqual(Assumptions.problems(), [], 'the assumptions must be restored');

// --- The supply boundary is where APERC put it ---------------------------
assert.equal(Assumptions.tariffFor(150), Assumptions.TARIFFS.lt, '150 kW is still LT');
assert.equal(Assumptions.tariffFor(200), Assumptions.TARIFFS.ht, '200 kW is HT');

// --- The cash flow says what model.js promises it says --------------------
const deck = Model.deckFor(250);
const taxRate = A.taxRatePercent / 100;

assert.ok(
    Math.abs(deck.capex * (1 + A.gstPercent / 100) - deck.priceInclGst) < 1,
    'capex is the price with GST taken out, because the ITC is claimed'
);

assert.ok(
    Math.abs(deck.rows[0].depreciation - deck.capex * 0.4) < 1,
    'year one depreciation is 40% of the ex-GST capex'
);

const totalDepreciation = deck.rows.reduce((total, row) => total + row.depreciation, 0);
assert.ok(totalDepreciation < deck.capex, 'a WDV block never fully writes off');

deck.rows.forEach(row => {
    assert.ok(
        Math.abs(row.taxableProfit - (row.grossSavings - row.amc - row.depreciation)) < 2,
        `year ${row.year}: taxable profit is savings less AMC less depreciation`
    );
    assert.ok(
        Math.abs(row.tax - row.taxableProfit * taxRate) < 2,
        `year ${row.year}: tax is charged on that profit, at one rate`
    );
    assert.ok(
        Math.abs(row.netCashFlow - (row.grossSavings - row.amc - row.tax)) < 2,
        `year ${row.year}: the savings are taxed, not just sheltered`
    );
});

assert.ok(deck.rows[0].tax < 0, 'in year one depreciation exceeds savings, so tax is an inflow');
assert.ok(deck.rows[A.projectionYears - 1].tax > 0, 'by the final year the savings are taxed');
assert.equal(deck.rows[0].amc, 0, 'year one maintenance is covered by the build');

// --- Payback lands where the cumulative column crosses --------------------
const crossing = deck.rows.find(row => row.cumulative >= deck.capex);
assert.ok(crossing, 'the plant pays back inside the projection');
assert.ok(
    deck.payback > crossing.year - 1 && deck.payback <= crossing.year,
    'payback is interpolated inside the year the cumulative column crosses'
);
assert.ok(deck.discountedPayback > deck.payback, 'discounting can only lengthen payback');

// --- Every deck is sane, on disk, and in the catalogue -------------------
const listed = catalogue.RESOURCES.filter(resource => resource.category === 'Financial decks');
assert.equal(
    listed.length,
    Assumptions.CAPACITIES_KW.length,
    'the catalogue lists one entry per capacity'
);

let previousTotal = 0;

Assumptions.CAPACITIES_KW.forEach(capacityKw => {
    const built = Model.deckFor(capacityKw);

    assert.ok(built.irr > 5 && built.irr < 60, `${capacityKw} kW: IRR is a plausible percentage`);
    assert.ok(built.npv > 0, `${capacityKw} kW: NPV is positive`);
    assert.ok(built.lcoe > 0 && built.lcoe < built.tariff.rateRupeesPerKwh,
        `${capacityKw} kW: solar undercuts the tariff it is compared against`);

    assert.ok(built.priceInclGst > previousTotal, `${capacityKw} kW costs more in total than the size below`);
    previousTotal = built.priceInclGst;

    const expectedPath = `downloads/financial-decks/${Build.slugFor(capacityKw)}.pdf`;
    const entry = listed.find(resource => resource.path === expectedPath);
    assert.ok(entry, `${capacityKw} kW is missing from the Resource Library`);
    assert.equal(entry.title, `${capacityKw} kWp commercial financial analysis`);
    assert.ok(
        fs.existsSync(path.join(repoRoot, expectedPath)),
        `${expectedPath} is listed but not built — run node scripts/financial-decks/build.js`
    );
});

console.log('financial deck tests passed');
