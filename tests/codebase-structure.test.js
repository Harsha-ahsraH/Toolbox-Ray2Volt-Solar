const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const toolsRoot = path.join(repoRoot, 'tools');
const toolNames = [
    'emi-calculator',
    'gst-calculator',
    'package-prices',
    'sales-sop',
    'receipt-generator',
    'invoice-generator',
    'proforma-invoice',
    'purchase-order',
    'payslip-generator',
    'warranty-card',
    'quote-generator',
    'request-for-quotation',
    'letterheadify'
];

for (const toolName of toolNames) {
    const toolRoot = path.join(toolsRoot, toolName);
    assert.ok(fs.statSync(toolRoot).isDirectory(), `${toolName} must have its own folder`);

    for (const extension of ['html', 'css', 'js']) {
        const implementationFile = path.join(toolRoot, `${toolName}.${extension}`);
        assert.ok(fs.existsSync(implementationFile), `Missing ${path.relative(repoRoot, implementationFile)}`);
    }
}

for (const sharedPath of [
    'global/styles/base.css',
    'global/styles/navigation.css',
    'global/styles/tool-responsive.css',
    'global/scripts/navigation.js',
    'global/scripts/tool-lock.js',
    'global/scripts/financial-document.js',
    'global/assets/logo.png',
    'global/assets/favicon.png'
]) {
    assert.ok(fs.existsSync(path.join(repoRoot, sharedPath)), `Missing shared file ${sharedPath}`);
}

function collectTextFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory() && ['.git', 'tmp', 'node_modules', 'Samples'].includes(entry.name)) return [];
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectTextFiles(absolutePath);
        return /\.(?:css|html|js|json|md)$/i.test(entry.name) ? [absolutePath] : [];
    });
}

for (const absolutePath of collectTextFiles(repoRoot)) {
    const relativePath = path.relative(repoRoot, absolutePath);
    const contents = fs.readFileSync(absolutePath, 'utf8');
    const lineCount = contents.split(/\r?\n/).length;
    assert.ok(lineCount <= 1000, `${relativePath} has ${lineCount} lines; maximum is 1000`);
}

console.log('codebase structure tests passed');
