/**
 * Quote Generator - Comprehensive §09-§10 and Annexures B onward
 * Ray2Volt Solar Toolbox
 *
 * The commercial offer (price, taxes and payment milestones), the terms and
 * conditions, the acceptance page, Annexure B (the year-by-year projection),
 * Annexure C (the project background in full, printed only when a page had
 * to shorten it) and the frames for attached documents. The commercial,
 * terms and annexure pages flow; acceptance is a fixed composition.
 */
(function (root) {
    'use strict';

    const Content = root.QuoteGeneratorContent;
    const Calc = root.QuoteGeneratorCalc;
    const Pages = root.QuoteGeneratorPages;
    const Charts = root.QuoteGeneratorCharts;

    if (!Pages || !Pages.design || !Charts) {
        console.error('Comprehensive page helpers are missing; load the front matter first.');
        return;
    }

    const {
        esc, escLines, fallback, money, number, formatDate, customerName, siteAddress, offeredRate
    } = Pages.helpers;
    const { kwp, chapterNumber, opener, kpi, kpiMoney, designedPage } = Pages.design;
    const { icon, inr } = Charts;

    // ---------------------------------------------------------------------
    // P21. Commercial offer (flows)
    // ---------------------------------------------------------------------

    function priceRows(state, derived) {
        const commercial = derived.commercial;
        const discounts = (state.commercial.discounts || []).filter(discount => Number(discount.amount) > 0);
        const half = number(commercial.gstRate / 2, 2);
        const row = (label, amount, className) =>
            `<tr${className ? ` class="${className}"` : ''}><td>${label}</td><td class="cq-num">${amount}</td></tr>`;

        // Without a discount the project cost is the final price; show it once.
        return (discounts.length ? [
            row('Project cost, including GST', money(commercial.actualProjectCost))
        ].concat(discounts.map(discount => row(`Less: ${esc(discount.name || 'Discount')}`, `− ${money(discount.amount)}`))) : [])
            .concat([
                row('Final offered price, including GST', money(commercial.finalPrice), 'cq-total-row'),
                row('Taxable value', money(commercial.taxableValue))
            ])
            .concat(commercial.isInterState
                ? [row(`IGST at ${number(commercial.gstRate, 2)}%`, money(commercial.gstAmount))]
                : [row(`CGST at ${half}%`, money(commercial.gstAmount / 2)),
                    row(`SGST at ${half}%`, money(commercial.gstAmount / 2))])
            .join('');
    }

    Pages.register('commercial-offer', context => {
        const { state, derived } = context;
        const commercial = derived.commercial;
        const price = kpiMoney(commercial.finalPrice);
        const taxable = kpiMoney(commercial.taxableValue);
        const gst = kpiMoney(commercial.gstAmount);
        const rate = offeredRate(state, derived);
        const breakdown = (state.commercial.priceBreakdown || []).filter(entry => Number(entry.amount) > 0);
        const milestones = commercial.milestones;

        return designedPage('Commercial', 'The commercial offer', `
            ${opener(chapterNumber(context, 'commercial'),
                `${inr(commercial.finalPrice)} for the complete ${kwp(state.project.dcCapacityKwp)} kWp plant, including GST.`,
                'The price, the taxes within it, and when each payment falls due.')}

            <div class="cq-g4">
                ${kpi('rupee', 'Offered price', price.value, price.unit, 'Including GST')}
                ${kpi('file', 'Taxable value', taxable.value, taxable.unit, 'Before GST')}
                ${kpi('layers', 'GST', gst.value, gst.unit, `At ${number(commercial.gstRate, 2)}%, ${commercial.isInterState ? 'IGST' : 'CGST + SGST'}`)}
                ${rate ? kpi('sun', 'Rate per Wp', `₹${number(commercial.finalPricePerWp, 2)}`, '/Wp', 'Excluding GST')
                    : kpi('calendar', 'Valid for', esc(state.project.validityDays), 'days', 'From the date of issue')}
            </div>

            <h3 class="cq-t-h3">Price and taxes</h3>
            <table class="cq-table cq-price-table">
                <colgroup><col><col style="width:32%"></colgroup>
                <thead><tr><th>Particulars</th><th class="cq-num">Amount</th></tr></thead>
                <tbody>${priceRows(state, derived)}</tbody>
            </table>

            ${breakdown.length ? `
            <h3 class="cq-t-h3">What the price is made of</h3>
            <table class="cq-table cq-price-table">
                <colgroup><col><col style="width:32%"></colgroup>
                <thead><tr><th>Description</th><th class="cq-num">Amount, including GST</th></tr></thead>
                <tbody>${breakdown.map(entry => `
                    <tr><td>${escLines(entry.description)}</td><td class="cq-num">${money(entry.amount)}</td></tr>`).join('')}
                    <tr class="cq-total-row"><td>Total</td><td class="cq-num">${money(commercial.breakdownTotal)}</td></tr>
                </tbody>
            </table>` : ''}

            <h3 class="cq-t-h3">Payment milestones</h3>
            ${milestones.length ? `<div class="cq-fig cq-fig-stack"><div class="cq-fig-body">${Charts.stack(milestones.map(entry => ({
                percent: entry.percent,
                share: `${number(entry.percent, entry.percent % 1 ? 1 : 0)}%`,
                label: entry.name || 'Milestone',
                amount: inr(entry.amount)
            })))}</div></div>` : ''}
            <table class="cq-table cq-milestone-table">
                <colgroup><col style="width:8mm"><col style="width:36%"><col style="width:11%"><col style="width:20%"><col></colgroup>
                <thead><tr><th></th><th>Milestone</th><th class="cq-num">Share</th><th class="cq-num">Amount</th><th>Due when</th></tr></thead>
                <tbody>
                    ${milestones.length ? milestones.map((entry, index) => `
                        <tr><td class="cq-center">${index + 1}</td><td>${esc(entry.name || '—')}</td>
                            <td class="cq-num">${number(entry.percent, 2)}%</td><td class="cq-num">${money(entry.amount)}</td>
                            <td>${esc(entry.note || '—')}</td></tr>`).join('')
                        : '<tr><td colspan="5">No payment milestones have been entered.</td></tr>'}
                    <tr class="cq-total-row"><td></td><td>Total</td><td class="cq-num">${number(commercial.milestonePercentTotal, 2)}%</td>
                        <td class="cq-num">${money(commercial.finalPrice)}</td><td></td></tr>
                </tbody>
            </table>

            <div class="cq-callout is-assume">
                ${icon('calendar')}
                <div><strong>Valid for ${esc(state.project.validityDays)} days</strong> from
                    ${esc(formatDate(state.project.quoteDate) || 'the date of issue')}. Material is despatched and work is
                    scheduled against cleared payment for each milestone. Any statutory change in taxes or duties after the
                    validity date is charged at actuals.</div>
            </div>`, { flow: true });
    });

    // ---------------------------------------------------------------------
    // P23. Terms and conditions (flows)
    // ---------------------------------------------------------------------

    Pages.register('terms-conditions', context => {
        const { state, page } = context;
        const clauses = Calc.clauseUnits(state, 'terms');
        const chunk = page.chunk || { start: 0, end: clauses.length };
        const slice = clauses.slice(chunk.start, chunk.end);
        const first = !page.isContinuation;
        const last = page.part === page.partCount - 1;

        return designedPage('Commercial', first ? 'Terms and conditions' : 'Continued', `
            ${first ? opener(chapterNumber(context, 'commercial'), 'The terms on which this offer is made.',
                'Read with the scope of supply and the commercial offer; together they form the accepted offer.') : ''}
            ${slice.length ? `
            <ol class="cq-clause-list cq-terms">${slice.map(clause => `
                <li><span class="cq-clause-num">${clause.number}${clause.isContinuation ? '<br>cont.' : ''}</span>
                    <span>${escLines(clause.text)}</span></li>`).join('')}
            </ol>` : '<p class="cq-para">No terms are enabled.</p>'}
            ${last ? `
            <div class="cq-callout is-assume">
                ${icon('info')}
                <div>This quotation is valid for ${esc(state.project.validityDays)} days from
                    ${esc(formatDate(state.project.quoteDate) || 'the date of issue')}. Acceptance of this offer constitutes
                    acceptance of these terms.</div>
            </div>` : ''}`, { flow: true });
    });

    // ---------------------------------------------------------------------
    // P24. Acceptance
    // ---------------------------------------------------------------------

    function signBox(title, name) {
        const line = label => `<span>${label}</span><span class="cq-sign-line" aria-hidden="true"></span>`;
        return `
            <div class="cq-sign-box">
                <strong>${title}</strong>
                <span class="cq-sign-name">${name}</span>
                <div class="cq-signature-area">Signature</div>
                <div class="cq-sign-fields">${line('Name')}${line('Designation')}${line('Date')}${line('Seal')}</div>
            </div>`;
    }

    Pages.register('acceptance', context => {
        const { state, derived } = context;
        const rate = offeredRate(state, derived);
        const fact = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
        const documents = [
            'The scope of supply, with its inclusions and exclusions',
            'The bill of materials (Annexure A)',
            'The commercial offer and payment milestones',
            'The terms and conditions'
        ];

        return designedPage('Acceptance', 'Confirmation of this offer', `
            ${opener(chapterNumber(context, 'acceptance'), 'Sign below to accept the offer and begin the project.',
                'By signing, you accept the scope, the commercial offer and the terms and conditions set out in this proposal.')}

            <div class="cq-split">
                <dl class="cq-facts cq-facts-2 cq-accept-facts">
                    ${fact('Quotation', `${esc(state.project.quoteNumber || '—')}, ${esc(state.project.revision || 'Rev 0')}`)}
                    ${fact('Date of issue', esc(formatDate(state.project.quoteDate) || '—'))}
                    ${fact('Customer', fallback(customerName(state), 'customer name'))}
                    ${fact('Plant', `${number(state.project.dcCapacityKwp, 2)} kWp ${esc(state.project.systemConfiguration)}`)}
                    ${fact('Offered price', `${money(derived.commercial.finalPrice)} incl. GST`)}
                    ${fact(rate ? 'Offered rate' : 'Validity', rate ? esc(rate) : `${esc(state.project.validityDays)} days from issue`)}
                    <div class="cq-facts-wide"><dt>Site</dt><dd>${fallback(siteAddress(state), 'site address')}</dd></div>
                </dl>
                <div class="cq-accept-docs">
                    <h4>This acceptance covers</h4>
                    <ul class="cq-check is-in">${documents.map(item => `<li>${icon('check')}<span>${esc(item)}</span></li>`).join('')}</ul>
                    <div class="cq-accept-how">
                        <p><strong>Valid for ${esc(state.project.validityDays)} days</strong> from the date of issue.</p>
                        <p>Please sign both boxes below and return one signed copy of this page to confirm the order.</p>
                    </div>
                </div>
            </div>

            <div class="cq-sign-grid cq-fill">
                ${signBox('For the Customer', fallback(customerName(state), 'customer name'))}
                ${signBox(`For ${esc(Content.COMPANY.legalName)}`, esc(state.project.preparedBy || Content.COMPANY.legalName))}
            </div>

            <div class="cq-next" data-optional>
                <h4>What happens next</h4>
                <ol>${Content.WHY_RAY2VOLT.nextSteps.map((step, index) =>
                    `<li><span class="cq-seq-n">${index + 1}</span><p>${esc(step)}</p></li>`).join('')}</ol>
            </div>`);
    });

    // ---------------------------------------------------------------------
    // Annexure B. The year-by-year projection (flows)
    // ---------------------------------------------------------------------

    Pages.register('savings-projection', context => {
        const { derived, page } = context;
        const projection = derived.projection;
        const totals = derived.insights.projectionTotals;
        const chunk = page.chunk || { start: 0, end: projection.rows.length };
        const first = !page.isContinuation;
        const last = page.part === page.partCount - 1;
        const letter = page.annexureLetter || 'B';

        return designedPage(`Annexure ${letter}: Year-by-Year Projection`, first ? `Every year of the ${projection.years}-year projection` : 'Continued', `
            ${first ? opener(letter, 'The savings projection, year by year.',
                'Gross saving is the value of energy used on site plus export credit; net saving is gross saving less running costs.') : ''}
            <table class="cq-table cq-savings-table">
                <thead><tr>
                    <th style="width:7%">Year</th>
                    <th class="cq-num" style="width:14%">Generation (kWh)</th>
                    <th class="cq-num" style="width:10%">Tariff (₹/kWh)</th>
                    <th class="cq-num" style="width:14%">Used on site</th>
                    <th class="cq-num" style="width:12%">Export credit</th>
                    <th class="cq-num" style="width:11%">Running costs</th>
                    <th class="cq-num" style="width:15%">Net saving</th>
                    <th class="cq-num" style="width:17%">Cumulative</th>
                </tr></thead>
                <tbody>${projection.rows.slice(chunk.start, chunk.end).map(row => `
                    <tr><td>${row.year}</td>
                        <td class="cq-num">${number(row.generationKwh)}</td>
                        <td class="cq-num">${number(row.tariff, 2)}</td>
                        <td class="cq-num">${money(row.selfSavings)}</td>
                        <td class="cq-num">${money(row.exportCredit)}</td>
                        <td class="cq-num">${money(row.costs)}</td>
                        <td class="cq-num">${money(row.netSavings)}</td>
                        <td class="cq-num">${money(row.cumulativeNet)}</td></tr>`).join('')}
                    ${last ? `<tr class="cq-total-row"><td>Total</td>
                        <td class="cq-num">${number(projection.totalGenerationKwh)}</td><td class="cq-num">—</td>
                        <td class="cq-num">${money(totals.selfSavings)}</td>
                        <td class="cq-num">${money(totals.exportCredit)}</td>
                        <td class="cq-num">${money(projection.totalCosts)}</td>
                        <td class="cq-num">${money(projection.totalNetSavings)}</td>
                        <td class="cq-num">${money(projection.totalNetSavings)}</td></tr>` : ''}
                </tbody>
            </table>
            ${last ? `<p class="cq-table-note">Figures are rounded to the nearest rupee. Savings are projections on the
                assumptions set out in the design basis and are not guaranteed.</p>` : ''}`, { flow: true });
    });

    // ---------------------------------------------------------------------
    // Annexure C. Project background in full (flows)
    // ---------------------------------------------------------------------

    const NARRATIVE_TITLES = {
        objective: 'Objective',
        specialRequirements: 'Special requirements',
        existingSystem: 'Existing electrical system',
        siteConditions: 'Site conditions',
        proposedSolution: 'The proposed solution',
        projectNotes: 'Project notes'
    };

    Pages.register('project-background', context => {
        const { derived, page } = context;
        const fields = derived.insights.narrative.fields;
        const letter = page.annexureLetter || 'C';
        const blocks = Object.keys(NARRATIVE_TITLES).filter(key => fields[key] && fields[key].text).map(key => `
            <h3 class="cq-t-h3">${esc(NARRATIVE_TITLES[key])}</h3>
            ${fields[key].text.split(/\n\s*\n/).map(paragraph => `<p class="cq-para">${escLines(paragraph.trim())}</p>`).join('')}`);

        return designedPage(`Annexure ${letter}: Project Background`, 'The project text in full', `
            ${opener(letter, 'The project background, in full.',
                'The pages of this proposal quote these notes in shortened form; the complete text is set out here.')}
            ${blocks.join('')}`, { flow: true });
    });

    // ---------------------------------------------------------------------
    // Attached annexures. The frame is drawn here; quote-generator-annexures.js
    // fills it with the stored image or the rendered PDF page.
    // ---------------------------------------------------------------------

    Pages.register('annexures', context => {
        const { page } = context;
        const entry = Calc.annexureList(context.state).filter(item => item.annexureId === page.annexureId)[0];
        if (!entry) return { title: 'Annexure', subtitle: '', body: '<p class="cq-para">Annexure not found.</p>' };

        return {
            title: `Annexure ${entry.letter}: ${entry.title}`,
            subtitle: entry.type + (entry.pageCount > 1 ? `, page ${page.part + 1} of ${entry.pageCount}` : ''),
            bodyClass: 'cq-annexure-page',
            body: `
                <div class="cq-annexure-frame" data-annexure-id="${esc(entry.annexureId)}" data-annexure-page="${page.part + 1}">
                    <p class="cq-para">Loading annexure…</p>
                </div>`
        };
    });
}(typeof self !== 'undefined' ? self : this));
