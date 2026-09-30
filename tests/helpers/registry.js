// Loads global/scripts/tools.js the way a page would and returns the registry.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..', '..');

function loadRegistry() {
    const window = {};
    const document = { currentScript: { src: 'https://toolbox.test/global/scripts/tools.js' } };
    const source = fs.readFileSync(path.join(repoRoot, 'global', 'scripts', 'tools.js'), 'utf8');
    vm.runInNewContext(source, { window, document });
    const registry = window.Ray2VoltTools;
    // Copy into this realm so deepEqual doesn't trip over the sandbox's prototypes.
    return { ...registry, list: Array.from(registry.list, (tool) => ({ ...tool })), dashboard: { ...registry.dashboard } };
}

// Every tools/<id>/ folder that holds a tool page.
function toolFolders() {
    return fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => fs.existsSync(path.join(repoRoot, 'tools', name, `${name}.html`)))
        .sort();
}

module.exports = { repoRoot, loadRegistry, toolFolders };
