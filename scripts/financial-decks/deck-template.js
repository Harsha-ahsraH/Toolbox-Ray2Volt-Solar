/**
 * Commercial Financial Deck — the document.
 *
 * Turns one model result into three pages of A4 HTML. Formatting lives here
 * and nowhere else; model.js holds no strings and this file holds no
 * arithmetic beyond laying figures out.
 *
 * Icons are inline Feather-style SVG (viewBox 0 0 24 24, stroke currentColor,
 * stroke-width 2), matching the printed Proposal. Material Symbols belong to
 * the toolbox UI, not to a document — do not mix them here.
 */
'use strict';

const Assumptions = require('./assumptions.js');

const A = Assumptions.ASSUMPTIONS;

/* --- Formatting --------------------------------------------------------- */

function esc(value) {
    return String(value).replace(/[&<>"']/g, char => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
    ));
}

/** Indian digit grouping, no decimals. */
function inr(value) {
    const negative = value < 0;
    const text = Math.round(Math.abs(value)).toLocaleString('en-IN');
    return negative ? `(${text})` : text;
}

/** Lakhs for headline figures, where seven digits are unreadable. */
function lakhs(value, digits = 2) {
    return `₹${(value / 100000).toFixed(digits)} L`;
}

/** Lakhs or crores, whichever reads better at this size. */
function money(value) {
    if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    return lakhs(value);
}

function num(value, digits = 0) {
    return Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function years(value) {
    return value === null ? '—' : `${value.toFixed(1)} yrs`;
}

function percent(value, digits = 1) {
    return Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—';
}

/* --- Icons -------------------------------------------------------------- */

const ICON = {
    plant: '<path d="M12 2v6m0 0 3-3m-3 3L9 5"/><rect x="3" y="10" width="18" height="11" rx="1"/><path d="M3 15h18M9 10v11M15 10v11"/>',
    rupee: '<path d="M6 3h12M6 8h12M16 3c0 5-4 5-6 5h-1l7 8"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16-2 0-3-1-3-3"/><path d="M4 21c4-5 8-8 13-9"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};

function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" `
        + `stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
}

/* --- Page furniture ----------------------------------------------------- */

function header(deck, subtitle) {
    return `<div class="qp-header">
        <div class="qp-title-section">
            <h1>Commercial Solar — Financial Analysis</h1>
            <p class="qp-subtitle">${esc(subtitle)}</p>
        </div>
        <div class="fd-capacity-stamp">
            <div class="fd-stamp-value">${num(deck.capacityKw)} kWp</div>
            <span class="fd-stamp-label">Plant capacity</span>
        </div>
    </div>`;
}

function footer(deck, pageNumber, buildDate) {
    return `<div class="qp-page-footer">
        <span><strong>Ray2Volt Solar Private Limited</strong> · Indicative analysis, not a quotation</span>
        <span>Rates current as at ${esc(buildDate)} · Page ${pageNumber} of 3</span>
    </div>`;
}

/* --- Page 1: metrics, plant, depreciation ------------------------------- */

function pageOne(deck, buildDate) {
    const tariffKind = deck.capacityKw <= Assumptions.LT_MAX_KW ? 'LT supply' : 'HT supply at 11 kV';

    const metrics = [
        {
            label: 'Payback',
            value: years(deck.payback),
            note: 'Post-tax, undiscounted',
            primary: true
        },
        {
            label: 'Project IRR',
            value: percent(deck.irr),
            note: `Unlevered, ${A.projectionYears} years`
        },
        {
            label: 'Cost of solar energy',
            value: `₹${deck.lcoe.toFixed(2)}`,
            note: `per kWh, against ₹${deck.tariff.rateRupeesPerKwh.toFixed(2)} from the grid`
        },
        {
            label: 'Net present value',
            value: money(deck.npv),
            note: `Discounted at ${A.discountRatePercent}%`
        }
    ];

    const metricCards = metrics.map(metric => `<div class="qp-metric-card${metric.primary ? ' qp-metric-primary' : ''}">
        <div class="qp-metric-label">${esc(metric.label)}</div>
        <div class="qp-metric-value">${esc(metric.value)}</div>
        <div class="qp-metric-note">${esc(metric.note)}</div>
    </div>`).join('');

    const plantRows = [
        ['Plant capacity', `${num(deck.capacityKw)} kWp`],
        ['Year 1 generation', `${num(deck.year1GenerationKwh)} kWh`],
        ['Specific yield', `${num(A.annualGenerationPerKwp)} kWh / kWp / year`],
        ['Supply category', `${deck.tariff.category} (${tariffKind})`],
        ['Energy charge offset', `₹${deck.tariff.rateRupeesPerKwh.toFixed(2)} / kWh`],
        ['Units self-consumed', `${A.selfConsumptionPercent}% at the energy charge`],
        ['Units exported', `${A.exportPercent}% at ₹${A.exportRateRupeesPerKwh.toFixed(2)} / kWh (APPC)`],
        ['Year 1 gross saving', lakhs(deck.year1GrossSavings)]
    ];

    const investmentRows = [
        ['Price per watt-peak', `₹${deck.rupeesPerWp.toFixed(2)} / Wp (incl. GST)`],
        ['Project price incl. GST', money(deck.priceInclGst)],
        [`GST at ${A.gstPercent}% — recovered as ITC`, money(deck.gstCredit)],
        ['Net capitalised cost', money(deck.capex)],
        ['Depreciation block', `${A.depreciationRatePercent}% WDV, Appendix I`],
        ['Tax regime', `s.115BAA — ${A.taxRatePercent}%`],
        ['Annual maintenance', `₹${num(A.amcRupeesPerKwpPerYear)} / kWp / year, year 1 free`],
        [`${A.projectionYears}-year depreciation shield`, money(deck.totalDepreciationShield)]
    ];

    const specTable = rows => `<table class="qp-specs-table"><tbody>${rows.map(
        ([label, value]) => `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`
    ).join('')}</tbody></table>`;

    // Twelve years is the whole story: at 40% WDV the block is 99.8% written
    // off by year 12 and the remaining charge is rounding. Twelve rather than
    // ten because ten left 23mm dead at the foot of the page.
    const DEPRECIATION_YEARS = 12;
    const depreciationRows = deck.rows.slice(0, DEPRECIATION_YEARS).map(row => {
        const opening = row.writtenDownValue + row.depreciation;
        return `<tr>
            <td>${row.year}</td>
            <td>${inr(opening)}</td>
            <td>${inr(row.depreciation)}</td>
            <td>${inr(row.writtenDownValue)}</td>
            <td>${inr(row.depreciation * (A.taxRatePercent / 100))}</td>
        </tr>`;
    }).join('');

    const shownShield = deck.rows.slice(0, DEPRECIATION_YEARS)
        .reduce((total, row) => total + row.depreciation, 0) * (A.taxRatePercent / 100);

    return `<div class="quote-page">
        ${header(deck, 'Returns, plant and tax depreciation')}

        <div class="qp-dashboard-hero">
            <div class="qp-hero-main">
                <span class="qp-hero-type">APSPDCL · Commercial rooftop</span>
                <h2 class="qp-hero-title">${num(deck.capacityKw)} kWp grid-tied solar plant</h2>
                <p class="qp-hero-sub">Net investment ${money(deck.capex)} after input tax credit,
                    generating ${num(deck.year1GenerationKwh)} units in year one against an energy
                    charge of ₹${deck.tariff.rateRupeesPerKwh.toFixed(2)} per unit.</p>
            </div>
            <div class="qp-hero-badges">
                <span class="qp-hero-badge">${esc(deck.tariff.category)}</span>
                <span class="qp-hero-badge">${A.projectionYears}-year analysis</span>
            </div>
        </div>

        <div class="fd-metric-grid">${metricCards}</div>

        <div class="fd-split qp-section">
            <div>
                <h3>${icon('plant')}Plant and generation</h3>
                ${specTable(plantRows)}
            </div>
            <div>
                <h3>${icon('rupee')}Investment and tax basis</h3>
                ${specTable(investmentRows)}
            </div>
        </div>

        <div class="qp-section">
            <h3>${icon('chart')}Accelerated depreciation — first ${DEPRECIATION_YEARS} years</h3>
            <table class="fd-table fd-table-depreciation">
                <thead><tr>
                    <th>Year</th>
                    <th>Opening WDV (₹)</th>
                    <th>Depreciation at ${A.depreciationRatePercent}% (₹)</th>
                    <th>Closing WDV (₹)</th>
                    <th>Tax shield at ${A.taxRatePercent}% (₹)</th>
                </tr></thead>
                <tbody>${depreciationRows}</tbody>
                <tfoot><tr>
                    <td colspan="4">Tax shield, years 1–${DEPRECIATION_YEARS}</td>
                    <td>${inr(shownShield)}</td>
                </tr></tfoot>
            </table>
        </div>

        ${footer(deck, 1, buildDate)}
    </div>`;
}

/* --- Page 2: the cash flow ---------------------------------------------- */

function pageTwo(deck, buildDate) {
    const paybackYear = deck.payback === null ? null : Math.ceil(deck.payback);

    const bodyRows = deck.rows.map(row => {
        const isPayback = row.year === paybackYear;
        return `<tr${isPayback ? ' class="fd-payback-row"' : ''}>
            <td>${row.year}</td>
            <td>${inr(row.generationKwh)}</td>
            <td>${inr(row.grossSavings)}</td>
            <td>${row.amc === 0 ? '—' : inr(row.amc)}</td>
            <td>${inr(row.depreciation)}</td>
            <td class="${row.tax < 0 ? 'fd-positive' : ''}">${inr(row.tax)}</td>
            <td>${inr(row.netCashFlow)}</td>
            <td class="${row.cumulative < 0 ? 'fd-negative' : ''}">${inr(row.cumulative)}</td>
        </tr>`;
    }).join('');

    const totals = deck.rows.reduce((sum, row) => ({
        generation: sum.generation + row.generationKwh,
        gross: sum.gross + row.grossSavings,
        amc: sum.amc + row.amc,
        depreciation: sum.depreciation + row.depreciation,
        tax: sum.tax + row.tax,
        net: sum.net + row.netCashFlow
    }), { generation: 0, gross: 0, amc: 0, depreciation: 0, tax: 0, net: 0 });

    return `<div class="quote-page">
        ${header(deck, `${A.projectionYears}-year post-tax cash flow`)}

        <div class="fd-note">
            <strong>How this table works.</strong> Electricity savings reduce an operating expense,
            so they increase taxable profit and are taxed at ${A.taxRatePercent}%. Depreciation
            reduces the same taxable profit. Both are applied to one figure, so the tax column is a
            net inflow in the early years when depreciation exceeds savings — shown in green. Net
            cash flow is therefore gross saving, less maintenance, less that tax. The shaded row is
            the year the investment is recovered.
        </div>

        <table class="fd-table fd-table-cashflow">
            <thead><tr>
                <th>Year</th>
                <th>Generation (kWh)</th>
                <th>Gross saving (₹)</th>
                <th>AMC (₹)</th>
                <th>Depreciation (₹)</th>
                <th>Tax (₹)</th>
                <th>Net cash flow (₹)</th>
                <th>Cumulative (₹)</th>
            </tr></thead>
            <tbody>${bodyRows}</tbody>
            <tfoot><tr>
                <td>Total</td>
                <td>${inr(totals.generation)}</td>
                <td>${inr(totals.gross)}</td>
                <td>${inr(totals.amc)}</td>
                <td>${inr(totals.depreciation)}</td>
                <td>${inr(totals.tax)}</td>
                <td>${inr(totals.net)}</td>
                <td>${inr(totals.net)}</td>
            </tr></tfoot>
        </table>

        ${footer(deck, 2, buildDate)}
    </div>`;
}

/* --- Page 3: returns, assumptions, disclaimers -------------------------- */

function pageThree(deck, buildDate) {
    const gridRate = deck.tariff.rateRupeesPerKwh;
    const gridRateFinalYear = gridRate * Math.pow(1 + A.tariffEscalationPercent / 100, A.projectionYears - 1);
    const maxRate = Math.max(gridRate, deck.lcoe);

    const compareRow = (label, value, isGrid) => `<div class="fd-compare-row">
        <span class="fd-compare-label">${esc(label)}</span>
        <span class="fd-compare-track">
            <span class="fd-compare-fill${isGrid ? ' fd-compare-grid-fill' : ''}"
                  style="width:${((value / maxRate) * 100).toFixed(1)}%"></span>
        </span>
        <span class="fd-compare-value">₹${value.toFixed(2)}</span>
    </div>`;

    // Two compact spec tables rather than one wide table with a "Basis"
    // column: that column repeated the assumptions list directly below it,
    // and cost 176px doing so. The basis now rides in the label.
    const returnsLeft = [
        ['Simple payback', years(deck.payback)],
        ['Discounted payback', years(deck.discountedPayback)],
        ['Project IRR, unlevered', percent(deck.irr)],
        [`Net present value at ${A.discountRatePercent}%`, money(deck.npv)]
    ];

    const returnsRight = [
        ['Levelised cost of energy', `₹${deck.lcoe.toFixed(2)} / kWh`],
        [`Cumulative return, ${A.projectionYears} years`, percent(deck.roi, 0)],
        ['Total net cash flow, after tax', money(deck.totalNetCashFlow)],
        [`${A.projectionYears}-year generation`, `${num(deck.totalGenerationKwh)} kWh`]
    ];

    const specTable = rows => `<table class="qp-specs-table"><tbody>${rows.map(
        ([label, value]) => `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`
    ).join('')}</tbody></table>`;

    const assumptions = [
        ['Tariff', `${deck.tariff.category} at ₹${gridRate.toFixed(2)}/kWh. ${deck.tariff.slabNote}. APERC Retail Supply Tariff Order FY2025-26, continued for FY2026-27.`],
        ['Demand charges', 'Excluded. Solar does not reduce contracted demand, so fixed and demand charges are unchanged by the plant.'],
        ['Tariff escalation', `${A.tariffEscalationPercent}% per year, applied to both the energy charge and the export rate.`],
        ['Generation', `${num(A.annualGenerationPerKwp)} kWh per kWp in year one, degrading ${A.degradationPercent}% per year.`],
        ['Unit split', `${A.selfConsumptionPercent}% self-consumed, ${A.exportPercent}% exported at ₹${A.exportRateRupeesPerKwh.toFixed(2)}/kWh. The plant is assumed to be sized to the site's daytime load.`],
        ['GST', `${A.gstPercent}%, recovered in full as input tax credit. Figures are stated ex-GST. A buyer who cannot claim ITC should read the cost as ${money(deck.priceInclGst)}.`],
        ['Depreciation', `${A.depreciationRatePercent}% written-down value, Income Tax Act Appendix I. No additional depreciation under s.32(1)(iia), which s.115BAA forfeits.`],
        ['Tax', `${A.taxRatePercent}% — s.115BAA at 22% plus 10% surcharge and 4% cess. Applied to savings and to depreciation alike.`],
        ['Loss set-off', 'Early-year depreciation exceeds savings. The resulting loss is assumed to shelter the buyer\'s other business income in the same year.'],
        ['Commissioning', 'Full first-year depreciation assumed, i.e. the plant is put to use on or before 30 September. Later commissioning halves the year-one charge, with the balance carried forward.'],
        ['Maintenance', `₹${num(A.amcRupeesPerKwpPerYear)} per kWp per year from year 2, held flat. Year 1 is covered by the build.`],
        ['Inverter replacement', 'Not modelled. A mid-life inverter replacement would reduce the figures shown.'],
        ['Financing', 'None. All returns are unlevered — the return on the money invested, before any loan.'],
        ['Horizon', `${A.projectionYears} years, which runs beyond the module performance warranty.`],
        ['Discount rate', `${A.discountRatePercent}% for net present value, discounted payback and levelised cost.`],
        ['Emissions', `Grid emission factor ${A.gridEmissionFactorKgPerKwh} kg CO₂ per kWh; tree equivalence at ${A.treesPerTonneCo2} trees per tonne is illustrative, not measured sequestration.`]
    ];

    return `<div class="quote-page">
        ${header(deck, 'Return metrics, assumptions and basis')}

        <div class="fd-split qp-section">
            <div>
                <h3>${icon('chart')}Return metrics</h3>
                ${specTable(returnsLeft)}
            </div>
            <div>
                <h3>${icon('table')}Over the full term</h3>
                ${specTable(returnsRight)}
            </div>
        </div>

        <div class="qp-section">
            <h3>${icon('rupee')}Cost of a unit — solar against the grid</h3>
            <div class="fd-compare">
                ${compareRow(`Solar, levelised over ${A.projectionYears} years`, deck.lcoe, false)}
                ${compareRow('Grid energy charge today', gridRate, true)}
            </div>
            <div class="fd-note" style="margin-bottom:0">
                Every unit the plant generates costs <strong>₹${deck.lcoe.toFixed(2)}</strong> across its
                life against <strong>₹${gridRate.toFixed(2)}</strong> bought from APSPDCL today — and the
                grid figure reaches <strong>₹${gridRateFinalYear.toFixed(2)}</strong> by year
                ${A.projectionYears} at ${A.tariffEscalationPercent}% escalation, while the solar figure is
                fixed at the day of purchase. Over ${A.projectionYears} years the plant generates
                ${num(deck.totalGenerationKwh)} units, avoiding ${num(deck.co2Tonnes, 1)} tonnes of CO₂.
            </div>
        </div>

        <div class="qp-section">
            <h3>${icon('list')}Assumptions</h3>
            <ul class="fd-assumptions">${assumptions.map(
                ([label, text]) => `<li><strong>${esc(label)}:</strong> ${esc(text)}</li>`
            ).join('')}</ul>
        </div>

        <div class="fd-disclaimer">
            <h4>Basis and limitations</h4>
            <p>This is an indicative financial analysis for a standard ${num(deck.capacityKw)} kWp
            commercial rooftop plant. <strong>It is not a quotation, an offer, or tax advice.</strong>
            Pricing is subject to a site survey, roof condition, structure height, cable routing,
            evacuation distance and the APSPDCL sanction actually granted.</p>
            <p>Tariffs, the depreciation block and the corporate tax rate are as we understand them at
            the date printed below and are subject to change by APERC and by the Finance Act. The tax
            treatment shown assumes a GST-registered company that has opted into s.115BAA and has
            sufficient other business income to absorb the early-year depreciation.
            <strong>Have your chartered accountant confirm the tax position before you rely on it.</strong></p>
            <p>Generation depends on site irradiance, shading, orientation, soiling and grid
            availability. Actual results will differ from this projection.</p>
        </div>

        ${footer(deck, 3, buildDate)}
    </div>`;
}

/* --- Document ----------------------------------------------------------- */

function render(deck, buildDate, cssHref) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Ray2Volt — ${num(deck.capacityKw)} kWp commercial solar financial analysis</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${esc(cssHref)}">
</head>
<body>
${pageOne(deck, buildDate)}
${pageTwo(deck, buildDate)}
${pageThree(deck, buildDate)}
</body>
</html>`;
}

module.exports = { render, esc, inr, lakhs, money, num, years, percent };
