const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const salesSop = fs.readFileSync(
    path.join(repoRoot, 'tools', 'sales-sop', 'sales-sop.html'),
    'utf8'
);
const prices = fs.readFileSync(
    path.join(repoRoot, 'tools', 'package-prices', 'package-prices.html'),
    'utf8'
);
const solarReturns = require(path.join(repoRoot, 'global', 'scripts', 'solar-returns.js'));

assert.match(salesSop, /Solar Sales SOP/, 'Sales SOP title should be present');

// --- Two playbooks on one page -----------------------------------------------
// Residential and C&I are separate tabs. Each tab must point at a panel that
// exists, or the page opens on a blank screen.
const tabPanels = [...salesSop.matchAll(/class="sop-tab[^"]*"[^>]*data-panel="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(tabPanels, ['panel-residential', 'panel-ci'], 'Sales SOP should expose both playbook tabs in order');
for (const panelId of tabPanels) {
    assert.match(salesSop, new RegExp('class="sop-panel"[^>]*id="' + panelId + '"'), 'Sales SOP should define ' + panelId);
}
// Exactly one panel starts visible; the other waits for its tab to be picked.
assert.equal(
    (salesSop.match(/class="sop-panel"[^>]*hidden/g) || []).length,
    1,
    'Exactly one playbook panel should start hidden'
);

// --- Residential playbook ----------------------------------------------------
assert.match(salesSop, /On-Grid Schematic Diagram\.png/, 'Sales SOP should use the global on-grid schematic');
assert.match(salesSop, /Hybrid Solar Schemartic Diagram\.png/, 'Sales SOP should use the global hybrid schematic');
assert.match(salesSop, /PM Surya Ghar Muft Bijli Yojana/, 'Sales SOP should include subsidy guidance');
assert.match(salesSop, /Easy Solar Loan Option/, 'Sales SOP should include loan guidance');
assert.match(salesSop, /Project Timeline/, 'Sales SOP should include the project timeline');

// Returns guidance — the figures here are asserted against the model in
// tests/solar-returns.test.js, so the two cannot drift apart silently.
assert.match(salesSop, /Returns: ROI &amp; IRR/, 'Sales SOP should explain ROI and IRR');
assert.match(salesSop, /23–32%/, 'Sales SOP should quote the IRR range');
// ROI is quoted as a percentage, the same unit the calculator prints, so a
// salesperson can read the tile and the report without converting.
assert.match(salesSop, /700–1,000%/, 'Sales SOP should quote the ROI range');
assert.match(salesSop, /before any loan/, 'Sales SOP should say the returns exclude financing');

// --- C&I playbook ------------------------------------------------------------
// The C&I tab exists to answer the three questions a commercial buyer always
// asks: what does it return, how is it metered, and what is on my roof.
assert.match(salesSop, /Commercial &amp; Industrial/, 'Sales SOP should label the C&I tab');
assert.match(salesSop, /Returns: The C&amp;I Case/, 'C&I playbook should make the returns case');
assert.match(salesSop, /Net Metering: Sizing, Approval &amp; Settlement/, 'C&I playbook should cover net metering');
assert.match(salesSop, /The Technology That Decides The Quote/, 'C&I playbook should cover the technology');
assert.match(salesSop, /commercial-ongrid-architecture\.png/, 'C&I playbook should use the commercial on-grid architecture');
assert.match(salesSop, /commercial-hybrid-architecture\.png/, 'C&I playbook should use the commercial hybrid architecture');

// Gross metering is explained but not sold: Ray2Volt builds net-metered plants,
// and a salesperson still has to answer the question when a customer raises it.
assert.match(salesSop, /Gross Metering/, 'C&I playbook should explain gross metering');
assert.match(salesSop, /Only where the DISCOM mandates it/, 'C&I playbook should say gross metering is not the offer');

// The three levers that make a commercial roof pay back faster than a home.
assert.match(salesSop, /input credit/, 'C&I playbook should explain the GST input credit');
assert.match(salesSop, /Section 32/, 'C&I playbook should explain accelerated depreciation');
assert.match(salesSop, /sanctioned load/, 'C&I playbook should cap capacity at sanctioned load');

// PM Surya Ghar is residential-only. The C&I tab has to say so out loud, because
// a commercial customer expecting a subsidy is a customer lost at signing.
assert.match(
    salesSop,
    /PM Surya Ghar does not apply to a commercial connection/,
    'C&I playbook should rule out the subsidy'
);

// --- C&I worked example ------------------------------------------------------
// The example is the toolbox's own 20 kWp commercial package run through the
// shared returns model. Recomputing it here stops the page drifting away from
// either the price list or the model.
const CI_PRICE = 956000;        // 20 kWp commercial on-grid, GST inclusive
const CI_GST_RATE = 0.138;      // 70% goods at 12% + 30% service at 18%
const CI_UNITS_YEAR_ONE = 20 * 120 * 12;
const CI_DEGRADATION = 0.005;
const CI_ESCALATION = 0.03;
const CI_MAINTENANCE = 8000;

const ciBase = CI_PRICE / (1 + CI_GST_RATE);
const ciCredit = CI_PRICE - ciBase;
assert.equal(Math.round(ciBase), 840070, 'Cash cost after input credit should match the quoted figure');
assert.equal(Math.round(ciCredit), 115930, 'Input credit should match the quoted figure');
assert.equal(CI_UNITS_YEAR_ONE, 28800, 'Year-one generation should match the quoted figure');
assert.equal(CI_UNITS_YEAR_ONE * 8.5, 244800, 'Year-one saving at the quoted tariff should match the page');

for (const figure of ['9,56,000', '1,15,930', '8,40,070', '2,44,800', '28,800 kWh']) {
    assert.match(salesSop, new RegExp(figure), 'C&I worked example should print ' + figure);
}

// The headline tiles quote a band, not a point. Both ends of the tariff range the
// page assumes must land inside that band, or the tiles promise something the
// model does not produce.
function ciReturns(tariff) {
    const flows = [];
    for (let year = 0; year < 25; year += 1) {
        const generated = CI_UNITS_YEAR_ONE * Math.pow(1 - CI_DEGRADATION, year);
        const escalated = Math.pow(1 + CI_ESCALATION, year);
        flows.push(generated * tariff * escalated - CI_MAINTENANCE * escalated);
    }

    let recovered = 0;
    let payback = null;
    flows.forEach((saving, year) => {
        const before = recovered;
        recovered += saving;
        if (payback === null && recovered >= ciBase) payback = year + (ciBase - before) / saving;
    });

    return Object.assign({ payback }, solarReturns.projectReturns(ciBase, flows));
}

assert.match(salesSop, /27–36%/, 'C&I playbook should quote the IRR band');
assert.match(salesSop, /740–1,040%/, 'C&I playbook should quote the ROI band');
assert.match(salesSop, /Under 4 years/, 'C&I playbook should quote the payback band');

for (const tariff of [7.5, 10]) {
    const { irr, roi, payback } = ciReturns(tariff);
    assert.ok(irr >= 27 && irr <= 36, 'IRR at ' + tariff + '/kWh should sit inside the quoted 27-36% band, got ' + irr);
    assert.ok(roi >= 740 && roi <= 1040, 'ROI at ' + tariff + '/kWh should sit inside the quoted 740-1,040% band, got ' + roi);
    assert.ok(payback <= 4, 'Payback at ' + tariff + '/kWh should stay under the quoted four years, got ' + payback);
}

// A commercial roof has to out-return a home at both ends of the band, or the
// whole reason for a separate C&I playbook falls away.
function irrBand(html, section) {
    const [, low, high] = html.slice(html.indexOf(section)).match(/(\d+)–(\d+)%<\/strong><span>IRR/);
    return [Number(low), Number(high)];
}

const [residentialLow, residentialHigh] = irrBand(salesSop, 'Returns: ROI &amp; IRR');
const [commercialLow, commercialHigh] = irrBand(salesSop, 'Returns: The C&amp;I Case');
assert.ok(commercialLow > residentialLow, 'C&I IRR should start above the residential band');
assert.ok(commercialHigh > residentialHigh, 'C&I IRR should end above the residential band');

const pricingAccordions = prices.match(/<details class="pkg-accordion"/g) || [];
assert.equal(pricingAccordions.length, 4, 'Prices should expose four package accordions');

for (const currentPrice of ['1,73,600', '1,21,600', '4,34,000', '3,81,000']) {
    assert.match(prices, new RegExp(currentPrice), `Prices should retain toolbox value ${currentPrice}`);
}

const htmlFiles = [
    path.join(repoRoot, 'index.html'),
    ...fs.readdirSync(path.join(repoRoot, 'tools'), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(repoRoot, 'tools', entry.name, `${entry.name}.html`))
        .filter(file => fs.existsSync(file))
];

for (const htmlFile of htmlFiles) {
    const contents = fs.readFileSync(htmlFile, 'utf8');
    const pricesIndex = contents.indexOf('package-prices/package-prices.html');
    const sopIndex = contents.indexOf('sales-sop/sales-sop.html');
    assert.ok(pricesIndex >= 0, `${path.relative(repoRoot, htmlFile)} should link to Package Prices`);
    assert.ok(sopIndex > pricesIndex, `${path.relative(repoRoot, htmlFile)} should place Sales SOP after Package Prices`);
}

console.log('sales SOP and pricing tests passed');
