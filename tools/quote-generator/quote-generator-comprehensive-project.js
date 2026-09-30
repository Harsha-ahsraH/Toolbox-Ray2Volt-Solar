/**
 * Quote Generator - Comprehensive §02-§03: the site and the proposed system
 * Ray2Volt Solar Toolbox
 *
 * Pages 5-7: "Your site today", "Proposed system at a glance" and "Design
 * basis & assumptions". Each is a fixed A4 composition built from the shared
 * blocks in Pages.design (quote-generator-comprehensive-front.js). Every
 * figure arrives on `context.derived`; free text arrives already excerpted on
 * `derived.insights.narrative`, with the full text in Annexure C.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Content = root.QuoteGeneratorContent;
    const Pages = root.QuoteGeneratorPages;
    const Charts = root.QuoteGeneratorCharts;

    if (!Pages || !Pages.design || !Charts) {
        console.error('Comprehensive page helpers are missing; load the front matter first.');
        return;
    }

    const { esc, fallback, number, labelFor, customerName, siteAddress } = Pages.helpers;
    const {
        kwp, installationLabel, meteringLabel, chapterNumber, opener, kpi, kpiMoney,
        designedPage, section, figure, textCard, energyParts, energyText, ratedCount
    } = Pages.design;
    const { icon, inr } = Charts;

    /** Where the array sits, for a sentence ("designed for your RCC roof"). */
    const SURFACE = {
        'rcc-rooftop': 'RCC roof',
        'metal-sheet-rooftop': 'metal-sheet roof',
        'ground-mounted': 'open ground',
        carport: 'carport',
        mixed: 'installation areas'
    };

    function fact(label, value) {
        return `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    }

    function notEntered(note) {
        return { value: '<span class="cq-kpi-na">Not entered</span>', unit: '', note };
    }

    // ---------------------------------------------------------------------
    // P5. Your site today
    // ---------------------------------------------------------------------

    function siteTakeaway(consumption) {
        if (consumption.annualKwh > 0 && consumption.annualBill > 0) {
            return `Your site uses ${energyText(consumption.annualKwh)} a year and pays ${inr(consumption.annualBill)} for it.`;
        }
        if (consumption.annualKwh > 0) {
            return `Your site draws ${energyText(consumption.annualKwh)} from the grid each year.`;
        }
        return 'The plant is sized to your site; its consumption is confirmed at the survey.';
    }

    Pages.register('site-today', context => {
        const { state, derived } = context;
        const consumption = derived.consumption;
        const detailed = consumption.method === 'detailed';
        const fields = derived.insights.narrative.fields;

        const use = consumption.annualKwh > 0 ? energyParts(consumption.annualKwh) : null;
        const bill = consumption.annualBill > 0 ? kpiMoney(consumption.annualBill) : null;
        const useTile = use || notEntered('Confirmed from your bills at the survey');
        const billTile = bill || notEntered(consumption.annualKwh > 0 ? 'Bill amounts not entered' : 'From your bills');
        const tiles = [
            kpi('zap', 'Annual consumption', useTile.value, useTile.unit,
                use ? (detailed ? 'Sum of 12 monthly bills' : `${number(consumption.monthlyKwh)} kWh a month`) : useTile.note),
            kpi('rupee', 'Annual bill', billTile.value, billTile.unit,
                bill ? (detailed ? 'Sum of 12 monthly bills' : 'Monthly use × tariff × 12') : billTile.note),
            kpi('gauge', 'Average tariff', `₹${number(consumption.averageTariff, 2)}`, '/kWh',
                detailed && consumption.annualBill > 0 ? 'Bill amount ÷ units billed' : 'Energy charge entered'),
            detailed && consumption.maxDemandKva > 0
                ? kpi('trend', 'Peak demand', number(consumption.maxDemandKva, 0), 'kVA', 'Highest monthly maximum demand')
                : kpi('calendar', 'Monthly use', consumption.monthlyKwh > 0 ? number(consumption.monthlyKwh) : '—',
                    consumption.monthlyKwh > 0 ? 'kWh' : '', consumption.monthlyKwh > 0 ? 'An average month' : 'Not entered')
        ];

        const site = String(state.project.siteName || '').trim()
            || String(siteAddress(state) || '').split(/\r?\n|,/)[0];
        const asked = [textCard('Objective', fields.objective, 'award'),
            textCard('Special requirements', fields.specialRequirements, 'clipboard')].filter(Boolean);
        const existing = [textCard('Existing electrical system', fields.existingSystem, 'zap'),
            textCard('Site conditions', fields.siteConditions, 'home')].filter(Boolean);

        return designedPage('Your Site Today', 'What you asked for, the site, and how it uses energy', `
            ${opener(chapterNumber(context, 'site'), siteTakeaway(consumption),
                'Your objectives, the site as recorded for this offer, and the electricity it uses today.')}

            <div class="cq-g4">${tiles.join('')}</div>

            <dl class="cq-facts cq-facts-4">
                ${fact('Customer', fallback(customerName(state), 'customer name'))}
                ${fact('Site', fallback(site, 'site'))}
                ${fact('Installation', esc(installationLabel(state)))}
                ${fact('Metering', esc(meteringLabel(state)))}
            </dl>

            ${asked.length ? section('What you asked for',
                `<div class="cq-card-row cq-card-row-${asked.length}">${asked.join('')}</div>`, 'cq-fill') : ''}
            ${existing.length ? section('The site as it stands',
                `<div class="cq-card-row cq-card-row-${existing.length}">${existing.join('')}</div>`, 'cq-fill') : ''}`);
    });

    // ---------------------------------------------------------------------
    // P6. Proposed system at a glance
    // ---------------------------------------------------------------------

    function allocationTable(state, derived) {
        const rows = (state.project.mixedLocations || []).filter(row => Number(row.capacityKwp) > 0);
        if (state.project.installationLocation !== 'mixed' || !rows.length) return '';
        const total = derived.mixedLocationTotalKwp || 0;

        return `
            <table class="cq-table cq-compact-table">
                <thead><tr><th>Installation area</th><th class="cq-num">kWp</th><th class="cq-num">Share</th></tr></thead>
                <tbody>${rows.map(row => `
                    <tr><td>${esc(labelFor(Config.INSTALLATION_LOCATIONS, row.locationType))}</td>
                        <td class="cq-num">${number(row.capacityKwp, 2)}</td>
                        <td class="cq-num">${total > 0 ? number((Number(row.capacityKwp) / total) * 100, 0) : 0}%</td></tr>`).join('')}
                </tbody>
            </table>`;
    }

    // Energy-flow renders, one per configuration; the Sales SOP shows the same.
    const ARCHITECTURE_IMAGE = {
        'On-Grid': 'assets/commercial-ongrid-architecture.jpg',
        Hybrid: 'assets/commercial-hybrid-architecture.jpg'
    };

    Pages.register('system-overview', context => {
        const { state, derived } = context;
        const hybrid = state.project.systemConfiguration === 'Hybrid';
        const architecture = Content.SYSTEM_ARCHITECTURE[hybrid ? 'Hybrid' : 'On-Grid'];
        const approach = Content.INSTALLATION_APPROACH[state.project.installationLocation]
            || Content.INSTALLATION_APPROACH['rcc-rooftop'];
        const surface = SURFACE[state.project.installationLocation] || 'site';
        const modules = ratedCount(state, 'modules');
        const storage = hybrid && Number(state.project.batteryEnergyKwh) > 0
            ? ` with ${kwp(state.project.batteryEnergyKwh)} kWh of storage` : '';
        const takeaway = `A ${kwp(state.project.dcCapacityKwp)} kWp ${hybrid ? 'hybrid' : 'on-grid'} plant${storage}, `
            + `designed for your ${surface}.`;

        const fourth = hybrid
            ? kpi('battery', 'Battery storage', number(state.project.batteryEnergyKwh, 0), 'kWh',
                Number(state.project.batteryPowerKw) > 0 ? `${number(state.project.batteryPowerKw, 0)} kW power rating` : 'Energy rating')
            : modules
                ? kpi('grid', 'Solar modules', number(modules.quantity), 'nos', modules.rating ? `${esc(modules.rating)} each` : 'As listed in the BOM')
                : kpi('gauge', 'Metering', esc(meteringLabel(state)), '', 'Subject to DISCOM sanction');

        const steps = architecture.steps.map((step, index) => `
            <li><span class="cq-seq-n">${index + 1}</span><div><strong>${esc(step.title)}</strong>
                <p>${esc(step.text)}</p></div></li>`).join('');
        const points = approach.points.map((point, index) => `
            <li${index > 2 ? ' data-optional' : ''}>${icon('check')}<span>${esc(point)}</span></li>`).join('');
        const solution = textCard('Scope of the plant', derived.insights.narrative.fields.proposedSolution);
        // With the customer's own description beside the installation, the
        // six-step sequence moves under them as an optional compact row.
        const left = solution
            ? section('The proposed solution', solution)
            : section('In sequence', `<ol class="cq-seq">${steps}</ol>`);

        return designedPage('Proposed System', 'The plant at a glance', `
            ${opener(chapterNumber(context, 'system'), takeaway,
                'The ratings, how energy flows from the array to your load and the grid, and how the plant is installed.')}

            <div class="cq-g4">
                ${kpi('sun', 'DC capacity', number(state.project.dcCapacityKwp, 2), 'kWp', 'Module (array) rating')}
                ${kpi('zap', 'AC capacity', number(state.project.acCapacityKw, 2), 'kW', hybrid ? 'Hybrid inverter rating' : 'Inverter rating')}
                ${kpi('layers', 'DC / AC ratio', derived.dcAcRatio > 0 ? number(derived.dcAcRatio, 2) : '—', '',
                    'Array rating ÷ inverter rating')}
                ${fourth}
            </div>

            ${figure('How energy flows', `
                <img class="cq-arch-img" src="${ARCHITECTURE_IMAGE[hybrid ? 'Hybrid' : 'On-Grid']}" width="1536" height="1024"
                    alt="${hybrid ? 'Hybrid' : 'On-grid'} solar energy flow for a commercial or industrial facility">`, {
                className: 'cq-grow cq-fig-arch',
                caption: esc(architecture.lead)
            })}

            <div class="cq-split">
                ${left}
                ${section(approach.title, `
                    <div class="cq-install">
                        <p>${esc(approach.lead)}</p>
                        <ul class="cq-check is-in">${points}</ul>
                    </div>
                    ${allocationTable(state, derived)}`)}
            </div>

            ${solution ? `<section class="cq-sec" data-optional>
                <h3 class="cq-t-h3">In sequence</h3>
                <ol class="cq-seq is-row">${steps}</ol>
            </section>` : ''}`);
    });

    // ---------------------------------------------------------------------
    // P7. Design basis & assumptions
    // ---------------------------------------------------------------------

    function assumptionRows(state, derived) {
        const savings = state.savings;
        const consumption = derived.consumption;
        const exported = Number(savings.exportPercent) || 0;
        const row = (label, value, basis) =>
            `<tr><td>${esc(label)}</td><td class="cq-num">${value}</td><td>${esc(basis)}</td></tr>`;

        return [
            row('Plant DC capacity', `${number(state.project.dcCapacityKwp, 2)} kWp`, 'Approved capacity for this offer'),
            row('Inverter AC capacity', `${number(state.project.acCapacityKw, 2)} kW`,
                derived.dcAcRatio > 0 ? `DC/AC ratio ${number(derived.dcAcRatio, 2)}` : 'As listed in the BOM'),
            row('Specific yield', `${number(savings.annualGenerationPerKwp, 0)} kWh/kWp`, 'A year, before degradation; confirmed at survey'),
            row('Year-1 generation', `${number(derived.projection.rows[0].generationKwh, 0)} kWh`, 'Capacity × specific yield'),
            row('Module degradation', `${number(savings.degradationPercent, 2)}% a year`, 'Applied from year 2'),
            row('Tariff today', `₹${number(consumption.averageTariff, 2)}/kWh`,
                consumption.method === 'detailed' && consumption.annualBill > 0 ? 'Average of the 12 bills entered' : 'Energy charge entered'),
            row('Tariff escalation', `${number(savings.tariffEscalationPercent, 1)}% a year`, 'Applied to the tariff and export credit'),
            row('Used on site', `${number(savings.selfConsumptionPercent, 0)}%`, 'Of generation, valued at the tariff'),
            row('Exported', `${number(exported, 0)}%`,
                exported > 0 ? `Credited at ₹${number(savings.exportCreditRate, 2)}/kWh` : 'No export assumed'),
            row('Metering', esc(meteringLabel(state)), 'Subject to DISCOM sanction'),
            row('Projection period', `${derived.projection.years} years`, 'The analysis horizon'),
            row('Grid emission factor', `${number(Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh, 2)} kg/kWh`,
                'CO₂ per unit; environmental figures only')
        ].join('');
    }

    function costRows(state) {
        const costs = (state.savings.futureCosts || []).filter(cost => Number(cost.amount) > 0);
        if (!costs.length) {
            return '<tr><td colspan="4">No running costs entered. Savings are shown before operation, maintenance and insurance.</td></tr>';
        }
        return costs.map(cost => `
            <tr><td>${esc(cost.name || 'Running cost')}</td>
                <td class="cq-num">${inr(cost.amount)} a year</td>
                <td class="cq-num">${number(cost.escalationPercent, 1)}% a year</td>
                <td class="cq-num">Years ${esc(cost.startYear)} to ${esc(cost.endYear)}</td></tr>`).join('');
    }

    const METHOD = [
        ['sun', 'Generation', 'Capacity × specific yield, reduced each year by the degradation rate.'],
        ['home', 'Energy used on site', 'The used-on-site share of generation × the tariff for that year.'],
        ['tower', 'Export credit', 'The exported share of generation × the export credit rate for that year.'],
        ['trendDown', 'Net saving', 'Value of energy used on site + export credit − running costs.'],
        ['clock', 'Payback', 'The point at which the cumulative net saving equals the offered price.'],
        ['trend', 'IRR', 'The discount rate at which the price and the yearly net savings balance.']
    ];

    Pages.register('design-basis', context => {
        const { state, derived } = context;
        const notes = derived.insights.narrative.fields.projectNotes;

        return designedPage('Proposed System', 'Design basis & assumptions', `
            ${opener(chapterNumber(context, 'system'), 'Every figure in this proposal rests on the assumptions below.',
                'Disclosed in full so you can test each number against your own view of the site.')}

            ${section('Assumptions', `
                <table class="cq-table cq-basis-table">
                    <colgroup><col style="width:30%"><col style="width:24%"><col></colgroup>
                    <thead><tr><th>Assumption</th><th class="cq-num">Value</th><th>Basis</th></tr></thead>
                    <tbody>${assumptionRows(state, derived)}</tbody>
                </table>`)}

            ${section('Running costs included', `
                <table class="cq-table cq-basis-table">
                    <colgroup><col style="width:30%"><col style="width:24%"><col style="width:20%"><col></colgroup>
                    <thead><tr><th>Cost</th><th class="cq-num">Amount</th><th class="cq-num">Escalation</th><th class="cq-num">Applies</th></tr></thead>
                    <tbody>${costRows(state)}</tbody>
                </table>`)}

            ${section('How each figure is calculated', `
                <div class="cq-method">${METHOD.map(([iconName, title, text]) => `
                    <div><span class="cq-feature-ic">${icon(iconName)}</span>
                        <strong>${esc(title)}</strong><p>${esc(text)}</p></div>`).join('')}</div>`, 'cq-fill')}

            ${notes && notes.excerpt ? `
            <div class="cq-callout is-assume" data-optional>
                ${icon('info')}
                <div><strong>Project notes.</strong> ${esc(notes.excerpt)}${notes.excerpted ? ' (Full text in Annexure C.)' : ''}</div>
            </div>` : ''}

            <div class="cq-callout is-assume">
                ${icon('alert')}
                <div><strong>A projection, not a guarantee.</strong> Generation depends on irradiance, temperature,
                    soiling, shading and grid availability; savings also depend on the tariff in force and the site load
                    when the plant generates. Actual results will differ from these projections.</div>
            </div>`);
    });
}(typeof self !== 'undefined' ? self : this));
