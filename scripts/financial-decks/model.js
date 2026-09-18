/**
 * Commercial Financial Deck — the model.
 *
 * One function, `deckFor(capacityKw)`, turns a capacity into every number the
 * deck prints. No formatting, no HTML: this file answers "what are the
 * figures?", and deck-template.js answers "how do they look?".
 *
 * ---------------------------------------------------------------------------
 * THE ONE THING TO UNDERSTAND BEFORE CHANGING ANYTHING HERE
 *
 * The cash flow is POST-TAX and internally consistent. Electricity savings
 * reduce an expense, so they raise taxable profit — a commercial buyer keeps
 * only about 75% of them. Depreciation reduces taxable profit, so it hands
 * some back. Both are applied to the same taxable profit line:
 *
 *      taxable profit = gross savings − AMC − depreciation
 *      net cash flow  = gross savings − AMC − tax on that profit
 *
 * In the early years depreciation exceeds savings, so taxable profit is
 * negative and the tax line is a net INFLOW. That is correct, and it assumes
 * the buyer has other business income for the loss to shelter — which is
 * stated on the deck's assumptions page rather than left implicit.
 *
 * Presenting gross savings PLUS a depreciation tax shield, without taxing the
 * savings, would shorten every payback by roughly a year and would be wrong:
 * it claims the tax benefit while ignoring the tax cost. Do not "simplify" it
 * back to that.
 * ---------------------------------------------------------------------------
 */
'use strict';

const path = require('node:path');
const Assumptions = require('./assumptions.js');
const Returns = require(path.join(__dirname, '..', '..', 'global', 'scripts', 'solar-returns.js'));

const A = Assumptions.ASSUMPTIONS;

function round(value, digits = 0) {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}

/**
 * The year in which cumulative cash flow first covers the investment,
 * interpolated within that year, or null if it never does.
 */
function paybackYears(investment, cashFlows) {
    let cumulative = 0;

    for (let index = 0; index < cashFlows.length; index++) {
        const previous = cumulative;
        cumulative += cashFlows[index];

        if (cumulative >= investment) {
            const shortfall = investment - previous;
            const withinYear = cashFlows[index] > 0 ? shortfall / cashFlows[index] : 0;
            return round(index + withinYear, 2);
        }
    }

    return null;
}

/**
 * Levelised cost of energy, stated PRE-TAX so it compares like-for-like with
 * the grid tariff a reader sees on their own bill: lifetime cost discounted
 * over lifetime generation discounted at the same rate. The depreciation
 * benefit is deliberately left out of this figure and reported separately —
 * folding it in would produce a number no one could reconcile against a bill.
 */
function levelisedCost(capex, amcByYear, generationByYear, discountRate) {
    let cost = capex;
    let energy = 0;

    for (let index = 0; index < generationByYear.length; index++) {
        const discount = Math.pow(1 + discountRate, index + 1);
        cost += amcByYear[index] / discount;
        energy += generationByYear[index] / discount;
    }

    return energy > 0 ? cost / energy : null;
}

/** Every figure for one capacity. */
function deckFor(capacityKw) {
    const tariff = Assumptions.tariffFor(capacityKw);
    const rupeesPerWp = Assumptions.rupeesPerWp(capacityKw);

    const priceInclGst = capacityKw * 1000 * rupeesPerWp;
    const capex = priceInclGst / (1 + A.gstPercent / 100);   // ex-GST: ITC claimed
    const gstCredit = priceInclGst - capex;

    const taxRate = A.taxRatePercent / 100;
    const discountRate = A.discountRatePercent / 100;
    const degradation = A.degradationPercent / 100;
    const escalation = A.tariffEscalationPercent / 100;
    const selfShare = A.selfConsumptionPercent / 100;
    const exportShare = A.exportPercent / 100;

    const year1Generation = capacityKw * A.annualGenerationPerKwp;
    const amcPerYear = capacityKw * A.amcRupeesPerKwpPerYear;

    const rows = [];
    const cashFlows = [];
    const generationByYear = [];
    const amcByYear = [];

    let writtenDownValue = capex;

    for (let year = 1; year <= A.projectionYears; year++) {
        const generation = year1Generation * Math.pow(1 - degradation, year - 1);
        const tariffRate = tariff.rateRupeesPerKwh * Math.pow(1 + escalation, year - 1);
        const exportRate = A.exportRateRupeesPerKwh * Math.pow(1 + escalation, year - 1);

        const selfSavings = generation * selfShare * tariffRate;
        const exportCredit = generation * exportShare * exportRate;
        const grossSavings = selfSavings + exportCredit;

        const amc = year <= A.amcFreeYears ? 0 : amcPerYear;

        // 40% WDV. Once the block is nearly written off the charge tails to
        // nothing; it never reaches zero, which is how a WDV block behaves.
        const depreciation = writtenDownValue * (A.depreciationRatePercent / 100);
        writtenDownValue -= depreciation;

        const taxableProfit = grossSavings - amc - depreciation;
        const tax = taxableProfit * taxRate;          // negative = shelters other income
        const netCashFlow = grossSavings - amc - tax;

        rows.push({
            year,
            generationKwh: round(generation),
            tariffRate: round(tariffRate, 2),
            grossSavings: round(grossSavings),
            amc: round(amc),
            depreciation: round(depreciation),
            writtenDownValue: round(writtenDownValue),
            taxableProfit: round(taxableProfit),
            tax: round(tax),
            netCashFlow: round(netCashFlow),
            cumulative: 0     // filled below
        });

        cashFlows.push(netCashFlow);
        generationByYear.push(generation);
        amcByYear.push(amc);
    }

    let running = 0;
    rows.forEach(row => {
        running += row.netCashFlow;
        row.cumulative = round(running);
    });

    const discountedFlows = cashFlows.map((flow, index) => flow / Math.pow(1 + discountRate, index + 1));
    const totalNetCashFlow = cashFlows.reduce((total, flow) => total + flow, 0);
    const totalGenerationKwh = generationByYear.reduce((total, value) => total + value, 0);
    const co2Tonnes = (totalGenerationKwh * A.gridEmissionFactorKgPerKwh) / 1000;

    return {
        capacityKw,
        rupeesPerWp,
        priceInclGst: round(priceInclGst),
        capex: round(capex),
        gstCredit: round(gstCredit),
        tariff,

        year1GenerationKwh: round(year1Generation),
        year1GrossSavings: round(rows[0].grossSavings),
        year1NetCashFlow: round(rows[0].netCashFlow),
        amcPerYear: round(amcPerYear),

        rows,
        totalNetCashFlow: round(totalNetCashFlow),
        totalGenerationKwh: round(totalGenerationKwh),
        totalDepreciationShield: round(rows.reduce((total, row) => total + row.depreciation, 0) * taxRate),

        payback: paybackYears(capex, cashFlows),
        discountedPayback: paybackYears(capex, discountedFlows),
        irr: Returns.irr([-capex, ...cashFlows]),
        npv: round(Returns.npv(discountRate, [-capex, ...cashFlows])),
        roi: Returns.roi(capex, cashFlows),
        lcoe: round(levelisedCost(capex, amcByYear, generationByYear, discountRate), 2),

        co2Tonnes: round(co2Tonnes, 1),
        treesEquivalent: Math.round(co2Tonnes * A.treesPerTonneCo2)
    };
}

module.exports = { deckFor, paybackYears, levelisedCost, round };
