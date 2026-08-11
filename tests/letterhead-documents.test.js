const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.join(repoRoot, 'tools', 'letterheadify');
const html = fs.readFileSync(path.join(toolRoot, 'letterheadify.html'), 'utf8');
const css = fs.readFileSync(path.join(toolRoot, 'letterheadify.css'), 'utf8');
const js = fs.readFileSync(path.join(toolRoot, 'letterheadify.js'), 'utf8');
const index = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const auth = fs.readFileSync(path.join(repoRoot, 'global', 'scripts', 'auth.js'), 'utf8');
const letterheadAsset = fs.readFileSync(path.join(toolRoot, 'assets', 'Letterhead (Latest) Ray2Volt Solar PNG.png'));

assert.match(html, /Letterheadify/);
assert.match(html, /pdf-lib@1\.17\.1\/dist\/pdf-lib\.min\.js/);
assert.match(html, /id="lhdPdfInput"/);
assert.match(html, /accept="application\/pdf"/);
assert.match(html, /id="lhdProcessBtn"/);
assert.match(html, /Add Letterhead &amp; Download/);
assert.match(html, /data-tool-id="letterhead-documents"/);
assert.match(html, /letterheadify\.css/);
assert.match(html, /letterheadify\.js/);
assert.doesNotMatch(html, /marked\.min\.js|Markdown Content|lhdMarkdownBody|Document Title|lhdDocumentDate/);

assert.match(css, /\.lhd-file-drop\s*\{/);
assert.match(css, /\.lhd-status\.success\s*\{/);
assert.match(css, /font-family:\s*'Google Sans Flex', 'Open Sans', 'Google Sans'/);
assert.doesNotMatch(css, /lhd-page-content|lhd-markdown-body|@page/);

assert.match(js, /Letterhead \(Latest\) Ray2Volt Solar PNG\.png/);
assert.match(js, /PDFDocument\.load\(pdfBytes, \{ ignoreEncryption: true \}\)/);
assert.match(js, /embedPng\(letterheadBytes\)/);
assert.match(js, /page\.drawImage\(letterhead/);
assert.match(js, /blendMode:\s*BlendMode\.Multiply/);
assert.match(js, /downloadPdf\(outputBytes, buildOutputName\(selectedFile\.name\)\)/);
assert.match(js, /password-protected or corrupted/);
assert.match(js, /function loadLetterheadBytes\(/);
assert.match(js, /function loadLetterheadViaImage\(/);
assert.match(js, /Could not load the letterhead image/);
assert.doesNotMatch(js, /fetchLetterhead/);
assert.doesNotMatch(js, /marked|parseMarkdown|lhdPreview|window\.print/);

assert.match(index, /tools\/letterheadify\/letterheadify\.html/);
assert.match(auth, /'letterhead-documents':\s*1/);
assert.equal(
    crypto.createHash('sha256').update(letterheadAsset).digest('hex'),
    '7d4510724d5924ca426ca7254dd35d524de0cf27cea572f24b9480b93b7fe5cb'
);

console.log('letterhead-documents tests passed');
