/**
 * Shared solar return metrics for Ray2Volt calculators and proposals.
 *
 * Both figures are project-level (unlevered): they measure the return on the
 * money put into the system, before any loan. Financing is a separate decision
 * and is reported separately as EMI and financed breakeven.
 */
(function (root, factory) {
    'use strict';

    const solarReturns = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = solarReturns;
    }

    root.Ray2VoltSolarReturns = solarReturns;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    /**
     * Net present value of a cash-flow series. cashFlows[0] is time zero and is
     * not discounted; each later entry is discounted one further period.
     */
    function npv(rate, cashFlows) {
        return cashFlows.reduce((total, flow, period) => total + flow / Math.pow(1 + rate, period), 0);
    }

    /**
     * Internal rate of return as a percentage, or null when the series has no
     * meaningful IRR — no sign change (never pays back, or costs nothing), or
     * a rate outside the bracket we search.
     *
     * Bisection rather than Newton-Raphson: the series is well behaved (one
     * outflow then inflows), so a bracketed search cannot diverge.
     */
    function irr(cashFlows, { lowerBound = -0.9999, upperBound = 10, tolerance = 1e-7, maxIterations = 200 } = {}) {
        if (!Array.isArray(cashFlows) || cashFlows.length < 2) return null;
        if (!cashFlows.every(flow => Number.isFinite(flow))) return null;

        const hasOutflow = cashFlows.some(flow => flow < 0);
        const hasInflow = cashFlows.some(flow => flow > 0);
        if (!hasOutflow || !hasInflow) return null;

        let low = lowerBound;
        let high = upperBound;
        let npvLow = npv(low, cashFlows);
        let npvHigh = npv(high, cashFlows);

        // No root inside the bracket — the project either never breaks even or
        // returns more than we are willing to claim.
        if (npvLow * npvHigh > 0) return null;

        for (let i = 0; i < maxIterations; i++) {
            const mid = (low + high) / 2;
            const npvMid = npv(mid, cashFlows);

            if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
                return mid * 100;
            }

            if (npvLow * npvMid < 0) {
                high = mid;
                npvHigh = npvMid;
            } else {
                low = mid;
                npvLow = npvMid;
            }
        }

        return ((low + high) / 2) * 100;
    }

    /**
     * Simple return on investment as a percentage: what the system returns over
     * and above what it cost, across the whole projection.
     */
    function roi(netInvestment, savingsByYear) {
        if (!Number.isFinite(netInvestment) || netInvestment <= 0) return null;
        if (!Array.isArray(savingsByYear) || !savingsByYear.length) return null;

        const totalSavings = savingsByYear.reduce((total, saving) => total + (Number.isFinite(saving) ? saving : 0), 0);
        return ((totalSavings - netInvestment) / netInvestment) * 100;
    }

    /**
     * Both metrics for one project. `savingsByYear` is year 1 onward; the net
     * investment becomes the year-zero outflow.
     */
    function projectReturns(netInvestment, savingsByYear) {
        return {
            roi: roi(netInvestment, savingsByYear),
            irr: irr([-netInvestment, ...savingsByYear])
        };
    }

    /** Percentage for display, or an em dash when the metric does not apply. */
    function formatPercent(value, digits = 1) {
        return Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—';
    }

    return { npv, irr, roi, projectReturns, formatPercent };
});
