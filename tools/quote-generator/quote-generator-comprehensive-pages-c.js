/**
 * Quote Generator - Comprehensive proposal pages (closing and annexures)
 * Ray2Volt Solar Toolbox
 *
 * The closing sections and the annexure pages. These register into the shared
 * registry created by quote-generator-comprehensive-pages.js; see that file's
 * header for the renderer contract.
 *
 * Split from quote-generator-comprehensive-pages-b.js to stay inside the
 * repository's per-file line budget.
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
    const { esc, money, number, formatDate, labelFor, customerName } = Pages.helpers;

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
