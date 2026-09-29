/* Run with @playwright/test installed: node tests/pdf-metadata.browser.cjs */
const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const lib = require('../global/vendor/pdf-lib.min.js');
const fields = require('../global/scripts/pdf-metadata-fields.js');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp', 'pdf-metadata-qa');
fs.mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
});
const buttons = {
    'invoice-generator': 'generateInvoiceBtn', quotation: 'quoGenerateBtn', 'proforma-invoice': 'piGenerateBtn',
    'purchase-order': 'poGenerateBtn', 'receipt-generator': 'generateReceiptBtn', 'payslip-generator': 'generatePayslipBtn',
    'warranty-card': 'generateWarrantyBtn', 'request-for-quotation': 'rfqGenerateBtn', 'quote-generator': 'qgGenerateBtn',
    'comparison-sheet': 'csPreviewBtn', 'margin-breakdown': 'mbPreviewBtn', 'emi-calculator': 'previewEmiReportBtn'
};
function readMetadata(pdf) {
    const info = pdf.context.lookup(pdf.context.trailerInfo.Info);
    return Object.fromEntries(info.keys().filter(k => k.decodeText().startsWith('R2V_')).map(k => [k.decodeText().slice(4), info.get(k).decodeText()]));
}
function pageStreams(pdf, index) {
    const contents = pdf.getPage(index).node.Contents();
    const refs = contents instanceof lib.PDFArray ? contents.asArray() : [contents];
    return refs.map(ref => Buffer.from(lib.decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('hex'));
}
async function stampFile(page, buffer, name = 'saved.pdf') {
    await page.locator('.r2v-pdf-panel input[type=file]').setInputFiles({ name, mimeType: 'application/pdf', buffer });
    await page.locator('[data-confirm]').check();
    const promise = page.waitForEvent('download'); await page.locator('[data-stamp]').click();
    const download = await promise;
    const file = path.join(output, name.replace('.pdf', '-extra.pdf')); await download.saveAs(file);
    return { file, metadata: readMetadata(await lib.PDFDocument.load(fs.readFileSync(file), { updateMetadata: false })) };
}
async function values(page, inputs) {
    await page.evaluate(inputs => {
        for (const [id, value] of Object.entries(inputs)) {
            const el = document.getElementById(id);
            if (!el) throw new Error(`Missing fixture control ${id}`);
            el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, inputs);
}
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    await context.addInitScript(() => localStorage.setItem('ray2volt_toolbox_session', JSON.stringify({ role: 'owner', at: Date.now() })));
    // Font requests are independent of metadata; avoid making this functional check depend on them.
    await context.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
    const summary = [];
    try {
        for (const tool of Object.keys(fields.tools)) {
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('dialog', dialog => dialog.dismiss());
            await page.goto(`${origin}/tools/${tool}/${tool}.html`, { waitUntil: 'load' });
            await page.locator('.r2v-pdf-panel').waitFor();
            if (tool === 'comparison-sheet') await values(page, { csCapacity: '5', csPrice1: '35', csPrice2: '40', csPrice3: '45' });
            if (tool === 'margin-breakdown') {
                await values(page, { mbCustomerName: 'Metadata Test', mbCapacity: '5', mbProjectId: 'QA-PROJECT', mbConsultantId: 'QA-STAFF' });
                await page.locator('#mbLineTableBody input').first().fill('Solar installation');
            }
            if (tool === 'quote-generator') await values(page, { qgCustomerName: 'Metadata Test', qgSystemCapacity: '5', qgTotalPrice: '250000' });
            if (tool === 'payslip-generator') await values(page, { payslipEmployeeId: 'QA-EMP', payslipBankAccount: 'PRIVATE-BANK', payslipPan: 'PRIVATE-PAN', payslipBasicSalary: '50000' });
            let original;
            if (tool === 'letterheadify') {
                const fixture = await lib.PDFDocument.create(); fixture.addPage([595, 842]).drawText('Letterhead fixture');
                fixture.setAuthor('Fixture author');
                original = await fixture.save();
                await page.locator('#lhdPdfInput').setInputFiles({ name: 'fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from(original) });
            } else {
                if (tool === 'solar-savings') await page.evaluate(() => openReportModal());
                else await page.locator('#' + buttons[tool]).click();
                await page.waitForFunction(() => document.querySelector('.r2v-pdf-panel dl').children.length > 0);
                const sourcePath = path.join(output, `${tool}-source.pdf`);
                original = await page.pdf({ path: sourcePath, format: 'A4', printBackground: true, preferCSSPageSize: true });
                // Closing report modals makes the toolbox panel reachable, as in a real workflow.
                await page.evaluate(() => {
                    document.querySelectorAll('.ssc-modal-overlay,.emi-modal-overlay').forEach(el => el.classList.remove('active'));
                    const emi = document.getElementById('emiReportModalOverlay'); if (emi) emi.classList.remove('active');
                    document.body.style.overflow = '';
                });
                await page.locator('.r2v-pdf-panel input[type=file]').setInputFiles({ name: 'saved.pdf', mimeType: 'application/pdf', buffer: original });
                await page.locator('[data-confirm]').check();
            }
            const downloadPromise = page.waitForEvent('download');
            await page.locator(tool === 'letterheadify' ? '#lhdProcessBtn' : '[data-stamp]').click();
            const download = await downloadPromise;
            const target = path.join(output, `${tool}-tracked.pdf`); await download.saveAs(target);
            const pdf = await lib.PDFDocument.load(fs.readFileSync(target), { updateMetadata: false });
            const source = await lib.PDFDocument.load(original, { updateMetadata: false });
            const metadata = readMetadata(pdf);
            assert.equal(metadata.ToolId, tool);
            assert.equal(metadata.Revision, '1');
            assert.match(metadata.ExportId, /^[0-9a-f-]{36}$/);
            assert.equal(pdf.getPageCount(), source.getPageCount());
            if (tool !== 'letterheadify') {
                for (let i = 0; i < pdf.getPageCount(); i++) assert.deepEqual(pageStreams(pdf, i), pageStreams(source, i), `${tool} page ${i + 1} content changed`);
            }
            const xmlValid = await page.evaluate(() => {
                // Writer escapes XML text, including Unicode; verify the generated XMP in Node below.
                return document.querySelector('.r2v-pdf-status').textContent.includes('Tracked PDF ready');
            });
            assert.ok(xmlValid);
            const xmp = Buffer.from(pdf.catalog.lookup(lib.PDFName.of('Metadata')).getContents()).toString('utf8');
            assert.ok(await page.evaluate(xmp => !new DOMParser().parseFromString(xmp, 'text/xml').querySelector('parsererror'), xmp));
            if (tool === 'payslip-generator') {
                assert.equal(metadata.EmployeeId, 'QA-EMP');
                assert.doesNotMatch(JSON.stringify(metadata), /PRIVATE-BANK|PRIVATE-PAN|50000/);
            }
            if (tool === 'letterheadify') assert.equal(metadata.SourceAuthor, 'Fixture author');
            if (tool === 'invoice-generator') {
                // Edit after preview/print: the selected PDF must retain its frozen metadata.
                await values(page, { invoiceNumber: 'EDITED-AFTER-PRINT' });
                await page.locator('.r2v-pdf-panel input[type=file]').setInputFiles({ name: 'same.pdf', mimeType: 'application/pdf', buffer: original });
                await page.locator('[data-confirm]').check();
                const againPromise = page.waitForEvent('download'); await page.locator('[data-stamp]').click();
                const againPath = path.join(output, 'invoice-second-export.pdf'); await (await againPromise).saveAs(againPath);
                const again = readMetadata(await lib.PDFDocument.load(fs.readFileSync(againPath), { updateMetadata: false }));
                assert.equal(again.DocumentNumber, metadata.DocumentNumber);
                assert.equal(again.DocumentId, metadata.DocumentId);
                assert.equal(again.Revision, '1'); assert.notEqual(again.ExportId, metadata.ExportId);
                await page.locator('.r2v-pdf-panel').screenshot({ path: path.join(output, 'details-desktop.png') });
                await page.setViewportSize({ width: 390, height: 844 });
                await page.locator('.r2v-pdf-panel').screenshot({ path: path.join(output, 'details-mobile.png') });
                assert.ok(await page.locator('.r2v-pdf-panel').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
                await values(page, { invoiceNumber: metadata.DocumentNumber, invoiceName: 'Revision fixture' });
                await page.locator('#generateInvoiceBtn').click();
                const changed = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
                await page.locator('[data-footer]').check();
                const revised = await stampFile(page, changed, 'invoice-footer.pdf');
                assert.equal(revised.metadata.DocumentId, metadata.DocumentId);
                assert.equal(revised.metadata.Revision, '2');
                assert.equal(revised.metadata.TrackingFooter, 'true');
                await page.locator('[data-footer]').uncheck();
                await page.locator('.r2v-pdf-panel input[type=file]').setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') });
                await page.locator('[data-confirm]').check(); await page.locator('[data-stamp]').click();
                await page.waitForFunction(() => document.querySelector('.r2v-pdf-status').textContent.includes('Could not embed metadata'));
                await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
                await stampFile(page, changed, 'invoice-storage-denied.pdf');
                assert.match(await page.locator('.r2v-pdf-status').textContent(), /storage is unavailable/);
            }
            if (tool === 'quote-generator') {
                await page.locator('#qgModeComprehensive').click();
                await page.evaluate(() => {
                    QuoteGeneratorApp.patch(state => {
                        state.project.quoteNumber = 'QA-COMPREHENSIVE';
                        state.project.dcCapacityKwp = 10;
                        state.project.acCapacityKw = 10;
                        state.commercial.actualProjectCost = 450000;
                    });
                    QuoteGeneratorPreview.render(QuoteGeneratorApp.getState(), QuoteGeneratorApp.getDerived(), QuoteGeneratorApp.getValidation());
                });
                await page.waitForFunction(() => document.querySelector('#qgComprehensivePages').children.length > 0);
                const comprehensive = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
                const tracked = await stampFile(page, comprehensive, 'comprehensive.pdf');
                assert.equal(tracked.metadata.ReportMode, 'comprehensive');
                assert.equal(tracked.metadata.CapacityKwp, '10');
                assert.equal(tracked.metadata.DocumentNumber, 'QA-COMPREHENSIVE');
                assert.equal(tracked.metadata.QuotedAmount, '450000');
                summary.push({ tool: 'quote-generator-comprehensive', fields: Object.keys(tracked.metadata).length });
            }
            if (tool === 'emi-calculator') {
                for (const [button, mode] of [['calcTenureBtn', 'tenure'], ['calcRateBtn', 'rate']]) {
                    await page.locator('#' + button).click();
                    await values(page, { fixedEMI: '15000', loanAmount: '1000000', loanTenure: '120' });
                    const report = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
                    const tracked = await stampFile(page, report, `emi-${mode}.pdf`);
                    assert.equal(tracked.metadata.CalculationMode, mode);
                    assert.equal(tracked.metadata.MonthlyEmi, '15000');
                    summary.push({ tool: `emi-${mode}`, fields: Object.keys(tracked.metadata).length });
                }
            }
            assert.deepEqual(errors, [], `${tool} browser errors`);
            summary.push({ tool, pages: pdf.getPageCount(), fields: Object.keys(metadata).length });
            console.log('PASS', tool, pdf.getPageCount(), 'pages', Object.keys(metadata).length, 'fields');
            await page.close();
        }
        fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
