const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot, loadRegistry, toolFolders } = require('./helpers/registry');

const toolsRoot = path.join(repoRoot, 'tools');
const registry = loadRegistry();

// The registry and the tools/ folders describe the same set of tools: a
// folder with no entry never reaches the sidebar, and an entry with no folder
// is a dead link. Only a tool hosted elsewhere (href) has no folder.
const localTools = registry.list.filter((tool) => !tool.href).map((tool) => tool.id).sort();
assert.deepEqual(localTools, toolFolders(), 'every tool folder needs a registry entry, and every entry a folder');

for (const tool of registry.list) {
    for (const field of ['id', 'label', 'icon', 'description', 'keywords']) {
        assert.equal(typeof tool[field], 'string', `${tool.id} needs a ${field}`);
        assert.ok(tool[field].trim(), `${tool.id} has an empty ${field}`);
    }
    assert.ok([0, 1, 2, 3].includes(tool.level), `${tool.id} needs a level from 0 to 3`);
    assert.match(tool.icon, /^[a-z0-9_]+$/, `${tool.id} icon must be a Material Symbols ligature`);
}

assert.equal(new Set(registry.list.map((tool) => tool.id)).size, registry.list.length, 'tool ids are unique');

// A tool is its page and its script; a stylesheet is optional because a tool
// built only from the shared components needs none.
for (const toolName of toolFolders()) {
    const toolRoot = path.join(toolsRoot, toolName);
    for (const extension of ['html', 'js']) {
        const implementationFile = path.join(toolRoot, `${toolName}.${extension}`);
        assert.ok(fs.existsSync(implementationFile), `Missing ${path.relative(repoRoot, implementationFile)}`);
    }
}

for (const sharedPath of [
    'global/styles/base.css',
    'global/styles/navigation.css',
    'global/styles/components.css',
    'global/styles/responsive.css',
    'global/styles/financial-document.css',
    'global/scripts/tools.js',
    'global/scripts/navigation.js',
    'global/scripts/auth.js',
    'global/scripts/theme.js',
    'global/scripts/financial-document.js',
    'global/assets/logo.png',
    'global/assets/favicon.png',
    'docs/design-system.md'
]) {
    assert.ok(fs.existsSync(path.join(repoRoot, sharedPath)), `Missing shared file ${sharedPath}`);
}

function collectTextFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        // `output` is the gitignored build product of scripts/financial-decks.
        // The line limit is a rule about code someone has to read; a generated
        // fifty-nine page document is not that, and it only stayed under the
        // limit until now because a three-page deck happens to fit.
        if (entry.isDirectory() && ['.git', 'tmp', 'output', 'node_modules', 'Samples'].includes(entry.name)) return [];
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
