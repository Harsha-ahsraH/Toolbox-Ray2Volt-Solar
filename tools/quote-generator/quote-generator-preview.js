/**
 * Quote Generator - Comprehensive preview and print
 * Ray2Volt Solar Toolbox
 *
 * Builds the Comprehensive Proposal from the page plan, displays every A4 page
 * in a continuous preview, and wires Print / Save as PDF.
 *
 * One page plan feeds preview and browser print. The pages are built once into
 * #qgComprehensivePages; the preview shows scaled clones of those same
 * nodes, so the preview and printed Proposal cannot disagree on page order,
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
    let stage = null;
    let position = null;
    let exportBlocked = null;
    let printButton = null;

    let currentPlan = [];
    let stale = true;
    let waitingForAssets = false;

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
            <div class="quote-page cq-page ${esc(descriptor.pageClass || '')}"
                data-page-index="${page.pageNumber - 1}"
                data-section-id="${esc(page.sectionId)}">
                ${head}
                <div class="cq-body ${esc(descriptor.bodyClass || '')}">${descriptor.body}</div>
                <div class="cq-foot">
                    <span>${esc(Content.COMPANY.legalName)}</span>
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
        const unloaded = Array.from(container.querySelectorAll('img')).filter(img => !img.complete);
        if (!waitingForAssets && (unloaded.length || document.fonts.status !== 'loaded')) {
            waitingForAssets = true;
            Promise.all([document.fonts.ready, ...unloaded.map(img => img.decode().catch(() => null))])
                .then(() => {
                    waitingForAssets = false;
                    if (app) render(app.getState(), app.getDerived(), app.getValidation());
                });
        }
        if (root.QuoteGeneratorDocumentLayout) {
            currentPlan = root.QuoteGeneratorDocumentLayout.compose(container, currentPlan);
        }
        const estimate = byId('qgPageEstimate');
        if (estimate) estimate.textContent = `${currentPlan.length} pages`;

        // Annexure frames are filled asynchronously from IndexedDB.
        if (root.QuoteGeneratorAnnexures) {
            root.QuoteGeneratorAnnexures.hydrate(container, state);
        }
    }

    // ---------------------------------------------------------------------
    // Continuous document preview
    // ---------------------------------------------------------------------

    function fitStage() {
        if (!stage) return;
        const style = getComputedStyle(stage);
        const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        if (available <= 0) return;
        const scale = Math.max(0.2, Math.min(1, available / A4_WIDTH_PX));
        stage.style.setProperty('--qg-stage-scale', scale.toFixed(4));
    }

    function buildFullPreview(state) {
        if (!stage) return;
        stage.replaceChildren(...Array.from(container.children, node => node.cloneNode(true)));
        if (!currentPlan.length) stage.innerHTML = '<p class="qg-preview-empty">No pages selected.</p>';
        if (position) position.textContent = currentPlan.length ? currentPlan.length + ' pages · A4 proposal' : 'No pages';
        fitStage();
        if (root.QuoteGeneratorAnnexures) root.QuoteGeneratorAnnexures.hydrate(stage, state);
    }

    // ---------------------------------------------------------------------
    // Export
    // ---------------------------------------------------------------------

    function applyExportGate(validation) {
        const blocked = validation ? validation.hasCriticalErrors : true;

        if (printButton) printButton.disabled = blocked || waitingForAssets;
        if (exportBlocked) exportBlocked.hidden = !blocked;
    }

    function setPrintMode() {
        document.body.classList.add('qg-print-comprehensive');
        document.body.classList.remove('qg-print-short');
    }

    function printWhenFreshAndReady() {
        ensureFresh();
        if (printButton.disabled) return;
        setPrintMode();

        const annexures = root.QuoteGeneratorAnnexures;
        const ready = annexures ? annexures.whenReady() : Promise.resolve();

        printButton.disabled = true;
        ready.then(() => {
            printButton.disabled = false;

            // Inputs may change while annexures render. Rebuilding starts a new
            // hydration cycle, so wait again rather than printing empty frames.
            if (stale) {
                printWhenFreshAndReady();
                return;
            }

            window.print();
        });
    }

    // ---------------------------------------------------------------------
    // Public interface
    // ---------------------------------------------------------------------

    function render(state, derived, validation) {
        if (!container) return;

        buildPages(state, derived, validation);
        buildFullPreview(state);
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
        stage = byId('qgPreviewStage');
        position = byId('qgPreviewPosition');
        exportBlocked = byId('qgExportBlocked');
        printButton = byId('qgComprehensivePrint');

        if (!container) return;

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
                printWhenFreshAndReady();
            });
        }

        window.addEventListener('resize', fitStage);
        window.addEventListener('orientationchange', fitStage);
        if (root.ResizeObserver && stage) {
            const observer = new root.ResizeObserver(() => window.requestAnimationFrame(fitStage));
            observer.observe(stage);
        }
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
        getPlan() {
            return currentPlan;
        }
    };
}(typeof self !== 'undefined' ? self : this));
