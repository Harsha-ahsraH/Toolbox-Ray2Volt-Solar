const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const styleCss = fs.readdirSync(path.join(root, 'global', 'styles'))
  .filter(file => file.endsWith('.css'))
  .map(file => fs.readFileSync(path.join(root, 'global', 'styles', file), 'utf8'))
  .join('\n');

const toolPages = [
  'emi-calculator',
  'gst-calculator',
  'package-prices',
  'solar-savings',
  'receipt-generator',
  'invoice-generator',
  'proforma-invoice',
  'purchase-order',
  'payslip-generator',
  'warranty-card',
  'quote-generator',
  'comparison-sheet',
  'margin-breakdown',
  'request-for-quotation',
  'letterheadify',
  'resource-library',
];

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

assert(
  styleCss.includes('.main-nav .nav-link[href$="index.html"]::before'),
  'dashboard sidebar link should have an icon mapping'
);

for (const page of toolPages) {
  const selector = `href$="${page}.html"`;

  assert(
    styleCss.includes(`.main-nav .nav-link[${selector}]::before`),
    `${page} sidebar link should have a Material icon mapping`
  );

  assert(
    styleCss.includes(`.tool-card[${selector}] h3::before`),
    `${page} dashboard card title should have a Material icon mapping`
  );
}

console.log('Material icon UI smoke tests passed');
