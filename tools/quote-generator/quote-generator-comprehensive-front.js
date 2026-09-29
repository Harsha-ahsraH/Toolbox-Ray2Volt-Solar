/**
 * Quote Generator - Comprehensive front matter (pages 1-4)
 * Ray2Volt Solar Toolbox
 *
 * The cover, the Contents & Document Control page, and the two Executive
 * Summary pages: "what changes for you" and "the offer at a glance". These
 * are fixed full-page compositions; the document layout places them whole
 * instead of flowing their content (quote-generator-document-layout.js).
 *
 * The cover masthead, the cover footer, and the running header and footer are
 * unchanged house stationery. See quote-generator-comprehensive-pages.js for
 * the renderer contract; every figure comes from `context.derived`.
 *
 * The building blocks every designed page shares (the chapter band, KPI
 * tiles, text cards, figure frames) are published at the end of this file
 * as Pages.design for the renderers of pages 5 onward.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Content = root.QuoteGeneratorContent;
    const Calc = root.QuoteGeneratorCalc;
    const Pages = root.QuoteGeneratorPages;
    const Charts = root.QuoteGeneratorCharts;

    if (!Pages || !Charts) {
        console.error('Comprehensive page registry or chart builders are missing.');
        return;
    }

    const {
        esc, escLines, fallback, money, number, formatDate, labelFor,
        customerName, siteAddress, capacityLine, proposalTitle, categoryRows, warrantyText, offeredRate
    } = Pages.helpers;
    const { icon, inr } = Charts;

    /** A label and its value, drawn only when there is a value. */
    function detail(label, value) {
        const text = String(value === null || value === undefined ? '' : value).trim();
        return text ? `<dt>${esc(label)}</dt><dd>${escLines(text)}</dd>` : '';
    }

    /** Capacity for a sentence: "250 kWp", "498.96 kWp". */
    function kwp(value) {
        return (Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }

    function installationLabel(state) {
        return labelFor(Config.INSTALLATION_LOCATIONS, state.project.installationLocation);
    }

    function meteringLabel(state) {
        return labelFor(Config.ARRANGEMENT_TYPES, state.savings.arrangementType);
    }

    /** The chapter number the executive summary opens, from the page plan. */
    function chapterNumber(context, chapterId) {
        const chapter = Calc.chapterContents(context.pagePlan || []).filter(entry => entry.id === chapterId)[0];
        return chapter ? chapter.number : '';
    }

    /**
     * The chapter's key message: a tinted band with the chapter number, the
     * takeaway as one sentence, and a line on what the page covers. The
     * running header already names the chapter, so the band does not repeat it.
     */
    function opener(number, title, lead) {
        return `
            <header class="cq-opener">
                <span class="cq-opener-num">${esc(number)}</span>
                <div>
                    <h2 class="cq-t-h2">${esc(title)}</h2>
                    ${lead ? `<p>${esc(lead)}</p>` : ''}
                </div>
            </header>`;
    }

    // ---------------------------------------------------------------------
    // P1. Cover — masthead and footer unchanged; no figures before page 3.
    // ---------------------------------------------------------------------

    Pages.register('cover', context => {
        const { state } = context;
        const contactLine = [state.customer.contactPerson, state.customer.designation]
            .filter(part => String(part || '').trim()).join(', ');
        const reach = [state.customer.phone, state.customer.email]
            .filter(part => String(part || '').trim()).join(' · ');

        return {
            chrome: 'none',
            pageClass: 'cq-cover',
            body: `
                <div class="cq-cover-head">
                    <img src="../../global/assets/logo.png" alt="Ray2Volt Solar" class="cq-cover-logo">
                    <dl class="cq-cover-ref">
                        <dt>Quotation</dt>
                        <dd>${fallback(state.project.quoteNumber, 'number pending')}</dd>
                        <dt>Date</dt>
                        <dd>${fallback(formatDate(state.project.quoteDate), 'date pending')}</dd>
                    </dl>
                </div>

                <span class="cq-cover-kicker">Techno-Commercial Proposal</span>
                <h1 class="cq-cover-title">${esc(proposalTitle(state))}</h1>
                <p class="cq-cover-lead">Prepared for
                    <strong>${fallback(customerName(state), 'customer name')}</strong></p>

                <img src="assets/Cover Page Image.png" alt="Solar installation" class="cq-cover-hero">

                <div class="cq-cover-facts">
                    <div class="cq-cover-fact">
                        ${icon('user')}
                        <div>
                            <strong>Attention</strong>
                            <span>${contactLine ? esc(contactLine) : fallback(customerName(state), 'contact person')}</span>
                            ${reach ? `<small>${esc(reach)}</small>` : ''}
                        </div>
                    </div>
                    <div class="cq-cover-fact">
                        ${icon('file')}
                        <div>
                            <strong>Offer</strong>
                            <span>${esc(installationLabel(state))} · ${esc(meteringLabel(state))}</span>
                            <small>Valid for ${esc(state.project.validityDays)} days · ${esc(state.project.revision || 'Rev 0')}</small>
                        </div>
                    </div>
                </div>

                <div class="cq-cover-footer">
                    <p>${esc(Content.COMPANY.legalName)} | CIN: ${esc(Content.COMPANY.cin)}</p>
                    <p>${esc(Content.COMPANY.address)}</p>
                </div>`
        };
    });

    // ---------------------------------------------------------------------
    // P2. Contents & Document Control
    //
    // Page numbers are drafted from the page plan and corrected by the document
    // layout after composition, through the data-chapter-id hooks.
    // ---------------------------------------------------------------------

    Pages.register('contents', context => {
        const { state } = context;
        const chapters = Calc.chapterContents(context.pagePlan || []);
        const company = state.customer.customerType === 'company';

        return {
            title: 'Contents & Document Control',
            subtitle: 'Where to find each part of this proposal',
            bodyClass: 'cq-contents-page',
            body: `
                <div class="cq-contents-grid">
                    <section>
                        <h3 class="cq-t-h3">Contents</h3>
                        <ol class="cq-chapters">
                            ${chapters.map(chapter => `
                                <li data-chapter-id="${esc(chapter.id)}">
                                    <span class="cq-chapter-num">${esc(chapter.number)}</span>
                                    <span class="cq-chapter-text">
                                        <strong>${esc(chapter.title)}</strong>
                                        <small>${esc(chapter.summary)}</small>
                                    </span>
                                    <span class="cq-toc-page">${chapter.pageNumber}</span>
                                </li>`).join('')}
                        </ol>
                    </section>
                    <aside class="cq-docpanel">
                        <h3 class="cq-docpanel-head">Document details</h3>
                        <dl class="cq-docpanel-id">
                            <div class="is-lead"><dt>Quotation no.</dt><dd>${fallback(state.project.quoteNumber, 'number pending')}</dd></div>
                            <div class="is-wide"><dt>Date of issue</dt><dd>${fallback(formatDate(state.project.quoteDate), 'date pending')}</dd></div>
                            <div><dt>Revision</dt><dd>${esc(state.project.revision || 'Rev 0')}</dd></div>
                            <div><dt>Valid for</dt><dd>${esc(state.project.validityDays)} days</dd></div>
                        </dl>
                        <div class="cq-docpanel-group">
                            <h4>Customer</h4>
                            <dl class="cq-docinfo">
                                <dt>Prepared for</dt><dd>${fallback(customerName(state), 'customer name')}</dd>
                                ${company ? detail('Attention', [state.customer.contactPerson, state.customer.designation]
                                    .filter(part => String(part || '').trim()).join(', ')) : ''}
                                <dt>Billing address</dt><dd>${fallback(state.customer.billingAddress, 'billing address')}</dd>
                                <dt>Site address</dt><dd>${fallback(siteAddress(state), 'site address')}</dd>
                                ${detail('GSTIN', state.customer.gstin)}
                                ${company ? detail('CIN', state.customer.cin) : ''}
                            </dl>
                        </div>
                        <div class="cq-docpanel-group cq-docpanel-issuer">
                            <h4>Issued by</h4>
                            <dl class="cq-docinfo">
                                ${detail('Prepared by', state.project.preparedBy)}
                                <dt>Company</dt><dd>${esc(Content.COMPANY.legalName)}</dd>
                            </dl>
                        </div>
                    </aside>
                </div>

                <section class="cq-glossary" data-optional>
                    <h3 class="cq-t-h3">Abbreviations</h3>
                    <dl>
                        ${Content.ABBREVIATIONS.map(([term, meaning]) =>
                            `<div><dt>${esc(term)}</dt><dd>${esc(meaning)}</dd></div>`).join('')}
                    </dl>
                </section>

                <div class="cq-callout is-assume cq-contents-note">
                    ${icon('info')}
                    <div><strong>Confidentiality.</strong> ${esc(Content.COMPANY.confidentiality)}</div>
                </div>`
        };
    });

    // ---------------------------------------------------------------------
    // P3. Executive summary I — what changes for you
    // ---------------------------------------------------------------------

    function changeRow(label, note, today, withSolar, reduction) {
        return `
            <tr>
                <td><strong>${esc(label)}</strong><small>${esc(note)}</small></td>
                <td class="cq-num">${today}</td>
                <td class="cq-num cq-change-with">${withSolar}</td>
                <td class="cq-num">${reduction > 0 ? `${reduction}% lower` : '—'}</td>
            </tr>`;
    }

    function reductionPercent(pair) {
        return pair && pair.today > 0 && Number.isFinite(pair.withSolar)
            ? Math.round((1 - pair.withSolar / pair.today) * 100) : 0;
    }

    function summaryTakeaway(derived) {
        const change = derived.beforeAfter.billReductionPercent;
        if (change === 100) return 'Your electricity bill is fully offset from the first month.';
        if (change > 0) return `Your electricity bill falls by ${change}% from the first month.`;
        return `Solar saves ${inr(derived.projection.rows[0].netSavings)} in the first year alone.`;
    }

    /**
     * The bar pairs under the table: year-1 energy and bill when consumption
     * was entered, the lifetime spend always, and the cost per unit when there
     * would otherwise be a single pair.
     */
    function shiftPairs(derived) {
        const shift = derived.transformation;
        const change = derived.beforeAfter;
        const life = shift.lifetime;
        const byBill = life.basis === 'bill';
        const kwh = value => `${number(value, 0)} kWh`;
        const pairs = [];

        if (shift.energy) {
            pairs.push(Charts.barPair({
                title: 'Where your electricity comes from, year 1',
                change: `${100 - change.gridShare.withSolar}% from your own plant`,
                rows: [
                    { label: 'Today', value: '100% grid', parts: [{ kind: 'grid', amount: shift.energy.totalKwh }] },
                    { label: 'With Ray2Volt', value: `${change.gridShare.withSolar}% grid`, parts: [
                        { kind: 'grid', amount: shift.energy.gridKwh }, { kind: 'solar', amount: shift.energy.solarKwh }] }
                ],
                key: [
                    { kind: 'grid', label: 'From the grid', value: kwh(shift.energy.gridKwh) },
                    { kind: 'solar', label: 'From your solar plant', value: kwh(shift.energy.solarKwh) }
                ]
            }));
        }
        if (shift.bill) {
            pairs.push(Charts.barPair({
                title: 'Your electricity bill, year 1',
                change: `${change.billReductionPercent}% lower`,
                rows: [
                    { label: 'Today', value: inr(shift.bill.today), parts: [{ kind: 'grid', amount: shift.bill.today }] },
                    { label: 'With Ray2Volt', value: inr(shift.bill.withSolar), parts: [
                        { kind: 'grid', amount: shift.bill.withSolar }, { kind: 'kept', amount: shift.bill.saved }] }
                ],
                key: [
                    { kind: 'grid', label: 'Paid to the DISCOM' },
                    { kind: 'kept', label: 'Saved', value: inr(shift.bill.saved) }
                ]
            }));
        }
        if (!shift.energy && change.costPerUnit.withSolar !== null) {
            pairs.push(Charts.barPair({
                title: 'What each unit of energy costs',
                change: `${reductionPercent(change.costPerUnit)}% lower`,
                rows: [
                    { label: 'Grid tariff', value: `₹${number(change.costPerUnit.today, 2)}/kWh`,
                        parts: [{ kind: 'grid', amount: change.costPerUnit.today }] },
                    { label: 'With Ray2Volt', value: `₹${number(change.costPerUnit.withSolar, 2)}/kWh`,
                        parts: [{ kind: 'plant', amount: change.costPerUnit.withSolar }] }
                ],
                key: [
                    { kind: 'grid', label: 'Grid tariff today' },
                    { kind: 'plant', label: `Solar: the price and running costs, averaged over ${life.years} years` }
                ]
            }));
        }
        pairs.push(Charts.barPair({
            title: `What electricity costs you over ${life.years} years`,
            change: life.kept > 0 ? `${inr(life.kept)} kept` : '',
            rows: [
                { label: byBill ? 'Grid only' : 'At grid rates', value: inr(life.gridOnly),
                    parts: [{ kind: 'grid', amount: life.gridOnly }] },
                { label: 'With Ray2Volt', value: inr(life.withSolar), parts: [
                    { kind: 'grid', amount: life.gridBills }, { kind: 'costs', amount: life.costs },
                    { kind: 'plant', amount: life.plant }, { kind: 'kept', amount: life.kept }] }
            ],
            key: [
                { kind: 'grid', label: byBill ? 'Paid to the DISCOM' : 'The same energy bought from the grid',
                    value: byBill ? inr(life.gridBills) : '' },
                life.costs > 0 ? { kind: 'costs', label: 'Running costs', value: inr(life.costs) } : null,
                { kind: 'plant', label: 'Plant price', value: inr(life.plant) },
                life.kept > 0 ? { kind: 'kept', label: 'Kept', value: '' } : null
            ].filter(Boolean)
        }));
        return pairs;
    }

    /** The assumptions every figure on the page rests on, as a ruled grid of eight. */
    function basisCells(state, derived) {
        const savings = state.savings;
        const exported = Number(savings.exportPercent) || 0;
        const cell = (label, value, note) =>
            `<div><dt>${esc(label)}</dt><dd>${value}</dd>${note ? `<small>${note}</small>` : ''}</div>`;

        return [
            cell('Year-1 generation', `${number(derived.projection.rows[0].generationKwh, 0)} kWh`,
                `From ${esc(kwp(state.project.dcCapacityKwp))} kWp DC`),
            cell('Specific yield', `${number(savings.annualGenerationPerKwp, 0)} kWh/kWp`, 'A year, before degradation'),
            cell('Used on site', `${number(savings.selfConsumptionPercent, 0)}%`, 'Of generation, at the grid tariff'),
            cell('Exported', `${number(exported, 0)}%`,
                exported > 0 ? `Credited at ₹${number(savings.exportCreditRate, 2)}/kWh` : 'No export assumed'),
            cell('Tariff today', `₹${number(derived.consumption.averageTariff, 2)}/kWh`,
                derived.consumption.method === 'detailed' ? 'Average of your bills' : 'Current energy charge'),
            cell('Tariff escalation', `${number(savings.tariffEscalationPercent, 1)}% a year`, 'Applied from year 2'),
            cell('Module degradation', `${number(savings.degradationPercent, 2)}% a year`, 'On generation'),
            cell('Grid emission factor', `${number(Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh, 2)} kg/kWh`,
                'CO₂ per unit drawn from the grid')
        ].join('');
    }

    function transformationPage(context) {
        const { state, derived } = context;
        const change = derived.beforeAfter;
        const years = derived.projection.years;
        const rows = [];

        if (change.annualBill) {
            rows.push(changeRow('Annual electricity bill', 'Year 1, at today\'s tariff',
                inr(change.annualBill.today), inr(change.annualBill.withSolar), change.billReductionPercent));
        }
        if (change.costPerUnit.withSolar !== null) {
            rows.push(changeRow('Cost per unit of energy', `Grid tariff today; solar averaged over ${years} years`,
                `₹${number(change.costPerUnit.today, 2)}/kWh`, `₹${number(change.costPerUnit.withSolar, 2)}/kWh`,
                reductionPercent(change.costPerUnit)));
        }
        if (change.gridShare) {
            rows.push(changeRow('Power drawn from the grid', 'Share of annual consumption',
                `${change.gridShare.today}%`, `${change.gridShare.withSolar}%`, reductionPercent(change.gridShare)));
        }
        if (change.co2Tonnes) {
            rows.push(changeRow('CO₂ from your electricity', 'Tonnes a year, at the grid emission factor',
                `${number(change.co2Tonnes.today, 1)} t`, `${number(change.co2Tonnes.withSolar, 1)} t`,
                reductionPercent(change.co2Tonnes)));
        }

        const escalation = number(state.savings.tariffEscalationPercent, 1);
        const pairs = shiftPairs(derived);

        return {
            title: 'Executive Summary',
            subtitle: 'What changes for you',
            pageClass: 'cq-fixed-page',
            bodyClass: 'cq-summary-page',
            body: `
                ${opener(chapterNumber(context, 'summary'), summaryTakeaway(derived),
                    `What the proposed ${kwp(state.project.dcCapacityKwp)} kWp plant changes, from the first month and over ${years} years.`)}

                <table class="cq-table cq-change-table">
                    <colgroup><col><col style="width:24mm"><col style="width:30mm"><col style="width:24mm"></colgroup>
                    <thead>
                        <tr><th></th><th class="cq-num">Today</th><th class="cq-num">With Ray2Volt</th><th class="cq-num">Change</th></tr>
                    </thead>
                    <tbody>${rows.join('')}</tbody>
                </table>

                <section class="cq-shift cq-shift-${pairs.length}" aria-label="Today compared with Ray2Volt solar">
                    ${pairs.join('')}
                </section>

                <section class="cq-basis">
                    <h3 class="cq-t-h3">Basis of these figures</h3>
                    <dl class="cq-basis-grid">${basisCells(state, derived)}</dl>
                    <p class="cq-basis-note">Year-1 figures are at today's tariff; the ${years}-year view raises it by
                        ${escalation}% a year${derived.transformation.lifetime.basis === 'bill' ? ''
                            : ' and, with no consumption entered, prices the plant\'s own energy at grid rates'}.
                        A projection on these assumptions, not a guarantee.</p>
                </section>`
        };
    }

    // ---------------------------------------------------------------------
    // P4. Executive summary II — the offer at a glance
    // ---------------------------------------------------------------------

    function kpi(iconName, label, value, unit, note) {
        return `
            <div class="cq-kpi${String(value).replace(/<[^>]+>/g, '').length > 9 ? ' is-long' : ''}">
                <div class="cq-kpi-label">${icon(iconName)}${esc(label)}</div>
                <div class="cq-kpi-value">${value}${unit ? `<span class="cq-kpi-unit">${esc(unit)}</span>` : ''}</div>
                ${note ? `<div class="cq-kpi-note">${note}</div>` : ''}
            </div>`;
    }

    /** Rupees for a KPI tile: the full figure, no unit beside it. */
    function kpiMoney(value) {
        return { value: inr(value), unit: '' };
    }

    function offerItem(iconName, title, main, sideLabel, sideValue) {
        return `
            <li class="cq-offer-item">
                <span class="cq-feature-ic">${icon(iconName)}</span>
                <span class="cq-offer-text"><strong>${esc(title)}</strong><span>${main}</span></span>
                <span class="cq-offer-side">${sideValue
                    ? `<small>${esc(sideLabel)}</small>${esc(sideValue)}` : ''}</span>
            </li>`;
    }

    /** The first described BOM row of a category, as "make · spec × qty". */
    function equipmentLine(state, categoryId) {
        const row = categoryRows(state, categoryId)[0];
        if (!row) return null;
        const spec = String(row.specification || row.name || '').trim();
        const quantity = Number(row.quantity) > 0 ? ` × ${number(row.quantity)}` : '';
        return {
            main: `${row.make ? `<b>${esc(row.make)}</b> · ` : ''}${esc(spec)}${esc(quantity)}`,
            warranty: row.warranty ? warrantyText(row.warranty) : ''
        };
    }

    function offerPage(context) {
        const { state, derived } = context;
        const projection = derived.projection;
        const year1 = projection.rows[0];
        const hybrid = state.project.systemConfiguration === 'Hybrid';
        const price = kpiMoney(derived.commercial.finalPrice);
        const yearSaving = kpiMoney(year1.netSavings);
        const lifeSaving = kpiMoney(projection.totalNetSavings);
        const payback = derived.payback;
        const milestones = derived.commercial.milestones;
        const rate = offeredRate(state, derived);
        // The price leads the first tile; in full rupees it would push this line to two.
        const takeaway = `A turnkey ${kwp(state.project.dcCapacityKwp)} kWp plant`
            + (payback > 0 ? `, paid back in ${number(payback, 1)} years.` : '.');

        const items = [
            offerItem('sun', 'Plant size', esc(capacityLine(state)), 'Configuration',
                derived.dcAcRatio > 0 ? `${state.project.systemConfiguration} · DC/AC ${number(derived.dcAcRatio, 2)}`
                    : state.project.systemConfiguration)
        ];
        [['modules', 'grid', 'Solar PV modules'], ['inverters', 'zap', hybrid ? 'Hybrid inverters' : 'Inverters']]
            .concat(hybrid ? [['battery', 'battery', 'Battery storage']] : [])
            .forEach(([categoryId, iconName, title]) => {
                const line = equipmentLine(state, categoryId);
                if (line) items.push(offerItem(iconName, title, line.main, 'Warranty', line.warranty));
            });
        const mounting = categoryRows(state, 'mounting')[0];
        items.push(offerItem('layers', 'Mounting structure',
            `${esc(installationLabel(state))}${mounting && mounting.specification ? ` · ${esc(mounting.specification)}` : ''}`,
            'Warranty', mounting && mounting.warranty ? warrantyText(mounting.warranty) : ''));
        items.push(offerItem('tool', 'Turnkey delivery',
            'Design, supply, installation, testing and commissioning, with approvals and '
                + `${state.savings.arrangementType === 'net-metering' ? 'net-metering' : 'grid-connection'} liaison with the DISCOM`,
            'Responsibility', 'Single point, end to end'));

        return {
            title: 'Executive Summary',
            subtitle: 'The offer at a glance',
            pageClass: 'cq-fixed-page',
            bodyClass: 'cq-summary-page',
            body: `
                ${opener(chapterNumber(context, 'summary'), takeaway,
                    'The headline figures, what is included, how it is paid for, and what happens next.')}

                <div class="cq-g4 cq-offer-kpis">
                    ${kpi('rupee', 'Offered price', price.value, price.unit, `incl. GST${rate ? ` · ${esc(rate)}` : ''}`)}
                    ${kpi('clock', 'Payback', payback === null ? 'n/a' : number(payback, 1), payback === null ? '' : 'years',
                        payback === null ? 'Not recovered in the projection' : 'Simple payback on the offered price')}
                    ${kpi('trendDown', 'Year-1 saving', yearSaving.value, yearSaving.unit,
                        derived.beforeAfter.billReductionPercent
                            ? `${derived.beforeAfter.billReductionPercent}% off the bill` : 'After running costs')}
                    ${kpi('trend', `${projection.years}-year net saving`, lifeSaving.value, lifeSaving.unit, 'After running costs')}
                </div>

                <h3 class="cq-t-h3">What you get</h3>
                <ul class="cq-offer-list">${items.join('')}</ul>

                ${milestones.length ? `
                <h3 class="cq-t-h3">Payment terms</h3>
                <ol class="cq-payterms" style="--cq-pay-cols:${Math.min(milestones.length, 4)}">
                    ${milestones.map(row => `
                        <li>
                            <span class="cq-payterms-share">${number(row.percent, 0)}%<b>${inr(row.amount)}</b></span>
                            <span class="cq-payterms-name">${esc(row.name || 'Milestone')}</span>
                        </li>`).join('')}
                </ol>` : ''}

                <h3 class="cq-t-h3">Next steps</h3>
                <ol class="cq-stepper">
                    ${Content.WHY_RAY2VOLT.nextSteps.map((step, index) => `
                        <li><span class="cq-stepper-n">${index + 1}</span><p>${esc(step)}</p></li>`).join('')}
                </ol>

                <div class="cq-callout is-assume cq-offer-note">
                    ${icon('info')}
                    <div><strong>Validity.</strong> This offer, ${fallback(state.project.quoteNumber, 'quotation number')}
                        (${esc(state.project.revision || 'Rev 0')}), is valid for ${esc(state.project.validityDays)} days from
                        ${fallback(formatDate(state.project.quoteDate), 'the date of issue')}. The offered price of
                        ${money(derived.commercial.finalPrice)} includes GST; savings are projections on the assumptions
                        in the design basis.</div>
                </div>`
        };
    }

    Pages.register('executive-summary', context =>
        (context.page && context.page.part === 1 ? offerPage : transformationPage)(context));

    // ---------------------------------------------------------------------
    // Shared building blocks for the designed pages
    // ---------------------------------------------------------------------

    /**
     * A designed page: a fixed A4 composition laid out as a column, whose one
     * chart or card row grows into the height the page has left (.cq-grow for
     * charts, .cq-fill for text that may grow but never shrink). `flow` pages
     * are measured and continued by the document layout instead.
     */
    function designedPage(title, subtitle, body, options) {
        const settings = options || {};
        return {
            title,
            subtitle,
            pageClass: settings.flow ? 'cq-designed' : 'cq-fixed-page cq-designed',
            bodyClass: settings.flow ? 'cq-sheet-flow' : 'cq-sheet',
            body
        };
    }

    function section(title, inner, className) {
        return `<section class="cq-sec${className ? ` ${className}` : ''}">
            ${title ? `<h3 class="cq-t-h3">${esc(title)}</h3>` : ''}${inner}</section>`;
    }

    /** A figure frame: title, optional legend, the chart, optional caption. */
    function figure(title, inner, options) {
        const settings = options || {};
        const legend = (settings.legend || []).map(item =>
            `<span><i class="cq-key-${item.kind}"></i>${esc(item.label)}</span>`).join('');
        return `
            <figure class="cq-fig${settings.className ? ` ${settings.className}` : ''}">
                <div class="cq-fig-title"><h4>${esc(title)}</h4>${legend ? `<div class="cq-legend">${legend}</div>` : ''}</div>
                <div class="cq-fig-body">${inner}</div>
                ${settings.caption ? `<figcaption>${settings.caption}</figcaption>` : ''}
            </figure>`;
    }

    /**
     * An outlined card carrying one narrative field as printed on its page,
     * with a pointer to Annexure C when the field was shortened. Empty
     * fields draw nothing.
     */
    function textCard(title, field, iconName) {
        if (!field || !field.excerpt) return '';
        return `
            <article class="cq-text-card">
                <h4>${iconName ? icon(iconName) : ''}${esc(title)}</h4>
                <p>${escLines(field.excerpt)}</p>
                ${field.excerpted ? '<small>Continued in full in Annexure C.</small>' : ''}
            </article>`;
    }

    /** Energy for a tile, in full kWh with Indian digit grouping. */
    function energyParts(kwh) {
        return { value: number(Number(kwh) || 0, 0), unit: 'kWh' };
    }

    function energyText(kwh) {
        const parts = energyParts(kwh);
        return `${parts.value} ${parts.unit}`;
    }

    /** The first BOM row in a category with a stated quantity and rating, as "427 × 585 Wp". */
    function ratedCount(state, categoryId) {
        const row = categoryRows(state, categoryId).filter(entry => Number(entry.quantity) > 0)[0];
        if (!row) return null;
        const rating = Number(row.rating) > 0 ? `${number(row.rating, 2)} ${row.ratingUnit || ''}`.trim() : '';
        return { quantity: Number(row.quantity), rating, row };
    }

    Pages.design = {
        detail, kwp, installationLabel, meteringLabel, chapterNumber, opener, kpi, kpiMoney,
        equipmentLine, designedPage, section, figure, textCard, energyParts, energyText, ratedCount
    };
}(typeof self !== 'undefined' ? self : this));
