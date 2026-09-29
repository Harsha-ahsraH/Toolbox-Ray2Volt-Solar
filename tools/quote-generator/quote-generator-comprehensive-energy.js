/**
 * Quote Generator - Comprehensive §04-§05: energy, savings and returns
 * Ray2Volt Solar Toolbox
 *
 * Pages 8-12: generation, where the energy goes, savings, returns and the
 * environmental benefit. Each is a fixed A4 composition whose chart grows
 * into the height the page has left. Every figure arrives on
 * `context.derived` (the projection and derived.insights); nothing here
 * calculates a business number.
 */
(function (root) {
    'use strict';

    const Content = root.QuoteGeneratorContent;
    const Pages = root.QuoteGeneratorPages;
    const Charts = root.QuoteGeneratorCharts;

    if (!Pages || !Pages.design || !Charts) {
        console.error('Comprehensive page helpers are missing; load the front matter first.');
        return;
    }

    const { esc, number } = Pages.helpers;
    const {
        chapterNumber, opener, kpi, kpiMoney, designedPage, section, figure, energyParts, energyText, meteringLabel
    } = Pages.design;
    const { icon, inr } = Charts;

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /** Energy on a chart axis, in full: "40,000", "1,50,000". */
    function kwhAxis(value) {
        return number(value, 0);
    }

    /** Rupees on a chart axis, in full. */
    function inrAxis(value) {
        return value === 0 ? '₹0' : inr(value);
    }

    /** Year ticks every five years, plus the first and the last. */
    function everyFifth(years) {
        return index => index === 0 || index === years - 1 || (index + 1) % 5 === 0;
    }

    function callout(iconName, title, text, optional) {
        return `
            <div class="cq-callout is-assume"${optional ? ' data-optional' : ''}>
                ${icon(iconName)}
                <div><strong>${esc(title)}</strong> ${text}</div>
            </div>`;
    }

    // ---------------------------------------------------------------------
    // P8. Generation
    // ---------------------------------------------------------------------

    Pages.register('generation', context => {
        const { state, derived } = context;
        const insights = derived.insights;
        const projection = derived.projection;
        const year1 = projection.rows[0].generationKwh;
        const last = projection.rows[projection.rows.length - 1];
        const site = insights.energy.site;
        const consumption = insights.monthlyConsumption;
        const first = energyParts(year1);
        const lifetime = energyParts(projection.totalGenerationKwh);
        const takeaway = `Your plant will generate ${energyText(year1)} in its first year`
            + (site ? `, meeting ${site.solarSharePercent}% of what your site uses.` : '.');

        const monthly = Charts.columns({
            categories: MONTHS,
            series: [{ kind: 'solar', values: insights.monthlyGeneration }]
                .concat(consumption ? [{ kind: 'grid', values: consumption }] : []),
            format: kwhAxis,
            ticks: 4,
            labels: consumption ? [] : [{ series: 0, index: 2 }, { series: 0, index: 6 }]
        });
        const annual = Charts.columns({
            categories: projection.rows.map(row => String(row.year)),
            series: [{ kind: 'solar', values: projection.rows.map(row => row.generationKwh) }],
            format: kwhAxis,
            ticks: 4,
            showCategory: everyFifth(projection.years),
            labels: [{ series: 0, index: 0 }, { series: 0, index: projection.years - 1 }]
        });

        return designedPage('Energy', 'What the plant generates', `
            ${opener(chapterNumber(context, 'energy'), takeaway,
                'Generation month by month in the first year, and year by year over the projection.')}

            <div class="cq-g4">
                ${kpi('sun', 'Year-1 generation', first.value, first.unit, 'In the first twelve months')}
                ${kpi('gauge', 'Specific yield', number(state.savings.annualGenerationPerKwp, 0), 'kWh/kWp', 'Each kWp, in a year')}
                ${kpi('layers', `${projection.years}-year generation`, lifetime.value, lifetime.unit, 'After degradation')}
                ${kpi('clock', 'Capacity factor', insights.capacityFactor === null ? '—' : number(insights.capacityFactor, 1), '%',
                    'Energy ÷ (DC rating × 8,760 h)')}
            </div>

            ${figure(consumption ? 'Monthly generation against your use, year 1' : 'Monthly generation, year 1', monthly, {
                className: 'cq-grow cq-grow-lg',
                legend: consumption
                    ? [{ kind: 'solar', label: 'Solar generation' }, { kind: 'grid', label: 'Your use (from bills)' }] : [],
                caption: 'kWh a month. Months follow a typical seasonal profile for the region: highest in spring, '
                    + 'lowest in the monsoon. Actual output varies with the weather in each year.'
            })}

            ${figure(`Annual generation over ${projection.years} years`, annual, {
                className: 'cq-grow',
                caption: `kWh a year, falling ${number(state.savings.degradationPercent, 2)}% a year as the modules age, `
                    + `to ${energyText(last.generationKwh)} in year ${last.year}.`
            })}`);
    });

    // ---------------------------------------------------------------------
    // P9. Where the energy goes
    // ---------------------------------------------------------------------

    function balanceRows(energy) {
        const row = (label, kwh, share, value, strong) => `
            <tr${strong ? ' class="cq-row-strong"' : ''}><td>${esc(label)}</td>
                <td class="cq-num">${number(kwh, 0)}</td>
                <td class="cq-num">${share === null ? '' : `${number(share, 0)}%`}</td>
                <td>${share === null ? '' : Charts.meter(share)}</td>
                <td class="cq-num">${value === null ? '—' : esc(inr(value))}</td></tr>`;
        const site = energy.site;

        return [
            row('Solar generation', energy.generationKwh, 100, energy.value.grossSavings, true),
            row('Used on site', energy.selfKwh, energy.selfPercent, energy.value.selfSavings),
            row('Exported to the grid', energy.exportKwh, energy.exportPercent, energy.value.exportCredit)
        ].concat(site ? [
            row('Your site uses', site.consumptionKwh, 100, null, true),
            row('Met by solar', site.fromSolarKwh, site.solarSharePercent, null),
            row('Still drawn from the grid', site.fromGridKwh, 100 - site.solarSharePercent, null)
        ] : []).join('');
    }

    Pages.register('energy-use', context => {
        const { state, derived } = context;
        const energy = derived.insights.energy;
        const site = energy.site;
        const takeaway = energy.exportPercent > 0
            ? `${energy.selfPercent}% of the energy is used on site; ${energy.exportPercent}% earns export credit.`
            : `All of the energy is used on site, at the tariff you pay today.`;

        const ring = Charts.donut([
            { value: energy.selfKwh, kind: 'plant' },
            { value: energy.exportKwh, kind: 'export' }
        ], `${energy.selfPercent}%`, 'used on site');
        const value = Charts.hbars({
            rows: [
                { label: 'Energy used on site', note: `${number(energy.selfKwh, 0)} kWh at the tariff`,
                    value: energy.value.selfSavings, text: inr(energy.value.selfSavings), kind: 'plant' },
                { label: 'Export credit', note: `${number(energy.exportKwh, 0)} kWh at the credit rate`,
                    value: energy.value.exportCredit, text: inr(energy.value.exportCredit), kind: 'export' }
            ]
        });
        const sources = site ? Charts.hbars({
            rows: [
                { label: 'From your plant', note: 'Solar energy used on site', value: site.fromSolarKwh,
                    text: `${energyText(site.fromSolarKwh)} · ${site.solarSharePercent}%`, kind: 'plant' },
                { label: 'From the grid', note: 'Bought at the tariff', value: site.fromGridKwh,
                    text: `${energyText(site.fromGridKwh)} · ${100 - site.solarSharePercent}%`, kind: 'grid' }
            ],
            max: site.consumptionKwh
        }) : '';
        // Without the site's consumption there is no source split to draw;
        // show instead what each unit earns, now and in the last year.
        const first = derived.projection.rows[0];
        const final = derived.projection.rows[derived.projection.rows.length - 1];
        const rates = site ? '' : `
            <table class="cq-table cq-rate-table">
                <colgroup><col style="width:52%"><col style="width:24%"><col></colgroup>
                <thead><tr><th>Each unit</th><th class="cq-num">Year 1</th><th class="cq-num">Year ${final.year}</th></tr></thead>
                <tbody>
                    <tr><td>Used on site, at the tariff</td><td class="cq-num">₹${number(first.tariff, 2)}</td><td class="cq-num">₹${number(final.tariff, 2)}</td></tr>
                    <tr><td>Exported, at the credit rate</td><td class="cq-num">₹${number(first.exportRate, 2)}</td><td class="cq-num">₹${number(final.exportRate, 2)}</td></tr>
                </tbody>
            </table>`;

        return designedPage('Energy', 'Where the energy goes', `
            ${opener(chapterNumber(context, 'energy'), takeaway,
                'How year-1 generation divides between your load and the grid, and what each part is worth.')}

            <div class="cq-split cq-fill">
                ${figure('Where the solar energy goes, year 1', `<div class="cq-ring-wrap">${ring}</div>`, {
                    className: 'cq-fig-ring',
                    legend: [{ kind: 'plant', label: `Used on site ${energy.selfPercent}%` },
                        { kind: 'export', label: `Exported ${energy.exportPercent}%` }]
                })}
                <div class="cq-stack-col">
                    ${figure('What it is worth, year 1', value, {
                        caption: `${esc(inr(energy.value.grossSavings))} in all, before running costs.`
                    })}
                    ${site ? figure('Where your electricity comes from, year 1', sources)
                        : figure('What each unit is worth', rates, {
                            caption: `Per kWh. Both rise ${esc(number(state.savings.tariffEscalationPercent, 1))}% a year in this projection.`
                        })}
                </div>
            </div>

            ${section('Year-1 energy balance', `
                <table class="cq-table cq-balance-table">
                    <colgroup><col style="width:30%"><col style="width:16%"><col style="width:10%"><col><col style="width:16%"></colgroup>
                    <thead><tr><th>Energy</th><th class="cq-num">kWh</th><th class="cq-num">Share</th><th></th><th class="cq-num">Value</th></tr></thead>
                    <tbody>${balanceRows(energy)}</tbody>
                </table>`)}

            ${callout('info', `${esc(meteringLabel(state))}.`,
                'Generation serves the site load first. The share that cannot be used on site at the moment it is '
                + 'generated is exported and credited under the metering arrangement sanctioned by the distribution '
                + 'licensee.')}
            ${callout('alert', 'The used-on-site share is an assumption.',
                `This proposal assumes ${number(state.savings.selfConsumptionPercent, 0)}% of generation is used on site. `
                + 'The real share depends on how your load lines up with the hours of sunshine, and is best confirmed '
                + 'from interval meter data.', true)}`);
    });

    // ---------------------------------------------------------------------
    // P10. Savings
    // ---------------------------------------------------------------------

    Pages.register('savings', context => {
        const { derived } = context;
        const projection = derived.projection;
        const year1 = projection.rows[0];
        const last = projection.rows[projection.rows.length - 1];
        const first = kpiMoney(year1.netSavings);
        const total = kpiMoney(projection.totalNetSavings);
        const final = kpiMoney(last.netSavings);
        const costs = kpiMoney(projection.totalCosts);
        const takeaway = last.netSavings > year1.netSavings
            ? `${inr(year1.netSavings)} saved in year 1, rising to ${inr(last.netSavings)} by year ${last.year}.`
            : `${inr(year1.netSavings)} saved in year 1 and ${inr(projection.totalNetSavings)} over ${projection.years} years.`;

        const chart = Charts.columns({
            categories: projection.rows.map(row => String(row.year)),
            series: [{ kind: 'plant', values: projection.rows.map(row => row.netSavings) }],
            format: inrAxis,
            ticks: 4,
            showCategory: everyFifth(projection.years),
            labels: [{ series: 0, index: 0 }, { series: 0, index: projection.years - 1 }]
        });
        const rows = derived.insights.milestoneRows.map(row => `
            <tr><td>Year ${row.year}</td>
                <td class="cq-num">${number(row.generationKwh, 0)}</td>
                <td class="cq-num">₹${number(row.tariff, 2)}</td>
                <td class="cq-num">${esc(inr(row.grossSavings))}</td>
                <td class="cq-num">${row.costs > 0 ? esc(inr(row.costs)) : '—'}</td>
                <td class="cq-num">${esc(inr(row.netSavings))}</td>
                <td class="cq-num"><strong>${esc(inr(row.cumulativeNet))}</strong></td></tr>`).join('');

        return designedPage('Savings & Returns', 'What the plant saves', `
            ${opener(chapterNumber(context, 'returns'), takeaway,
                'Net savings each year after running costs, as the tariff rises and the modules age.')}

            <div class="cq-g4">
                ${kpi('rupee', 'Year-1 net saving', first.value, first.unit, 'After running costs')}
                ${kpi('trend', `Year-${last.year} net saving`, final.value, final.unit, 'At the escalated tariff')}
                ${kpi('layers', `${projection.years}-year net saving`, total.value, total.unit, 'After running costs')}
                ${kpi('tool', 'Running costs', projection.totalCosts > 0 ? costs.value : '—', projection.totalCosts > 0 ? costs.unit : '',
                    projection.totalCosts > 0 ? `Over ${projection.years} years` : 'None entered')}
            </div>

            ${figure('Net savings each year', chart, {
                className: 'cq-grow cq-grow-lg',
                caption: 'Value of energy used on site plus export credit, less running costs, in each year of the projection.'
            })}

            ${section('At milestone years', `
                <table class="cq-table cq-milestone-years">
                    <thead><tr><th>Year</th><th class="cq-num">Generation (kWh)</th><th class="cq-num">Tariff</th>
                        <th class="cq-num">Gross saving</th><th class="cq-num">Running costs</th>
                        <th class="cq-num">Net saving</th><th class="cq-num">Cumulative</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>`)}

            ${callout('info', 'The basis.',
                'Figures follow the assumptions on the design basis page. The tariff and export credit rise each year '
                + 'by the stated escalation; generation falls by the degradation rate. Every year is listed in Annexure B.')}`);
    });

    // ---------------------------------------------------------------------
    // P11. Returns
    // ---------------------------------------------------------------------

    Pages.register('returns', context => {
        const { derived } = context;
        const projection = derived.projection;
        const returns = derived.insights.returns;
        const payback = derived.payback;
        const unit = derived.beforeAfter.costPerUnit;
        const price = kpiMoney(returns.investment);
        const total = kpiMoney(projection.totalNetSavings);
        const recovered = payback !== null && payback > 0;
        const takeaway = recovered
            ? `The plant pays for itself in ${number(payback, 1)} years, then returns ${inr(returns.netGain)} more.`
            : `Over ${projection.years} years the savings come to ${inr(projection.totalNetSavings)}.`;

        const chart = Charts.columns({
            categories: returns.recovery.map(row => String(row.year)),
            series: [{ kind: 'plant', values: returns.recovery.map(row => row.position) }],
            kindOf: value => (value < 0 ? 'grid' : 'plant'),
            format: inrAxis,
            ticks: 5,
            showCategory: everyFifth(projection.years),
            labels: [{ series: 0, index: 0 }, { series: 0, index: projection.years - 1 }],
            marker: recovered ? { index: Math.min(projection.years - 1, Math.ceil(payback) - 1),
                text: `Payback ${number(payback, 1)} yrs` } : null
        });
        const row = (label, value, note) => `
            <tr><td>${esc(label)}</td><td class="cq-num"><strong>${value}</strong></td><td>${esc(note)}</td></tr>`;

        return designedPage('Savings & Returns', 'Payback and return on investment', `
            ${opener(chapterNumber(context, 'returns'), takeaway,
                'The investment against the savings it earns: when it is recovered and what it returns.')}

            <div class="cq-g4">
                ${kpi('rupee', 'Investment', price.value, price.unit, 'Offered price incl. GST')}
                ${kpi('clock', 'Payback', recovered ? number(payback, 1) : '—', recovered ? 'years' : '',
                    recovered ? 'Cumulative saving equals the price' : `Not within ${projection.years} years`)}
                ${kpi('trend', 'IRR', returns.irrPercent === null ? 'n/a' : number(returns.irrPercent, 1), returns.irrPercent === null ? '' : '%',
                    returns.roiPercent === null ? '' : `ROI ${number(returns.roiPercent, 0)}% over ${projection.years} years`)}
                ${kpi('zap', 'Cost per unit', unit.withSolar === null ? '—' : `₹${number(unit.withSolar, 2)}`, '/kWh',
                    `Against ₹${number(unit.today, 2)}/kWh from the grid`)}
            </div>

            ${figure('Your position, year by year', chart, {
                className: 'cq-grow cq-grow-lg',
                legend: [{ kind: 'grid', label: 'Still recovering the price' }, { kind: 'plant', label: 'Net gain' }],
                caption: 'Cumulative net savings less the offered price, at the end of each year.'
            })}

            <div class="cq-split">
                ${section('The return in figures', `
                    <table class="cq-table cq-returns-table">
                        <colgroup><col style="width:39%"><col style="width:25%"><col></colgroup>
                        <tbody>
                            ${row('Offered price', esc(inr(returns.investment)), 'Including GST')}
                            ${row(`${projection.years}-year net saving`, esc(inr(projection.totalNetSavings)), 'After running costs')}
                            ${row('Net gain', esc(inr(returns.netGain)), 'Savings less the price')}
                            ${row('Return on investment', returns.roiPercent === null ? '—' : `${number(returns.roiPercent, 0)}%`, 'Net gain ÷ price')}
                            ${row('Internal rate of return', returns.irrPercent === null ? 'n/a' : `${number(returns.irrPercent, 1)}%`, 'A year, over the projection')}
                            ${row('Cost per unit', unit.withSolar === null ? '—' : `₹${number(unit.withSolar, 2)}/kWh`, 'Price and running costs ÷ lifetime kWh')}
                        </tbody>
                    </table>`)}
                ${section('Reading the numbers', `
                    <div class="cq-explain">
                        <p><strong>Payback</strong> is the simple point at which the savings add up to the price; it does not
                            discount later years.</p>
                        <p><strong>IRR</strong> is the yearly interest rate a deposit would need to earn to match this
                            investment, so it can be set against your cost of capital.</p>
                        <p data-optional><strong>Cost per unit</strong> spreads the price and running costs over every unit the
                            plant generates, for comparison with the tariff.</p>
                    </div>`)}
            </div>`);
    });

    // ---------------------------------------------------------------------
    // P12. Environmental benefit
    // ---------------------------------------------------------------------

    Pages.register('environment', context => {
        const { derived } = context;
        const projection = derived.projection;
        const environmental = derived.environmental;
        const co2 = derived.insights.co2ByYear;
        const pictogram = Charts.trees(environmental.treesEquivalent);
        const clean = energyParts(projection.totalGenerationKwh);

        const chart = Charts.columns({
            categories: projection.rows.map(row => String(row.year)),
            series: [{ kind: 'plant', values: co2 }],
            format: value => (value === 0 ? '0' : number(value, value < 10 ? 1 : 0)),
            ticks: 4,
            showCategory: everyFifth(projection.years),
            labels: [{ series: 0, index: 0 }, { series: 0, index: projection.years - 1 }]
        });

        return designedPage('Savings & Returns', 'Environmental benefit', `
            ${opener(chapterNumber(context, 'returns'),
                `${number(environmental.co2Tonnes, 0)} tonnes of CO₂ kept out of the air over ${projection.years} years.`,
                'The grid electricity the plant replaces, expressed as carbon dioxide avoided.')}

            <div class="cq-g4">
                ${kpi('leaf', 'CO₂ avoided', number(environmental.co2Tonnes, 0), 'tonnes', `Over ${projection.years} years`)}
                ${kpi('leaf', 'Year-1 CO₂ avoided', number(co2[0], 1), 'tonnes', 'In the first year')}
                ${kpi('earth', 'Tree equivalent', number(environmental.treesEquivalent, 0), 'trees', 'Illustrative conversion')}
                ${kpi('sun', 'Clean energy', clean.value, clean.unit, `Generated over ${projection.years} years`)}
            </div>

            ${figure('The same carbon, in trees', pictogram.html, {
                className: 'cq-fig-trees',
                caption: `Each mark stands for ${number(pictogram.each, 0)} ${pictogram.each === 1 ? 'tree' : 'trees'}; `
                    + `${number(environmental.treesEquivalent, 0)} in all.`
            })}

            ${figure('CO₂ avoided each year', chart, {
                className: 'cq-grow cq-grow-lg',
                caption: `Tonnes of CO₂ a year at ${number(Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh, 2)} kg per kWh, `
                    + 'falling with generation as the modules age.'
            })}

            ${callout('info', 'How this is worked out.', esc(environmental.note))}`);
    });
}(typeof self !== 'undefined' ? self : this));
