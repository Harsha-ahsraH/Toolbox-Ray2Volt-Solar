/**
 * Quote Generator - Comprehensive proposal insights
 * Ray2Volt Solar Toolbox
 *
 * The derived figures the redesigned Comprehensive pages draw on beyond the
 * core projection: IRR and ROI, the monthly generation shape, the energy
 * balance, the indicative schedule, milestone years, CO2 by year, parsed
 * warranty terms, the one-row-per-category BOM summary and the narrative
 * excerpts. Every value comes from existing inputs and the fixed tables in
 * quote-generator-config.js; nothing here is a new input.
 *
 * Kept apart from quote-generator-calc.js, which is near the repository's
 * per-file line budget. Renderers read these through `derived.insights` and
 * never calculate for themselves.
 */
(function (root, factory) {
    'use strict';
    const isNode = typeof require === 'function' && typeof module === 'object';
    const config = isNode ? require('./quote-generator-config.js') : root.QuoteGeneratorConfig;
    const content = isNode ? require('./quote-generator-content.js') : root.QuoteGeneratorContent;
    const model = isNode ? require('./quote-generator-model.js') : root.QuoteGeneratorModel;

    const api = factory(config, content, model);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorInsights = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Content, Model) {
    'use strict';

    const num = Model.num;
    const trimmed = Model.trimmed;

    function round(value, places) {
        const factor = Math.pow(10, places || 0);
        return Math.round((Number(value) || 0) * factor) / factor;
    }

    // ---------------------------------------------------------------------
    // Narrative excerpts
    // ---------------------------------------------------------------------

    /**
     * Shortens free text for a designed page, at a full stop where one falls
     * late enough, otherwise at a word with an ellipsis.
     */
    function excerpt(value, maxChars) {
        const text = trimmed(value);
        if (!maxChars || text.length <= maxChars) return text;

        const cut = text.slice(0, maxChars);
        const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf('.\n'));
        if (lastStop > maxChars * 0.6) return cut.slice(0, lastStop + 1);
        return cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : maxChars).trim() + '…';
    }

    /**
     * Each narrative field as printed on its designed page. `excerpted` is true
     * when any field was shortened, which is what puts the full text in
     * Annexure C.
     */
    function narrative(state) {
        const fields = {};
        let excerpted = false;

        Object.keys(Config.NARRATIVE_EXCERPTS).forEach(field => {
            const text = trimmed(state.projectNarrative && state.projectNarrative[field]);
            const short = excerpt(text, Config.NARRATIVE_EXCERPTS[field]);
            const cut = short !== text;
            if (cut) excerpted = true;
            fields[field] = { text, excerpt: short, excerpted: cut };
        });

        return { fields, excerpted };
    }

    // ---------------------------------------------------------------------
    // Returns
    // ---------------------------------------------------------------------

    function npv(rate, cashFlows) {
        return cashFlows.reduce((total, flow, year) => total + flow / Math.pow(1 + rate, year), 0);
    }

    /**
     * Internal rate of return of -investment followed by each year's net
     * saving, solved by bisection. Null when the savings never repay the
     * investment, so there is no positive return to state.
     */
    function irr(investment, savings) {
        const flows = [-num(investment)].concat(savings.map(value => num(value)));
        if (!(investment > 0) || npv(0, flows) <= 0) return null;

        let low = 0;
        let high = 1;
        while (npv(high, flows) > 0 && high < 1e3) high *= 2;

        for (let step = 0; step < 200; step++) {
            const middle = (low + high) / 2;
            if (npv(middle, flows) > 0) low = middle;
            else high = middle;
        }

        return round(((low + high) / 2) * 100, 1);
    }

    function returns(commercial, projection) {
        const investment = num(commercial.finalPrice);
        const savings = projection.rows.map(row => row.netSavings);

        return {
            investment,
            irrPercent: irr(investment, savings),
            roiPercent: investment > 0
                ? round(((projection.totalNetSavings - investment) / investment) * 100, 0) : null,
            netGain: round(projection.totalNetSavings - investment, 0),
            recovery: projection.rows.map(row => ({
                year: row.year,
                position: round(row.cumulativeNet - investment, 0)
            }))
        };
    }

    // ---------------------------------------------------------------------
    // Energy
    // ---------------------------------------------------------------------

    /** Year-1 generation shaped by the fixed seasonal profile, January first. */
    function monthlyGeneration(year1Kwh) {
        const profile = Config.SEASONAL_PROFILE;
        const total = profile.reduce((sum, value) => sum + value, 0);
        return profile.map(share => round((num(year1Kwh) * share) / total, 0));
    }

    /** Entered monthly imports, or null outside Detailed entry or when blank. */
    function monthlyConsumption(state) {
        if (state.savings.consumptionMethod !== 'detailed') return null;
        const values = (state.savings.monthlyRows || []).map(row => num(row.importedKwh));
        return values.some(value => value > 0) ? values : null;
    }

    /**
     * Where year-1 generation goes and how much of the site's use it covers.
     * The consumption half is null when no consumption was entered.
     */
    function energyBalance(state, projection, consumption) {
        const generation = projection.rows[0].generationKwh;
        const selfShare = num(state.savings.selfConsumptionPercent) / 100;
        const exportShare = num(state.savings.exportPercent) / 100;
        const selfKwh = generation * selfShare;
        const annualKwh = num(consumption.annualKwh);
        const covered = Math.min(annualKwh, selfKwh);

        return {
            generationKwh: round(generation, 0),
            selfKwh: round(selfKwh, 0),
            exportKwh: round(generation * exportShare, 0),
            selfPercent: round(selfShare * 100, 0),
            exportPercent: round(exportShare * 100, 0),
            site: annualKwh > 0 ? {
                consumptionKwh: round(annualKwh, 0),
                fromSolarKwh: round(covered, 0),
                fromGridKwh: round(annualKwh - covered, 0),
                solarSharePercent: round((covered / annualKwh) * 100, 0)
            } : null,
            value: {
                selfSavings: projection.rows[0].selfSavings,
                exportCredit: projection.rows[0].exportCredit,
                grossSavings: projection.rows[0].grossSavings
            }
        };
    }

    /** Share of the year the plant would run at full DC rating to make its energy. */
    function capacityFactor(dcKwp, year1Kwh) {
        return num(dcKwp) > 0 ? round((num(year1Kwh) / (num(dcKwp) * 8760)) * 100, 1) : null;
    }

    /** Years 1, 5, 10 ... and the final year of the projection. */
    function milestoneYears(projection) {
        const years = [1, 5, 10, 15, 20, 25, 30, projection.years]
            .filter((year, index, list) => year <= projection.years && list.indexOf(year) === index);
        return years.map(year => projection.rows[year - 1]);
    }

    /** Column totals for the year-by-year table (Annexure B). */
    function projectionTotals(projection) {
        const sum = key => round(projection.rows.reduce((total, row) => total + num(row[key]), 0), 0);
        return { selfSavings: sum('selfSavings'), exportCredit: sum('exportCredit'), grossSavings: sum('grossSavings') };
    }

    function co2ByYear(projection) {
        const factor = Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh;
        return projection.rows.map(row => round((row.generationKwh * factor) / 1000, 1));
    }

    // ---------------------------------------------------------------------
    // Delivery
    // ---------------------------------------------------------------------

    /** The indicative schedule for the plant size, in weeks from order. */
    function schedule(dcKwp) {
        const band = Config.SCHEDULE_BANDS.filter(entry => num(dcKwp) <= entry.maxKwp)[0]
            || Config.SCHEDULE_BANDS[Config.SCHEDULE_BANDS.length - 1];
        const half = value => Math.round(value * band.weeks * 2) / 2;

        return {
            weeks: band.weeks,
            phases: Config.SCHEDULE_PHASES.map(phase => ({
                title: phase.title,
                owner: phase.owner,
                start: half(phase.start),
                end: half(phase.end)
            }))
        };
    }

    // ---------------------------------------------------------------------
    // Bill of materials
    // ---------------------------------------------------------------------

    /** Non-empty BOM categories for the configuration, with their rows, in order. */
    function activeBomCategories(state) {
        return Config.BOM_CATEGORIES
            .filter(category => !category.configurations
                || category.configurations.indexOf(state.project.systemConfiguration) !== -1)
            .map(category => {
                const stored = Model.getBomCategory(state, category.id);
                const rows = stored
                    ? stored.rows.filter(row => trimmed(row.name) || trimmed(row.specification))
                    : [];
                return { id: category.id, label: category.label, rows };
            })
            .filter(category => category.rows.length > 0);
    }

    /**
     * Warranty wording split into its terms: "12 yr product / 30 yr
     * performance" is two terms of 12 and 30 years. Text without a period in
     * years ("As per manufacturer", "—") has no terms.
     */
    function warrantyTerms(text) {
        const terms = [];
        trimmed(text).split(/\s*(?:\/|,|;|\+|\band\b)\s*/i).forEach(part => {
            const match = part.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i);
            if (!match) return;
            const label = part.replace(match[0], ' ').replace(/[^a-z ]/gi, ' ').replace(/\s+/g, ' ').trim()
                .toLowerCase();
            terms.push({ years: Number(match[1]), label });
        });
        return terms;
    }

    /** One warranty line per term, from the first row in each category that states one. */
    function warranties(state) {
        const lines = [];

        activeBomCategories(state).forEach(category => {
            const row = category.rows.filter(entry => warrantyTerms(entry.warranty).length)[0];
            if (!row) return;
            warrantyTerms(row.warranty).forEach(term => lines.push({
                categoryId: category.id,
                label: category.label,
                term: term.label,
                years: term.years,
                make: trimmed(row.make)
            }));
        });

        return lines;
    }

    /** The BOM summary: one row per category with its lead item, makes and quantity. */
    function bomSummary(state) {
        return activeBomCategories(state).map(category => {
            const rows = category.rows;
            const lead = rows[0];
            // "JSW / TATA / Reputed" and "Reputed" list three makes, not four.
            const makes = [].concat(...rows.map(row => trimmed(row.make).split(/[/,]/)))
                .map(make => make.trim()).filter(Boolean)
                .filter((make, index, list) => list.indexOf(make) === index);
            // A single row states its own quantity; several rows add up only
            // when each is counted in numbers ("Lot" and "Job" do not add).
            const units = rows.map(row => trimmed(row.unit));
            const sameUnit = rows.length === 1 ? Boolean(units[0])
                : units.every(unit => unit === 'Nos');
            const quantity = rows.reduce((total, row) => total + num(row.quantity), 0);
            const warranty = rows.map(row => trimmed(row.warranty))
                .filter(text => text && text !== '—')[0] || '';

            return {
                id: category.id,
                label: category.label,
                itemCount: rows.length,
                lead: trimmed(lead.specification) || trimmed(lead.name),
                leadName: trimmed(lead.name),
                makes,
                quantity: sameUnit && quantity > 0 ? { amount: round(quantity, 2), unit: units[0] } : null,
                warranty
            };
        });
    }

    // ---------------------------------------------------------------------
    // Everything the Comprehensive pages read, on derived.insights
    // ---------------------------------------------------------------------

    function build(state, base) {
        const projection = base.projection;

        return {
            returns: returns(base.commercial, projection),
            monthlyGeneration: monthlyGeneration(projection.rows[0].generationKwh),
            monthlyConsumption: monthlyConsumption(state),
            energy: energyBalance(state, projection, base.consumption),
            capacityFactor: capacityFactor(state.project.dcCapacityKwp, projection.rows[0].generationKwh),
            milestoneRows: milestoneYears(projection),
            projectionTotals: projectionTotals(projection),
            co2ByYear: co2ByYear(projection),
            schedule: schedule(state.project.dcCapacityKwp),
            warranties: warranties(state),
            bomSummary: bomSummary(state),
            narrative: narrative(state)
        };
    }

    return {
        build,
        excerpt,
        narrative,
        irr,
        returns,
        monthlyGeneration,
        monthlyConsumption,
        energyBalance,
        capacityFactor,
        milestoneYears,
        projectionTotals,
        co2ByYear,
        schedule,
        activeBomCategories,
        warrantyTerms,
        warranties,
        bomSummary
    };
}));
