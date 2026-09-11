/**
 * Quote Generator - Comprehensive proposal pages (front matter to BOM)
 * Ray2Volt Solar Toolbox
 *
 * Section renderers for the first half of the Comprehensive Proposal: the
 * cover through the bill of materials. They register into the shared registry
 * created by quote-generator-comprehensive-pages.js; see that file's header
 * for the renderer contract.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Content = root.QuoteGeneratorContent;
    const Model = root.QuoteGeneratorModel;
    const Calc = root.QuoteGeneratorCalc;
    const Pages = root.QuoteGeneratorPages;

    if (!Pages) {
        console.error('Comprehensive page registry is missing.');
        return;
    }

    const register = Pages.register;
    const {
        esc, escLines, fallback, excerpt, money, number, formatDate, labelFor,
        customerName, siteAddress, capacityLine, proposalTitle, categoryRows, equipmentTable
    } = Pages.helpers;

    /**
     * Card-header glyphs, drawn from the same stroked 24x24 family the Short
     * Proposal already uses on .qp-prep-header, so a card on either document
     * announces itself the same way.
     */
    const ICONS = {
        customer: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>'
            + '<circle cx="12" cy="7" r="4"></circle>',
        document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>'
            + '<polyline points="14 2 14 8 20 8"></polyline>',
        company: '<path d="M3 21h18"></path><path d="M5 21V7l7-4 7 4v14"></path>'
            + '<path d="M10 21v-6h4v6"></path>'
    };

    function icon(name) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
    }

    /** A definition row, drawn only when there is something to put in it. */
    function row(label, value) {
        const text = String(value === null || value === undefined ? '' : value).trim();
        return text ? `<dt>${esc(label)}</dt><dd>${escLines(text)}</dd>` : '';
    }

    /** A heading and its paragraph, or nothing at all when the field is empty. */
    function block(heading, text) {
        const body = String(text === null || text === undefined ? '' : text).trim();
        return body
            ? `<h3 class="cq-subtitle">${esc(heading)}</h3>
                <p class="cq-para">${escLines(body)}</p>`
            : '';
    }

    /**
     * Specification cell for an equipment table, carrying the scope note typed
     * against the bill-of-materials row beneath it. The note is the sentence
     * that says what the quantity actually covers, so it is printed rather than
     * left in the editor; it is set under the specification it qualifies rather
     * than given a column, which would squeeze every other column on the page.
     *
     * The page planner keeps specifications and remarks as separate fields,
     * including on continuation rows, so both can be printed without guessing
     * whether one is part of the other.
     */
    function specCell(row) {
        const note = String(row.remarks || '').trim();
        const spec = String(row.specification || '');
        if (!note) return esc(spec);

        return `${esc(spec)}<span class="cq-cell-note">${escLines(note)}</span>`;
    }

    /** The per-unit rating entered against a row, when one has been entered. */
    function ratingCell(row) {
        const value = Number(row.rating);
        const unit = String(row.ratingUnit || '').trim();
        return value > 0 ? `${number(value, 2)}${unit ? ` ${esc(unit)}` : ''}` : '—';
    }

    /**
     * Approved capacity beside the capacity the listed equipment adds up to.
     * Both are shown and the difference is stated; neither figure is presented
     * as correcting the other, and the strip is omitted entirely when there are
     * no rated rows to add up.
     */
    function reconStrip(label, entry, unit, hasRated) {
        if (!hasRated || !entry || !(entry.approved > 0)) return '';
        const sign = entry.difference > 0 ? '+' : '';

        return `
            <div class="cq-recon">
                <div class="cq-recon-item">
                    <span class="cq-recon-label">Approved ${esc(label)}</span>
                    <span class="cq-recon-value">${number(entry.approved, 3)} ${esc(unit)}</span>
                </div>
                <div class="cq-recon-item">
                    <span class="cq-recon-label">Listed in bill of materials</span>
                    <span class="cq-recon-value">${number(entry.derived, 3)} ${esc(unit)}</span>
                </div>
                <div class="cq-recon-item">
                    <span class="cq-recon-label">Difference (${entry.mismatch ? 'outside' : 'within'} tolerance)</span>
                    <span class="cq-recon-value">${sign}${number(entry.difference, 3)} ${esc(unit)}</span>
                </div>
            </div>`;
    }

    Pages.blocks = { icon, row, block, specCell, ratingCell, reconStrip };


    // ---------------------------------------------------------------------
    // 1. Cover
    //
    // Follows the Short Proposal's cover sequence — navy edge, ruled masthead,
    // kicker over title over short rule, image, then the two cards that carry
    // the facts a reader checks first. Both cards are set as label/value pairs
    // on one label column so they line up with each other, the treatment
    // .qp-prep-meta gives the Short cover.
    // ---------------------------------------------------------------------

    register('cover', context => {
        const { state } = context;
        const contact = [state.customer.contactPerson, state.customer.designation]
            .filter(part => String(part || '').trim()).join(', ');

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
                <div class="cq-cover-rule"></div>

                <img src="assets/Cover Page Image.png" alt="Solar installation" class="cq-cover-image">

                <div class="cq-cover-grid">
                    <div class="cq-cover-card">
                        <h3>${icon('customer')}Prepared For</h3>
                        <span class="cq-cover-name">${fallback(customerName(state), 'customer name')}</span>
                        <dl class="cq-cover-meta">
                            ${row('Attention', contact)}
                            <dt>Site</dt><dd>${fallback(siteAddress(state), 'site address')}</dd>
                            ${row('Phone', state.customer.phone)}
                            ${row('Email', state.customer.email)}
                            ${row('GSTIN', state.customer.gstin)}
                        </dl>
                    </div>
                    <div class="cq-cover-card">
                        <h3>${icon('document')}Project Summary</h3>
                        <span class="cq-cover-name">${esc(capacityLine(state))}</span>
                        <dl class="cq-cover-meta">
                            <dt>Configuration</dt><dd>${esc(state.project.systemConfiguration)}</dd>
                            <dt>Installation</dt>
                            <dd>${esc(labelFor(Config.INSTALLATION_LOCATIONS,
                                state.project.installationLocation))}</dd>
                            ${row('Site', state.project.siteName)}
                            <dt>Metering</dt>
                            <dd>${esc(labelFor(Config.ARRANGEMENT_TYPES, state.savings.arrangementType))}</dd>
                            ${row('Prepared by', state.project.preparedBy)}
                        </dl>
                    </div>
                </div>

                <div class="cq-cover-footer">
                    <p>${esc(Content.COMPANY.legalName)} | CIN: ${esc(Content.COMPANY.cin)}</p>
                    <p>${esc(Content.COMPANY.address)}</p>
                </div>`
        };
    });

    // ---------------------------------------------------------------------
    // 2. Document control
    // ---------------------------------------------------------------------

    register('document-control', context => {
        const { state } = context;

        return {
            title: 'Document Control',
            subtitle: 'Issue details and confidentiality',
            // Short page: the confidentiality note is anchored to the foot of the
            // text area so the space above it reads as margin, not omission.
            bodyClass: 'cq-body-fill',
            body: `
                <div class="cq-grid-2 cq-document-parties">
                    <div class="cq-card">
                        <h4>${icon('customer')}Prepared For</h4>
                        <dl class="cq-kv">
                            <dt>Customer</dt><dd>${fallback(customerName(state), 'customer name')}</dd>
                            ${state.customer.contactPerson
                                ? `<dt>Contact</dt><dd>${esc(state.customer.contactPerson)}</dd>` : ''}
                            ${state.customer.designation
                                ? `<dt>Designation</dt><dd>${esc(state.customer.designation)}</dd>` : ''}
                            <dt>Phone</dt><dd>${fallback(state.customer.phone, 'phone')}</dd>
                            ${state.customer.email ? `<dt>Email</dt><dd>${esc(state.customer.email)}</dd>` : ''}
                            ${state.customer.gstin ? `<dt>GSTIN</dt><dd>${esc(state.customer.gstin)}</dd>` : ''}
                            ${state.customer.cin ? `<dt>CIN</dt><dd>${esc(state.customer.cin)}</dd>` : ''}
                        </dl>
                    </div>
                    <div class="cq-card">
                        <h4>${icon('company')}Prepared By</h4>
                        <dl class="cq-kv">
                            <dt>Company</dt><dd>${esc(Content.COMPANY.legalName)}</dd>
                            <dt>CIN</dt><dd>${esc(Content.COMPANY.cin)}</dd>
                            <dt>Address</dt><dd>${esc(Content.COMPANY.address)}</dd>
                            ${state.project.preparedBy
                                ? `<dt>Project team</dt><dd>${esc(state.project.preparedBy)}</dd>` : ''}
                        </dl>
                    </div>
                </div>

                <h3 class="cq-subtitle">Document Details</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>Quotation number</dt><dd>${fallback(state.project.quoteNumber, 'number pending')}</dd>
                    <dt>Date of issue</dt><dd>${fallback(formatDate(state.project.quoteDate), 'date pending')}</dd>
                    <dt>Revision</dt><dd>${esc(state.project.revision || 'Rev 0')}</dd>
                    <dt>Validity</dt><dd>${esc(state.project.validityDays)} days from date of issue</dd>
                    <dt>Project title</dt><dd>${esc(proposalTitle(state))}</dd>
                    ${state.project.siteName
                        ? `<dt>Site</dt><dd>${esc(state.project.siteName)}</dd>` : ''}
                    <dt>Billing address</dt><dd>${fallback(state.customer.billingAddress, 'billing address')}</dd>
                    <dt>Site address</dt><dd>${fallback(siteAddress(state), 'site address')}</dd>
                </div>

                <div class="cq-note cq-fill-end">
                    <strong>Confidentiality.</strong> ${esc(Content.COMPANY.confidentiality)}
                </div>`
        };
    });

    // ---------------------------------------------------------------------
    // 3. Table of contents
    // ---------------------------------------------------------------------

    register('contents', context => {
        const { page } = context;
        const all = context.toc.filter(entry => entry.sectionId !== 'contents');
        const chunk = page.chunk || { start: 0, end: all.length };
        const entries = all.slice(chunk.start, chunk.end);
        const groups = [];

        entries.forEach(entry => {
            const last = groups[groups.length - 1];
            if (last && last.group === entry.group) {
                last.items.push(entry);
            } else {
                groups.push({ group: entry.group, items: [entry] });
            }
        });

        return {
            title: 'Table of Contents',
            subtitle: page.isContinuation
                ? `Continued — page ${page.part + 1} of ${page.partCount}`
                : 'Page numbers reflect the sections selected for this proposal',
            body: groups.map(group => `
                <div class="cq-toc-group">${esc(group.group)}</div>
                <ul class="cq-toc-list">
                    ${group.items.map(item => `
                        <li>
                            <span class="cq-toc-title">${esc(item.title)}</span>
                            <span class="cq-toc-page">${item.pageNumber}</span>
                        </li>`).join('')}
                </ul>`).join('')
        };
    });

    // ---------------------------------------------------------------------
    // 4. Executive summary
    // ---------------------------------------------------------------------

    register('executive-summary', context => {
        const { state, derived } = context;
        const projection = derived.projection;
        const payback = derived.payback;

        return {
            title: 'Executive Summary',
            subtitle: 'The proposal at a glance',
            body: `
                <div class="cq-metrics">
                    <div class="cq-metric">
                        <span class="cq-metric-label">Plant Capacity</span>
                        <span class="cq-metric-value">${number(state.project.dcCapacityKwp, 2)}</span>
                        <span class="cq-metric-sub">kWp DC</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Year-1 Generation</span>
                        <span class="cq-metric-value">${number(projection.year1GenerationKwh)}</span>
                        <span class="cq-metric-sub">kWh</span>
                    </div>
                    <div class="cq-metric cq-metric-primary">
                        <span class="cq-metric-label">Offered Price</span>
                        <span class="cq-metric-value">${money(derived.commercial.finalPrice)}</span>
                        <span class="cq-metric-sub">incl. GST${Pages.helpers.offeredRate(state, derived)
                            ? `<br>${Pages.helpers.offeredRate(state, derived)}` : ''}</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Simple Payback</span>
                        <span class="cq-metric-value">${payback === null ? '—' : number(payback, 1)}</span>
                        <span class="cq-metric-sub">years</span>
                    </div>
                </div>

                ${block('Objective', excerpt(state.projectNarrative.objective, 620))}
                ${block('Proposed Solution', excerpt(state.projectNarrative.proposedSolution, 620))}

                <h3 class="cq-subtitle">Headline Figures</h3>
                <table class="cq-table cq-value-table">
                    <thead>
                        <tr><th style="width:46%">Item</th><th>Value</th><th>Basis</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Plant capacity</td>
                            <td>${esc(capacityLine(state))}</td>
                            <td>Approved in Project Settings</td>
                        </tr>
                        <tr>
                            <td>Specific yield assumed</td>
                            <td>${number(projection.specificYield)} kWh/kWp/year</td>
                            <td>Design basis assumption</td>
                        </tr>
                        <tr>
                            <td>Year-1 generation</td>
                            <td>${number(projection.year1GenerationKwh)} kWh</td>
                            <td>Capacity × specific yield</td>
                        </tr>
                        <tr>
                            <td>Generation over ${projection.years} years</td>
                            <td>${number(projection.totalGenerationKwh)} kWh</td>
                            <td>After ${number(state.savings.degradationPercent, 2)}%/year degradation</td>
                        </tr>
                        <tr>
                            <td>Net savings over ${projection.years} years</td>
                            <td>${money(projection.totalNetSavings)}</td>
                            <td>Gross savings less future costs</td>
                        </tr>
                        <tr class="cq-total-row">
                            <td>Offered price (incl. GST)</td>
                            <td>${money(derived.commercial.finalPrice)}</td>
                            <td>After ${money(derived.commercial.discountTotal)} discount${Pages.helpers.offeredRate(state, derived)
                                ? `<br>${Pages.helpers.offeredRate(state, derived)}` : ''}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="cq-note">Generation and savings are projections on the assumptions disclosed
                    in the design basis section. They are estimates, not guaranteed outcomes.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 5. Customer and project profile
    // ---------------------------------------------------------------------

    register('customer-project-profile', context => {
        const { state, derived } = context;
        const isCompany = state.customer.customerType === 'company';

        return {
            title: 'Customer & Project Profile',
            subtitle: 'Who the proposal is for and what is being built',
            bodyClass: 'cq-body-fill',
            body: `
                <h3 class="cq-subtitle">Customer</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>${isCompany ? 'Legal name' : 'Name'}</dt>
                    <dd>${fallback(customerName(state), 'customer name')}</dd>
                    ${isCompany && state.customer.contactPerson
                        ? `<dt>Contact person</dt><dd>${esc(state.customer.contactPerson)}${
                            state.customer.designation ? `, ${esc(state.customer.designation)}` : ''}</dd>` : ''}
                    <dt>Phone</dt><dd>${fallback(state.customer.phone, 'phone')}</dd>
                    ${state.customer.email ? `<dt>Email</dt><dd>${esc(state.customer.email)}</dd>` : ''}
                    ${state.customer.gstin ? `<dt>GSTIN</dt><dd>${esc(state.customer.gstin)}</dd>` : ''}
                    ${isCompany && state.customer.cin ? `<dt>CIN</dt><dd>${esc(state.customer.cin)}</dd>` : ''}
                    <dt>Billing address</dt><dd>${fallback(state.customer.billingAddress, 'billing address')}</dd>
                </div>

                <h3 class="cq-subtitle">Project</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>Site address</dt><dd>${fallback(siteAddress(state), 'site address')}</dd>
                    ${state.project.siteName ? `<dt>Site name</dt><dd>${esc(state.project.siteName)}</dd>` : ''}
                    <dt>System configuration</dt><dd>${esc(state.project.systemConfiguration)}</dd>
                    <dt>Installation location</dt>
                    <dd>${esc(labelFor(Config.INSTALLATION_LOCATIONS, state.project.installationLocation))}</dd>
                    <dt>Solar DC capacity</dt><dd>${number(state.project.dcCapacityKwp, 2)} kWp</dd>
                    <dt>Inverter AC capacity</dt><dd>${number(state.project.acCapacityKw, 2)} kW</dd>
                    <dt>DC/AC ratio</dt><dd>${derived.dcAcRatio > 0 ? `${derived.dcAcRatio} : 1` : '—'}</dd>
                    ${state.project.systemConfiguration === 'Hybrid' ? `
                        <dt>Battery energy</dt><dd>${number(state.project.batteryEnergyKwh, 2)} kWh</dd>
                        <dt>Battery power</dt><dd>${number(state.project.batteryPowerKw, 2)} kW</dd>` : ''}
                    <dt>Metering arrangement</dt>
                    <dd>${esc(labelFor(Config.ARRANGEMENT_TYPES, state.savings.arrangementType))}</dd>
                </div>

                ${state.project.installationLocation === 'mixed' ? `
                    <h3 class="cq-subtitle">Capacity Allocation</h3>
                    <table class="cq-table">
                        <thead><tr><th>Installation Area</th><th class="cq-num">Allocated Capacity (kWp)</th></tr></thead>
                        <tbody>
                            ${(state.project.mixedLocations || []).map(row => `
                                <tr>
                                    <td>${esc(labelFor(Config.INSTALLATION_LOCATIONS, row.locationType))}</td>
                                    <td class="cq-num">${number(row.capacityKwp, 2)}</td>
                                </tr>`).join('')}
                            <tr class="cq-total-row">
                                <td>Total allocated</td>
                                <td class="cq-num">${number(derived.mixedLocationTotalKwp, 2)}</td>
                            </tr>
                        </tbody>
                    </table>` : ''}

                <div class="cq-note cq-fill-end">The details above are as recorded at the time of
                    issue. Any change to the site, the capacity or the metering arrangement will be
                    reflected in a revised issue of this document.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 6. Project objectives
    // ---------------------------------------------------------------------

    register('project-objectives', context => {
        const { state, page } = context;
        // Free text the salesperson pasted in is chunked across pages by the
        // page plan, using the same unit list the plan measured.
        const units = Calc.narrativeUnits(state, 'project-objectives');
        const chunk = page.chunk || { start: 0, end: units.length };
        const slice = units.slice(chunk.start, chunk.end);

        return {
            title: 'Project Objectives & Background',
            subtitle: page.isContinuation
                ? `Continued — page ${page.part + 1} of ${page.partCount}`
                : 'Why the project is being undertaken',
            body: slice.length
                ? slice.map(unit => `
                    <h3 class="cq-subtitle">${esc(unit.heading)}</h3>
                    <p class="cq-para">${escLines(unit.text)}</p>`).join('')
                : '<p class="cq-para">No project background has been recorded.</p>'
        };
    });

    // ---------------------------------------------------------------------
    // 7. About Ray2Volt
    // ---------------------------------------------------------------------

    // Six capabilities on a three-column grid left two tight rows above a great
    // deal of nothing. On two columns the same six cards read at a comfortable
    // measure and occupy the page honestly, without a word being added.
    register('about-ray2volt', () => ({
        title: 'About Ray2Volt',
        subtitle: 'Who is delivering this project',
        body: `
            <p class="cq-lead">${esc(Content.ABOUT.lead)}</p>
            ${Content.ABOUT.paragraphs.map(text => `<p class="cq-para">${esc(text)}</p>`).join('')}

            <h3 class="cq-subtitle">What We Deliver In-House</h3>
            <div class="cq-grid-2">
                ${Content.ABOUT.capabilities.map(item => `
                    <div class="cq-card">
                        <h4>${esc(item.title)}</h4>
                        <p>${esc(item.text)}</p>
                    </div>`).join('')}
            </div>`
    }));

    // ---------------------------------------------------------------------
    // 8. Why C&I solar
    // ---------------------------------------------------------------------

    // The generic case is followed by the three inputs that decide how much of it
    // applies here. All four values are read straight from the entered project —
    // nothing is claimed about the outcome, which the analysis sections carry.
    register('ci-solar-benefits', context => {
        const { state } = context;

        return {
            title: 'Why C&I Solar',
            subtitle: 'The case for on-site generation',
            bodyClass: 'cq-body-fill',
            body: `
                <p class="cq-lead">${esc(Content.CI_BENEFITS.lead)}</p>
                <div class="cq-grid-2">
                    ${Content.CI_BENEFITS.benefits.map(item => `
                        <div class="cq-card">
                            <h4>${esc(item.title)}</h4>
                            <p>${esc(item.text)}</p>
                        </div>`).join('')}
                </div>

                <h3 class="cq-subtitle">The Inputs That Apply At This Site</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>Plant capacity</dt><dd>${esc(capacityLine(state))}</dd>
                    <dt>Tariff assumed</dt>
                    <dd>${money(state.savings.tariffRate)} per kWh, escalating at
                        ${number(state.savings.tariffEscalationPercent, 2)}% per year</dd>
                    <dt>Metering arrangement</dt>
                    <dd>${esc(labelFor(Config.ARRANGEMENT_TYPES, state.savings.arrangementType))}</dd>
                    <dt>Assumed split</dt>
                    <dd>${number(state.savings.selfConsumptionPercent, 0)}% self-consumed,
                        ${number(state.savings.exportPercent, 0)}% exported</dd>
                </div>

                <div class="cq-note cq-fill-end">The value realised at this site depends on the tariff,
                    the load profile and the metering arrangement. The figures specific to this project
                    are set out in the design basis, energy utilization and savings sections.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 9. Proposed solution
    // ---------------------------------------------------------------------

    register('proposed-solution', context => {
        const { state, derived, page } = context;
        const isHybrid = state.project.systemConfiguration === 'Hybrid';

        // The narrative is carried in full across however many pages it needs;
        // the fixed metric, allocation and scope blocks sit on the first.
        const units = Calc.narrativeUnits(state, 'proposed-solution');
        const chunk = page.chunk || { start: 0, end: units.length };
        const slice = units.slice(chunk.start, chunk.end);
        const narrative = slice.map(unit => `
            ${unit.repeatHeading ? `<h3 class="cq-subtitle">${esc(unit.heading)}</h3>` : ''}
            <p class="cq-para">${escLines(unit.text)}</p>`).join('');

        if (page.isContinuation) {
            return {
                title: 'Proposed Solution',
                subtitle: `Continued — page ${page.part + 1} of ${page.partCount}`,
                body: narrative
            };
        }

        return {
            title: 'Proposed Solution',
            subtitle: 'System configuration and scope summary',
            // The fixed blocks come first so that a narrative running onto a
            // continuation page carries straight on rather than resuming after
            // unrelated tables.
            body: `

                <div class="cq-metrics ${isHybrid ? '' : 'cq-metrics-3'}">
                    <div class="cq-metric">
                        <span class="cq-metric-label">DC Capacity</span>
                        <span class="cq-metric-value">${number(state.project.dcCapacityKwp, 2)}</span>
                        <span class="cq-metric-sub">kWp</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">AC Capacity</span>
                        <span class="cq-metric-value">${number(state.project.acCapacityKw, 2)}</span>
                        <span class="cq-metric-sub">kW</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">DC / AC Ratio</span>
                        <span class="cq-metric-value">${derived.dcAcRatio > 0 ? derived.dcAcRatio : '—'}</span>
                        <span class="cq-metric-sub">design ratio</span>
                    </div>
                    ${isHybrid ? `
                    <div class="cq-metric">
                        <span class="cq-metric-label">Storage</span>
                        <span class="cq-metric-value">${number(state.project.batteryEnergyKwh, 1)}</span>
                        <span class="cq-metric-sub">kWh / ${number(state.project.batteryPowerKw, 1)} kW</span>
                    </div>` : ''}
                </div>

                <h3 class="cq-subtitle">Installation Allocation</h3>
                ${state.project.installationLocation === 'mixed'
                    ? `<table class="cq-table">
                        <thead><tr><th>Area</th><th class="cq-num">Capacity (kWp)</th><th class="cq-num">Share</th></tr></thead>
                        <tbody>
                            ${(state.project.mixedLocations || []).map(row => {
                                const total = derived.mixedLocationTotalKwp || 0;
                                const share = total > 0 ? (Number(row.capacityKwp) / total) * 100 : 0;
                                return `<tr>
                                    <td>${esc(labelFor(Config.INSTALLATION_LOCATIONS, row.locationType))}</td>
                                    <td class="cq-num">${number(row.capacityKwp, 2)}</td>
                                    <td class="cq-num">${number(share, 1)}%</td>
                                </tr>`;
                            }).join('')}
                            <tr class="cq-total-row">
                                <td>Total</td>
                                <td class="cq-num">${number(derived.mixedLocationTotalKwp, 2)}</td>
                                <td class="cq-num">100%</td>
                            </tr>
                        </tbody>
                    </table>`
                    : `<p class="cq-para">The full ${number(state.project.dcCapacityKwp, 2)} kWp is installed on
                        ${esc(labelFor(Config.INSTALLATION_LOCATIONS, state.project.installationLocation))}.</p>`}

                <h3 class="cq-subtitle">Scope Summary</h3>
                <ul class="cq-bullets">
                    <li>Detailed site survey, system design and single-line diagram.</li>
                    <li>Supply of modules, ${isHybrid ? 'hybrid inverter and battery storage' : 'inverters'},
                        mounting structure and balance-of-system material as listed in the bill of materials.</li>
                    <li>Mechanical and electrical installation, earthing and lightning protection.</li>
                    <li>Monitoring configuration and demonstration.</li>
                    <li>DISCOM application preparation, submission and follow-up.</li>
                    <li>Testing, commissioning, handover and documentation.</li>
                </ul>
                <p class="cq-para">The binding scope is the combination of the bill of materials and the
                    scope inclusions and exclusions sections of this proposal.</p>

                ${narrative}`
        };
    });

    // ---------------------------------------------------------------------
    // 10. System architecture
    // ---------------------------------------------------------------------

    register('system-architecture', context => {
        const { state } = context;
        const isHybrid = state.project.systemConfiguration === 'Hybrid';
        const architecture = Content.SYSTEM_ARCHITECTURE[isHybrid ? 'Hybrid' : 'On-Grid'];
        const schematic = isHybrid
            ? 'assets/commercial-hybrid-architecture.png'
            : 'assets/commercial-ongrid-architecture.png';

        return {
            title: 'System Architecture',
            subtitle: `${state.project.systemConfiguration} energy flow`,
            bodyClass: 'cq-body-fill',
            body: `
                <p class="cq-lead">${esc(architecture.lead)}</p>
                <figure class="cq-figure">
                    <img src="${schematic}" width="1536" height="1024"
                        alt="Commercial and industrial ${esc(state.project.systemConfiguration)} solar energy flow"
                        class="cq-schematic">
                    <figcaption class="cq-figure-caption">${esc(state.project.systemConfiguration)} energy flow for a commercial or industrial facility.
                        ${isHybrid ? 'Backup applies only to the designated backup circuits.' : ''}</figcaption>
                </figure>
                <div class="cq-steps">
                    ${architecture.steps.map((step, index) => `
                        <div class="cq-step">
                            <span class="cq-step-num">${index + 1}</span>
                            <div>
                                <strong>${esc(step.title)}</strong>
                                <p>${esc(step.text)}</p>
                            </div>
                        </div>`).join('')}
                </div>
                <div class="cq-note cq-fill-end">This is the standard architecture for the selected
                    configuration. The project single-line diagram and array layout are issued during
                    detailed engineering and, where supplied with this proposal, appear as annexures.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 11. Installation approach
    // ---------------------------------------------------------------------

    register('installation-approach', context => {
        const { state } = context;
        const approach = Content.INSTALLATION_APPROACH[state.project.installationLocation]
            || Content.INSTALLATION_APPROACH['rcc-rooftop'];

        return {
            title: 'Installation Approach',
            subtitle: approach.title,
            bodyClass: 'cq-body-fill',
            // The method is a sequence, not a set, so it is numbered rather than
            // bulleted — the same treatment the Short Proposal gives its journey
            // steps. This is the one page that carries these points; the mounting
            // structure section used to repeat them verbatim and no longer does.
            body: `
                <p class="cq-lead">${esc(approach.lead)}</p>
                <h3 class="cq-subtitle">Method</h3>
                <div class="cq-steps cq-steps-1">
                    ${approach.points.map((point, index) => `
                        <div class="cq-step cq-step-plain">
                            <span class="cq-step-num">${index + 1}</span>
                            <div><p>${esc(point)}</p></div>
                        </div>`).join('')}
                </div>

                ${state.project.installationLocation === 'mixed' ? `
                    <h3 class="cq-subtitle">Areas Covered</h3>
                    <table class="cq-table">
                        <thead><tr><th>Installation Area</th><th class="cq-num">Capacity (kWp)</th></tr></thead>
                        <tbody>
                            ${(state.project.mixedLocations || []).map(row => `
                                <tr>
                                    <td>${esc(labelFor(Config.INSTALLATION_LOCATIONS, row.locationType))}</td>
                                    <td class="cq-num">${number(row.capacityKwp, 2)}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>` : ''}

                ${block('Site Conditions Noted', excerpt(state.projectNarrative.siteConditions, 520))}

                <div class="cq-note cq-fill-end">The method above is the approach planned for this
                    installation type. It is confirmed, and adjusted where the site requires it, after
                    the detailed site survey.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 12. Design basis
    // ---------------------------------------------------------------------

    register('design-basis', context => {
        const { state, derived } = context;
        const savings = state.savings;

        return {
            title: 'Design Basis & Assumptions',
            subtitle: 'Every figure used in the analysis that follows',
            body: `
                <p class="cq-lead">The projections in this proposal are produced from the inputs below.
                    They are disclosed in full so the customer can test the numbers against their own view.</p>

                <table class="cq-table cq-value-table">
                    <thead><tr><th style="width:46%">Assumption</th><th>Value</th><th>Note</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>Plant DC capacity</td>
                            <td>${number(state.project.dcCapacityKwp, 2)} kWp</td>
                            <td>Approved capacity</td>
                        </tr>
                        <tr>
                            <td>Inverter AC capacity</td>
                            <td>${number(state.project.acCapacityKw, 2)} kW</td>
                            <td>DC/AC ratio ${derived.dcAcRatio > 0 ? derived.dcAcRatio : '—'}</td>
                        </tr>
                        <tr>
                            <td>Specific yield</td>
                            <td>${number(savings.annualGenerationPerKwp)} kWh/kWp/year</td>
                            <td>Subject to detailed site verification</td>
                        </tr>
                        <tr>
                            <td>Annual module degradation</td>
                            <td>${number(savings.degradationPercent, 2)}%</td>
                            <td>Applied from year 2 onward</td>
                        </tr>
                        <tr>
                            <td>Current electricity tariff</td>
                            <td>₹${number(savings.tariffRate, 2)}/kWh</td>
                            <td>${savings.consumptionMethod === 'detailed'
                                ? 'Simple-entry reference tariff'
                                : 'As advised by the customer'}</td>
                        </tr>
                        <tr>
                            <td>Tariff escalation</td>
                            <td>${number(savings.tariffEscalationPercent, 2)}% per year</td>
                            <td>Applied to tariff and export credit</td>
                        </tr>
                        <tr>
                            <td>Self-consumption share</td>
                            <td>${number(savings.selfConsumptionPercent, 2)}%</td>
                            <td>Balance is exported</td>
                        </tr>
                        <tr>
                            <td>Export share</td>
                            <td>${number(savings.exportPercent, 2)}%</td>
                            <td>Credited at ₹${number(savings.exportCreditRate, 2)}/kWh</td>
                        </tr>
                        <tr>
                            <td>Metering arrangement</td>
                            <td>${esc(labelFor(Config.ARRANGEMENT_TYPES, savings.arrangementType))}</td>
                            <td>Subject to DISCOM sanction</td>
                        </tr>
                        <tr>
                            <td>Projection period</td>
                            <td>${derived.projection.years} years</td>
                            <td>Analysis horizon</td>
                        </tr>
                        <tr>
                            <td>Grid emission factor</td>
                            <td>${Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh} kg CO₂ per kWh</td>
                            <td>Used for the environmental estimate only</td>
                        </tr>
                    </tbody>
                </table>

                <div class="cq-note">Generation depends on irradiance, ambient temperature, soiling,
                    shading and grid availability. Savings additionally depend on the tariff in force and
                    on the site load pattern at the time of generation. Actual results will differ from
                    these projections.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 13-15. Equipment technology sections
    // ---------------------------------------------------------------------

    function technologySection(options) {
        return context => {
            const rows = categoryRows(context.state, options.categoryId);
            const recon = options.recon ? options.recon(context.derived.reconciliation) : '';

            return {
                title: options.title,
                subtitle: options.subtitle,
                body: `
                    <p class="cq-lead">${esc(options.content.lead)}</p>
                    ${Pages.helpers.componentPhoto(options.categoryId)}
                    <h3 class="cq-subtitle">Equipment Offered</h3>
                    ${recon}
                    ${equipmentTable(rows, [
                        { label: 'Item', width: '22%', value: row => esc(row.name) },
                        { label: 'Specification', width: '29%', value: specCell },
                        { label: 'Make', width: '15%', value: row => esc(row.make) },
                        { label: 'Rating', width: '10%', className: 'cq-center', value: ratingCell },
                        { label: 'Qty', width: '9%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` },
                        { label: 'Warranty', width: '15%', value: row => esc(Pages.helpers.warrantyText(row.warranty)) }
                    ])}
                    <h3 class="cq-subtitle">Technology Notes</h3>
                    <div class="cq-grid-2">
                        ${options.content.points.map(point => `
                            <div class="cq-card">
                                <h4>${esc(point.title)}</h4>
                                <p>${esc(point.text)}</p>
                            </div>`).join('')}
                    </div>`
            };
        };
    }

    register('pv-module-technology', technologySection({
        title: 'PV Module Technology',
        subtitle: 'Modules selected for this plant',
        categoryId: 'modules',
        content: Content.TECHNOLOGY.modules,
        recon: reconciliation => reconStrip('DC capacity', reconciliation.modules, 'kWp',
            reconciliation.hasRatedModules)
    }));

    register('inverter-technology', context => {
        const base = technologySection({
            title: 'Inverter Technology',
            subtitle: 'Conversion and grid interface',
            categoryId: 'inverters',
            content: Content.TECHNOLOGY.inverters,
            recon: reconciliation => reconStrip('AC capacity', reconciliation.inverters, 'kW',
                reconciliation.hasRatedInverters)
        })(context);

        const { state, derived } = context;

        base.body += `
            <h3 class="cq-subtitle">AC Sizing</h3>
            <div class="cq-kv cq-kv-boxed">
                <dt>Approved AC capacity</dt><dd>${number(state.project.acCapacityKw, 2)} kW</dd>
                <dt>Array DC capacity</dt><dd>${number(state.project.dcCapacityKwp, 2)} kWp</dd>
                <dt>DC/AC ratio</dt><dd>${derived.dcAcRatio > 0 ? `${derived.dcAcRatio} : 1` : '—'}</dd>
            </div>`;

        return base;
    });

    register('battery-technology', context => {
        const base = technologySection({
            title: 'Battery Energy Storage',
            subtitle: 'Storage sizing and operation',
            categoryId: 'battery',
            content: Content.TECHNOLOGY.battery,
            // A battery row carries one rating, so energy and power are
            // reconciled separately and each strip appears only if rows were
            // rated in that unit.
            recon: reconciliation => reconStrip('battery energy', reconciliation.batteryEnergy, 'kWh',
                reconciliation.hasRatedBatteryEnergy)
                + reconStrip('battery power', reconciliation.batteryPower, 'kW',
                    reconciliation.hasRatedBatteryPower)
        })(context);

        const { state } = context;

        base.body += `
            <h3 class="cq-subtitle">Storage Sizing</h3>
            <div class="cq-kv cq-kv-boxed">
                <dt>Approved battery energy</dt><dd>${number(state.project.batteryEnergyKwh, 2)} kWh</dd>
                <dt>Approved battery power</dt><dd>${number(state.project.batteryPowerKw, 2)} kW</dd>
            </div>
            <div class="cq-note">Backup duration depends on the connected backup load and the state of
                charge at the time of an outage. The backup circuit and the loads on it are confirmed
                during detailed engineering.</div>`;

        return base;
    });

    // Sections 16-18 — mounting structure, balance of system and monitoring —
    // are registered in quote-generator-comprehensive-pages-c.js. Registration
    // is order-independent; they live there to keep this file inside the
    // repository's per-file line budget.

    // ---------------------------------------------------------------------
    // 19. Bill of materials (paginates)
    // ---------------------------------------------------------------------

    register('bill-of-materials', context => {
        const { state, page } = context;
        // The very list the page plan chunked, so drawn rows and planned pages
        // can never drift apart.
        const lines = Calc.bomLines(state);
        const chunk = page.chunk || { start: 0, end: lines.length };
        const slice = lines.slice(chunk.start, chunk.end);

        // Continuation pages repeat the heading of the category they resume.
        let openCategory = null;
        for (let index = chunk.start - 1; index >= 0; index--) {
            if (lines[index].kind === 'category') {
                openCategory = lines[index].label;
                break;
            }
        }

        const rowsHtml = slice.map(line => {
            if (line.kind === 'category') {
                return `<tr class="cq-cat-row"><td colspan="7">${esc(line.label)}</td></tr>`;
            }

            const row = line.row;

            return `
                <tr>
                    <td class="cq-center">${line.number}${line.isContinuation ? '<br>cont.' : ''}</td>
                    <td>${esc(row.name)}</td>
                    <td>${esc(row.specification)}${row.remarks
                        ? `<span class="cq-cell-note"><strong>Remarks:</strong> ${esc(row.remarks)}</span>`
                        : ''}</td>
                    <td>${esc(row.make)}</td>
                    <td class="cq-center">${esc(row.quantity)}</td>
                    <td class="cq-center">${esc(row.unit)}</td>
                    <td>${esc(Pages.helpers.warrantyText(row.warranty))}</td>
                </tr>`;
        }).join('');

        return {
            title: 'Bill of Materials',
            subtitle: page.isContinuation
                ? `Continued — page ${page.part + 1} of ${page.partCount}`
                : 'Supplied components and services',
            body: `
                ${page.isContinuation && openCategory && slice[0] && slice[0].kind === 'row'
                    ? `<p class="cq-para"><strong>Continued from previous page — ${esc(openCategory)}</strong></p>`
                    : ''}
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th class="cq-center" style="width:6%">S.No</th>
                            <th style="width:22%">Item</th>
                            <th style="width:26%">Specification / Model</th>
                            <th style="width:14%">Make</th>
                            <th class="cq-center" style="width:8%">Qty</th>
                            <th class="cq-center" style="width:8%">Unit</th>
                            <th style="width:16%">Warranty</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml || '<tr><td colspan="7">No items listed.</td></tr>'}</tbody>
                </table>
                ${page.part === page.partCount - 1 ? `
                    <p class="cq-table-note">Quantities are as designed at the time of offer and are
                        confirmed against the approved layout after the detailed site survey. Makes
                        shown are indicative of the class of equipment offered; the exact model is
                        confirmed at order against availability, and any change is offered for written
                        approval before supply.</p>` : ''}`
        };
    });

    // ---------------------------------------------------------------------
}(typeof self !== 'undefined' ? self : this));
