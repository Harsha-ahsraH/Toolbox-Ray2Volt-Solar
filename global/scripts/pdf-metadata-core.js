/* Metadata identity and PDF writer, shared by the static browser workflow and tests. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Ray2VoltPdfMetadata = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';
    const NS = 'https://ray2voltsolar.com/ns/pdf/1.0/';
    const VERSION = '2026-09-29.1';
    const xml = value => String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]))
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
    async function hash(bytes) {
        const input = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
        return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', input)), b => b.toString(16).padStart(2, '0')).join('');
    }
    async function identify(snapshot, previous, options = {}) {
        const fingerprint = await hash(snapshot.content + JSON.stringify(snapshot.fields));
        const same = previous && previous.ContentFingerprint === fingerprint;
        return {
            ...snapshot.fields,
            DocumentId: previous?.DocumentId || options.documentId || globalThis.crypto.randomUUID(),
            Revision: previous ? previous.Revision + (same ? 0 : 1) : 1,
            ExportId: globalThis.crypto.randomUUID(),
            GeneratedAt: options.now || new Date().toISOString(),
            ContentFingerprint: fingerprint,
            MetadataSchemaVersion: '1', TemplateVersion: VERSION,
            ...options.actor
        };
    }
    function assertEditable(pdf, lib) {
        if (pdf.isEncrypted) throw new Error('Password-protected PDFs cannot be stamped. Use an unencrypted PDF.');
        const seen = new Set();
        function inspect(object) {
            if (!object || seen.has(object)) return;
            seen.add(object);
            if (object instanceof lib.PDFDict) {
                if (object.has(lib.PDFName.of('ByteRange')) || String(object.get(lib.PDFName.of('FT'))) === '/Sig') {
                    throw new Error('This PDF contains a signature. Select the unsigned original so its signature is not invalidated.');
                }
                for (const key of object.keys()) inspect(object.get(key));
            } else if (object instanceof lib.PDFArray) {
                object.asArray().forEach(inspect);
            }
        }
        for (const [, object] of pdf.context.enumerateIndirectObjects()) inspect(object);
    }
    function write(pdf, metadata, lib, options = {}) {
        assertEditable(pdf, lib);
        const title = `${metadata.DocumentType} - ${metadata.DocumentNumber || metadata.DocumentId}`;
        const subject = `${metadata.DocumentType}; revision ${metadata.Revision}; export ${metadata.ExportId}`;
        const now = new Date(metadata.GeneratedAt);
        const creator = 'Ray2Volt Solar Toolbox';
        const producer = 'pdf-lib 1.17.1 / Ray2Volt metadata';
        // Letterheadify preserves the original descriptive authorship in the document record.
        if (options.preserveSource) {
            metadata.SourceTitle = pdf.getTitle() || '';
            metadata.SourceAuthor = pdf.getAuthor() || '';
            metadata.SourceCreator = pdf.getCreator() || '';
            metadata.SourceCreatedAt = pdf.getCreationDate()?.toISOString() || '';
        }
        pdf.setTitle(title);
        pdf.setAuthor('Ray2Volt Solar');
        pdf.setSubject(subject);
        pdf.setCreator(creator);
        pdf.setProducer(producer);
        pdf.setKeywords([metadata.ToolId, metadata.DocumentNumber || metadata.DocumentId, metadata.ExportId]);
        pdf.setCreationDate(now);
        pdf.setModificationDate(now);
        // Mirror custom fields into Info for inspectors that do not expose XMP.
        const info = pdf.context.lookup(pdf.context.trailerInfo.Info, lib.PDFDict);
        for (const key of Array.from(info.keys())) if (key.decodeText().startsWith('R2V_')) info.delete(key);
        for (const [key, value] of Object.entries(metadata)) {
            if (!/^[A-Za-z][A-Za-z0-9]*$/.test(key)) throw new Error('Invalid metadata field name.');
            info.set(lib.PDFName.of(`R2V_${key}`), lib.PDFHexString.fromText(typeof value === 'object' ? JSON.stringify(value) : String(value)));
        }
        const properties = Object.entries(metadata).map(([key, value]) =>
            `<r2v:${key}>${xml(typeof value === 'object' ? JSON.stringify(value) : value)}</r2v:${key}>`).join('');
        const packet = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:r2v="${NS}" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xml(title)}</rdf:li></rdf:Alt></dc:title>
<dc:creator><rdf:Seq><rdf:li>Ray2Volt Solar</rdf:li></rdf:Seq></dc:creator>
<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${xml(subject)}</rdf:li></rdf:Alt></dc:description>
<xmp:CreatorTool>${creator}</xmp:CreatorTool><pdf:Producer>${producer}</pdf:Producer>
<xmp:CreateDate>${xml(metadata.GeneratedAt)}</xmp:CreateDate><xmp:ModifyDate>${xml(metadata.GeneratedAt)}</xmp:ModifyDate>
${properties}</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
        pdf.catalog.set(lib.PDFName.of('Metadata'), pdf.context.register(pdf.context.stream(new TextEncoder().encode(packet), { Type: 'Metadata', Subtype: 'XML' })));
        return metadata;
    }
    async function addFooter(pdf, metadata, lib) {
        const font = await pdf.embedFont(lib.StandardFonts.Helvetica);
        // UUIDs only: compatible with the built-in font regardless of customer language.
        const text = `R2V ${metadata.DocumentId} | Rev ${metadata.Revision} | Export ${metadata.ExportId}`;
        for (const page of pdf.getPages()) {
            const box = page.getCropBox();
            const size = Math.min(6, (box.width - 24) / font.widthOfTextAtSize(text, 1));
            page.drawText(text, { x: box.x + 12, y: box.y + 8, size, font, color: lib.rgb(0.25, 0.25, 0.25) });
        }
    }
    return { NS, VERSION, hash, identify, assertEditable, write, addFooter };
});
