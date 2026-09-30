const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadRegistry } = require('./helpers/registry');

const root = path.resolve(__dirname, '..');
const styleCss = fs.readdirSync(path.join(root, 'global', 'styles'))
  .filter(file => file.endsWith('.css'))
  .map(file => fs.readFileSync(path.join(root, 'global', 'styles', file), 'utf8'))
  .join('\n');

assert(
  styleCss.includes('Material+Symbols+Rounded'),
  'style.css should load Material Symbols Rounded for Material 3 icons'
);

assert(
  /main-nav \.nav-link::before,[\s\S]*\.tool-card h3::before[\s\S]*font-family:\s*'Material Symbols Rounded'/.test(styleCss),
  'nav links and dashboard card titles should share Material Symbols icon styling'
);

assert(
  /\.main-nav \.nav-link\s*{[\s\S]*display:\s*flex/.test(styleCss),
  'sidebar nav links should use a flex row for icon + label'
);

assert(
  /\.tool-card h3\s*{[\s\S]*display:\s*flex/.test(styleCss),
  'dashboard card titles should place the icon inline with the title'
);

assert(
  !/\.tool-card::before/.test(styleCss),
  'dashboard cards should not use a separate card-level icon layout'
);

// Icons come from each registry entry: navigation.js writes it to data-icon and
// the stylesheet draws it with content: attr(data-icon).
assert(
  /\.main-nav \.nav-link::before,\s*\.tool-card h3::before\s*{[^}]*content:\s*attr\(data-icon\)/.test(styleCss),
  'nav links and card titles should draw the icon named in data-icon'
);

const navigationJs = fs.readFileSync(path.join(root, 'global', 'scripts', 'navigation.js'), 'utf8');
assert(/data-icon="\$\{/.test(navigationJs), 'navigation.js should write each tool\'s icon to data-icon');

const registry = loadRegistry();
for (const tool of [registry.dashboard, ...registry.list]) {
  assert(/^[a-z0-9_]+$/.test(tool.icon), `${tool.id} needs a Material Symbols ligature for its icon`);
}

console.log('Material icon UI smoke tests passed');
