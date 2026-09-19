/**
 * Commercial financial decks — the guard.
 *
 * The decks are generated, not hand-written, so the thing worth testing is the
 * generator: that the assumptions are coherent, that the post-tax cash flow is
 * internally consistent (see the warning block in model.js), and that every
 * capacity is actually listed in the Resource Library and actually on disk.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const deckRoot = path.join(repoRoot, 'scripts', 'financial-decks');

const Assumptions = require(path.join(deckRoot, 'assumptions.js'));
const Model = require(path.join(deckRoot, 'model.js'));
const Build = require(path.join(deckRoot, 'build.js'));
const Compendium = require(path.join(deckRoot, 'compendium-template.js'));
const Template = require(path.join(deckRoot, 'deck-template.js'));
const catalogue = require(path.join(repoRoot, 'tools', 'resource-library', 'resource-library-catalogue.js'));

const A = Assumptions.ASSUMPTIONS;

// --- The assumptions are coherent ----------------------------------------
assert.deepEqual(Assumptions.problems(), [], 'the shipped assumptions must have no problems');

// The validator has to actually bite, or the assertion above is empty.
const band = Assumptions.PRICE_BANDS[1];
const held = band.rupeesPerWp;
band.rupeesPerWp = 1;                       // makes 150 kW cost less than 100 kW
assert.ok(
    Assumptions.problems().some(problem => /costs no more in total than/.test(problem)),
    'a price band that makes a bigger plant cheaper overall is a problem'
);
band.rupeesPerWp = held;
assert.deepEqual(Assumptions.problems(), [], 'the assumptions must be restored');

// --- The supply boundary is where APERC put it ---------------------------
assert.equal(Assumptions.tariffFor(150), Assumptions.TARIFFS.lt, '150 kW is still LT');
assert.equal(Assumptions.tariffFor(200), Assumptions.TARIFFS.ht, '200 kW is HT');

// --- The cash flow says what model.js promises it says --------------------
const deck = Model.deckFor(250);
const taxRate = A.taxRatePercent / 100;

assert.ok(
    Math.abs(deck.capex * (1 + A.gstPercent / 100) - deck.priceInclGst) < 1,
    'capex is the price with GST taken out, because the ITC is claimed'
);

assert.ok(
    Math.abs(deck.rows[0].depreciation - deck.capex * 0.4) < 1,
    'year one depreciation is 40% of the ex-GST capex'
);

const totalDepreciation = deck.rows.reduce((total, row) => total + row.depreciation, 0);
assert.ok(totalDepreciation < deck.capex, 'a WDV block never fully writes off');

deck.rows.forEach(row => {
    assert.ok(
        Math.abs(row.taxableProfit - (row.grossSavings - row.amc - row.depreciation)) < 2,
        `year ${row.year}: taxable profit is savings less AMC less depreciation`
    );
    assert.ok(
        Math.abs(row.tax - row.taxableProfit * taxRate) < 2,
        `year ${row.year}: tax is charged on that profit, at one rate`
    );
    assert.ok(
        Math.abs(row.netCashFlow - (row.grossSavings - row.amc - row.tax)) < 2,
        `year ${row.year}: the savings are taxed, not just sheltered`
    );
});

assert.ok(deck.rows[0].tax < 0, 'in year one depreciation exceeds savings, so tax is an inflow');
assert.ok(deck.rows[A.projectionYears - 1].tax > 0, 'by the final year the savings are taxed');
assert.equal(deck.rows[0].amc, 0, 'year one maintenance is covered by the build');

// --- Payback lands where the cumulative column crosses --------------------
const crossing = deck.rows.find(row => row.cumulative >= deck.capex);
assert.ok(crossing, 'the plant pays back inside the projection');
assert.ok(
    deck.payback > crossing.year - 1 && deck.payback <= crossing.year,
    'payback is interpolated inside the year the cumulative column crosses'
);
assert.ok(deck.discountedPayback > deck.payback, 'discounting can only lengthen payback');

// --- Every deck is sane, on disk, and in the catalogue -------------------
const listed = catalogue.RESOURCES.filter(resource => resource.category === 'Financial decks');
assert.equal(
    listed.length,
    Assumptions.CAPACITIES_KW.length + 1,
    'the catalogue lists one entry per capacity, plus the combined set'
);

let previousTotal = 0;

Assumptions.CAPACITIES_KW.forEach(capacityKw => {
    const built = Model.deckFor(capacityKw);

    assert.ok(built.irr > 5 && built.irr < 60, `${capacityKw} kW: IRR is a plausible percentage`);
    assert.ok(built.npv > 0, `${capacityKw} kW: NPV is positive`);
    assert.ok(built.lcoe > 0 && built.lcoe < built.tariff.rateRupeesPerKwh,
        `${capacityKw} kW: solar undercuts the tariff it is compared against`);

    assert.ok(built.priceInclGst > previousTotal, `${capacityKw} kW costs more in total than the size below`);
    previousTotal = built.priceInclGst;

    const expectedPath = `downloads/financial-decks/${Build.slugFor(capacityKw)}.pdf`;
    const entry = listed.find(resource => resource.path === expectedPath);
    assert.ok(entry, `${capacityKw} kW is missing from the Resource Library`);
    assert.equal(entry.title, `${capacityKw} kWp commercial financial analysis`);
    assert.ok(
        fs.existsSync(path.join(repoRoot, expectedPath)),
        `${expectedPath} is listed but not built — run node scripts/financial-decks/build.js`
    );
});

// --- The combined set -----------------------------------------------------
// One document holding all nineteen decks behind a cover and a ladder. Two
// things can silently go wrong with it and neither shows up in the PDF until
// someone turns to a page that is not what the ladder promised: the footers
// can be numbered from the wrong offset, and the ladder's page column can
// drift from the order the decks are actually laid out in. Both are checked
// against the rendered HTML rather than against the arithmetic that produced
// it, so the check is of the document a reader gets.
const combinedPath = `downloads/financial-decks/${Build.compendiumSlug()}.pdf`;
const combinedEntry = listed.find(resource => resource.path === combinedPath);
assert.ok(combinedEntry, 'the combined set is missing from the Resource Library');
assert.ok(
    fs.existsSync(path.join(repoRoot, combinedPath)),
    `${combinedPath} is listed but not built \u2014 run node scripts/financial-decks/build.js`
);

const allDecks = Assumptions.CAPACITIES_KW.map(capacityKw => Model.deckFor(capacityKw));
const totalPages = Compendium.totalPages(allDecks.length);
const combinedHtml = Compendium.render(allDecks, '1 January 2026', 'deck.css');

assert.equal(
    totalPages,
    Compendium.FRONT_PAGES + allDecks.length * Compendium.PAGES_PER_DECK,
    'the page count is the cover and ladder plus three pages per deck'
);

// Every page carries a footer, numbered 1..total against the same total.
const stamps = [...combinedHtml.matchAll(/Page (\d+) of (\d+)</g)];
assert.equal(stamps.length, totalPages, 'every page carries a numbered footer');
stamps.forEach((stamp, index) => {
    assert.equal(Number(stamp[1]), index + 1, `page ${index + 1} is numbered in order`);
    assert.equal(Number(stamp[2]), totalPages, `page ${index + 1} counts against the whole document`);
});

// The ladder's last column sends a reader to a page. That page must be the
// first page of that capacity's deck \u2014 which is what the capacity stamp
// in its header says.
const renderedPages = combinedHtml.split('<div class="quote-page').slice(1);
assert.equal(renderedPages.length, totalPages, 'the document splits into that many pages');

const ladderTargets = [...combinedHtml.matchAll(/<td class="fd-ladder-page">(\d+)<\/td>/g)]
    .map(match => Number(match[1]));
assert.equal(ladderTargets.length, allDecks.length, 'the ladder lists every capacity');

allDecks.forEach((built, index) => {
    const target = ladderTargets[index];
    assert.equal(
        target,
        Compendium.FRONT_PAGES + index * Compendium.PAGES_PER_DECK + 1,
        `${built.capacityKw} kW: the ladder points at the start of its three pages`
    );
    assert.match(
        renderedPages[target - 1],
        new RegExp(`<div class="fd-stamp-value">${built.capacityKw} kWp</div>`),
        `${built.capacityKw} kW: page ${target} is that capacity's deck, as the ladder promised`
    );
});

// A standalone deck still numbers itself 1..3 of 3. The compendium renumbers
// by passing a `numbering` function, so leaving it out must change nothing.
const standalone = Template.render(Model.deckFor(250), '1 January 2026', 'deck.css');
assert.equal(
    [...standalone.matchAll(/Page (\d+) of 3</g)].map(match => match[1]).join(''),
    '123',
    'a standalone deck is still three pages, numbered 1 to 3'
);

console.log('financial deck tests passed');
