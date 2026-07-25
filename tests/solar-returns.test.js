const assert = require('node:assert/strict');
const path = require('node:path');

const returns = require(path.resolve(__dirname, '..', 'global', 'scripts', 'solar-returns.js'));

function close(actual, expected, tolerance, message) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `${message}: expected ~${expected}, got ${actual}`
    );
}

// --- IRR against known values -------------------------------------------------
// Excel/LibreOffice IRR(-1000, 500, 500, 500) = 23.375%
close(returns.irr([-1000, 500, 500, 500]), 23.375, 0.01, 'three-year IRR');

// Excel IRR(-100000, 10000 x 25) = 8.80%
close(returns.irr([-100000, ...Array(25).fill(10000)]), 8.8, 0.05, 'flat annuity IRR');

// A project that exactly doubles in one year returns 100%.
close(returns.irr([-1000, 2000]), 100, 0.01, 'doubling in one year');

// NPV at the IRR must be zero — the defining property. The solver converges on
// the rate to 1e-7, which on a lakh-scale project leaves a sub-rupee residual.
const series = [-250000, 40000, 42000, 44000, 46000, 48000, 50000, 52000];
const rate = returns.irr(series) / 100;
close(returns.npv(rate, series), 0, 1, 'NPV at IRR');

// --- IRR edge cases -----------------------------------------------------------
assert.equal(returns.irr([100, 100]), null, 'no outflow has no IRR');
assert.equal(returns.irr([-100, -100]), null, 'no inflow has no IRR');
assert.equal(returns.irr([-100]), null, 'a single flow has no IRR');
assert.equal(returns.irr([]), null, 'an empty series has no IRR');
assert.equal(returns.irr([-100, Number.NaN]), null, 'a non-finite flow has no IRR');
assert.equal(returns.irr('nope'), null, 'a non-array has no IRR');

// A project returning far more than the search bracket reports nothing rather
// than a wrong number.
assert.equal(returns.irr([-1, 1e9]), null, 'return beyond the bracket is not guessed');

// --- ROI ----------------------------------------------------------------------
// 100k in, 250k back over the life => 150% return on the money invested.
close(returns.roi(100000, [50000, 50000, 50000, 50000, 50000]), 150, 0.001, 'simple ROI');

// Getting back exactly what you put in is 0%, not 100%.
close(returns.roi(100000, [100000]), 0, 0.001, 'break-even ROI is zero');

// Losing money reads negative.
close(returns.roi(100000, [10000, 10000]), -80, 0.001, 'shortfall ROI is negative');

assert.equal(returns.roi(0, [100]), null, 'zero investment has no ROI');
assert.equal(returns.roi(-5, [100]), null, 'negative investment has no ROI');
assert.equal(returns.roi(100, []), null, 'no savings has no ROI');

// --- projectReturns ties the two together ------------------------------------
const both = returns.projectReturns(150000, Array(25).fill(32000));
assert.ok(both.roi > 0 && both.irr > 0, 'a paying project reports both metrics');
close(both.roi, returns.roi(150000, Array(25).fill(32000)), 0.001, 'roi matches');
close(both.irr, returns.irr([-150000, ...Array(25).fill(32000)]), 0.001, 'irr matches');

// --- Formatting ---------------------------------------------------------------
assert.equal(returns.formatPercent(23.456), '23.5%');
assert.equal(returns.formatPercent(1131.2, 0), '1131%');
assert.equal(returns.formatPercent(null), '—', 'a missing metric shows an em dash, not NaN');
assert.equal(returns.formatPercent(Number.NaN), '—');
assert.equal(returns.formatPercent(Infinity), '—');

// --- A realistic Ray2Volt project --------------------------------------------
// 3 kWp residential on-grid: ₹2,26,400 less ₹78,000 subsidy, 360 units/month at
// ₹8.50 escalating 4%. This is the case quoted in the Sales SOP, so the SOP's
// headline ranges must stay true.
const netCost = 226400 - 78000;
const annual = 360 * 12 * 8.5;
const projected = Array.from({ length: 25 }, (_, year) => annual * Math.pow(1.04, year));
const residential = returns.projectReturns(netCost, projected);

assert.ok(
    residential.irr >= 24 && residential.irr <= 29,
    `SOP quotes 24-29% IRR for a 3 kWp system; model gives ${residential.irr.toFixed(1)}%`
);
assert.ok(
    residential.roi >= 800 && residential.roi <= 950,
    `SOP quotes 8-9x ROI for a 3 kWp system; model gives ${(residential.roi / 100).toFixed(1)}x`
);

console.log('solar returns tests passed');
