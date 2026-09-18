/**
 * Commercial Financial Deck — every assumption, in one file.
 *
 * THIS IS THE ONLY FILE YOU EDIT WHEN A RATE MOVES.
 *
 * Change a number here and re-run `node scripts/financial-decks/build.js`.
 * All nineteen decks regenerate from it, so they can never drift apart.
 *
 * ---------------------------------------------------------------------------
 * WHERE EACH NUMBER CAME FROM
 *
 *   Tariffs        APERC Retail Supply Tariff Order FY2025-26, carried forward
 *                  unchanged into FY2026-27. LT Category II is telescopic; the
 *                  rate below is the TOP SLAB (above 500 units), because any
 *                  site large enough for a 50 kW plant burns well past 500
 *                  units a month and solar displaces its marginal units, not
 *                  its average ones.
 *
 *   LT/HT boundary APERC extended LT supply to 150 kW for FY2025-26 (raised
 *                  from 75 kW). At and below 150 kW a deck is modelled on LT;
 *                  above it, on HT at 11 kV. This is why the 150 kW deck pays
 *                  back faster than the 200 kW deck — LT ₹10.15 beats HT ₹7.65
 *                  by more than the price-per-watt saving at that step. That
 *                  is real, not a modelling error.
 *
 *   Prices         Set by the owner, 2026-09-18, GST-inclusive, banded.
 *
 *   Depreciation   Income Tax Act Appendix I: solar power generating systems
 *                  sit in the 40% WDV block since AY 2018-19. Modelled under
 *                  s.115BAA, which means NO additional depreciation under
 *                  s.32(1)(iia) — a company taking the 22% concessional rate
 *                  forfeits it. Claiming both is the most common error in
 *                  Indian solar decks and the first thing a CFO will pull on.
 *
 *   Tax rate       s.115BAA: 22% + 10% surcharge + 4% cess = 25.168%.
 *
 *   AMC            Ray2Volt's own published rate for the Ray2Volt Choice build,
 *                  matching tools/comparison-sheet/comparison-sheet-model.js.
 * ---------------------------------------------------------------------------
 */
'use strict';

/** The nineteen decks: 50 kW to 950 kW in 50 kW steps. */
const CAPACITIES_KW = Array.from({ length: 19 }, (_, index) => (index + 1) * 50);

/**
 * Price per watt-peak, GST-inclusive, by capacity band. `upToKw` is inclusive.
 * Bands must be listed smallest first and must not leave a gap.
 */
const PRICE_BANDS = [
    { upToKw: 100, rupeesPerWp: 46.00 },
    { upToKw: 250, rupeesPerWp: 43.00 },
    { upToKw: 500, rupeesPerWp: 40.50 },
    { upToKw: 950, rupeesPerWp: 38.00 }
];

/**
 * Tariff by supply category. A deck uses LT at or below `LT_MAX_KW`, HT above.
 * Rates are ENERGY CHARGES ONLY — demand and fixed charges are deliberately
 * excluded, because solar does not reduce contracted demand.
 */
const LT_MAX_KW = 150;

const TARIFFS = {
    lt: {
        category: 'LT Category II — Commercial',
        rateRupeesPerKwh: 10.15,
        slabNote: 'Marginal rate, above 500 units per month'
    },
    ht: {
        category: 'HT Category I / II at 11 kV',
        rateRupeesPerKwh: 7.65,
        slabNote: 'Energy charge; ₹475/kVA/month demand charge excluded'
    }
};

const ASSUMPTIONS = {
    /* --- Generation ------------------------------------------------------ */
    annualGenerationPerKwp: 1533,   // kWh/kWp/year, matches quote-generator-config.js
    degradationPercent: 0.5,        // per year, compounding
    projectionYears: 30,

    /* --- Where the units go ---------------------------------------------- */
    selfConsumptionPercent: 90,
    exportPercent: 10,
    exportRateRupeesPerKwh: 2.75,   // APPC / net-billing rate
    tariffEscalationPercent: 4,     // applied to both tariff and export rate

    /* --- Money ------------------------------------------------------------ */
    gstPercent: 5,
    taxRatePercent: 25.168,         // s.115BAA, incl. surcharge and cess
    depreciationRatePercent: 40,    // WDV, Appendix I
    discountRatePercent: 10,        // for NPV, discounted payback and LCOE

    /* --- Running costs ---------------------------------------------------- */
    amcRupeesPerKwpPerYear: 600,
    amcFreeYears: 1,                // year 1 is covered by the build
    // Inverter replacement is deliberately NOT modelled. Disclosed on page 3.

    /* --- Environmental (shared with the Quote Generator) ------------------ */
    gridEmissionFactorKgPerKwh: 0.82,
    treesPerTonneCo2: 45
};

/** Price per Wp, GST-inclusive, for one capacity. */
function rupeesPerWp(capacityKw) {
    const band = PRICE_BANDS.find(entry => capacityKw <= entry.upToKw);
    if (!band) throw new Error(`No price band covers ${capacityKw} kW.`);
    return band.rupeesPerWp;
}

/** Which tariff a capacity falls under, and why. */
function tariffFor(capacityKw) {
    return capacityKw <= LT_MAX_KW ? TARIFFS.lt : TARIFFS.ht;
}

/**
 * Problems with the assumptions, as plain sentences. Returned rather than
 * thrown so the build can report them all at once and the test suite can
 * assert the file is coherent.
 */
function problems() {
    const found = [];

    if (ASSUMPTIONS.selfConsumptionPercent + ASSUMPTIONS.exportPercent !== 100) {
        found.push('Self-consumption and export must add to 100%.');
    }
    if (ASSUMPTIONS.projectionYears < 1) {
        found.push('Projection years must be at least 1.');
    }
    if (PRICE_BANDS[PRICE_BANDS.length - 1].upToKw < Math.max(...CAPACITIES_KW)) {
        found.push('The last price band does not reach the largest capacity.');
    }

    PRICE_BANDS.forEach((band, index) => {
        if (index > 0 && band.upToKw <= PRICE_BANDS[index - 1].upToKw) {
            found.push('Price bands must be listed smallest first, without overlap.');
        }
        if (!(band.rupeesPerWp > 0)) {
            found.push(`Price band up to ${band.upToKw} kW has no positive rate.`);
        }
    });

    // A larger plant must never cost less in total than a smaller one, or the
    // deck set reads as a pricing error to anyone who lines them up.
    CAPACITIES_KW.forEach((capacityKw, index) => {
        if (index === 0) return;
        const previous = CAPACITIES_KW[index - 1];
        if (capacityKw * rupeesPerWp(capacityKw) <= previous * rupeesPerWp(previous)) {
            found.push(`${capacityKw} kW costs no more in total than ${previous} kW.`);
        }
    });

    return found;
}

module.exports = {
    CAPACITIES_KW,
    PRICE_BANDS,
    TARIFFS,
    LT_MAX_KW,
    ASSUMPTIONS,
    rupeesPerWp,
    tariffFor,
    problems
};
