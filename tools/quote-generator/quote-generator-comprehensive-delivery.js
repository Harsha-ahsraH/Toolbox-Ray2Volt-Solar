/**
 * Quote Generator - Comprehensive §07-§08: delivery and the company
 * Ray2Volt Solar Toolbox
 *
 * Pages 16-20: scope of supply, execution and schedule, quality and safety,
 * warranty and support, and why Ray2Volt. The scope page flows (its clauses
 * are editable and can run long); the others are fixed A4 compositions.
 * Standard wording comes from quote-generator-content.js, the schedule and
 * warranty terms from derived.insights.
 */
(function (root) {
    'use strict';

    const Content = root.QuoteGeneratorContent;
    const Model = root.QuoteGeneratorModel;
    const Pages = root.QuoteGeneratorPages;
    const Charts = root.QuoteGeneratorCharts;

    if (!Pages || !Pages.design || !Charts) {
        console.error('Comprehensive page helpers are missing; load the front matter first.');
        return;
    }

    const { esc, escLines, number } = Pages.helpers;
    const { chapterNumber, opener, designedPage, section, figure } = Pages.design;
    const { icon } = Charts;

    function callout(iconName, title, text) {
        return `
            <div class="cq-callout is-assume">
                ${icon(iconName)}
                <div><strong>${esc(title)}</strong> ${esc(text)}</div>
            </div>`;
    }

    // ---------------------------------------------------------------------
    // P16. Scope of supply (flows)
    // ---------------------------------------------------------------------

    Pages.register('scope', context => {
        const { state } = context;
        const included = Model.enabledClauses(state, 'inclusions');
        const excluded = Model.enabledClauses(state, 'exclusions');
        const rows = Array.from({ length: Math.max(included.length, excluded.length) }, (_, index) => {
            const cell = (clause, kind) => (clause
                ? `<span class="cq-scope-mark is-${kind}">${icon(kind === 'in' ? 'check' : 'x')}</span>${escLines(clause.text)}`
                : '');
            return `<tr><td>${cell(included[index], 'in')}</td><td>${cell(excluded[index], 'out')}</td></tr>`;
        }).join('');

        return designedPage('Scope & Delivery', 'Scope of supply', `
            ${opener(chapterNumber(context, 'delivery'), 'A turnkey scope: what the price covers, and what it does not.',
                'Anything not listed as included here or in the bill of materials is outside the offered price and can be quoted separately.')}
            <table class="cq-table cq-scope-table">
                <colgroup><col style="width:50%"><col style="width:50%"></colgroup>
                <thead><tr><th>Included in the offered price</th><th>Not included</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="2">No scope clauses are enabled.</td></tr>'}</tbody>
            </table>
            <h3 class="cq-t-h3">Who does what</h3>
            <div class="cq-grid-3 cq-duty-grid">${Content.RESPONSIBILITIES.map(entry => `
                <div class="cq-duty">
                    <h4>${esc(entry.party)}</h4>
                    <ul>${entry.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
                </div>`).join('')}
            </div>`, { flow: true });
    });

    // ---------------------------------------------------------------------
    // P17. Execution and schedule
    // ---------------------------------------------------------------------

    Pages.register('execution', context => {
        const { derived } = context;
        const schedule = derived.insights.schedule;
        const chart = Charts.gantt({
            weeks: schedule.weeks,
            rows: schedule.phases.map(phase => ({
                label: phase.title,
                owner: phase.owner,
                start: phase.start,
                end: phase.end,
                kind: phase.owner === 'DISCOM' ? 'grid' : 'plant'
            }))
        });
        const stages = Content.EXECUTION_METHODOLOGY.stages.map((stage, index) => `
            <div class="cq-stage">
                <span class="cq-seq-n">${index + 1}</span>
                <div>
                    <div class="cq-stage-head"><strong>${esc(stage.title)}</strong><span class="cq-chip is-quiet">${esc(stage.owner)}</span></div>
                    <p>${esc(stage.text)}</p>
                </div>
            </div>`).join('');

        return designedPage('Scope & Delivery', 'Execution and schedule', `
            ${opener(chapterNumber(context, 'delivery'),
                `About ${schedule.weeks} weeks from order to commissioning, subject to DISCOM approvals.`,
                Content.EXECUTION_METHODOLOGY.lead)}

            ${figure('Indicative schedule', chart, {
                className: 'cq-grow',
                legend: [{ kind: 'plant', label: 'Ray2Volt' }, { kind: 'grid', label: 'DISCOM' }],
                caption: `Weeks from order confirmation for a plant of this size. ${esc(Content.PROJECT_SCHEDULE.lead)}`
            })}

            ${section('How the work is done', `<div class="cq-stages">${stages}</div>`)}

            ${callout('info', 'External agencies.', Content.PROJECT_SCHEDULE.note)}`);
    });

    // ---------------------------------------------------------------------
    // P18. Quality and safety
    // ---------------------------------------------------------------------

    const SAFETY_ICONS = ['clipboard', 'shield', 'zap', 'users'];

    /** The four quality checkpoints as one numbered sequence, left to right. */
    function qualityGates(checks) {
        return `<ol class="cq-gates">${checks.map((entry, index) => `
            <li class="cq-gate">
                <span class="cq-gate-n">${index + 1}</span>
                <h4>${esc(entry.title)}</h4>
                <ul>${entry.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
            </li>`).join('')}</ol>`;
    }

    /** One row per safety area; its practices run in two columns. */
    function safetyTable(practices) {
        return `
            <table class="cq-table cq-safety">
                <colgroup><col style="width:46mm"><col></colgroup>
                <thead><tr><th>Area</th><th>What is done on site</th></tr></thead>
                <tbody>${practices.map((entry, index) => `
                    <tr>
                        <td><span class="cq-safety-area">${icon(SAFETY_ICONS[index] || 'check')}<strong>${esc(entry.title)}</strong></span></td>
                        <td><ul>${entry.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul></td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    Pages.register('quality-safety', context => {
        const quality = Content.QUALITY_ASSURANCE;
        const safety = Content.HEALTH_SAFETY;

        return designedPage('Scope & Delivery', 'Quality and safety', `
            ${opener(chapterNumber(context, 'delivery'), 'Checked at every stage, and recorded for handover.',
                quality.lead)}

            ${section('Quality checkpoints', qualityGates(quality.checks), 'cq-fill')}
            ${section('Health and safety', `<p class="cq-sec-lead" data-optional>${esc(safety.lead)}</p>${safetyTable(safety.practices)}`)}`);
    });

    // ---------------------------------------------------------------------
    // P19. Warranty and support
    // ---------------------------------------------------------------------

    const SUPPORT_ICONS = ['link', 'activity', 'tool', 'headphones'];

    Pages.register('warranty', context => {
        const { derived } = context;
        const lines = derived.insights.warranties;
        const support = Content.WARRANTY_SUPPORT;
        const longest = lines.reduce((max, line) => Math.max(max, line.years), 0);
        const span = Math.max(25, Math.ceil(longest / 5) * 5);
        const axis = [];
        for (let year = 0; year <= span; year += 5) axis.push(year);

        const timeline = lines.length ? Charts.hbars({
            rows: lines.map(line => ({
                label: line.label,
                note: [line.term ? line.term.replace(/^./, char => char.toUpperCase()) : 'Warranty', line.make].filter(Boolean).join(' · '),
                value: line.years,
                text: `${number(line.years, line.years % 1 ? 1 : 0)} ${line.years === 1 ? 'year' : 'years'}`,
                kind: line.categoryId === 'modules' ? 'solar' : 'plant'
            })),
            max: span,
            axis,
            axisLabel: value => (value === 0 ? 'Handover' : `${value} yrs`)
        }) : '<p class="cq-t-small">No warranty periods are stated in the bill of materials.</p>';

        return designedPage('Scope & Delivery', 'Warranty and support', `
            ${opener(chapterNumber(context, 'delivery'),
                longest > 0 ? `Warranties of up to ${number(longest, 0)} years, registered in your name.`
                    : 'Manufacturer warranties registered in your name, and our support behind them.',
                support.lead)}

            ${figure('Warranty periods from handover', timeline, {
                className: 'cq-grow cq-fig-warranty',
                caption: 'As stated in the bill of materials. The manufacturer\'s own warranty document governs each term.'
            })}

            ${section('What we do after handover', `
                <div class="cq-support">${support.support.map((text, index) => `
                    <div><span class="cq-feature-ic">${icon(SUPPORT_ICONS[index] || 'check')}</span><p>${esc(text)}</p></div>`).join('')}
                </div>`)}

            <div class="cq-split">
                ${callout('award', 'Workmanship.', support.workmanship)}
                ${callout('alert', 'Exclusions.', support.exclusionsNote)}
            </div>`);
    });

    // ---------------------------------------------------------------------
    // P20. Why Ray2Volt
    // ---------------------------------------------------------------------

    const CAPABILITY_ICONS = ['pen', 'truck', 'tool', 'file', 'zap', 'headphones'];

    Pages.register('why-ray2volt', context => {
        const about = Content.ABOUT;
        const why = Content.WHY_RAY2VOLT;
        const company = Content.COMPANY;

        return designedPage('Why Ray2Volt', 'Who builds your plant, and how we work', `
            ${opener(chapterNumber(context, 'company'), 'One team and one contract, from the survey to the handover.',
                about.lead)}

            <div class="cq-about">
                <div class="cq-about-text">
                    ${about.paragraphs.map((text, index) => `<p${index > 1 ? ' data-optional' : ''}>${esc(text)}</p>`).join('')}
                </div>
                <dl class="cq-company">
                    <div><dt>Company</dt><dd>${esc(company.legalName)}</dd></div>
                    <div><dt>CIN</dt><dd>${esc(company.cin)}</dd></div>
                    <div><dt>Registered office</dt><dd>${esc(company.address)}</dd></div>
                </dl>
            </div>

            ${section('What we do', `<div class="cq-cap-grid">${about.capabilities.map((capability, index) => `
                <div class="cq-cap"><span class="cq-feature-ic">${icon(CAPABILITY_ICONS[index] || 'check')}</span>
                    <strong>${esc(capability.title)}</strong><p>${esc(capability.text)}</p></div>`).join('')}</div>`)}

            ${section('What you get', `<ol class="cq-diff">${why.differentiators.map((item, index) => `
                <li><span class="cq-seq-n">${index + 1}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></li>`).join('')}
                </ol>`, 'cq-fill')}`);
    });
}(typeof self !== 'undefined' ? self : this));
