/**
 * Quote Generator - Annexure attachments
 * Ray2Volt Solar Toolbox
 *
 * Optional project-specific documents appended after the main Proposal in
 * upload order. Images become one scaled A4 page each; every page of an
 * uploaded PDF becomes its own annexure page.
 *
 * Files are held in IndexedDB on this device and are never uploaded anywhere.
 *
 * PDF.js is fetched from cdnjs only when a PDF annexure actually needs
 * rendering, matching how global/scripts/pdf-download.js lazy-loads html2canvas
 * and jsPDF. If it cannot load, the main Proposal stays fully usable and the
 * affected annexure pages carry a clear, annexure-specific error.
 */
(function (root) {
    'use strict';

    const Model = root.QuoteGeneratorModel;
    const Storage = root.QuoteGeneratorStorage;

    const PDFJS_VERSION = '3.11.174';
    const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

    /** Render width in CSS pixels. Comfortably above A4 at 150dpi for print. */
    const PDF_RENDER_WIDTH = 1400;

    let app = null;
    let pdfLibPromise = null;
    let hydrateChain = Promise.resolve();

    const objectUrls = {};
    const documentCache = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function showError(message) {
        const box = byId('qgAnnexureError');
        if (!box) return;

        if (!message) {
            box.hidden = true;
            box.textContent = '';
            return;
        }

        box.hidden = false;
        box.textContent = message;
    }

    // ---------------------------------------------------------------------
    // PDF.js
    // ---------------------------------------------------------------------

    function loadPdfLibrary() {
        if (root.pdfjsLib) {
            root.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
            return Promise.resolve(root.pdfjsLib);
        }

        if (!pdfLibPromise) {
            pdfLibPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = PDFJS_SRC;
                script.onload = () => {
                    if (!root.pdfjsLib) {
                        reject(new Error('PDF.js loaded but did not register.'));
                        return;
                    }
                    root.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
                    resolve(root.pdfjsLib);
                };
                script.onerror = () => reject(new Error('Could not load the PDF renderer.'));
                document.head.appendChild(script);
            }).catch(error => {
                pdfLibPromise = null;
                throw error;
            });
        }

        return pdfLibPromise;
    }

    function readAsArrayBuffer(blob) {
        if (blob.arrayBuffer) return blob.arrayBuffer();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Could not read the file.'));
            reader.readAsArrayBuffer(blob);
        });
    }

    function openPdfDocument(annexureId, blob) {
        if (documentCache[annexureId]) return documentCache[annexureId];

        documentCache[annexureId] = loadPdfLibrary()
            .then(pdfjsLib => readAsArrayBuffer(blob)
                .then(buffer => pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise))
            .catch(error => {
                delete documentCache[annexureId];
                throw error;
            });

        return documentCache[annexureId];
    }

    function countPdfPages(annexureId, blob) {
        return openPdfDocument(annexureId, blob).then(document_ => document_.numPages);
    }

    // ---------------------------------------------------------------------
    // Upload
    // ---------------------------------------------------------------------

    function isPdf(file) {
        return file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    }

    function isImage(file) {
        return /^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || '');
    }

    function addFiles(files) {
        if (!files || !files.length) return;

        showError('');

        const queue = Array.prototype.slice.call(files);

        queue.reduce((chain, file) => chain.then(() => addOneFile(file)), Promise.resolve())
            .then(() => app.persist());
    }

    function addOneFile(file) {
        if (!isPdf(file) && !isImage(file)) {
            showError(`"${file.name}" is not an image or a PDF, so it was not added.`);
            return Promise.resolve();
        }

        const state = app.getState();
        const before = state.annexures.length;

        Model.addAnnexure(state, {
            title: file.name.replace(/\.[^.]+$/, ''),
            type: isPdf(file) ? 'drawing' : 'site-photograph',
            fileName: file.name,
            fileType: file.type || (isPdf(file) ? 'application/pdf' : 'image'),
            fileSize: file.size || 0,
            pageCount: 1
        });

        const annexure = state.annexures[before];

        return Storage.saveAnnexureFile(annexure.id, file)
            .catch(error => {
                showError(`"${file.name}" could not be stored on this device: ${error.message}`);
            })
            .then(() => {
                if (!isPdf(file)) return null;

                return countPdfPages(annexure.id, file)
                    .then(pageCount => {
                        annexure.pageCount = pageCount;
                    })
                    .catch(() => {
                        showError(
                            'The PDF renderer could not be loaded, so PDF annexures cannot be paginated '
                            + 'or displayed. The rest of the proposal is unaffected. Check the internet '
                            + 'connection and reopen this page to try again.'
                        );
                    });
            });
    }

    function remove(annexureId, state, api) {
        if (objectUrls[annexureId]) {
            URL.revokeObjectURL(objectUrls[annexureId]);
            delete objectUrls[annexureId];
        }
        delete documentCache[annexureId];

        Storage.deleteAnnexureFile(annexureId).catch(() => {
            // A missing blob is not worth blocking the removal over.
        });

        api.update(current => Model.removeAnnexure(current, annexureId));
    }

    // ---------------------------------------------------------------------
    // Rendering into page frames
    // ---------------------------------------------------------------------

    function frameError(frame, message) {
        frame.innerHTML = `<div class="cq-annexure-error">${
            String(message).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`;
    }

    function renderImage(frame, record) {
        if (!objectUrls[record.id]) {
            objectUrls[record.id] = URL.createObjectURL(record.blob);
        }

        const image = new Image();
        image.src = objectUrls[record.id];
        image.alt = record.fileName || 'Annexure';

        frame.innerHTML = '';
        frame.appendChild(image);

        return new Promise(resolve => {
            image.onload = resolve;
            image.onerror = () => {
                frameError(frame, 'This image could not be displayed.');
                resolve();
            };
        });
    }

    function renderPdfPage(frame, record, pageNumber) {
        return openPdfDocument(record.id, record.blob)
            .then(document_ => document_.getPage(pageNumber))
            .then(pdfPage => {
                const baseViewport = pdfPage.getViewport({ scale: 1 });
                const scale = PDF_RENDER_WIDTH / baseViewport.width;
                const viewport = pdfPage.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = Math.round(viewport.width);
                canvas.height = Math.round(viewport.height);

                frame.innerHTML = '';
                frame.appendChild(canvas);

                return pdfPage.render({
                    canvasContext: canvas.getContext('2d'),
                    viewport
                }).promise;
            })
            .catch(error => {
                frameError(frame,
                    'This PDF annexure could not be rendered: ' + (error && error.message
                        ? error.message
                        : 'the PDF renderer is unavailable.')
                    + ' The rest of the proposal is unaffected.');
            });
    }

    /**
     * Fills every annexure frame under `scope` from the stored files. Returns a
     * promise so the PDF download can wait for the artwork to be on the page
     * before it captures.
     */
    function hydrate(scope, state) {
        if (!scope || !state) return Promise.resolve();

        const frames = Array.prototype.slice.call(scope.querySelectorAll('.cq-annexure-frame'));
        if (!frames.length) return Promise.resolve();

        hydrateChain = Storage.loadAllAnnexureFiles()
            .then(records => Promise.all(frames.map(frame => {
                const record = records[frame.dataset.annexureId];
                const pageNumber = parseInt(frame.dataset.annexurePage, 10) || 1;

                if (!record || !record.blob) {
                    frameError(frame, 'The file for this annexure is not stored on this device. '
                        + 'Re-upload it from the Annexures panel.');
                    return Promise.resolve();
                }

                const isPdfRecord = record.fileType === 'application/pdf'
                    || /\.pdf$/i.test(record.fileName || '');

                return isPdfRecord
                    ? renderPdfPage(frame, record, pageNumber)
                    : renderImage(frame, record);
            })))
            .catch(error => {
                frames.forEach(frame => frameError(frame,
                    'Annexures could not be loaded: ' + (error && error.message ? error.message : 'unknown error.')));
            });

        return hydrateChain;
    }

    function whenReady() {
        return hydrateChain;
    }

    // ---------------------------------------------------------------------

    function init(appApi) {
        app = appApi;

        const input = byId('qgAnnexureFile');
        if (!input) return;

        input.addEventListener('change', () => {
            addFiles(input.files);
            input.value = '';
        });

        // Recount PDF pages for a restored draft: the page plan depends on it,
        // and a page count is cheap to re-derive but expensive to get wrong.
        Storage.loadAllAnnexureFiles().then(records => {
            const state = app.getState();
            const pending = (state.annexures || []).filter(annexure => {
                const record = records[annexure.id];
                return record && record.blob
                    && (record.fileType === 'application/pdf' || /\.pdf$/i.test(record.fileName || ''));
            });

            if (!pending.length) return null;

            return Promise.all(pending.map(annexure =>
                countPdfPages(annexure.id, records[annexure.id].blob)
                    .then(pageCount => { annexure.pageCount = pageCount; })
                    .catch(() => null)
            )).then(() => app.persist());
        }).catch(() => null);
    }

    root.QuoteGeneratorAnnexures = {
        init,
        hydrate,
        whenReady,
        remove,
        loadPdfLibrary
    };
}(typeof self !== 'undefined' ? self : this));
