/**
 * Commercial Financial Deck — the combined set.
 *
 * One document holding all nineteen decks, for the salesperson who wants the
 * whole ladder on a laptop before a meeting rather than nineteen downloads.
 *
 * It is built by rendering the decks' own pages into a single file and
 * printing that once, NOT by merging nineteen PDFs. Two reasons: there is no
 * PDF library here and adding one for this would be the first npm dependency
 * in a static site, and a merge would produce fifty-seven pages with no way
 * in. Rendered as one document it gets a cover and, on page 2, the ladder —
 * every capacity's price, payback, IRR and levelised cost on one page, which
 * is the thing nineteen separate PDFs cannot show you.
 *
 * The decks themselves are byte-for-byte the pages of the standalone PDFs,
 * with one difference: their footers are renumbered continuously, so page 5
 * of this document says so rather than saying "Page 2 of 3".
 */
'use strict';

const Assumptions = require('./assumptions.js');
const Model = require('./model.js');
const Template = require('./deck-template.js');

const A = Assumptions.ASSUMPTIONS;
const { esc, money, num, years, percent } = Template;

/** Cover, then the ladder. The decks start on page 3. */
const FRONT_PAGES = 2;
const PAGES_PER_DECK = 3;

function totalPages(deckCount) {
    return FRONT_PAGES + deckCount * PAGES_PER_DECK;
}

/* --- Page furniture ----------------------------------------------------- */

function frontFooter(buildDate, pageNumber, total) {
    return `<div class="qp-page-footer">
        <span><strong>Ray2Volt Solar Private Limited</strong> · Indicative analysis, not a quotation</span>
        <span>Rates current as at ${esc(buildDate)} · Page ${pageNumber} of ${total}</span>
    </div>`;
}

/* --- Page 1: the cover -------------------------------------------------- */

function coverPage(decks, buildDate, total) {
    const first = decks[0];
    const last = decks[decks.length - 1];

    // The two ends of the ladder, which is what a reader wants off the cover.
    const spread = [
        [`${num(first.capacityKw)} kWp`, `₹${first.rupeesPerWp.toFixed(2)} / Wp`, years(first.payback)],
        [`${num(last.capacityKw)} kWp`, `₹${last.rupeesPerWp.toFixed(2)} / Wp`, years(last.payback)]
    ];

    const spreadCards = spread.map(([capacity, rate, payback]) => `<div class="fd-cover-card">
        <div class="fd-cover-card-capacity">${esc(capacity)}</div>
        <dl>
            <div><dt>Price</dt><dd>${esc(rate)}</dd></div>
            <div><dt>Payback</dt><dd>${esc(payback)}</dd></div>
        </dl>
    </div>`).join('');

    return `<div class="quote-page fd-cover">
        <div class="fd-cover-rule"></div>

        <div class="fd-cover-head">
            <span class="fd-cover-eyebrow">Ray2Volt Solar Private Limited</span>
            <h1>Commercial Solar<br>Financial Analysis</h1>
            <p class="fd-cover-lead">The complete set — ${num(first.capacityKw)} kWp to
                ${num(last.capacityKw)} kWp on APSPDCL commercial tariffs.</p>
        </div>

        <div class="fd-cover-facts">
            <div><strong>${decks.length}</strong><span>Standard plant sizes</span></div>
            <div><strong>${total}</strong><span>Pages of analysis</span></div>
            <div><strong>${A.projectionYears} yrs</strong><span>Post-tax projection each</span></div>
        </div>

        <div class="fd-cover-spread">${spreadCards}</div>

        <div class="fd-cover-body">
            <h2>What is in here</h2>
            <p>Every capacity gets the same three pages: <strong>returns, plant and the
            depreciation schedule</strong>; then the <strong>${A.projectionYears}-year post-tax cash
            flow</strong>, year by year; then the <strong>return metrics and the full list of
            assumptions</strong> the figures rest on. Page 2 puts all ${decks.length} side by side,
            so the nearest size to a customer's load is one glance away.</p>

            <h2>How to use it</h2>
            <p>Find the capacity on page 2, turn to its three pages, and read the assumptions page
            before you quote anything from it. These are <strong>standard plants at list pricing</strong>,
            built to show a buyer the shape of the return — not a site-specific proposal. For that,
            run the site through the Quote Generator.</p>

            <div class="fd-cover-warning">
                <h3>This is not a quotation</h3>
                <p>Pricing is subject to a site survey, roof condition, structure height, cable
                routing, evacuation distance and the sanction APSPDCL actually grants. Tariffs, the
                depreciation block and the corporate tax rate are as we understand them at the date
                below and are subject to change by APERC and by the Finance Act. Nothing here is tax
                advice — the buyer's chartered accountant confirms the tax position before anyone
                relies on it.</p>
            </div>
        </div>

        ${frontFooter(buildDate, 1, total)}
    </div>`;
}

/* --- Page 2: the ladder ------------------------------------------------- */

function ladderPage(decks, buildDate, total) {
    // A section row where the supply category changes, rather than a column
    // repeating the same word nineteen times. It costs no width and it marks
    // the one boundary that changes the tariff under the whole table.
    let lastCategory = null;

    const rows = decks.map((deck, index) => {
        const startPage = FRONT_PAGES + index * PAGES_PER_DECK + 1;

        let sectionRow = '';
        if (deck.tariff.category !== lastCategory) {
            lastCategory = deck.tariff.category;
            const kind = deck.capacityKw <= Assumptions.LT_MAX_KW
                ? 'LT supply'
                : 'HT supply at 11 kV';
            sectionRow = `<tr class="fd-ladder-section"><td colspan="10">${esc(deck.tariff.category)}
                &middot; ${esc(kind)} &middot; ₹${deck.tariff.rateRupeesPerKwh.toFixed(2)} per unit</td></tr>`;
        }

        return sectionRow + `<tr>
            <td class="fd-ladder-capacity">${num(deck.capacityKw)} kWp</td>
            <td>${deck.rupeesPerWp.toFixed(2)}</td>
            <td>${money(deck.priceInclGst)}</td>
            <td>${money(deck.capex)}</td>
            <td>${num(deck.year1GenerationKwh)}</td>
            <td>${money(deck.year1GrossSavings)}</td>
            <td class="fd-ladder-strong">${years(deck.payback)}</td>
            <td class="fd-ladder-strong">${percent(deck.irr)}</td>
            <td>${deck.lcoe.toFixed(2)}</td>
            <td class="fd-ladder-page">${startPage}</td>
        </tr>`;
    }).join('');

    return `<div class="quote-page">
        <div class="qp-header">
            <div class="qp-title-section">
                <h1>Commercial Solar — Financial Analysis</h1>
                <p class="qp-subtitle">Every capacity on one page</p>
            </div>
            <div class="fd-capacity-stamp">
                <div class="fd-stamp-value">${num(decks[0].capacityKw)}–${num(decks[decks.length - 1].capacityKw)}</div>
                <span class="fd-stamp-label">kWp</span>
            </div>
        </div>

        <div class="fd-note">
            <strong>Reading the ladder.</strong> Price per watt-peak falls as capacity rises, so the
            larger plants pay back faster on the same tariff — and the step down from the LT tariff to
            the HT tariff at ${num(Assumptions.LT_MAX_KW)} kW cuts the value of every unit generated,
            which is why payback lengthens across that boundary before improving again. Levelised cost
            is what a unit from the plant costs over ${A.projectionYears} years, against the grid rate
            in the section heading above it. The last column is where that plant's three pages begin.
        </div>

        <table class="fd-table fd-table-ladder">
            <thead><tr>
                <th>Capacity</th>
                <th>₹ / Wp<br><span>incl. GST</span></th>
                <th>Price<br><span>incl. GST</span></th>
                <th>Net capex<br><span>after ITC</span></th>
                <th>Year 1<br><span>units (kWh)</span></th>
                <th>Year 1<br><span>gross saving</span></th>
                <th>Payback<br><span>post-tax</span></th>
                <th>IRR<br><span>unlevered</span></th>
                <th>₹ / kWh<br><span>levelised</span></th>
                <th>Page</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>

        <div class="fd-note" style="margin-bottom:0">
            <strong>What these figures exclude.</strong> Demand and fixed charges, which solar does not
            reduce. Financing, so every return is unlevered — the return on the money, before any loan.
            Inverter replacement, which a real thirty-year plant will need once. Each deck's third page
            lists the assumptions in full, and they are the same for all ${decks.length}.
        </div>

        ${frontFooter(buildDate, 2, total)}
    </div>`;
}

/* --- Document ----------------------------------------------------------- */

/**
 * The whole set as one HTML document.
 *
 * `decks` are model results in the order they should appear. Page numbers are
 * derived from that order, so the ladder's page column and the footers cannot
 * disagree with each other.
 */
function render(decks, buildDate, cssHref) {
    const total = totalPages(decks.length);

    const deckPages = decks.map((deck, index) => {
        const startPage = FRONT_PAGES + index * PAGES_PER_DECK;
        const numbering = pageInDeck => `Page ${startPage + pageInDeck} of ${total}`;
        return Template.pages(deck, buildDate, numbering).join('\n');
    }).join('\n');

    return Template.documentShell(
        `Ray2Volt — Commercial solar financial analysis, ${num(decks[0].capacityKw)}`
        + `–${num(decks[decks.length - 1].capacityKw)} kWp`,
        cssHref,
        [coverPage(decks, buildDate, total), ladderPage(decks, buildDate, total), deckPages].join('\n')
    );
}

/** Built here rather than by the caller, so the order is the file's own. */
function decksForAll() {
    return Assumptions.CAPACITIES_KW.map(capacityKw => Model.deckFor(capacityKw));
}

module.exports = { render, decksForAll, totalPages, FRONT_PAGES, PAGES_PER_DECK };
