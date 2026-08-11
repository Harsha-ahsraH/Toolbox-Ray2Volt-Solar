/**
 * Quote Generator - Comprehensive proposal pages (analysis to annexures)
 * Ray2Volt Solar Toolbox
 *
 * Section renderers for the second half of the Comprehensive Proposal. These
 * register into the shared registry created by
 * quote-generator-comprehensive-pages-a.js and use the same descriptor
 * contract; see that file's header for the details.
 *
 * Returns are computed with the shared global/scripts/solar-returns.js module,
 * the same one the Short Proposal uses, so ROI and IRR are calculated one way
 * across the whole toolbox.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Content = root.QuoteGeneratorContent;
    const Model = root.QuoteGeneratorModel;
    const Calc = root.QuoteGeneratorCalc;
    const Pages = root.QuoteGeneratorPages;
    const Returns = root.Ray2VoltSolarReturns;

    if (!Pages) {
        console.error('Comprehensive page registry is missing.');
        return;
    }

    const register = Pages.register;
    const {
        esc, escLines, money, number, formatDate, labelFor, customerName, siteAddress
    } = Pages.helpers;

    // ---------------------------------------------------------------------
    // 20. Generation assessment
    // ---------------------------------------------------------------------

    register('generation-assessment', context => {
        const { state, derived } = context;
        const projection = derived.projection;
        const milestoneYears = [1, 5, 10, 15, 20, 25, projection.years]
            .filter((year, index, list) => year <= projection.years && list.indexOf(year) === index);

        return {
            title: 'Generation Assessment',
            subtitle: 'Expected output over the analysis period',
            body: `
                <div class="cq-metrics">
                    <div class="cq-metric">
                        <span class="cq-metric-label">Capacity</span>
                        <span class="cq-metric-value">${number(state.project.dcCapacityKwp, 2)}</span>
                        <span class="cq-metric-sub">kWp</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Specific Yield</span>
                        <span class="cq-metric-value">${number(projection.specificYield)}</span>
                        <span class="cq-metric-sub">kWh/kWp/yr</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Year-1 Output</span>
                        <span class="cq-metric-value">${number(projection.year1GenerationKwh)}</span>
                        <span class="cq-metric-sub">kWh</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">${projection.years}-Year Output</span>
                        <span class="cq-metric-value">${number(projection.totalGenerationKwh / 1000, 1)}</span>
                        <span class="cq-metric-sub">MWh</span>
                    </div>
                </div>

                <h3 class="cq-subtitle">Generation Over Time</h3>
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th style="width:16%">Year</th>
                            <th class="cq-num">Generation (kWh)</th>
                            <th class="cq-num">Retained Output</th>
                            <th class="cq-num">Cumulative (kWh)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${milestoneYears.map(year => {
                            const row = projection.rows[year - 1];
                            if (!row) return '';
                            const retained = projection.year1GenerationKwh > 0
                                ? (row.generationKwh / projection.year1GenerationKwh) * 100
                                : 0;
                            const cumulative = projection.rows
                                .slice(0, year)
                                .reduce((total, item) => total + item.generationKwh, 0);

                            return `<tr>
                                <td>Year ${year}</td>
                                <td class="cq-num">${number(row.generationKwh)}</td>
                                <td class="cq-num">${number(retained, 1)}%</td>
                                <td class="cq-num">${number(cumulative)}</td>
                            </tr>`;
                        }).join('')}
                        <tr class="cq-total-row">
                            <td>Total</td>
                            <td class="cq-num">${number(projection.totalGenerationKwh)}</td>
                            <td class="cq-num">—</td>
                            <td class="cq-num">${number(projection.totalGenerationKwh)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="cq-note">Output is modelled at the specific yield stated in the design basis,
                    reduced by ${number(state.savings.degradationPercent, 2)}% each year for module
                    degradation. Actual generation varies with irradiance, temperature, soiling, shading
                    and grid availability, and is subject to detailed site verification.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 21. Consumption profile
    // ---------------------------------------------------------------------

    register('consumption-profile', context => {
        const { state, derived } = context;
        const consumption = derived.consumption;
        const isDetailed = consumption.method === 'detailed';
        const rows = state.savings.monthlyRows || [];
        const peak = Math.max.apply(null, rows.map(row => Number(row.importedKwh) || 0).concat([1]));

        return {
            title: 'Consumption Profile',
            subtitle: isDetailed ? 'Twelve-month billed consumption' : 'Summary consumption',
            body: `
                <div class="cq-metrics ${isDetailed ? '' : 'cq-metrics-3'}">
                    <div class="cq-metric">
                        <span class="cq-metric-label">Annual Import</span>
                        <span class="cq-metric-value">${number(consumption.annualKwh)}</span>
                        <span class="cq-metric-sub">kWh</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Monthly Average</span>
                        <span class="cq-metric-value">${number(consumption.monthlyKwh)}</span>
                        <span class="cq-metric-sub">kWh</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Average Tariff</span>
                        <span class="cq-metric-value">₹${number(consumption.averageTariff, 2)}</span>
                        <span class="cq-metric-sub">per kWh</span>
                    </div>
                    ${isDetailed ? `
                    <div class="cq-metric">
                        <span class="cq-metric-label">Peak Demand</span>
                        <span class="cq-metric-value">${number(consumption.maxDemandKva, 1)}</span>
                        <span class="cq-metric-sub">kVA</span>
                    </div>` : ''}
                </div>

                ${isDetailed ? `
                    <h3 class="cq-subtitle">Monthly Pattern</h3>
                    <div class="cq-bars">
                        ${rows.map(row => {
                            const value = Number(row.importedKwh) || 0;
                            const height = Math.max(1, (value / peak) * 100);
                            return `<div class="cq-bar">
                                <span class="cq-bar-value">${value ? number(value) : ''}</span>
                                <div class="cq-bar-fill" style="height:${number(height, 1)}%"></div>
                                <span class="cq-bar-label">${esc(String(row.month).slice(0, 3))}</span>
                            </div>`;
                        }).join('')}
                    </div>

                    <h3 class="cq-subtitle">Billed Consumption</h3>
                    <table class="cq-table">
                        <thead>
                            <tr>
                                <th style="width:28%">Month</th>
                                <th class="cq-num">Imported (kWh)</th>
                                <th class="cq-num">Bill Amount</th>
                                <th class="cq-num">Max Demand (kVA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td>${esc(row.month)}</td>
                                    <td class="cq-num">${number(row.importedKwh)}</td>
                                    <td class="cq-num">${money(row.billAmount)}</td>
                                    <td class="cq-num">${number(row.maxDemandKva, 1)}</td>
                                </tr>`).join('')}
                            <tr class="cq-total-row">
                                <td>Total / Peak</td>
                                <td class="cq-num">${number(consumption.annualKwh)}</td>
                                <td class="cq-num">${money(consumption.annualBill)}</td>
                                <td class="cq-num">${number(consumption.maxDemandKva, 1)}</td>
                            </tr>
                        </tbody>
                    </table>`
                : `<h3 class="cq-subtitle">Basis</h3>
                    <div class="cq-kv cq-kv-boxed">
                        <dt>Average monthly consumption</dt>
                        <dd>${number(state.savings.monthlyConsumptionKwh)} kWh</dd>
                        <dt>Current tariff</dt>
                        <dd>₹${number(state.savings.tariffRate, 2)} per kWh</dd>
                        <dt>Estimated annual bill</dt>
                        <dd>${money(consumption.annualBill)}</dd>
                    </div>
                    <p class="cq-para">Consumption has been taken on a summary basis. A twelve-month
                        billing history allows the plant to be sized more closely against the actual
                        load pattern and is recommended before the design is finalised.</p>`}

                <div class="cq-note">Consumption figures are as advised by the customer. Ray2Volt has not
                    independently verified them.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 22. Energy utilization
    // ---------------------------------------------------------------------

    register('energy-utilization', context => {
        const { state, derived } = context;
        const projection = derived.projection;
        const year1 = projection.rows[0] || { selfSavings: 0, exportCredit: 0 };
        const selfShare = Number(state.savings.selfConsumptionPercent) || 0;
        const exportShare = Number(state.savings.exportPercent) || 0;
        const selfKwh = projection.year1GenerationKwh * (selfShare / 100);
        const exportKwh = projection.year1GenerationKwh * (exportShare / 100);

        return {
            title: 'Energy Utilization',
            subtitle: 'How generated energy is used and valued',
            body: `
                <p class="cq-lead">Generation serves the site load first. The share that cannot be used
                    on site at the moment it is generated is exported and credited under the metering
                    arrangement sanctioned by the distribution licensee.</p>

                <h3 class="cq-subtitle">Year-1 Energy Split</h3>
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th style="width:34%">Use</th>
                            <th class="cq-num">Share</th>
                            <th class="cq-num">Energy (kWh)</th>
                            <th class="cq-num">Rate (₹/kWh)</th>
                            <th class="cq-num">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Self-consumed on site</td>
                            <td class="cq-num">${number(selfShare, 2)}%</td>
                            <td class="cq-num">${number(selfKwh)}</td>
                            <td class="cq-num">${number(state.savings.tariffRate, 2)}</td>
                            <td class="cq-num">${money(year1.selfSavings)}</td>
                        </tr>
                        <tr>
                            <td>Exported to grid</td>
                            <td class="cq-num">${number(exportShare, 2)}%</td>
                            <td class="cq-num">${number(exportKwh)}</td>
                            <td class="cq-num">${number(state.savings.exportCreditRate, 2)}</td>
                            <td class="cq-num">${money(year1.exportCredit)}</td>
                        </tr>
                        <tr class="cq-total-row">
                            <td>Total year-1 value</td>
                            <td class="cq-num">${number(selfShare + exportShare, 2)}%</td>
                            <td class="cq-num">${number(projection.year1GenerationKwh)}</td>
                            <td class="cq-num">—</td>
                            <td class="cq-num">${money(year1.selfSavings + year1.exportCredit)}</td>
                        </tr>
                    </tbody>
                </table>

                <h3 class="cq-subtitle">Arrangement</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>Metering arrangement</dt>
                    <dd>${esc(labelFor(Config.ARRANGEMENT_TYPES, state.savings.arrangementType))}</dd>
                    <dt>Export credit rate</dt>
                    <dd>₹${number(state.savings.exportCreditRate, 2)} per kWh, escalated at
                        ${number(state.savings.tariffEscalationPercent, 2)}% per year</dd>
                    <dt>Sanction</dt>
                    <dd>Subject to approval by the distribution licensee</dd>
                </div>

                <div class="cq-note">The self-consumption share is an assumption based on the load
                    information available at the time of offer. The actual split depends on the site load
                    at the time of generation and on the terms of the sanctioned metering arrangement.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 23. Savings projection (paginates)
    // ---------------------------------------------------------------------

    register('savings-projection', context => {
        const { derived, page } = context;
        const projection = derived.projection;
        const chunk = page.chunk || { start: 0, end: projection.rows.length };
        const slice = projection.rows.slice(chunk.start, chunk.end);
        const isLast = page.part === page.partCount - 1;

        return {
            title: 'Savings Projection',
            subtitle: page.isContinuation
                ? `Continued — years ${chunk.start + 1} to ${chunk.end}`
                : `Year-by-year over ${projection.years} years`,
            body: `
                ${page.isContinuation ? '' : `
                    <p class="cq-lead">Gross savings are the value of self-consumed energy plus export
                        credits. Net savings are gross savings less the future costs entered for the
                        project.</p>`}
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th style="width:8%">Year</th>
                            <th class="cq-num">Generation (kWh)</th>
                            <th class="cq-num">Tariff</th>
                            <th class="cq-num">Self-Use Saving</th>
                            <th class="cq-num">Export Credit</th>
                            <th class="cq-num">Costs</th>
                            <th class="cq-num">Net Saving</th>
                            <th class="cq-num">Cumulative</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${slice.map(row => `
                            <tr>
                                <td>${row.year}</td>
                                <td class="cq-num">${number(row.generationKwh)}</td>
                                <td class="cq-num">${number(row.tariff, 2)}</td>
                                <td class="cq-num">${money(row.selfSavings)}</td>
                                <td class="cq-num">${money(row.exportCredit)}</td>
                                <td class="cq-num">${row.costs ? money(row.costs) : '—'}</td>
                                <td class="cq-num">${money(row.netSavings)}</td>
                                <td class="cq-num">${money(row.cumulativeNet)}</td>
                            </tr>`).join('')}
                        ${isLast ? `
                            <tr class="cq-total-row">
                                <td>Total</td>
                                <td class="cq-num">${number(projection.totalGenerationKwh)}</td>
                                <td class="cq-num">—</td>
                                <td class="cq-num">—</td>
                                <td class="cq-num">—</td>
                                <td class="cq-num">${money(projection.totalCosts)}</td>
                                <td class="cq-num">${money(projection.totalNetSavings)}</td>
                                <td class="cq-num">${money(projection.totalNetSavings)}</td>
                            </tr>` : ''}
                    </tbody>
                </table>
                ${isLast ? `
                    <p class="cq-table-note">Figures are rounded to the nearest rupee. Savings are
                        projections on the disclosed assumptions and are not guaranteed.</p>` : ''}`
        };
    });

    // ---------------------------------------------------------------------
    // 24. Returns analysis
    // ---------------------------------------------------------------------

    register('returns-analysis', context => {
        const { state, derived } = context;
        const projection = derived.projection;
        const investment = derived.commercial.finalPrice;
        const series = projection.rows.map(row => row.netSavings);

        let roiText = '—';
        let irrText = '—';

        if (Returns && investment > 0) {
            const result = Returns.projectReturns(investment, series);
            roiText = Returns.formatPercent(result.roi, 0);
            irrText = Returns.formatPercent(result.irr);
        }

        const payback = derived.payback;

        return {
            title: 'Returns Analysis',
            subtitle: 'Payback, ROI and IRR on the offered price',
            body: `
                <div class="cq-metrics">
                    <div class="cq-metric">
                        <span class="cq-metric-label">Investment</span>
                        <span class="cq-metric-value">${money(investment)}</span>
                        <span class="cq-metric-sub">offered price incl. GST</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Simple Payback</span>
                        <span class="cq-metric-value">${payback === null ? '—' : number(payback, 1)}</span>
                        <span class="cq-metric-sub">years</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Return on Investment</span>
                        <span class="cq-metric-value">${esc(roiText)}</span>
                        <span class="cq-metric-sub">over ${projection.years} years</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">IRR</span>
                        <span class="cq-metric-value">${esc(irrText)}</span>
                        <span class="cq-metric-sub">${projection.years}-year cash flow</span>
                    </div>
                </div>

                <h3 class="cq-subtitle">Basis of Calculation</h3>
                <table class="cq-table">
                    <thead><tr><th style="width:44%">Input</th><th>Value</th><th>Source</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>Net investment</td>
                            <td>${money(investment)}</td>
                            <td>Offered price after discounts, incl. GST</td>
                        </tr>
                        <tr>
                            <td>Year-1 net saving</td>
                            <td>${money(series[0] || 0)}</td>
                            <td>Savings projection</td>
                        </tr>
                        <tr>
                            <td>Total net saving</td>
                            <td>${money(projection.totalNetSavings)}</td>
                            <td>Sum over ${projection.years} years</td>
                        </tr>
                        <tr>
                            <td>Future costs deducted</td>
                            <td>${money(projection.totalCosts)}</td>
                            <td>Future-cost provisions entered</td>
                        </tr>
                        <tr>
                            <td>Analysis period</td>
                            <td>${projection.years} years</td>
                            <td>Design basis</td>
                        </tr>
                    </tbody>
                </table>

                <div class="cq-note">Payback is the year in which cumulative net savings first equal the
                    investment. ROI and IRR are computed on the same annual net-saving series shown in the
                    savings projection. No subsidy, accelerated depreciation or tax effect is included
                    unless stated elsewhere in this proposal. These are projections, not guaranteed
                    financial outcomes, and do not constitute investment advice.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 25. Environmental impact
    // ---------------------------------------------------------------------

    register('environmental-impact', context => {
        const environmental = context.derived.environmental;
        const years = context.derived.projection.years;

        return {
            title: 'Environmental Impact',
            subtitle: `Indicative effect over ${years} years`,
            body: `
                <div class="cq-metrics cq-metrics-3">
                    <div class="cq-metric">
                        <span class="cq-metric-label">Clean Energy</span>
                        <span class="cq-metric-value">${number(environmental.cleanEnergyMwh, 1)}</span>
                        <span class="cq-metric-sub">MWh generated</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">CO2 Avoided</span>
                        <span class="cq-metric-value">${number(environmental.co2Tonnes, 1)}</span>
                        <span class="cq-metric-sub">tonnes</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Tree Equivalent</span>
                        <span class="cq-metric-value">${number(environmental.treesEquivalent)}</span>
                        <span class="cq-metric-sub">illustrative only</span>
                    </div>
                </div>

                <h3 class="cq-subtitle">How These Are Calculated</h3>
                <table class="cq-table">
                    <thead><tr><th style="width:46%">Step</th><th>Value</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>Generation over ${years} years</td>
                            <td>${number(environmental.totalKwh)} kWh</td>
                        </tr>
                        <tr>
                            <td>Grid emission factor applied</td>
                            <td>${Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh} kg CO2 per kWh</td>
                        </tr>
                        <tr>
                            <td>Emissions avoided</td>
                            <td>${number(environmental.co2Tonnes, 1)} tonnes CO2</td>
                        </tr>
                        <tr>
                            <td>Tree equivalence conversion</td>
                            <td>${Content.ENVIRONMENTAL.treesPerTonneCo2} trees per tonne CO2</td>
                        </tr>
                    </tbody>
                </table>

                <div class="cq-note">${esc(Content.ENVIRONMENTAL.note)}</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 26-27, 35. Clause sections (paginate)
    // ---------------------------------------------------------------------

    function clauseSection(options) {
        return context => {
            const { state, page } = context;
            const clauses = Model.enabledClauses(state, options.listName);
            const chunk = page.chunk || { start: 0, end: clauses.length };
            const slice = clauses.slice(chunk.start, chunk.end);

            return {
                title: options.title,
                subtitle: page.isContinuation
                    ? `Continued — page ${page.part + 1} of ${page.partCount}`
                    : options.subtitle,
                body: `
                    ${page.isContinuation || !options.lead ? '' : `<p class="cq-lead">${esc(options.lead)}</p>`}
                    ${slice.length ? `
                        <ol class="cq-clause-list">
                            ${slice.map(clause => `
                                <li>
                                    <span class="cq-clause-num">${clause.number}.</span>
                                    <span>${escLines(clause.text)}</span>
                                </li>`).join('')}
                        </ol>`
                        : '<p class="cq-para">No clauses are enabled for this list.</p>'}
                    ${page.part === page.partCount - 1 && options.footer
                        ? `<div class="cq-note">${options.footer(context)}</div>` : ''}`
            };
        };
    }

    register('scope-inclusions', clauseSection({
        listName: 'inclusions',
        title: 'Scope Inclusions',
        subtitle: 'What the offered price covers',
        lead: 'The following are included in the offered price.',
        footer: () => 'Anything not listed here or in the bill of materials is excluded. '
            + 'Refer to the scope exclusions section.'
    }));

    register('scope-exclusions', clauseSection({
        listName: 'exclusions',
        title: 'Scope Exclusions',
        subtitle: 'What is not covered, and customer responsibilities',
        lead: 'The following are not included in the offered price. Where an excluded item is required, '
            + 'it can be quoted separately.',
        footer: () => 'The customer is responsible for site access, safe working conditions, and any '
            + 'approval or infrastructure listed above as excluded.'
    }));

    register('terms-conditions', clauseSection({
        listName: 'terms',
        title: 'Terms & Conditions',
        subtitle: 'Commercial and contractual terms',
        lead: null,
        footer: context => `This quotation is valid for ${esc(context.state.project.validityDays)} days `
            + `from ${esc(formatDate(context.state.project.quoteDate) || 'the date of issue')}. `
            + 'Acceptance of this offer constitutes acceptance of these terms.'
    }));

    // ---------------------------------------------------------------------
    // 28-31. Maintained execution content
    // ---------------------------------------------------------------------

    register('execution-methodology', () => ({
        title: 'Execution Methodology',
        subtitle: 'How the project is delivered',
        body: `
            <p class="cq-lead">${esc(Content.EXECUTION_METHODOLOGY.lead)}</p>
            <div class="cq-steps">
                ${Content.EXECUTION_METHODOLOGY.stages.map((stage, index) => `
                    <div class="cq-step">
                        <span class="cq-step-num">${index + 1}</span>
                        <div>
                            <strong>${esc(stage.title)}</strong>
                            <p>${esc(stage.text)}</p>
                        </div>
                    </div>`).join('')}
            </div>`
    }));

    register('project-schedule', () => ({
        title: 'Project Schedule',
        subtitle: 'Standard execution sequence',
        body: `
            <p class="cq-lead">${esc(Content.PROJECT_SCHEDULE.lead)}</p>
            <table class="cq-table">
                <thead>
                    <tr>
                        <th style="width:10%">Step</th>
                        <th style="width:58%">Activity</th>
                        <th>Responsibility</th>
                    </tr>
                </thead>
                <tbody>
                    ${Content.PROJECT_SCHEDULE.milestones.map((milestone, index) => `
                        <tr>
                            <td class="cq-center">${index + 1}</td>
                            <td>${esc(milestone.activity)}</td>
                            <td>${esc(milestone.dependency)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
            <div class="cq-note">${esc(Content.PROJECT_SCHEDULE.note)} Indicative durations are confirmed
                in writing after the detailed site survey and material lead times are known.</div>`
    }));

    function checklistSection(options) {
        return () => ({
            title: options.title,
            subtitle: options.subtitle,
            body: `
                <p class="cq-lead">${esc(options.content.lead)}</p>
                <div class="cq-grid-2">
                    ${(options.content.checks || options.content.practices).map(group => `
                        <div class="cq-card">
                            <h4>${esc(group.title)}</h4>
                            <ul class="cq-bullets" style="margin-bottom:0;">
                                ${group.items.map(item => `<li>${esc(item)}</li>`).join('')}
                            </ul>
                        </div>`).join('')}
                </div>`
        });
    }

    register('quality-assurance', checklistSection({
        title: 'Quality Assurance',
        subtitle: 'Checks applied and records kept',
        content: Content.QUALITY_ASSURANCE
    }));

    register('health-safety', checklistSection({
        title: 'Health & Safety',
        subtitle: 'Site safety approach and responsibilities',
        content: Content.HEALTH_SAFETY
    }));

    // ---------------------------------------------------------------------
    // 32. Warranty and support
    // ---------------------------------------------------------------------

    register('warranty-support', context => {
        const { state, page } = context;
        // Distinct item/make/warranty combinations, chunked by the same page
        // plan that decided how many warranty pages there are.
        const all = Calc.warrantyRows(state);
        const chunk = page.chunk || { start: 0, end: all.length };
        const rows = all.slice(chunk.start, chunk.end);
        const isLast = page.part === page.partCount - 1;

        return {
            title: 'Warranty & Support',
            subtitle: page.isContinuation
                ? `Continued — page ${page.part + 1} of ${page.partCount}`
                : 'Cover on equipment and workmanship',
            body: `
                ${page.isContinuation ? '' : `<p class="cq-lead">${esc(Content.WARRANTY_SUPPORT.lead)}</p>`}

                <h3 class="cq-subtitle">Equipment Warranties Offered${
                    page.isContinuation ? ' (continued)' : ''}</h3>
                ${rows.length ? `
                    <table class="cq-table">
                        <thead>
                            <tr>
                                <th style="width:42%">Item</th>
                                <th style="width:26%">Make</th>
                                <th>Warranty</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td>${esc(row.name)}</td>
                                    <td>${esc(row.make)}</td>
                                    <td>${esc(row.warranty)}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>`
                    : '<p class="cq-para">Warranty periods are stated against each item in the bill of materials.</p>'}

                ${isLast ? `
                    <h3 class="cq-subtitle">Workmanship</h3>
                    <p class="cq-para">${esc(Content.WARRANTY_SUPPORT.workmanship)}</p>

                    <h3 class="cq-subtitle">Support</h3>
                    <ul class="cq-bullets">
                        ${Content.WARRANTY_SUPPORT.support.map(item => `<li>${esc(item)}</li>`).join('')}
                    </ul>

                    <div class="cq-note">${esc(Content.WARRANTY_SUPPORT.exclusionsNote)}</div>` : ''}`
        };
    });

    // ---------------------------------------------------------------------
    // 33. Commercial offer
    // ---------------------------------------------------------------------

    register('commercial-offer', context => {
        const { state, derived } = context;
        const commercial = derived.commercial;
        const breakdown = state.commercial.priceBreakdown || [];
        const discounts = (state.commercial.discounts || [])
            .filter(row => Number(row.amount) > 0);
        const halfRate = commercial.gstRate / 2;

        return {
            title: 'Commercial Offer',
            subtitle: 'Price, taxes and the final offered amount',
            body: `
                <div class="cq-kv cq-kv-boxed" style="margin-bottom:4mm;">
                    <dt>Customer</dt><dd>${esc(customerName(state) || '—')}</dd>
                    <dt>Site</dt><dd>${esc(siteAddress(state) || '—')}</dd>
                    <dt>Quotation</dt><dd>${esc(state.project.quoteNumber || '—')}
                        dated ${esc(formatDate(state.project.quoteDate) || '—')}</dd>
                    <dt>Plant capacity</dt><dd>${number(state.project.dcCapacityKwp, 2)} kWp</dd>
                </div>

                ${breakdown.length ? `
                    <h3 class="cq-subtitle">Price Breakdown</h3>
                    <table class="cq-table">
                        <thead><tr><th style="width:70%">Description</th><th class="cq-num">Amount (Incl. GST)</th></tr></thead>
                        <tbody>
                            ${breakdown.map(row => `
                                <tr>
                                    <td>${esc(row.description)}</td>
                                    <td class="cq-num">${money(row.amount)}</td>
                                </tr>`).join('')}
                            <tr class="cq-total-row">
                                <td>Breakdown total</td>
                                <td class="cq-num">${money(commercial.breakdownTotal)}</td>
                            </tr>
                        </tbody>
                    </table>` : ''}

                <h3 class="cq-subtitle">Offer Summary</h3>
                <table class="cq-table">
                    <thead><tr><th style="width:70%">Particulars</th><th class="cq-num">Amount</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>Actual project cost (incl. GST)</td>
                            <td class="cq-num">${money(commercial.actualProjectCost)}</td>
                        </tr>
                        ${discounts.length ? discounts.map(row => `
                            <tr>
                                <td>Less: ${esc(row.name || 'Discount')}</td>
                                <td class="cq-num">- ${money(row.amount)}</td>
                            </tr>`).join('')
                            : '<tr><td>Less: Discount</td><td class="cq-num">—</td></tr>'}
                        <tr class="cq-total-row">
                            <td>Final offered price (incl. GST)</td>
                            <td class="cq-num">${money(commercial.finalPrice)}</td>
                        </tr>
                    </tbody>
                </table>

                <h3 class="cq-subtitle">Tax Disclosure</h3>
                <table class="cq-table">
                    <thead><tr><th style="width:70%">Component</th><th class="cq-num">Amount</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>Taxable value</td>
                            <td class="cq-num">${money(commercial.taxableValue)}</td>
                        </tr>
                        ${commercial.isInterState
                            ? `<tr>
                                <td>IGST @ ${number(commercial.gstRate, 2)}%</td>
                                <td class="cq-num">${money(commercial.gstAmount)}</td>
                            </tr>`
                            : `<tr>
                                <td>CGST @ ${number(halfRate, 2)}%</td>
                                <td class="cq-num">${money(commercial.gstAmount / 2)}</td>
                            </tr>
                            <tr>
                                <td>SGST @ ${number(halfRate, 2)}%</td>
                                <td class="cq-num">${money(commercial.gstAmount / 2)}</td>
                            </tr>`}
                        <tr class="cq-total-row">
                            <td>Total (incl. GST)</td>
                            <td class="cq-num">${money(commercial.finalPrice)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="cq-note">The offered price is inclusive of GST at
                    ${number(commercial.gstRate, 2)}%. Any statutory change in taxes or duties after the
                    date of this offer will be charged at actuals.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 34. Payment milestones
    // ---------------------------------------------------------------------

    register('payment-milestones', context => {
        const commercial = context.derived.commercial;

        return {
            title: 'Payment Milestones',
            subtitle: 'Payment triggers and amounts',
            body: `
                <p class="cq-lead">Payment is due against the milestones below. Material is despatched
                    and work is scheduled against cleared payment for the corresponding milestone.</p>
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th style="width:8%">#</th>
                            <th style="width:38%">Milestone / Payment Trigger</th>
                            <th class="cq-num">Percentage</th>
                            <th class="cq-num">Amount</th>
                            <th style="width:24%">Due Condition</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${commercial.milestones.length ? commercial.milestones.map((row, index) => `
                            <tr>
                                <td class="cq-center">${index + 1}</td>
                                <td>${esc(row.name || '—')}</td>
                                <td class="cq-num">${number(row.percent, 2)}%</td>
                                <td class="cq-num">${money(row.amount)}</td>
                                <td>${esc(row.note || '—')}</td>
                            </tr>`).join('')
                            : '<tr><td colspan="5">No payment milestones have been entered.</td></tr>'}
                        <tr class="cq-total-row">
                            <td colspan="2">Total</td>
                            <td class="cq-num">${number(commercial.milestonePercentTotal, 2)}%</td>
                            <td class="cq-num">${money(commercial.finalPrice)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                <div class="cq-note">Amounts are calculated on the final offered price inclusive of GST
                    and are rounded to the nearest rupee.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 36. Why Ray2Volt
    // ---------------------------------------------------------------------

    register('why-ray2volt', () => ({
        title: 'Why Ray2Volt',
        subtitle: 'What the customer gets, and what happens next',
        body: `
            <p class="cq-lead">${esc(Content.WHY_RAY2VOLT.lead)}</p>
            <div class="cq-grid-2">
                ${Content.WHY_RAY2VOLT.differentiators.map(item => `
                    <div class="cq-card">
                        <h4>${esc(item.title)}</h4>
                        <p>${esc(item.text)}</p>
                    </div>`).join('')}
            </div>
            <h3 class="cq-subtitle">Next Steps</h3>
            <div class="cq-steps">
                ${Content.WHY_RAY2VOLT.nextSteps.map((step, index) => `
                    <div class="cq-step">
                        <span class="cq-step-num">${index + 1}</span>
                        <div><p>${esc(step)}</p></div>
                    </div>`).join('')}
            </div>`
    }));

    // ---------------------------------------------------------------------
    // 37. Acceptance
    // ---------------------------------------------------------------------

    register('acceptance', context => {
        const { state, derived } = context;

        return {
            title: 'Acceptance',
            subtitle: 'Confirmation of this offer',
            body: `
                <p class="cq-lead">By signing below, the customer accepts the scope, the commercial
                    offer and the terms and conditions set out in this proposal.</p>

                <div class="cq-kv cq-kv-boxed">
                    <dt>Quotation number</dt><dd>${esc(state.project.quoteNumber || '—')}</dd>
                    <dt>Date of issue</dt><dd>${esc(formatDate(state.project.quoteDate) || '—')}</dd>
                    <dt>Revision</dt><dd>${esc(state.project.revision || 'Rev 0')}</dd>
                    <dt>Plant capacity</dt><dd>${number(state.project.dcCapacityKwp, 2)} kWp
                        ${esc(state.project.systemConfiguration)}</dd>
                    <dt>Offered price</dt><dd>${money(derived.commercial.finalPrice)} inclusive of GST</dd>
                </div>

                <div class="cq-sign-grid">
                    <div class="cq-sign-box">
                        <strong>For the Customer</strong>
                        ${esc(customerName(state) || '—')}<br>
                        Name:<br>Designation:<br>Date:
                    </div>
                    <div class="cq-sign-box">
                        <strong>For ${esc(Content.COMPANY.legalName)}</strong>
                        ${esc(state.project.preparedBy || '')}<br>
                        Name:<br>Designation:<br>Date:
                    </div>
                </div>

                <div class="cq-note">Please return one signed copy of this page to confirm the order.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 38. Annexure index
    // ---------------------------------------------------------------------

    register('annexure-index', context => {
        const { state, pagePlan } = context;
        const annexures = Model.includedAnnexures(state);

        const firstPageOf = annexureId => {
            const match = pagePlan.filter(page => page.annexureId === annexureId)[0];
            return match ? match.pageNumber : '—';
        };

        return {
            title: 'Annexure Index',
            subtitle: 'Supporting documents attached to this proposal',
            body: `
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th style="width:10%">#</th>
                            <th style="width:46%">Title</th>
                            <th style="width:22%">Type</th>
                            <th class="cq-num">Page</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${annexures.map((annexure, index) => `
                            <tr>
                                <td class="cq-center">${index + 1}</td>
                                <td>${esc(annexure.title || annexure.fileName || `Annexure ${index + 1}`)}</td>
                                <td>${esc(labelFor(Config.ANNEXURE_TYPES, annexure.type))}</td>
                                <td class="cq-num">${firstPageOf(annexure.id)}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
                <div class="cq-note">Annexures are project-specific documents supplied with this
                    proposal. They follow this page in upload order.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 39. Annexure pages
    //
    // The frame is drawn here; quote-generator-annexures.js fills it
    // asynchronously with the stored image or the rendered PDF page.
    // ---------------------------------------------------------------------

    register('annexures', context => {
        const { state, page } = context;
        const annexures = Model.includedAnnexures(state);
        const annexure = annexures.filter(item => item.id === page.annexureId)[0];
        const index = annexures.indexOf(annexure);

        if (!annexure) {
            return { title: 'Annexure', subtitle: '', body: '<p class="cq-para">Annexure not found.</p>' };
        }

        return {
            title: annexure.title || annexure.fileName || `Annexure ${index + 1}`,
            subtitle: `${labelFor(Config.ANNEXURE_TYPES, annexure.type)}`
                + (annexure.pageCount > 1 ? ` — page ${page.part + 1} of ${annexure.pageCount}` : ''),
            bodyClass: 'cq-annexure-page',
            body: `
                <div class="cq-annexure-frame" data-annexure-id="${esc(annexure.id)}"
                    data-annexure-page="${page.part + 1}">
                    <p class="cq-para">Loading annexure…</p>
                </div>`
        };
    });
}(typeof self !== 'undefined' ? self : this));
