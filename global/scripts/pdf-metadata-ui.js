/* Static workflow: freeze the printed preview, then stamp the user's saved PDF locally. */
(function () {
    'use strict';
    const Core = window.Ray2VoltPdfMetadata;
    const Fields = window.Ray2VoltPdfFields;
    const tool = document.currentScript.dataset.tool;
    const definition = Fields.tools[tool];
    if (!definition) return;
    const scriptUrl = document.currentScript.src;
    const STORE = 'ray2volt_pdf_records_v1';
    let latest = null;
    let printed = null;
    let lastRecord = null;
    let panel, details, status, stampButton, input, confirm, footer, history;
    let busy = false;
    let newIdentity = null;
    let memoryRecords = [];
    let storageAvailable = true;
    let libraryPromise;
    const snapshots = new Map();

    function actor() {
        try {
            const session = JSON.parse(localStorage.getItem('ray2volt_toolbox_session') || 'null');
            if (session && Date.now() - session.at < 12 * 3600000) {
                return { GeneratedByAccountId: session.role, IdentitySource: 'static-toolbox-session' };
            }
        } catch (_) { /* Missing session is recorded explicitly, never guessed. */ }
        return { IdentitySource: 'unavailable' };
    }
    function records() {
        if (!storageAvailable) return memoryRecords;
        try {
            const stored = JSON.parse(localStorage.getItem(STORE) || '[]');
            if (Array.isArray(stored)) memoryRecords = stored;
        } catch (_) { storageAvailable = false; }
        return memoryRecords;
    }
    function remember(record) {
        memoryRecords = [record, ...records()].slice(0, 100);
        try { localStorage.setItem(STORE, JSON.stringify(memoryRecords)); }
        catch (_) { storageAvailable = false; }
    }
    function label(key) { return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/Id\b/g, 'ID'); }
    function show(values) {
        if (!details) return;
        details.replaceChildren();
        for (const [key, value] of Object.entries(values)) {
            const term = document.createElement('dt');
            const description = document.createElement('dd');
            term.textContent = label(key);
            description.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value);
            details.append(term, description);
        }
    }
    function message(text) { if (status) status.textContent = text; }
    function fingerprintContent(element) {
        if (!element) return '';
        // Only used transiently for hashing; customer content is never stored in the tracking log.
        const images = Array.from(element.querySelectorAll('img'), image => image.src);
        const canvases = Array.from(element.querySelectorAll('canvas'), canvas => {
            try { return canvas.toDataURL(); } catch (_) { return 'unreadable-canvas'; }
        });
        return element.textContent.replace(/\s+/g, ' ').trim() + JSON.stringify([images, canvases]);
    }
    function capture(element, extra = {}, replaceFields = false) {
        if (!element) return;
        const fields = {
            DocumentType: definition[0], ToolId: tool,
            ...(tool !== 'letterheadify' && tool !== 'warranty-card' && tool !== 'payslip-generator' ? { Currency: 'INR' } : {}),
            ...(replaceFields ? {} : Fields.collect(tool, document)), ...extra
        };
        for (const [key, value] of Object.entries(fields)) {
            if (value === '' || value == null || value === '—' || value === '-') delete fields[key];
        }
        latest = { fields, content: fingerprintContent(element), elementId: element.id, capturedAt: new Date().toISOString(), actor: actor() };
        snapshots.set(element.id, latest);
        if (!printed) {
            show(fields);
            message('Preview details ready. Save this preview using Print / Save as PDF, then select that PDF below.');
        }
    }
    function freezePrint() {
        const elementId = tool === 'quote-generator' && document.body.classList.contains('qg-print-comprehensive')
            ? 'qgComprehensivePages' : definition[1];
        latest = snapshots.get(elementId);
        const element = document.getElementById(elementId);
        if (!latest || !element || (!['emi-calculator', 'solar-savings', 'quote-generator'].includes(tool) && !element.classList.contains('visible'))) {
            printed = null; enable(); message('Generate a valid preview before saving a PDF to track.'); return;
        }
        printed = JSON.parse(JSON.stringify(latest));
        panel?.querySelectorAll('[data-link]').forEach(field => {
            if (field.value.trim()) printed.fields[field.dataset.link] = field.value.trim();
        });
        printed.printedAt = new Date().toISOString();
        if (input) input.value = '';
        if (confirm) confirm.checked = false;
        show(printed.fields);
        message('Details frozen for the print dialog just opened. After saving, select that PDF below.');
        enable();
    }
    function enable() {
        if (stampButton) stampButton.disabled = busy || !printed || !input.files.length || !confirm.checked;
    }
    async function library() {
        if (window.PDFLib) return window.PDFLib;
        if (!libraryPromise) libraryPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL('../vendor/pdf-lib.min.js', scriptUrl).href;
            script.onload = () => window.PDFLib ? resolve(window.PDFLib) : reject(new Error('PDF library is unavailable.'));
            script.onerror = () => reject(new Error('Could not load PDF processing. Check the connection and try again.'));
            document.head.appendChild(script);
        }).catch(error => { libraryPromise = null; throw error; });
        return libraryPromise;
    }
    function download(bytes, name, type = 'application/pdf') {
        const url = URL.createObjectURL(new Blob([bytes], { type }));
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = name;
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    async function metadataFor(snapshot) {
        const account = snapshot.actor.GeneratedByAccountId || 'anonymous';
        const reference = snapshot.fields.DocumentNumber || snapshot.fields.ProjectId || 'current-report';
        const key = await Core.hash(`${account}|${tool}|${reference}|${newIdentity || ''}`);
        const previous = records().find(record => record.RegistryKey === key);
        const metadata = await Core.identify(snapshot, previous, { actor: snapshot.actor });
        return { metadata, key };
    }
    async function finish(pdf, sourceBytes, snapshot, lib, options = {}) {
        Core.assertEditable(pdf, lib);
        const info = pdf.context.lookup(pdf.context.trailerInfo.Info);
        if (info?.get(lib.PDFName.of('R2V_TrackingFooter'))?.decodeText() === 'true') {
            throw new Error('This PDF already has a tracking footer. Select the original PDF to avoid conflicting export references');
        }
        const { metadata, key } = await metadataFor(snapshot);
        metadata.SourceFileSha256 = await Core.hash(sourceBytes);
        metadata.PageCount = pdf.getPageCount();
        metadata.MetadataAppliedAt = new Date().toISOString();
        metadata.TrackingFooter = !!footer?.checked;
        if (snapshot.printedAt) metadata.PrintRequestedAt = snapshot.printedAt;
        if (options.letterhead) {
            metadata.SourcePageCount = pdf.getPageCount();
            metadata.LetterheadVersion = '7d4510724d5924ca426ca7254dd35d524de0cf27cea572f24b9480b93b7fe5cb';
            metadata.StampedAt = metadata.MetadataAppliedAt;
        }
        Core.write(pdf, metadata, lib, { preserveSource: !!options.letterhead });
        if (footer?.checked) await Core.addFooter(pdf, metadata, lib);
        const bytes = await pdf.save();
        lastRecord = { ...metadata, RegistryKey: key, FileSha256: await Core.hash(bytes) };
        remember(lastRecord);
        show(metadata);
        refreshHistory();
        message(`Tracked PDF ready. Revision ${metadata.Revision}. ${storageAvailable ? 'Tracking record saved in this browser.' : 'Browser storage is unavailable; download the tracking record to keep it.'}`);
        return bytes;
    }
    async function stamp() {
        if (busy || !printed || !input.files.length || !confirm.checked) return;
        busy = true; enable();
        const snapshot = printed;
        const file = input.files[0];
        message('Embedding metadata...');
        try {
            if (!/\.pdf$/i.test(file.name)) throw new Error('Select a PDF file.');
            const lib = await library();
            const bytes = new Uint8Array(await file.arrayBuffer());
            const pdf = await lib.PDFDocument.load(bytes, { updateMetadata: false });
            const output = await finish(pdf, bytes, snapshot, lib);
            download(output, file.name.replace(/\.pdf$/i, '') + '-tracked.pdf');
            input.value = ''; confirm.checked = false;
        } catch (error) {
            message(`Could not embed metadata: ${error.message}. The original file has not been changed.`);
        } finally { busy = false; enable(); }
    }
    async function letterhead(pdf, bytes) {
        const sourceHash = await Core.hash(bytes);
        const snapshot = {
            fields: { DocumentType: definition[0], ToolId: tool, SourceFileSha256: sourceHash },
            content: sourceHash, actor: actor()
        };
        // Separate source files are separate logical documents, even without a business number.
        snapshot.fields.DocumentNumber = `LHD-${sourceHash.slice(0, 16)}`;
        panel?.querySelectorAll('[data-link]').forEach(field => {
            if (field.value.trim()) snapshot.fields[field.dataset.link] = field.value.trim();
        });
        return finish(pdf, bytes, snapshot, await library(), { letterhead: true });
    }
    function refreshHistory() {
        if (!history) return;
        history.replaceChildren();
        for (const record of records().filter(item => item.ToolId === tool).slice(0, 10)) {
            const button = document.createElement('button'); button.type = 'button';
            button.textContent = `${record.DocumentNumber || record.DocumentType} · Rev ${record.Revision} · ${new Date(record.GeneratedAt).toLocaleString()}`;
            button.addEventListener('click', () => { lastRecord = record; show(record); });
            history.appendChild(button);
        }
    }
    function init() {
        try { newIdentity = localStorage.getItem(`ray2volt_pdf_identity_v1:${tool}`); }
        catch (_) { /* New identities can still be used for the current page. */ }
        panel = document.createElement('section');
        panel.className = 'r2v-pdf-panel no-print'; panel.setAttribute('aria-label', 'PDF document details');
        panel.innerHTML = `<h2 class="r2v-pdf-heading">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
                PDF Tracking</h2>
            <p class="r2v-pdf-intro">${tool === 'letterheadify' ? 'Tracking metadata is added automatically with your letterhead.' : 'Save your preview as a PDF, then select it below to add tracking details.'}</p>
            <div class="r2v-pdf-stamp" ${tool === 'letterheadify' ? 'hidden' : ''}>
                <div class="r2v-pdf-upload-row">
                    <label class="r2v-pdf-file">Saved PDF <input type="file" accept="application/pdf,.pdf"></label>
                    <button class="r2v-pdf-primary" type="button" data-stamp disabled>Embed &amp; Download PDF</button>
                </div>
                <label class="r2v-pdf-check"><input type="checkbox" data-confirm><span>This is the PDF I just saved from the preview.</span></label>
            </div>
            <p class="r2v-pdf-status" role="status" aria-live="polite">${tool === 'letterheadify' ? 'Choose a PDF above to get started.' : 'Generate a preview to see its document details.'}</p>
            <div class="r2v-pdf-sections">
                <details><summary>Document details</summary><dl></dl></details>
                <details class="r2v-pdf-options"><summary>Tracking options</summary>
                    <div class="r2v-pdf-links">
                        <p>Link existing records before printing. Leave unknown IDs blank.</p>
                        <div class="r2v-pdf-input-grid">
                            <label>Customer ID <input type="text" data-link="CustomerId" maxlength="120"></label>
                            <label>Project ID <input type="text" data-link="ProjectId" maxlength="120"></label>
                            <label>Supplier ID <input type="text" data-link="SupplierId" maxlength="120"></label>
                            <label>Linked quotation ID <input type="text" data-link="LinkedQuotationId" maxlength="120"></label>
                            <label>Linked invoice ID <input type="text" data-link="LinkedInvoiceId" maxlength="120"></label>
                        </div>
                    </div>
                    <label class="r2v-pdf-check"><input type="checkbox" data-footer><span>Add a tracking footer<small>Use only when the PDF has a clear bottom margin.</small></span></label>
                    <div class="r2v-pdf-actions"><button type="button" data-record>Download Tracking Record</button>
                        <button type="button" data-new>Start New Tracking Identity</button></div>
                </details>
                <details><summary>Recent exports</summary><div class="r2v-pdf-history"></div></details>
            </div>
            <p class="r2v-pdf-note">Processed on your device. History is saved in this browser.</p>`;
        const section = document.querySelector('.main-content > .content-section') || document.querySelector('.main-content') || document.body;
        const preview = document.getElementById(definition[1]);
        if (preview?.parentElement === section) section.insertBefore(panel, preview);
        else section.appendChild(panel);
        details = panel.querySelector('dl'); status = panel.querySelector('[role=status]');
        input = panel.querySelector('input[type=file]'); confirm = panel.querySelector('[data-confirm]');
        footer = panel.querySelector('[data-footer]'); stampButton = panel.querySelector('[data-stamp]');
        history = panel.querySelector('.r2v-pdf-history');
        const allowedLinks = tool === 'payslip-generator' ? [] :
            ['purchase-order', 'request-for-quotation'].includes(tool) ? ['ProjectId', 'SupplierId'] :
            ['CustomerId', 'ProjectId', ...(tool === 'proforma-invoice' ? ['LinkedQuotationId'] : []),
                ...(tool === 'receipt-generator' ? ['LinkedInvoiceId'] : [])];
        panel.querySelectorAll('[data-link]').forEach(field => {
            if (!allowedLinks.includes(field.dataset.link)) field.closest('label').remove();
        });
        if (!allowedLinks.length) panel.querySelector('.r2v-pdf-links').remove();
        input.addEventListener('change', () => { confirm.checked = false; enable(); });
        confirm.addEventListener('change', enable); stampButton.addEventListener('click', stamp);
        panel.querySelector('[data-new]').addEventListener('click', () => {
            if (busy) return;
            newIdentity = crypto.randomUUID(); printed = null; latest = null; snapshots.clear();
            try { localStorage.setItem(`ray2volt_pdf_identity_v1:${tool}`, newIdentity); } catch (_) { /* Session only. */ }
            input.value = ''; confirm.checked = false; lastRecord = null; show({}); enable();
            message('New identity started. Generate a fresh preview and print it before selecting the saved PDF.');
        });
        panel.querySelector('[data-record]').addEventListener('click', () => {
            if (!lastRecord) { message('Embed metadata in a PDF or select a recent record first.'); return; }
            download(JSON.stringify(lastRecord, null, 2), `tracking-${lastRecord.ExportId}.json`, 'application/json');
        });
        refreshHistory();
        if (latest) show(latest.fields);
        // Registered after tool initialization: EMI and comprehensive modes update in beforeprint.
        window.addEventListener('beforeprint', freezePrint);
    }
    window.Ray2VoltPdfTracking = {
        capture, letterhead, assertEditable: pdf => Core.assertEditable(pdf, window.PDFLib),
        invalidate: id => snapshots.delete(id)
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
