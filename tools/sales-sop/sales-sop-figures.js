/**
 * Sales SOP — the C&I worked figures.
 *
 * Feeds the capacity selector in the Commercial & Industrial playbook. Pick a
 * capacity, and every number on that block recalculates from here.
 *
 * Plain script rather than a module for the same reason as the Resource Library
 * catalogue: the toolbox is opened off disk as often as it is served, and an
 * import would fail under file://. A <script> tag works either way.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE MIRRORS scripts/financial-decks/assumptions.js
 *
 * The generation figure, the unit split, the export rate, the tariffs and the
 * LT/HT boundary are the same numbers the nineteen commercial financial decks
 * are built from. tests/sales-sop.test.js asserts that they match, so if you
 * change a rate in the decks and not here, the test fails rather than letting a
 * salesperson quote one number while the PDF in their hand shows another.
 *
 * Two numbers live ONLY here, because the decks do not model them:
 *
 *   NET_METERING_MAX_KWP   APERC Regulation 4 of 2023, gazetted 24.02.2024:
 *                          net metering stops at 500 kWp per service, and gross
 *                          metering runs to 5 MW above it. Plants already
 *                          commissioned, or holding an approved feasibility
 *                          report, keep their original terms.
 *
 *   TOD                    Electricity (Rights of Consumers) Rules: a state's
 *                          solar-hours tariff must sit at least 20% BELOW the
 *                          normal tariff for that category, and the peak rate
 *                          for commercial and industrial consumers is capped at
 *                          1.1x normal. These are the national bounds, not
 *                          APERC's published windows — the page says so, and
 *                          sends the salesperson to the customer's own bill.
 * ---------------------------------------------------------------------------
 */
(function (root, factory) {
    'use strict';

    const figures = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = figures;
    }

    root.Ray2VoltSopFigures = figures;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    /** 50 kW to 950 kW in 50 kW steps — the pre-built financial decks. */
    const CAPACITIES_KW = Array.from({ length: 19 }, (_, index) => (index + 1) * 50);

    const ANNUAL_GENERATION_PER_KWP = 1533;
    const SELF_CONSUMPTION_PERCENT = 90;
    const EXPORT_PERCENT = 10;
    const EXPORT_RATE = 2.75;

    const LT_MAX_KW = 150;
    const NET_METERING_MAX_KWP = 500;
    const GROSS_METERING_MAX_KWP = 5000;

    const TARIFFS = {
        lt: { label: 'LT Category II', rate: 10.15 },
        ht: { label: 'HT at 11 kV', rate: 7.65 }
    };

    /** Bounds set centrally, not APERC's published windows. */
    const TOD = { solarDiscount: 0.20, peakUplift: 0.10 };

    function tariffFor(capacityKw) {
        return capacityKw <= LT_MAX_KW ? TARIFFS.lt : TARIFFS.ht;
    }

    /**
     * Every figure the C&I block prints for one capacity.
     *
     * Above the net metering ceiling there is nothing to export into, so those
     * units earn nothing rather than earning the surplus rate. That is the
     * single biggest thing the selector is there to show.
     */
    function figuresFor(capacityKw) {
        const tariff = tariffFor(capacityKw);
        const netMetered = capacityKw <= NET_METERING_MAX_KWP;

        const generationKwh = capacityKw * ANNUAL_GENERATION_PER_KWP;
        const selfKwh = generationKwh * (SELF_CONSUMPTION_PERCENT / 100);
        const surplusKwh = generationKwh * (EXPORT_PERCENT / 100);

        const surplusRate = netMetered ? EXPORT_RATE : 0;

        const selfValue = selfKwh * tariff.rate;
        const surplusValue = surplusKwh * surplusRate;
        const surplusIfSelfConsumed = surplusKwh * tariff.rate;

        const solarHourRate = tariff.rate * (1 - TOD.solarDiscount);
        const peakRate = tariff.rate * (1 + TOD.peakUplift);

        return {
            capacityKw,
            tariff,
            netMetered,
            meteringLabel: netMetered ? 'Net metering' : 'Export blocked',

            generationKwh,
            selfKwh,
            surplusKwh,

            surplusRate,
            selfValue,
            surplusValue,
            // What the surplus would have been worth used on site — the gap is
            // the whole argument for sizing to load rather than to roof.
            surplusIfSelfConsumed,
            surplusGap: surplusIfSelfConsumed - surplusValue,

            solarHourRate,
            peakRate,
            // A flat-tariff estimate values every generated unit at the normal
            // rate. Under ToD the plant only ever earns the solar-hour rate.
            todOverstatement: selfKwh * (tariff.rate - solarHourRate)
        };
    }

    return {
        CAPACITIES_KW,
        ANNUAL_GENERATION_PER_KWP,
        SELF_CONSUMPTION_PERCENT,
        EXPORT_PERCENT,
        EXPORT_RATE,
        LT_MAX_KW,
        NET_METERING_MAX_KWP,
        GROSS_METERING_MAX_KWP,
        TARIFFS,
        TOD,
        tariffFor,
        figuresFor
    };
});
