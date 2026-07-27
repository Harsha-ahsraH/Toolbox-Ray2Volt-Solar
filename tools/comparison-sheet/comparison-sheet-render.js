/**
 * Comparison Sheet — document renderer.
 *
 * Lays the computed result across two A4 pages. It calculates nothing: every
 * number arrives from the model and every varying sentence from the copy
 * module, so the document and the screen can never disagree.
 */
(function (root) {
    'use strict';

    const copy = root.Ray2VoltComparisonCopy;
    const content = root.Ray2VoltComparisonContent;
    const model = root.Ray2VoltComparisonModel;

    const LOGO = '../../global/assets/logo.png';

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function each(result, callback) {
        return result.options.map(callback);
    }

    function header(title, subtitle) {
        return `
        <div class="cs-header">
            <img src="${LOGO}" alt="Ray2Volt" class="cs-logo">
            <div class="cs-title-section">
                <h1>${escapeHtml(title)}</h1>
                <p class="cs-subtitle">${escapeHtml(subtitle)}</p>
            </div>
        </div>`;
    }

    function pageFooter(page, total) {
        return `
        <div class="cs-page-footer">
            <span>${escapeHtml(content.FOOTER_LEFT)}</span>
            <span>Page ${page} of ${total}</span>
        </div>`;
    }

    /**
     * The header every table shares: a navy band naming the three builds, with
     * Option 3 marked as the recommendation. `leadLabel` fills the corner cell
     * so the specification table can title its own first column.
     */
    function optionHead(leadLabel) {
        const cells = content.OPTION_LABELS.map((label, index) => `
            <th class="cs-option-head${index === 2 ? ' cs-option-head-pick' : ''}">
                <span class="cs-option-label">${escapeHtml(label)}</span>
                <span class="cs-option-sublabel">${escapeHtml(content.OPTION_SUBLABELS[index])}</span>
            </th>`).join('');

        return `<tr><th class="cs-row-label cs-corner">${escapeHtml(leadLabel || '')}</th>${cells}</tr>`;
    }

    /** Cell classes for a value's flag. 'fair' deliberately gets nothing. */
    function toneClass(tone) {
        if (tone === 'poor') return ' cs-tone-poor';
        if (tone === 'good') return ' cs-tone-good';
        return '';
    }

    function row(label, cells, options) {
        const settings = options || {};
        const className = settings.className ? ` class="${settings.className}"` : '';
        const tones = settings.tone || [];

        const body = cells.map((value, index) => {
            const classes = (settings.money ? 'cs-money' : '') + toneClass(tones[index]);
            return `<td${classes.trim() ? ` class="${classes.trim()}"` : ''}>${value}</td>`;
        }).join('');

        return `<tr${className}><th class="cs-row-label">${escapeHtml(label)}</th>${body}</tr>`;
    }

    /**
     * Flags for one numeric ownership row, from the figures themselves rather
     * than a template — so they can never go stale. Only the best and worst are
     * marked, and only when they actually differ.
     */
    function numericTone(values, betterIsLower) {
        const best = betterIsLower ? Math.min(...values) : Math.max(...values);
        const worst = betterIsLower ? Math.max(...values) : Math.min(...values);
        if (best === worst) return ['fair', 'fair', 'fair'];

        return values.map(value => {
            if (value === best) return 'good';
            if (value === worst) return 'poor';
            return 'fair';
        });
    }

    /** Price summary. Both the rate and the total print, whichever was typed. */
    function priceSummary(result) {
        return `
        <table class="cs-doc-table cs-price-table">
            <thead>${optionHead()}</thead>
            <tbody>
                ${row('Price per Wp', each(result, option => copy.money(option.ratePerWp)), {
                    money: true,
                    className: 'cs-row-figure'
                })}
                ${row('Total capital cost', each(result, option => copy.rupees(option.capitalCost)), {
                    money: true,
                    className: 'cs-row-figure'
                })}
                ${row('Suited to', content.SUITED_TO.map(escapeHtml), { className: 'cs-row-suited' })}
            </tbody>
        </table>`;
    }

    /**
     * Past this many rows the comfortable spacing no longer fits page 1, so the
     * table switches to its dense variant. 13-row on-grid stays comfortable;
     * 18-row hybrid tightens.
     */
    const DENSE_ROW_THRESHOLD = 14;

    /**
     * The specification table, as the form currently has it.
     *
     * A cell the salesperson has edited carries no flag: once it is their
     * wording, the sheet stops asserting whether it is good or bad.
     */
    function specificationTable(rows) {
        const body = rows.map(specRow => {
            const tones = specRow.tone || [];
            const edited = specRow.edited || [];

            const cells = specRow.values.map((value, index) => {
                const tone = edited[index] ? null : tones[index];
                const classes = toneClass(tone).trim();
                return `<td${classes ? ` class="${classes}"` : ''}>${escapeHtml(value)}</td>`;
            }).join('');

            return `<tr><th class="cs-row-label">${escapeHtml(specRow.label)}</th>${cells}</tr>`;
        }).join('');

        const dense = rows.length > DENSE_ROW_THRESHOLD ? ' cs-spec-dense' : '';

        return `
        <table class="cs-doc-table cs-spec-doc-table${dense}">
            <thead>${optionHead('Specification')}</thead>
            <tbody>${body}</tbody>
        </table>`;
    }

    /**
     * Cost of ownership.
     *
     * Capital cost and payback are left unflagged on purpose. Capital cost is
     * the input, not a verdict — colouring Option 1 green for being cheapest
     * today would argue against the rest of the table. And the callout states
     * that payback is effectively identical, so flagging it would contradict
     * the sheet's own words.
     */
    function ownershipTable(result) {
        const figures = key => each(result, option => option[key]);

        return `
        <table class="cs-doc-table cs-ownership-table">
            <thead>${optionHead()}</thead>
            <tbody>
                ${row('Capital cost', each(result, option => copy.rupees(option.capitalCost)), { money: true })}
                ${row(`Maintenance, ${result.years} years`, each(result, option => copy.rupees(option.maintenance)), {
                    money: true,
                    tone: numericTone(figures('maintenance'), true)
                })}
                ${row('Expected repairs and replacements', each(result, option => copy.rupees(option.repairs)), {
                    money: true,
                    tone: numericTone(figures('repairs'), true)
                })}
                ${row('Total cost of ownership', each(result, option => copy.rupees(option.totalCostOfOwnership)), {
                    money: true,
                    className: 'cs-row-total',
                    tone: numericTone(figures('totalCostOfOwnership'), true)
                })}
                ${row('Year-1 generation', each(result, option => copy.units(option.yearOneGeneration)), {
                    tone: numericTone(figures('yearOneGeneration'), false)
                })}
                ${row(`${result.years}-year generation`, each(result, option => copy.lakhUnits(option.totalGeneration)), {
                    tone: numericTone(figures('totalGeneration'), false)
                })}
                ${row('Simple payback', each(result, option => copy.years(option.payback)))}
                ${row('Levelised cost per unit', each(result, option => `${copy.money(option.lcoe)} / kWh`), {
                    money: true,
                    className: 'cs-row-total',
                    tone: numericTone(figures('lcoe'), true)
                })}
            </tbody>
        </table>`;
    }

    function callout(result) {
        const [headline, ownership, payback] = copy.calloutLines(result);

        return `
        <div class="cs-callout">
            <p class="cs-callout-lead">${escapeHtml(headline)}</p>
            <p>${escapeHtml(ownership)}</p>
            <p>${escapeHtml(payback)}</p>
        </div>`;
    }

    function questionList(questions) {
        const items = questions
            .map(question => `<li>${escapeHtml(question)}</li>`)
            .join('');

        return `<ol class="cs-questions">${items}</ol>`;
    }

    function basis(result) {
        return `
        <div class="cs-basis">
            <p>${escapeHtml(copy.basisParagraph(result, model))}</p>
            <p>${escapeHtml(content.MODULES_PARAGRAPH)}</p>
            <p>${escapeHtml(content.EXCLUSIONS_PARAGRAPH)}</p>
        </div>`;
    }

    /** `74.4 kWp ground-mount`, or `74.4 kWp hybrid with 100 kWh storage`. */
    function plantDescription(result) {
        const capacity = `${copy.rate(result.capacityKwp).replace(/\.00$/, '')} kWp`;
        if (!result.isHybrid) return `${capacity} ground-mount plant`;

        const storage = result.batteryKwh ? ` with ${copy.rate(result.batteryKwh).replace(/\.00$/, '')} kWh of storage` : '';
        return `${capacity} hybrid plant${storage}`;
    }

    function renderPageOne(target, result, rows) {
        const description = plantDescription(result);

        target.innerHTML = `
        ${header('Three Build Standards for the Same Plant', `Where the price difference goes on a ${description}, and what each standard costs to own over ${result.years} years.`)}
        <h2 class="cs-heading">Price summary</h2>
        ${priceSummary(result)}
        <h2 class="cs-heading">What the price difference buys</h2>
        ${specificationTable(rows)}
        ${pageFooter(1, 2)}`;
    }

    function renderPageTwo(target, result) {
        const questions = content.questionsFor(result.systemType);

        target.innerHTML = `
        ${header('Three Build Standards for the Same Plant', 'Cost of ownership, and the questions that separate a real quotation from a cheap one.')}
        <h2 class="cs-heading">Cost of ownership over ${result.years} years</h2>
        ${ownershipTable(result)}
        ${callout(result)}
        <h2 class="cs-heading">${escapeHtml(content.questionsHeading(questions.length))}</h2>
        ${questionList(questions)}
        ${basis(result)}
        ${pageFooter(2, 2)}`;
    }

    root.Ray2VoltComparisonRender = {
        renderPageOne,
        renderPageTwo,
        priceSummary,
        specificationTable,
        ownershipTable,
        questionList,
        plantDescription,
        numericTone,
        toneClass,
        DENSE_ROW_THRESHOLD
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
