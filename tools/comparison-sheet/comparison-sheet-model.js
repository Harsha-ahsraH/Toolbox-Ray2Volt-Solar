/**
 * Comparison Sheet — calculation engine.
 *
 * Pure: no DOM, no formatting, no document generation. Everything the sheet
 * prints comes out of `compute()`; the renderer only lays out the object it
 * returns. That is what lets the numbers be unit-tested, and what stops the
 * screen and the printed page disagreeing.
 *
 * Every assumption lives here as a named constant rather than on the form —
 * the team enters capacity, type and three prices, nothing else.
 */
(function (root, factory) {
    'use strict';

    const model = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = model;
    }

    root.Ray2VoltComparisonModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const OPTION_COUNT = 3;

    /** Analysis horizon. Runs five years past the module performance warranty. */
    const ANALYSIS_YEARS = 30;

    /** Grid tariff, held flat for the whole horizon — no escalation assumed. */
    const TARIFF = 8.00;

    /** kWh per kWp per year, fixed-tilt ground mount. Option 1 carries a
     *  50 kWh penalty for reduced maintenance. */
    const SPECIFIC_YIELD = [1500, 1550, 1550];

    /** Rear-side gain, per cent. PERC bifacial recovers less rear irradiance
     *  than TopCon, so Options 1 and 2 gain less than Option 3. */
    const BIFACIAL_GAIN = [4.5, 4.5, 7];

    /** Printed range for the rear-side row, matching BIFACIAL_GAIN. */
    const BIFACIAL_TEXT = ['+4 to 5% on ground mount', '+4 to 5% on ground mount', '+6 to 8% on ground mount'];

    /** First-year drop, then the annual rate thereafter. Per cent. */
    const DEGRADATION_YEAR_1 = [2.0, 2.0, 1.0];
    const DEGRADATION_ANNUAL = [0.70, 0.55, 0.40];

    const AMC_RATE = [850, 720, 600];
    const AMC_FREE_YEARS = [0, 0, 1];

    /**
     * Expected repairs, rupees per kWp, on a 30-year basis: three inverter
     * replacements plus structure remediation for Option 1, two inverter
     * replacements for Options 2 and 3.
     */
    const REPAIR_RATE = [12774, 8000, 7000];

    /** One battery replacement inside the horizon, at present module rates. */
    const BATTERY_REPLACEMENT_RATE = 12000;
    const BATTERY_REPLACEMENTS = 1;

    /**
     * Earth pits for Option 3 by capacity. Options 1 and 2 take two fewer,
     * with a floor of three pits for any option at any capacity.
     */
    const EARTHING_BANDS = [
        { maxKwp: 10, pits: 3 },
        { maxKwp: 20, pits: 4 },
        { maxKwp: 50, pits: 6 },
        { maxKwp: 250, pits: 8 },
        { maxKwp: 500, pits: 10 },
        { maxKwp: 1000, pits: 12 }
    ];

    const MINIMUM_PITS = 3;

    const EARTHING_LABELS = [
        { singular: 'GI rod pit', plural: 'GI rod pits' },
        { singular: 'chemical electrode', plural: 'chemical electrodes' },
        {
            singular: 'chemical electrode with backfill compound',
            plural: 'chemical electrodes with backfill compound'
        }
    ];

    function number(value, fallback = 0) {
        const parsed = typeof value === 'number' ? value : parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    /** Option 3's pit count. Above 1 MWp the schedule adds 2 pits per MWp band. */
    function optionThreePits(capacityKwp) {
        const capacity = number(capacityKwp);
        const band = EARTHING_BANDS.find(entry => capacity <= entry.maxKwp);
        if (band) return band.pits;

        const lastBand = EARTHING_BANDS[EARTHING_BANDS.length - 1];
        const extraBands = Math.ceil((capacity - lastBand.maxKwp) / 1000);

        return lastBand.pits + 2 * extraBands;
    }

    /** Pit counts for all three options, floor applied. */
    function earthingCounts(capacityKwp) {
        const base = optionThreePits(capacityKwp);
        const lower = Math.max(MINIMUM_PITS, base - 2);

        return [lower, lower, Math.max(MINIMUM_PITS, base)];
    }

    /**
     * `6 GI rod pits`, `8 chemical electrodes with backfill compound`. The
     * count is shared between Options 1 and 2; the electrode type is what
     * tells them apart.
     */
    function earthingText(capacityKwp) {
        return earthingCounts(capacityKwp).map((count, index) => {
            const label = EARTHING_LABELS[index];
            return `${count} ${count === 1 ? label.singular : label.plural}`;
        });
    }

    function totalFromRate(ratePerWp, capacityKwp) {
        return number(ratePerWp) * number(capacityKwp) * 1000;
    }

    function rateFromTotal(total, capacityKwp) {
        const watts = number(capacityKwp) * 1000;
        return watts > 0 ? number(total) / watts : 0;
    }

    /**
     * Year-by-year output for one option. Year 1 is the nameplate yield with
     * rear-side gain applied; the first-year drop lands on year 2, which is
     * what makes the printed year-1 figure a number the customer can check
     * against the module datasheet.
     */
    function generationSeries(capacityKwp, index, years) {
        const yearOne = number(capacityKwp) * SPECIFIC_YIELD[index] * (1 + BIFACIAL_GAIN[index] / 100);
        const series = [yearOne];

        for (let year = 2; year <= years; year++) {
            const rate = year === 2 ? DEGRADATION_YEAR_1[index] : DEGRADATION_ANNUAL[index];
            series.push(series[series.length - 1] * (1 - rate / 100));
        }

        return series;
    }

    function sum(values) {
        return values.reduce((total, value) => total + value, 0);
    }

    /**
     * One option's full economics.
     *
     * `netBenefit` is lifetime generation valued at the tariff, less every
     * rupee the plant costs to buy and keep. It is the figure the closing
     * callout compares across options.
     */
    function computeOption(index, capacityKwp, capitalCost, batteryKwh, isHybrid, years) {
        const capacity = number(capacityKwp);
        const series = generationSeries(capacity, index, years);
        const totalGeneration = sum(series);

        const maintenance = AMC_RATE[index] * capacity * Math.max(0, years - AMC_FREE_YEARS[index]);
        const batteryCost = isHybrid
            ? number(batteryKwh) * BATTERY_REPLACEMENT_RATE * BATTERY_REPLACEMENTS
            : 0;
        const repairs = REPAIR_RATE[index] * capacity + batteryCost;

        const capital = number(capitalCost);
        const totalCostOfOwnership = capital + maintenance + repairs;
        const lifetimeSavings = totalGeneration * TARIFF;
        const yearOneSavings = series[0] * TARIFF;

        return {
            label: index,
            capitalCost: capital,
            ratePerWp: rateFromTotal(capital, capacity),
            maintenance,
            repairs,
            batteryCost,
            totalCostOfOwnership,
            yearOneGeneration: series[0],
            totalGeneration,
            lifetimeSavings,
            netBenefit: lifetimeSavings - totalCostOfOwnership,
            payback: yearOneSavings > 0 ? capital / yearOneSavings : Infinity,
            lcoe: totalGeneration > 0 ? totalCostOfOwnership / totalGeneration : 0,
            amcRate: AMC_RATE[index],
            amcFreeYears: AMC_FREE_YEARS[index]
        };
    }

    /**
     * The whole sheet.
     *
     * `prices` are read according to `priceMode`: 'rate' means rupees per Wp
     * ex-GST, 'total' means the whole ex-GST project cost. Both figures are
     * returned either way, because the sheet prints both.
     */
    function compute(inputs) {
        const options = inputs || {};
        const capacityKwp = number(options.capacityKwp);
        const systemType = options.systemType === 'hybrid' ? 'hybrid' : 'on-grid';
        const isHybrid = systemType === 'hybrid';
        const batteryKwh = isHybrid ? number(options.batteryKwh) : 0;
        const years = Math.max(1, Math.round(number(options.years, ANALYSIS_YEARS)));
        const priceMode = options.priceMode === 'total' ? 'total' : 'rate';

        const supplied = Array.isArray(options.prices) ? options.prices : [];
        const capitalCosts = Array.from({ length: OPTION_COUNT }, (unused, index) => {
            const value = number(supplied[index]);
            return priceMode === 'total' ? value : totalFromRate(value, capacityKwp);
        });

        const computed = capitalCosts.map((capital, index) =>
            computeOption(index, capacityKwp, capital, batteryKwh, isHybrid, years)
        );

        const paybacks = computed.map(option => option.payback).filter(Number.isFinite);

        return {
            capacityKwp,
            systemType,
            isHybrid,
            batteryKwh,
            years,
            priceMode,
            tariff: TARIFF,
            options: computed,
            earthing: earthingText(capacityKwp),
            earthingCounts: earthingCounts(capacityKwp),
            bifacialText: BIFACIAL_TEXT.slice(),
            capitalDelta: computed[2].capitalCost - computed[0].capitalCost,
            benefitDelta: computed[2].netBenefit - computed[0].netBenefit,
            ownershipDelta: computed[0].totalCostOfOwnership - computed[2].totalCostOfOwnership,
            paybackSpread: paybacks.length ? Math.max(...paybacks) - Math.min(...paybacks) : 0,
            ascending:
                computed[0].capitalCost < computed[1].capitalCost &&
                computed[1].capitalCost < computed[2].capitalCost
        };
    }

    return {
        OPTION_COUNT,
        ANALYSIS_YEARS,
        TARIFF,
        SPECIFIC_YIELD,
        BIFACIAL_GAIN,
        BIFACIAL_TEXT,
        DEGRADATION_YEAR_1,
        DEGRADATION_ANNUAL,
        AMC_RATE,
        AMC_FREE_YEARS,
        REPAIR_RATE,
        BATTERY_REPLACEMENT_RATE,
        BATTERY_REPLACEMENTS,
        MINIMUM_PITS,
        optionThreePits,
        earthingCounts,
        earthingText,
        totalFromRate,
        rateFromTotal,
        generationSeries,
        compute
    };
});
