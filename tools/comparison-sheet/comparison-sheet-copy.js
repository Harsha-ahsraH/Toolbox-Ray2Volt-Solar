/**
 * Comparison Sheet — formatting and the sentences that vary with the numbers.
 *
 * The closing callout is written here rather than in the renderer because it
 * has to survive prices that are equal, or that fall from Option 1 to Option 3.
 * A sheet that divides by zero or prints a negative return per rupee in front
 * of a customer is worse than a sheet that says something duller.
 */
(function (root, factory) {
    'use strict';

    const copy = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = copy;
    }

    root.Ray2VoltComparisonCopy = copy;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const RUPEE = '₹';

    function rupees(value) {
        const rounded = Math.round(Math.abs(Number(value) || 0));
        return `${RUPEE} ${rounded.toLocaleString('en-IN')}`;
    }

    function units(value) {
        return `${Math.round(Number(value) || 0).toLocaleString('en-IN')} kWh`;
    }

    /** `28.85 lakh kWh` — the lifetime figure is unreadable in full digits. */
    function lakhUnits(value) {
        const lakhs = (Number(value) || 0) / 100000;
        return `${lakhs.toFixed(2)} lakh kWh`;
    }

    function rate(value) {
        return (Number(value) || 0).toFixed(2);
    }

    function money(value) {
        return `${RUPEE} ${rate(value)}`;
    }

    function years(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '—';
        return `${number.toFixed(1)} years`;
    }

    function amcCell(option) {
        const cell = `${rupees(option.amcRate)} / kWp / year`;
        if (!option.amcFreeYears) return cell;

        return option.amcFreeYears === 1
            ? `${cell}, Year 1 free`
            : `${cell}, Years 1–${option.amcFreeYears} free`;
    }

    function batteryCell(result, index) {
        if (!result.isHybrid || !result.batteryKwh) return '—';

        const usable = [0.5, 0.8, 0.9][index];
        const figure = (result.batteryKwh * usable).toFixed(1).replace(/\.0$/, '');

        return `${figure} kWh of ${result.batteryKwh} kWh installed`;
    }

    /**
     * The three closing sentences.
     *
     * The first adapts to the sign of the capital difference, so an Option 3
     * priced level with or below Option 1 still reads as English. The
     * rupees-per-rupee clause only appears when there is an extra rupee to
     * divide by.
     */
    function calloutLines(result) {
        const capitalDelta = result.capitalDelta;
        const benefitDelta = result.benefitDelta;
        const horizon = `${result.years} years`;

        const returnClause = benefitDelta >= 0
            ? `returns ${rupees(benefitDelta)} more over ${horizon}`
            : `returns ${rupees(benefitDelta)} less over ${horizon}`;

        let headline;
        if (Math.round(capitalDelta) > 0) {
            const perRupee = benefitDelta / capitalDelta;
            const tail = benefitDelta > 0
                ? ` — ${money(perRupee)} back for every additional rupee.`
                : '.';
            headline = `Option 3 costs ${rupees(capitalDelta)} more today and ${returnClause}${tail}`;
        } else if (Math.round(capitalDelta) === 0) {
            headline = `Option 3 costs the same as Option 1 today and ${returnClause}.`;
        } else {
            headline = `Option 3 costs ${rupees(capitalDelta)} less today and ${returnClause}.`;
        }

        const ownership = result.ownershipDelta >= 0
            ? `It is also ${rupees(result.ownershipDelta)} cheaper to own across the plant life than Option 1, despite the higher price today.`
            : `It does, however, cost ${rupees(result.ownershipDelta)} more to own across the plant life than Option 1.`;

        const spread = result.paybackSpread;
        const payback = spread <= 0.05
            ? `Payback is effectively identical across all three options — the difference is not when the investment is recovered, but how much the plant earns afterwards.`
            : `Payback is within ${spread.toFixed(1)} years across all three options — the difference is not when the investment is recovered, but how much the plant earns afterwards.`;

        return [headline, ownership, payback];
    }

    /**
     * Basis of calculation. Every assumption the reader cannot see in the
     * tables above, stated plainly — including the ones that flatter us.
     */
    function basisParagraph(result, model) {
        const parts = [
            `Basis of calculation. Specific yield ${model.SPECIFIC_YIELD[1]} kWh per kWp per year for fixed-tilt ground mount at this location.`,
            `Grid tariff ${money(model.TARIFF)} per kWh, held flat with no escalation assumed.`,
            `Analysis period ${result.years} years, which runs beyond the 25-year module performance warranty.`,
            `Rear-side gain taken at ${model.BIFACIAL_GAIN[0]}% for Options 1 and 2 and ${model.BIFACIAL_GAIN[2]}% for Option 3, reflecting the lower bifaciality factor of PERC cells.`,
            `Module degradation: TopCon ${model.DEGRADATION_YEAR_1[2]}% in year one then ${model.DEGRADATION_ANNUAL[2]}% per year; Mono PERC ${model.DEGRADATION_YEAR_1[1]}% then ${model.DEGRADATION_ANNUAL[1]}% per year; Option 1 modelled at ${model.DEGRADATION_ANNUAL[0]}% per year to reflect reduced maintenance.`,
            `Expected repairs assume three inverter replacements and structure remediation for Option 1, and two inverter replacements for Options 2 and 3.`
        ];

        if (result.isHybrid) {
            parts.push(
                `Battery replacement is assumed once within the ${result.years}-year period at ${rupees(model.BATTERY_REPLACEMENT_RATE)} per kWh at present rates; no second replacement is costed.`
            );
        }

        parts.push('Maintenance held at present rates throughout.');

        return parts.join(' ');
    }

    return {
        RUPEE,
        rupees,
        units,
        lakhUnits,
        rate,
        money,
        years,
        amcCell,
        batteryCell,
        calloutLines,
        basisParagraph
    };
});
