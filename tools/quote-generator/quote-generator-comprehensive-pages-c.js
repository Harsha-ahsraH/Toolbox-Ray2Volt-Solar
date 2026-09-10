/**
 * Quote Generator - Comprehensive proposal pages (plant hardware, closing,
 * annexures)
 * Ray2Volt Solar Toolbox
 *
 * The mounting, balance-of-system and monitoring sections, the closing
 * sections and the annexure pages. These register into the shared registry
 * created by quote-generator-comprehensive-pages.js; see that file's header
 * for the renderer contract.
 *
 * Split from quote-generator-comprehensive-pages-a.js and -b.js to stay inside
 * the repository's per-file line budget. Registration is order-independent, so
 * which file a section is declared in carries no meaning beyond that.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Content = root.QuoteGeneratorContent;
    const Model = root.QuoteGeneratorModel;
    const Pages = root.QuoteGeneratorPages;

    if (!Pages) {
        console.error('Comprehensive page registry is missing.');
        return;
    }

    const register = Pages.register;
    const {
        esc, money, number, formatDate, labelFor, customerName, siteAddress, fallback,
        categoryRows, equipmentTable
    } = Pages.helpers;

    // Composition helpers declared by quote-generator-comprehensive-pages-a.js.
    // Read inside the renderers rather than at load time so this file does not
    // depend on which of the two is evaluated first.
    const blocks = () => Pages.blocks;

    // ---------------------------------------------------------------------
    // 16. Mounting structure
    //
    // The installation method used to be repeated here word for word from the
    // installation approach section, which is where it belongs and where it now
    // stays. This page carries what is specific to the structure itself: what is
    // supplied, and the design inputs it is engineered against.
    // ---------------------------------------------------------------------

    register('mounting-structure', context => {
        const { state } = context;
        const { specCell } = blocks();
        const rows = categoryRows(state, 'mounting');
        const approach = Content.INSTALLATION_APPROACH[state.project.installationLocation]
            || Content.INSTALLATION_APPROACH['rcc-rooftop'];

        return {
            title: 'Mounting Structure',
            subtitle: approach.title,
            bodyClass: 'cq-body-fill',
            body: `
                <p class="cq-lead">The array is carried on a structure selected for the installation
                    surface and designed against the site wind loading. Structural design is confirmed
                    after the detailed site survey.</p>
                <h3 class="cq-subtitle">Structure Supplied</h3>
                ${equipmentTable(rows, [
                    { label: 'Item', width: '26%', value: row => esc(row.name) },
                    { label: 'Specification', width: '38%', value: specCell },
                    { label: 'Make', width: '18%', value: row => esc(row.make) },
                    { label: 'Qty', width: '18%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` }
                ])}

                <h3 class="cq-subtitle">Structural Design Inputs</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>Installation surface</dt>
                    <dd>${esc(labelFor(Config.INSTALLATION_LOCATIONS, state.project.installationLocation))}</dd>
                    <dt>Array supported</dt><dd>${number(state.project.dcCapacityKwp, 2)} kWp</dd>
                    <dt>Site</dt>
                    <dd>${state.project.siteName
                        ? esc(state.project.siteName)
                        : fallback(siteAddress(state), 'site address')}</dd>
                    <dt>Wind and load basis</dt>
                    <dd>Confirmed against the site category and structure height at detailed survey</dd>
                    <dt>Foundation or fixing</dt>
                    <dd>Selected to suit the surveyed surface condition</dd>
                </div>

                <div class="cq-note cq-fill-end">Quantities above follow the bill of materials. The
                    installation method for this surface is set out in the installation approach
                    section.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 17. Balance of system
    // ---------------------------------------------------------------------

    register('balance-of-system', context => {
        const { state } = context;
        const { specCell } = blocks();
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
            bodyClass: 'cq-body-fill',
            body: `
                <p class="cq-lead">The balance of system carries generated power from the array to the
                    interconnection point safely and within the design voltage-drop limit, and protects
                    the plant and the site installation.</p>
                ${groups.length ? groups.map(group => `
                    <h3 class="cq-subtitle">${esc(group.label)}</h3>
                    ${equipmentTable(group.rows, [
                        { label: 'Item', width: '28%', value: row => esc(row.name) },
                        { label: 'Specification', width: '44%', value: specCell },
                        { label: 'Make', width: '16%', value: row => esc(row.make) },
                        { label: 'Qty', width: '12%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` }
                    ])}`).join('')
                    : '<p class="cq-para">No balance-of-system items are listed in the bill of materials.</p>'}

                <div class="cq-note cq-fill-end">Cable sizes, protection ratings and earthing
                    arrangements are finalised in the detailed design against the measured route
                    lengths and the interconnection point at the site.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 18. Monitoring and SCADA
    // ---------------------------------------------------------------------

    register('monitoring-scada', context => {
        const { specCell } = blocks();
        const rows = categoryRows(context.state, 'monitoring');
        const monitoring = Content.TECHNOLOGY.monitoring;

        return {
            title: 'Monitoring & SCADA',
            subtitle: 'How plant performance is observed',
            bodyClass: 'cq-body-fill',
            body: `
                <p class="cq-lead">${esc(monitoring.lead)}</p>
                <h3 class="cq-subtitle">Capabilities</h3>
                <div class="cq-grid-2">
                    ${monitoring.capabilities.map(item => `
                        <div class="cq-card"><p>${esc(item)}</p></div>`).join('')}
                </div>
                <h3 class="cq-subtitle">Equipment Supplied</h3>
                ${equipmentTable(rows, [
                    { label: 'Item', width: '28%', value: row => esc(row.name) },
                    { label: 'Specification', width: '42%', value: specCell },
                    { label: 'Make', width: '16%', value: row => esc(row.make) },
                    { label: 'Qty', width: '14%', className: 'cq-center', value: row => `${esc(row.quantity)} ${esc(row.unit)}` }
                ])}
                <div class="cq-note cq-fill-end">${esc(monitoring.note)}</div>`
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
            <div class="cq-steps cq-steps-1">
                ${Content.WHY_RAY2VOLT.nextSteps.map((step, index) => `
                    <div class="cq-step cq-step-plain">
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
            bodyClass: 'cq-body-fill',
            body: `
                <p class="cq-lead">By signing below, the customer accepts the scope, the commercial
                    offer and the terms and conditions set out in this proposal.</p>

                <h3 class="cq-subtitle">Offer Being Accepted</h3>
                <div class="cq-kv cq-kv-boxed">
                    <dt>Quotation number</dt><dd>${esc(state.project.quoteNumber || '—')}</dd>
                    <dt>Date of issue</dt><dd>${esc(formatDate(state.project.quoteDate) || '—')}</dd>
                    <dt>Revision</dt><dd>${esc(state.project.revision || 'Rev 0')}</dd>
                    <dt>Customer</dt><dd>${fallback(customerName(state), 'customer name')}</dd>
                    <dt>Site</dt><dd>${fallback(siteAddress(state), 'site address')}</dd>
                    <dt>Plant capacity</dt><dd>${number(state.project.dcCapacityKwp, 2)} kWp
                        ${esc(state.project.systemConfiguration)}</dd>
                    <dt>Validity</dt>
                    <dd>${esc(state.project.validityDays)} days from the date of issue</dd>
                    <dt>Offered price</dt><dd>${money(derived.commercial.finalPrice)} inclusive of GST</dd>
                </div>

                <div class="cq-sign-grid">
                    <div class="cq-sign-box">
                        <strong>For the Customer</strong>
                        ${fallback(customerName(state), 'customer name')}
                        <span class="cq-sign-note">Name<br>Designation<br>Date<br>Seal</span>
                    </div>
                    <div class="cq-sign-box">
                        <strong>For ${esc(Content.COMPANY.legalName)}</strong>
                        ${esc(state.project.preparedBy || Content.COMPANY.legalName)}
                        <span class="cq-sign-note">Name<br>Designation<br>Date<br>Seal</span>
                    </div>
                </div>

                <div class="cq-note cq-fill-end">Please return one signed copy of this page to confirm
                    the order. This page is to be read with the scope, commercial offer and terms and
                    conditions sections, which together form the accepted offer.</div>`
        };
    });

    // ---------------------------------------------------------------------
    // 38. Annexure index
    // ---------------------------------------------------------------------

    register('annexure-index', context => {
        const { state, pagePlan, page } = context;
        const allAnnexures = Model.includedAnnexures(state);
        const chunk = page.chunk || { start: 0, end: allAnnexures.length };
        const annexures = allAnnexures.slice(chunk.start, chunk.end);

        const firstPageOf = annexureId => {
            const match = pagePlan.filter(page => page.annexureId === annexureId)[0];
            return match ? match.pageNumber : '—';
        };

        return {
            title: 'Annexure Index',
            subtitle: page.isContinuation
                ? `Continued — page ${page.part + 1} of ${page.partCount}`
                : 'Supporting documents attached to this proposal',
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
                                <td class="cq-center">${chunk.start + index + 1}</td>
                                <td>${esc(annexure.title || annexure.fileName || `Annexure ${chunk.start + index + 1}`)}</td>
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
