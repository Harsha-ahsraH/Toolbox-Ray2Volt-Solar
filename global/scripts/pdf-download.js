/**
 * Shared PDF download module for Ray2Volt document generators.
 * Renders document previews straight to a downloadable PDF file
 * (no print dialog) using html2canvas + jsPDF, lazy-loaded from CDN
 * the first time a download is requested.
 */
(function (root) {
    'use strict';

    const LIBRARIES = [
        { global: 'html2canvas', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js' },
        { global: 'jspdf', src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' }
    ];

    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const CAPTURE_SCALE = 2;
    const JPEG_QUALITY = 0.95;
    const BREAK_CANDIDATE_SELECTOR = 'tr, p, h1, h2, h3, h4, table, ul, ol, .emi-input-group, .result-item';

    let librariesPromise = null;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(script);
        });
    }

    function loadLibraries() {
        if (!librariesPromise) {
            librariesPromise = Promise.all(
                LIBRARIES.filter(lib => !root[lib.global]).map(lib => loadScript(lib.src))
            ).catch(error => {
                librariesPromise = null;
                throw error;
            });
        }

        return librariesPromise;
    }

    function sanitizeFilename(name) {
        const cleaned = String(name || 'Ray2Volt-Document')
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, ' ')
            .trim();

        return /\.pdf$/i.test(cleaned) ? cleaned : cleaned + '.pdf';
    }

    function copyCanvases(sourceRoot, cloneRoot) {
        const sourceCanvases = sourceRoot.querySelectorAll('canvas');
        const cloneCanvases = cloneRoot.querySelectorAll('canvas');

        sourceCanvases.forEach((source, index) => {
            const target = cloneCanvases[index];
            if (!target || !source.width || !source.height) return;

            target.width = source.width;
            target.height = source.height;
            target.getContext('2d')?.drawImage(source, 0, 0);
        });
    }

    function captureElement(element, prepareClone) {
        return root.html2canvas(element, {
            scale: CAPTURE_SCALE,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (cloneDoc, cloneRoot) => {
                copyCanvases(element, cloneRoot);
                cloneRoot.style.border = 'none';
                cloneRoot.style.borderRadius = '0';
                cloneRoot.style.boxShadow = 'none';
                cloneRoot.style.margin = '0';
                if (prepareClone) prepareClone(cloneRoot, cloneDoc);
            }
        });
    }

    /**
     * Y-positions (as fractions of the element height) where a page cut is
     * safe — the top edge of rows, paragraphs, and headings. Fractions stay
     * valid regardless of any zoom applied to the live preview.
     */
    function collectBreakFractions(element) {
        const rootRect = element.getBoundingClientRect();
        if (!rootRect.height) return [];

        const fractions = new Set();
        element.querySelectorAll(BREAK_CANDIDATE_SELECTOR).forEach(node => {
            const rect = node.getBoundingClientRect();
            if (rect.height > 0 && rect.top > rootRect.top) {
                fractions.add((rect.top - rootRect.top) / rootRect.height);
            }
        });

        return Array.from(fractions).sort((a, b) => a - b);
    }

    function addSlicedCanvas(pdf, canvas, breakFractions, marginMm) {
        const contentWidthMm = A4_WIDTH_MM - marginMm * 2;
        const contentHeightMm = A4_HEIGHT_MM - marginMm * 2;
        const pageHeightPx = canvas.width * (contentHeightMm / contentWidthMm);
        const breakPoints = breakFractions.map(fraction => Math.round(fraction * canvas.height));

        let start = 0;
        let firstPage = true;

        while (start < canvas.height - 1) {
            let end = Math.min(start + pageHeightPx, canvas.height);

            if (end < canvas.height) {
                const safeBreaks = breakPoints.filter(point => point > start + pageHeightPx * 0.55 && point <= end);
                if (safeBreaks.length) {
                    end = safeBreaks[safeBreaks.length - 1];
                }
            }

            const slice = document.createElement('canvas');
            slice.width = canvas.width;
            slice.height = Math.max(1, Math.round(end - start));

            const context = slice.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, slice.width, slice.height);
            context.drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, canvas.width, slice.height);

            if (!firstPage) pdf.addPage();
            firstPage = false;

            const imageHeightMm = contentWidthMm * slice.height / slice.width;
            pdf.addImage(slice.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', marginMm, marginMm, contentWidthMm, imageHeightMm);

            start = end;
        }
    }

    async function runJob(options, job) {
        const button = options.button;
        const originalLabel = button ? button.textContent : '';

        if (button) {
            button.disabled = true;
            button.textContent = 'Preparing PDF…';
        }

        try {
            await loadLibraries();

            const { jsPDF } = root.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

            if (options.beforeCapture) await options.beforeCapture();
            try {
                await job(pdf);
            } finally {
                if (options.afterCapture) options.afterCapture();
            }

            pdf.save(sanitizeFilename(options.filename));
        } catch (error) {
            console.error('PDF download failed:', error);
            alert('Could not generate the PDF. Please check your internet connection and try again, or use Print / Save as PDF instead.');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalLabel;
            }
        }
    }

    /**
     * Download a single flowing document. Content taller than one A4 page is
     * split across pages, cutting at safe boundaries (rows, paragraphs).
     */
    function downloadElement(options) {
        const element = options.element;
        if (!element) return Promise.resolve();

        return runJob(options, async (pdf) => {
            const breakFractions = collectBreakFractions(element);
            const canvas = await captureElement(element, options.prepareClone);
            addSlicedCanvas(pdf, canvas, breakFractions, options.marginMm ?? 8);
        });
    }

    /**
     * Download a fixed-page document: each element in `pages` (already sized
     * as a full A4 page) becomes exactly one PDF page, edge to edge.
     */
    function downloadPages(options) {
        const pages = Array.from(options.pages || []);
        if (!pages.length) return Promise.resolve();

        return runJob(options, async (pdf) => {
            for (let index = 0; index < pages.length; index++) {
                const canvas = await captureElement(pages[index], options.prepareClone);
                if (index > 0) pdf.addPage();

                const imageHeightMm = Math.min(A4_HEIGHT_MM, A4_WIDTH_MM * canvas.height / canvas.width);
                pdf.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, A4_WIDTH_MM, imageHeightMm);
            }
        });
    }

    function extractPrintCss() {
        let css = '';

        Array.from(document.styleSheets).forEach(sheet => {
            let rules;
            try {
                rules = sheet.cssRules;
            } catch (error) {
                return; // cross-origin stylesheet
            }
            if (!rules) return;

            Array.from(rules).forEach(rule => {
                if (rule.type === CSSRule.MEDIA_RULE && /print/.test(rule.media.mediaText)) {
                    Array.from(rule.cssRules).forEach(inner => {
                        css += inner.cssText + '\n';
                    });
                }
            });
        });

        return css;
    }

    /**
     * Temporarily apply the page's @media print rules to the live document so
     * a capture matches the printed layout. Returns a cleanup function.
     */
    function applyPrintStyles() {
        const style = document.createElement('style');
        style.textContent = extractPrintCss();
        document.head.appendChild(style);

        return () => style.remove();
    }

    root.Ray2VoltPdfDownload = {
        downloadElement,
        downloadPages,
        applyPrintStyles
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
