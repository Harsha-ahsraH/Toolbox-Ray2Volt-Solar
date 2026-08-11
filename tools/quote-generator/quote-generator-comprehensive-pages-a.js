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
        esc, escLines, fallback, money, number, formatDate, labelFor,
        customerName, siteAddress, capacityLine, proposalTitle, categoryRows, equipmentTable
    } = Pages.helpers;


    // ---------------------------------------------------------------------
    // 1. Cover
    // ---------------------------------------------------------------------

    register('cover', context => {
        const { state } = context;

        return {
            chrome: 'none',
            body: `
                <div class="cq-cover-head">
                    <img src="../../global/assets/logo.png" alt="Ray2Volt Solar" class="cq-cover-logo">
                    <div class="cq-cover-ref">
                        <div>Quotation No: <strong>${fallback(state.project.quoteNumber, 'number pending')}</strong></div>
                        <div>Date: ${fallback(formatDate(state.project.quoteDate), 'date pending')}</div>
                        <div>Revision: ${esc(state.project.revision || 'Rev 0')}</div>
                    </div>
                </div>

                <span class="cq-cover-kicker">Techno-Commercial Proposal</span>
                <h1 class="cq-cover-title">${esc(proposalTitle(state))}</h1>
                <div class="cq-cover-rule"></div>

                <img src="assets/Cover Page Image.png" alt="Solar installation" class="cq-cover-image">

                <div class="cq-cover-grid">
                    <div class="cq-cover-card">
                        <h3>Prepared For</h3>
                        <strong>${fallback(customerName(state), 'customer name')}</strong>
                        ${state.customer.contactPerson
                            ? `<p>${esc(state.customer.contactPerson)}${state.customer.designation
                                ? `, ${esc(state.customer.designation)}` : ''}</p>` : ''}
                        <p>${fallback(siteAddress(state), 'site address')}</p>
                        ${state.customer.phone ? `<p>${esc(state.customer.phone)}</p>` : ''}
                    </div>
                    <div class="cq-cover-card">
                        <h3>Project Summary</h3>
                        <p><strong>${esc(capacityLine(state))}</strong></p>
                        <p>${esc(state.project.systemConfiguration)} ·
                            ${esc(labelFor(Config.INSTALLATION_LOCATIONS, state.project.installationLocation))}</p>
                        ${state.project.siteName ? `<p>Site: ${esc(state.project.siteName)}</p>` : ''}
                        <p>Valid for ${esc(state.project.validityDays)} days from date of issue</p>
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
            body: `
                <div class="cq-grid-2">
                    <div class="cq-card">
                        <h4>Prepared For</h4>
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
                        <h4>Prepared By</h4>
                        <dl class="cq-kv">
                            <dt>Company</dt><dd>${esc(Content.COMPANY.legalName)}</dd>
                            <dt>CIN</dt><dd>${esc(Content.COMPANY.cin)}</dd>
                            <dt>Address</dt><dd>${esc(Content.COMPANY.address)}</dd>
                            ${state.project.preparedBy
                                ? `<dt>Prepared by</dt><dd>${esc(state.project.preparedBy)}</dd>` : ''}
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

                <div class="cq-note">
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
                    <div class="cq-metric">
                        <span class="cq-metric-label">Offered Price</span>
                        <span class="cq-metric-value">${money(derived.commercial.finalPrice)}</span>
                        <span class="cq-metric-sub">incl. GST</span>
                    </div>
                    <div class="cq-metric">
                        <span class="cq-metric-label">Simple Payback</span>
                        <span class="cq-metric-value">${payback === null ? '—' : number(payback, 1)}</span>
                        <span class="cq-metric-sub">years</span>
                    </div>
                </div>

                <h3 class="cq-subtitle">Objective</h3>
                <p class="cq-para">${escLines(state.projectNarrative.objective)}</p>

                <h3 class="cq-subtitle">Proposed Solution</h3>
                <p class="cq-para">${escLines(state.projectNarrative.proposedSolution)}</p>

                <h3 class="cq-subtitle">Headline Figures</h3>
                <table class="cq-table">
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
                            <td>After ${money(derived.commercial.discountTotal)} discount</td>
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
                    </table>` : ''}`
        };
    });

    // ---------------------------------------------------------------------
    // 6. Project objectives
    // ---------------------------------------------------------------------

    register('project-objectives', context => {
        const narrative = context.state.projectNarrative;

        return {
            title: 'Project Objectives & Background',
            subtitle: 'Why the project is being undertaken',
            body: `
                <h3 class="cq-subtitle">Customer Objective</h3>
                <p class="cq-para">${escLines(narrative.objective)}</p>

                <h3 class="cq-subtitle">Existing Electrical System</h3>
                <p class="cq-para">${escLines(narrative.existingSystem)}</p>

                <h3 class="cq-subtitle">Site Conditions & Constraints</h3>
                <p class="cq-para">${escLines(narrative.siteConditions)}</p>

                <h3 class="cq-subtitle">Special Requirements</h3>
                <p class="cq-para">${escLines(narrative.specialRequirements)}</p>

                ${String(narrative.projectNotes || '').trim() ? `
                    <h3 class="cq-subtitle">Project Notes</h3>
                    <p class="cq-para">${escLines(narrative.projectNotes)}</p>` : ''}`
        };
    });

    // ---------------------------------------------------------------------
    // 7. About Ray2Volt
    // ---------------------------------------------------------------------

    register('about-ray2volt', () => ({
        title: 'About Ray2Volt',
        subtitle: 'Who is delivering this project',
        body: `
            <p class="cq-lead">${esc(Content.ABOUT.lead)}</p>
            ${Content.ABOUT.paragraphs.map(text => `<p class="cq-para">${esc(text)}</p>`).join('')}

            <h3 class="cq-subtitle">What We Deliver In-House</h3>
            <div class="cq-grid-3">
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

    register('ci-solar-benefits', () => ({
        title: 'Why Commercial & Industrial Solar',
        subtitle: 'The case for on-site generation',
        body: `
            <p class="cq-lead">${esc(Content.CI_BENEFITS.lead)}</p>
            <div class="cq-grid-2">
                ${Content.CI_BENEFITS.benefits.map(item => `
                    <div class="cq-card">
                        <h4>${esc(item.title)}</h4>
                        <p>${esc(item.text)}</p>
                    </div>`).join('')}
            </div>
            <div class="cq-note">The value realised at this site depends on the tariff, the load
                profile and the metering arrangement. The figures specific to this project are set
                out in the design basis, energy utilization and savings sections.</div>`
    }));

    // ---------------------------------------------------------------------
    // 9. Proposed solution
    // ---------------------------------------------------------------------

    register('proposed-solution', context => {
        const { state, derived } = context;
        const isHybrid = state.project.systemConfiguration === 'Hybrid';

        return {
            title: 'Proposed Solution',
            subtitle: 'System configuration and scope summary',
            body: `
                <p class="cq-lead">${escLines(state.projectNarrative.proposedSolution)}</p>

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
                        ${esc(labelFor(Config.INSTALLATION_LOCATIONS, state.project.installationLocation).toLowerCase())}.</p>`}

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
                    scope inclusions and exclusions sections of this proposal.</p>`
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
            ? 'assets/Hybrid Solar Schemartic Diagram.png'
            : 'assets/On-Grid Schematic Diagram.png';

        return {
            title: 'System Architecture',
            subtitle: `${state.project.systemConfiguration} energy flow`,
            body: `
                <p class="cq-lead">${esc(architecture.lead)}</p>
                <img src="${schematic}" alt="${esc(state.project.systemConfiguration)} system schematic"
                    class="cq-schematic">
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
                <div class="cq-note">This is the standard architecture for the selected configuration.
                    The project single-line diagram and array layout are issued during detailed
                    engineering and, where supplied with this proposal, appear as annexures.</div>`
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
            body: `
                <p class="cq-lead">${esc(approach.lead)}</p>
                <h3 class="cq-subtitle">Method</h3>
                <ul class="cq-bullets">
                    ${approach.points.map(point => `<li>${esc(point)}</li>`).join('')}
                </ul>

                ${state.project.installationLocation === 'mixed' ? `
                    <h3 class="cq-subtitle">Areas Covered</h3>
                    <ul class="cq-bullets">
                        ${(state.project.mixedLocations || []).map(row => `
                            <li>${esc(labelFor(Config.INSTALLATION_LOCATIONS, row.locationType))} —
                                ${number(row.capacityKwp, 2)} kWp</li>`).join('')}
                    </ul>` : ''}

                ${String(state.projectNarrative.siteConditions || '').trim() ? `
                    <h3 class="cq-subtitle">Site Conditions Noted</h3>
                    <p class="cq-para">${escLines(state.projectNarrative.siteConditions)}</p>` : ''}`
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

                <table class="cq-table">
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
                            <td>${Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh} kg CO2/kWh</td>
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

            return {
                title: options.title,
                subtitle: options.subtitle,
                body: `
                    <p class="cq-lead">${esc(options.content.lead)}</p>
                    <h3 class="cq-subtitle">Equipment Offered</h3>
                    ${equipmentTable(rows, [
                        { label: 'Item', width: '26%', value: row => esc(row.name) },
                        { label: 'Specification', width: '30%', value: row => esc(row.specification) },
                        { label: 'Make', width: '18%', value: row => esc(row.make) },
                        { label: 'Qty', width: '10%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` },
                        { label: 'Warranty', width: '16%', value: row => esc(row.warranty) }
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
        content: Content.TECHNOLOGY.modules
    }));

    register('inverter-technology', context => {
        const base = technologySection({
            title: 'Inverter Technology',
            subtitle: 'Conversion and grid interface',
            categoryId: 'inverters',
            content: Content.TECHNOLOGY.inverters
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
            content: Content.TECHNOLOGY.battery
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

    // ---------------------------------------------------------------------
    // 16-18. Structure, balance of system, monitoring
    // ---------------------------------------------------------------------

    register('mounting-structure', context => {
        const { state } = context;
        const rows = categoryRows(state, 'mounting');
        const approach = Content.INSTALLATION_APPROACH[state.project.installationLocation]
            || Content.INSTALLATION_APPROACH['rcc-rooftop'];

        return {
            title: 'Mounting Structure',
            subtitle: approach.title,
            body: `
                <p class="cq-lead">The array is carried on a structure selected for the installation
                    surface and designed against the site wind loading. Structural design is confirmed
                    after the detailed site survey.</p>
                <h3 class="cq-subtitle">Structure Supplied</h3>
                ${equipmentTable(rows, [
                    { label: 'Item', width: '28%', value: row => esc(row.name) },
                    { label: 'Specification', width: '36%', value: row => esc(row.specification) },
                    { label: 'Make', width: '18%', value: row => esc(row.make) },
                    { label: 'Qty', width: '18%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` }
                ])}
                <h3 class="cq-subtitle">Installation Considerations</h3>
                <ul class="cq-bullets">
                    ${approach.points.map(point => `<li>${esc(point)}</li>`).join('')}
                </ul>`
        };
    });

    register('balance-of-system', context => {
        const { state } = context;
        const groups = [
            { id: 'dc-cables', label: 'DC cables and connectors' },
            { id: 'ac-cables', label: 'AC cables and power evacuation' },
            { id: 'protection', label: 'DCDB, ACDB and protection devices' },
            { id: 'earthing', label: 'Earthing and lightning protection' },
            { id: 'metering', label: 'Metering and synchronization' }
        ].map(group => ({ label: group.label, rows: categoryRows(state, group.id) }))
            .filter(group => group.rows.length);

        return {
            title: 'Balance of System',
            subtitle: 'Cabling, protection, earthing and evacuation',
            body: `
                <p class="cq-lead">The balance of system carries generated power from the array to the
                    interconnection point safely and within the design voltage-drop limit, and protects
                    the plant and the site installation.</p>
                ${groups.length ? groups.map(group => `
                    <h3 class="cq-subtitle">${esc(group.label)}</h3>
                    ${equipmentTable(group.rows, [
                        { label: 'Item', width: '30%', value: row => esc(row.name) },
                        { label: 'Specification', width: '42%', value: row => esc(row.specification) },
                        { label: 'Make', width: '16%', value: row => esc(row.make) },
                        { label: 'Qty', width: '12%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` }
                    ])}`).join('')
                    : '<p class="cq-para">No balance-of-system items are listed in the bill of materials.</p>'}`
        };
    });

    register('monitoring-scada', context => {
        const rows = categoryRows(context.state, 'monitoring');
        const monitoring = Content.TECHNOLOGY.monitoring;

        return {
            title: 'Monitoring & SCADA',
            subtitle: 'How plant performance is observed',
            body: `
                <p class="cq-lead">${esc(monitoring.lead)}</p>
                <h3 class="cq-subtitle">Capabilities</h3>
                <ul class="cq-bullets">
                    ${monitoring.capabilities.map(item => `<li>${esc(item)}</li>`).join('')}
                </ul>
                <h3 class="cq-subtitle">Equipment Supplied</h3>
                ${equipmentTable(rows, [
                    { label: 'Item', width: '30%', value: row => esc(row.name) },
                    { label: 'Specification', width: '40%', value: row => esc(row.specification) },
                    { label: 'Make', width: '16%', value: row => esc(row.make) },
                    { label: 'Qty', width: '14%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` }
                ])}
                <div class="cq-note">${esc(monitoring.note)}</div>`
        };
    });

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

        let serial = lines.slice(0, chunk.start).filter(line => line.kind === 'row').length;

        const rowsHtml = slice.map(line => {
            if (line.kind === 'category') {
                return `<tr class="cq-cat-row"><td colspan="7">${esc(line.label)}</td></tr>`;
            }

            serial += 1;
            const row = line.row;

            return `
                <tr>
                    <td class="cq-center">${serial}</td>
                    <td>${esc(row.name)}</td>
                    <td>${esc(row.specification)}</td>
                    <td>${esc(row.make)}</td>
                    <td class="cq-center">${esc(row.quantity)}</td>
                    <td class="cq-center">${esc(row.unit)}</td>
                    <td>${esc(row.warranty)}</td>
                </tr>`;
        }).join('');

        return {
            title: 'Bill of Materials',
            subtitle: page.isContinuation
                ? `Continued — page ${page.part + 1} of ${page.partCount}`
                : 'Supplied components and services',
            body: `
                ${page.isContinuation && openCategory
                    ? `<p class="cq-para"><strong>Continued from previous page — ${esc(openCategory)}</strong></p>`
                    : ''}
                <table class="cq-table">
                    <thead>
                        <tr>
                            <th style="width:6%">S.No</th>
                            <th style="width:22%">Item</th>
                            <th style="width:26%">Specification / Model</th>
                            <th style="width:14%">Make</th>
                            <th style="width:8%">Qty</th>
                            <th style="width:8%">Unit</th>
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
