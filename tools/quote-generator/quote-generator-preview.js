/**
 * Quote Generator - Comprehensive preview, print and PDF
 * Ray2Volt Solar Toolbox
 *
 * Builds the Comprehensive Proposal from the page plan, drives the thumbnail
 * rail and the large A4 stage, and wires Print and Download PDF.
 *
 * One page plan feeds all four outputs. The pages are built once into
 * #qgComprehensivePages, which is what print and Ray2VoltPdfDownload read; the
 * rail and the stage show scaled clones of those same nodes. Preview, browser
 * print and the downloaded PDF therefore cannot disagree on page order,
 * content or numbering.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Content = root.QuoteGeneratorContent;
    const Calc = root.QuoteGeneratorCalc;
    const Pages = root.QuoteGeneratorPages;

    const A4_WIDTH_PX = (210 / 25.4) * 96;

    let app = null;
    let container = null;
    let rail = null;
    let stage = null;
    let position = null;
    let pageSelect = null;
    let exportBlocked = null;
    let printButton = null;
    let downloadButton = null;

    let currentPlan = [];
    let selectedIndex = 0;
    let stale = true;

    function byId(id) {
        return document.getElementById(id);
    }

    function esc(value) {
        return Pages.helpers.esc(value);
    }

    // ---------------------------------------------------------------------
    // Page construction
    // ---------------------------------------------------------------------

    function renderPage(page, context) {
        const renderer = Pages.renderers[page.sectionId];

        const descriptor = renderer
            ? renderer(Object.assign({}, context, { page }))
            : {
                title: page.title,
                subtitle: '',
                body: `<p class="cq-para">No renderer is registered for "${esc(page.sectionId)}".</p>`
            };

        const head = descriptor.chrome === 'none' ? '' : `
            <div class="cq-head">
                <div class="cq-head-title">
                    <h1>${esc(descriptor.title || page.title)}</h1>
                    ${descriptor.subtitle ? `<p>${esc(descriptor.subtitle)}</p>` : ''}
                </div>
                <img src="../../global/assets/logo.png" alt="Ray2Volt Solar" class="cq-head-logo">
            </div>`;

        return `
            <div class="quote-page cq-page" data-page-index="${page.pageNumber - 1}"
                data-section-id="${esc(page.sectionId)}">
                ${head}
                <div class="cq-body ${esc(descriptor.bodyClass || '')}">${descriptor.body}</div>
                <div class="cq-foot">
                    <span>${esc(Content.COMPANY.legalName)}</span>
                    <span>${esc(page.title)}</span>
                    <span>Page ${page.pageNumber} of ${page.totalPages}</span>
                </div>
            </div>`;
    }

    function buildPages(state, derived, validation) {
        currentPlan = Calc.planPages(state);

        const context = {
            state,
            derived,
            validation,
            pagePlan: currentPlan,
            toc: Calc.tableOfContents(currentPlan)
        };

        container.innerHTML = currentPlan.map(page => renderPage(page, context)).join('');

        // Annexure frames are filled asynchronously from IndexedDB.
        if (root.QuoteGeneratorAnnexures) {
            root.QuoteGeneratorAnnexures.hydrate(container, state);
        }
    }

    // ---------------------------------------------------------------------
    // Rail, stage and selection
    // ---------------------------------------------------------------------

    function pageNodes() {
        return Array.prototype.slice.call(container.querySelectorAll('.quote-page'));
    }

    function buildRail() {
        if (!rail) return;

        rail.innerHTML = '';

        pageNodes().forEach((node, index) => {
            const plan = currentPlan[index];
            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'qg-thumb';
            button.dataset.pageIndex = String(index);
            button.setAttribute('aria-label',
                `Page ${index + 1} of ${currentPlan.length}: ${plan ? plan.title : ''}`);

            const frame = document.createElement('div');
            frame.className = 'qg-thumb-frame';
            frame.setAttribute('aria-hidden', 'true');

            const clone = node.cloneNode(true);
            clone.removeAttribute('id');
            frame.appendChild(clone);

            const caption = document.createElement('span');
            caption.className = 'qg-thumb-caption';
            caption.innerHTML = `<span class="qg-thumb-number">${index + 1}</span>`
                + `<span class="qg-thumb-title">${esc(plan ? plan.title : '')}</span>`;

            button.appendChild(frame);
            button.appendChild(caption);
            rail.appendChild(button);
        });
    }

    function buildPageSelect() {
        if (!pageSelect) return;

        pageSelect.innerHTML = currentPlan.map((page, index) =>
            `<option value="${index}">Page ${index + 1} of ${currentPlan.length} — ${esc(page.title)}</option>`
        ).join('');
        pageSelect.value = String(selectedIndex);
    }

    function fitStage() {
        if (!stage) return;

        const available = stage.clientWidth - 32;
        const scale = Math.max(0.2, Math.min(1, available / A4_WIDTH_PX));
        stage.style.setProperty('--qg-stage-scale', scale.toFixed(4));
    }

    function selectPage(index, options) {
        const settings = options || {};

        if (!currentPlan.length) {
            selectedIndex = 0;
            if (stage) stage.innerHTML = '<p class="qg-preview-empty">No pages selected.</p>';
            if (position) position.textContent = 'No pages';
            return;
        }

        selectedIndex = Math.max(0, Math.min(index, currentPlan.length - 1));

        const nodes = pageNodes();
        const node = nodes[selectedIndex];

        if (stage && node) {
            stage.innerHTML = '';
            const clone = node.cloneNode(true);
            clone.removeAttribute('id');
            stage.appendChild(clone);
            fitStage();

            // Annexure artwork lives in the source node; refill the clone.
            if (root.QuoteGeneratorAnnexures) {
                root.QuoteGeneratorAnnexures.hydrate(stage, app ? app.getState() : null);
            }
        }

        if (rail) {
            Array.prototype.forEach.call(rail.querySelectorAll('.qg-thumb'), button => {
                const active = Number(button.dataset.pageIndex) === selectedIndex;
                button.classList.toggle('is-active', active);
                if (active && settings.scrollRail !== false) {
                    button.scrollIntoView({ block: 'nearest' });
                }
            });
        }

        if (pageSelect) pageSelect.value = String(selectedIndex);

        if (position) {
            const plan = currentPlan[selectedIndex];
            position.textContent = `Page ${selectedIndex + 1} of ${currentPlan.length} — ${plan.title}`;
        }

        if (settings.focus && stage) stage.focus();
    }

    // ---------------------------------------------------------------------
    // Export
    // ---------------------------------------------------------------------

    function sanitizeFilenamePart(value) {
        return String(value || '')
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\s/g, '-')
            || 'Draft';
    }

    function downloadFilename(state) {
        return 'Ray2Volt-Comprehensive-Proposal-'
            + sanitizeFilenamePart(state.customer.customerType === 'company'
                ? state.customer.companyName
                : state.customer.customerName)
            + '-'
            + sanitizeFilenamePart(state.project.quoteNumber);
    }

    function applyExportGate(validation) {
        const blocked = validation ? validation.hasCriticalErrors : true;

        if (printButton) printButton.disabled = blocked;
        if (downloadButton) downloadButton.disabled = blocked;
        if (exportBlocked) exportBlocked.hidden = !blocked;
    }

    function setPrintMode() {
        document.body.classList.add('qg-print-comprehensive');
        document.body.classList.remove('qg-print-short');
    }

    // ---------------------------------------------------------------------
    // Public interface
    // ---------------------------------------------------------------------

    function render(state, derived, validation) {
        if (!container) return;

        buildPages(state, derived, validation);
        buildRail();

        if (selectedIndex >= currentPlan.length) selectedIndex = 0;

        buildPageSelect();
        selectPage(selectedIndex, { scrollRail: false });
        applyExportGate(validation);
        stale = false;
    }

    function ensureFresh() {
        if (!stale || !app) return;
        render(app.getState(), app.getDerived(), app.getValidation());
    }

    function init(appApi) {
        app = appApi;
        container = byId('qgComprehensivePages');
        rail = byId('qgThumbRail');
        stage = byId('qgPreviewStage');
        position = byId('qgPreviewPosition');
        pageSelect = byId('qgPageSelect');
        exportBlocked = byId('qgExportBlocked');
        printButton = byId('qgComprehensivePrint');
        downloadButton = byId('qgComprehensiveDownload');

        if (!container) return;

        if (rail) {
            rail.addEventListener('click', event => {
                const button = event.target.closest('.qg-thumb');
                if (button) selectPage(Number(button.dataset.pageIndex), { focus: true });
            });
        }

        if (pageSelect) {
            pageSelect.addEventListener('change', () => {
                selectPage(Number(pageSelect.value), { focus: true });
            });
        }

        const generate = byId('qgComprehensiveGenerate');
        if (generate) {
            generate.addEventListener('click', () => {
                stale = true;
                ensureFresh();
            });
        }

        if (printButton) {
            printButton.addEventListener('click', () => {
                if (printButton.disabled) return;
                ensureFresh();
                setPrintMode();
                window.print();
            });
        }

        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                if (downloadButton.disabled) return;

                ensureFresh();
                setPrintMode();

                const state = app.getState();
                const annexures = root.QuoteGeneratorAnnexures;

                // Wait for annexure artwork to be on the page, or the capture
                // would photograph empty frames.
                const ready = annexures ? annexures.whenReady() : Promise.resolve();

                ready.then(() => {
                    root.Ray2VoltPdfDownload?.downloadPages({
                        pages: container.querySelectorAll('.quote-page'),
                        button: downloadButton,
                        filename: downloadFilename(state),
                        beforeCapture: () => {
                            container.style.display = 'block';
                        },
                        afterCapture: () => {
                            container.style.display = '';
                        }
                    });
                });
            });
        }

        window.addEventListener('resize', fitStage);
        window.addEventListener('orientationchange', fitStage);
    }

    /** Marks the built document stale so the next preview view rebuilds it. */
    function invalidate() {
        stale = true;
    }

    root.QuoteGeneratorPreview = {
        init,
        render(state, derived, validation) {
            stale = true;
            render(state, derived, validation);
        },
        invalidate,
        selectPage,
        getPlan() {
            return currentPlan;
        },
        downloadFilename,
        sanitizeFilenamePart
    };
}(typeof self !== 'undefined' ? self : this));
