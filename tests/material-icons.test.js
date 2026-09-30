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

// The icon font is subset to the names in icon_names, so every icon the
// Toolbox draws must be listed there — otherwise it renders as its name.
const iconNames = (styleCss.match(/icon_names=([a-z0-9_,]+)/) || [])[1];
assert(iconNames, 'the Material Symbols import should be subset with icon_names');
const subset = iconNames.split(',');
assert.deepStrictEqual(subset, [...subset].sort(), 'Google Fonts needs icon_names in alphabetical order');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(html|js|css)$/.test(entry.name) ? [full] : [];
  });
}

const drawn = new Set([registry.dashboard, ...registry.list].map(tool => tool.icon));
for (const file of [...sourceFiles(path.join(root, 'global')), ...sourceFiles(path.join(root, 'tools'))]) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/material-symbols-rounded[^"']*["'][^>]*>\s*([a-z0-9_]+)\s*</g)) drawn.add(m[1]);
  // Icons swapped by script, e.g. icon.textContent = dark ? 'light_mode' : 'dark_mode'.
  for (const m of text.matchAll(/[iI]con\.textContent\s*=\s*([^;]+);/g)) {
    for (const q of m[1].matchAll(/'([a-z0-9_]+)'/g)) drawn.add(q[1]);
  }
  // Icons drawn by CSS: a content ligature in a rule set in the icon font.
  if (file.endsWith('.css')) {
    for (const rule of text.matchAll(/\{([^}]*)\}/g)) {
      for (const m of rule[1].matchAll(/content:\s*["']([a-z][a-z0-9_]+)["']/g)) drawn.add(m[1]);
    }
  }
}
for (const name of drawn) {
  assert(subset.includes(name), `icon "${name}" is drawn but missing from icon_names in base.css`);
}

console.log('Material icon UI smoke tests passed');
