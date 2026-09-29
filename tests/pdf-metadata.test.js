const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const lib = require('../global/vendor/pdf-lib.min.js');
const Core = require('../global/scripts/pdf-metadata-core.js');
const Fields = require('../global/scripts/pdf-metadata-fields.js');
const root = path.resolve(__dirname, '..');

function snapshot(extra = {}) {
    return { fields: { DocumentType: 'Invoice', ToolId: 'invoice-generator', DocumentNumber: 'INV-001', ...extra }, content: 'Printed invoice total 100' };
}
function streams(pdf) {
    const contents = pdf.getPage(0).node.Contents();
    return contents.asArray().map(ref => Buffer.from(lib.decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('hex'));
}
test('identity is stable across exports; only changed contents advance the revision', async () => {
    const first = await Core.identify(snapshot(), null);
    const second = await Core.identify(snapshot(), first);
    assert.equal(second.DocumentId, first.DocumentId);
    assert.equal(second.Revision, 1);
    assert.notEqual(second.ExportId, first.ExportId);
    const changed = await Core.identify({ ...snapshot(), content: 'Printed invoice total 200' }, second);
    assert.equal(changed.DocumentId, first.DocumentId);
    assert.equal(changed.Revision, 2);
    assert.notEqual((await Core.identify(snapshot(), null)).DocumentId, first.DocumentId);
});
test('PDF round trip retains the page contents, links and geometry and writes readable metadata', async () => {
    const source = await lib.PDFDocument.create();
    const page = source.addPage([595, 842]);
    page.drawText('Invoice INV-001 - Total INR 100');
    page.node.set(lib.PDFName.of('Annots'), source.context.obj([
        source.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [10, 10, 80, 25], A: { S: 'URI', URI: lib.PDFString.of('https://ray2voltsolar.com') } })
    ]));
    const sourceBytes = await source.save();
    const pdf = await lib.PDFDocument.load(sourceBytes, { updateMetadata: false });
    const before = streams(pdf);
    const metadata = await Core.identify(snapshot({ RfqHeading: 'A & B <solar> "2026" తెలుగు' }), null);
    Core.write(pdf, metadata, lib);
    const output = await pdf.save();
    const reopened = await lib.PDFDocument.load(output, { updateMetadata: false });
    assert.deepEqual(streams(reopened), before);
    assert.deepEqual(reopened.getPage(0).getSize(), { width: 595, height: 842 });
    assert.equal(reopened.getPage(0).node.Annots().size(), 1);
    assert.equal(reopened.getAuthor(), 'Ray2Volt Solar');
    assert.match(reopened.getSubject(), new RegExp(metadata.ExportId));
    const info = reopened.context.lookup(reopened.context.trailerInfo.Info);
    assert.equal(info.get(lib.PDFName.of('R2V_ExportId')).decodeText(), metadata.ExportId);
    assert.equal(info.get(lib.PDFName.of('R2V_RfqHeading')).decodeText(), metadata.RfqHeading);
    const xmp = Buffer.from(reopened.catalog.lookup(lib.PDFName.of('Metadata')).getContents()).toString('utf8');
    assert.match(xmp, /A &amp; B &lt;solar&gt; &quot;2026&quot; తెలుగు/);
    assert.ok(xmp.includes(`<r2v:DocumentId>${metadata.DocumentId}</r2v:DocumentId>`));
    assert.notEqual(await Core.hash(sourceBytes), await Core.hash(output));
});
test('signed PDFs are rejected and source authorship is retained in letterhead metadata', async () => {
    const pdf = await lib.PDFDocument.create(); pdf.addPage();
    pdf.setAuthor('Original Author'); pdf.setTitle('Original Title');
    const metadata = await Core.identify(snapshot(), null);
    Core.write(pdf, metadata, lib, { preserveSource: true });
    assert.equal(metadata.SourceAuthor, 'Original Author');
    assert.equal(metadata.SourceTitle, 'Original Title');
    pdf.context.register(pdf.context.obj({ FT: 'Sig' }));
    assert.throws(() => Core.write(pdf, metadata, lib), /signature/);
});
test('optional footer adds text without adding pages', async () => {
    const pdf = await lib.PDFDocument.create(); pdf.addPage([595, 842]);
    await Core.addFooter(pdf, await Core.identify(snapshot(), null), lib);
    assert.equal(pdf.getPageCount(), 1);
    assert.ok(streams(await lib.PDFDocument.load(await pdf.save())).some(stream => stream.length > 50));
});
test('all 14 PDF tools load the shared UI and CSS, with an explicit field allowlist', () => {
    assert.equal(Object.keys(Fields.tools).length, 14);
    for (const tool of Object.keys(Fields.tools)) {
        const html = fs.readFileSync(path.join(root, 'tools', tool, `${tool}.html`), 'utf8');
        assert.ok(html.includes(`data-tool="${tool}"`), tool);
        assert.match(html, /pdf-metadata-core\.js/);
        assert.match(html, /pdf-metadata-fields\.js/);
        assert.match(html, /pdf-metadata\.css/);
    }
    const requested = [];
    const fakeDocument = { getElementById(id) { requested.push(id); return { value: 'example', textContent: 'example' }; }, querySelectorAll() { return []; } };
    Fields.collect('payslip-generator', fakeDocument);
    Fields.collect('margin-breakdown', fakeDocument);
    assert.ok(!requested.some(id => /bank|pan|salary|margin$|notes/i.test(id)));
});
