/**
 * Quote Generator - Comprehensive §06: equipment, and Annexure A
 * Ray2Volt Solar Toolbox
 *
 * Pages 13-15: the key equipment (modules, inverters and, for Hybrid, the
 * battery), the balance-of-system components, and the one-row-per-category
 * bill of materials. Annexure A opens the annexures with their index and the
 * full line-by-line BOM, which the document layout continues across pages.
 *
 * Every make, rating and quantity comes from the entered BOM. Where a
 * category is empty the page says so rather than describing equipment that
 * is not offered.
 */
(function (root) {
    'use strict';

    const Content = root.QuoteGeneratorContent;
    const Calc = root.QuoteGeneratorCalc;
    const Pages = root.QuoteGeneratorPages;
    const Charts = root.QuoteGeneratorCharts;

    if (!Pages || !Pages.design || !Charts) {
        console.error('Comprehensive page helpers are missing; load the front matter first.');
        return;
    }

    const { esc, number, categoryRows, warrantyText } = Pages.helpers;
    const { chapterNumber, opener, designedPage, ratedCount } = Pages.design;
    const { icon } = Charts;

    /**
     * The photograph and the icon for each BOM category. A category the offer
     * does not list shows only its icon, so no photograph suggests equipment
     * that is not being supplied.
     */
    const VISUAL = {
        modules: { photo: 'modules', icon: 'grid' },
        inverters: { photo: 'inverters', icon: 'zap' },
        battery: { photo: 'battery', icon: 'battery' },
        mounting: { photo: 'mounting', icon: 'layers' },
        'dc-cables': { photo: 'connectors', icon: 'link' },
        'ac-cables': { photo: 'acdb', icon: 'link' },
        protection: { photo: 'dcdb', icon: 'shield' },
        earthing: { icon: 'earth' },
        monitoring: { icon: 'activity' },
        metering: { photo: 'metering', icon: 'gauge' },
        safety: { icon: 'shield' },
        civil: { icon: 'tool' },
        installation: { icon: 'clipboard' },
        transport: { icon: 'truck' }
    };

    function visual(key, className, listed) {
        const entry = VISUAL[key] || { icon: 'box' };
        const photo = listed !== false && entry.photo && root.QuoteGeneratorComponentImages
            && root.QuoteGeneratorComponentImages[entry.photo];
        if (photo) {
            return `<span class="${className}"><img src="assets/components/${esc(photo.file)}" alt="${esc(photo.alt)}"
                width="${photo.width}" height="${photo.height}"></span>`;
        }
        return `<span class="${className} is-icon">${icon(entry.icon || 'box')}</span>`;
    }

    function spec(label, value) {
        const text = String(value === null || value === undefined ? '' : value).trim();
        return text ? `<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>` : '';
    }

    function quantityText(row) {
        return Number(row.quantity) > 0 ? `${number(row.quantity, 2)} ${row.unit || ''}`.trim() : '';
    }

    // ---------------------------------------------------------------------
    // P13. Key equipment
    // ---------------------------------------------------------------------

    function keyCard(state, categoryId, title) {
        const rows = categoryRows(state, categoryId);
        const rated = ratedCount(state, categoryId);
        const row = rows[0];
        const technology = Content.TECHNOLOGY[categoryId];
        const chip = rated && rated.rating ? `${number(rated.quantity)} × ${rated.rating}`
            : row && quantityText(row) ? quantityText(row) : '';
        const more = rows.length > 1 ? `<p class="cq-comp-more">${rows.length - 1} further ${rows.length === 2 ? 'line' : 'lines'}
            in this category; see the bill of materials.</p>` : '';

        return `
            <article class="cq-comp">
                <div class="cq-comp-side">
                    ${visual(categoryId, 'cq-comp-photo', Boolean(row))}
                    <p class="cq-comp-lead">${esc(technology.lead)}</p>
                </div>
                <div class="cq-comp-body">
                    <div class="cq-comp-head"><h4>${esc(title)}</h4>${chip ? `<span class="cq-chip">${esc(chip)}</span>` : ''}</div>
                    ${row ? `
                    <dl class="cq-comp-spec">
                        ${spec('Make', row.make)}
                        ${spec('Model / specification', row.specification || row.name)}
                        ${spec('Warranty', warrantyText(row.warranty))}
                        ${spec('Remarks', row.remarks)}
                    </dl>${more}` : '<p class="cq-comp-more">Not listed in the bill of materials for this offer.</p>'}
                    <ul class="cq-comp-points">${technology.points.map((point, index) => `
                        <li${index > 1 ? ' data-optional' : ''}><strong>${esc(point.title)}.</strong> ${esc(point.text)}</li>`).join('')}
                    </ul>
                </div>
            </article>`;
    }

    function equipmentTakeaway(state) {
        const modules = ratedCount(state, 'modules');
        const inverters = ratedCount(state, 'inverters');
        const make = entry => (entry && entry.row.make ? `${entry.row.make} ` : '');
        if (!modules) return 'The plant is built from three kinds of equipment, detailed below.';
        let text = `${number(modules.quantity)} ${make(modules)}modules`;
        if (inverters) text += ` feeding ${number(inverters.quantity)} ${make(inverters)}${inverters.quantity === 1 ? 'inverter' : 'inverters'}`;
        if (state.project.systemConfiguration === 'Hybrid' && Number(state.project.batteryEnergyKwh) > 0) {
            text += `, backed by ${number(state.project.batteryEnergyKwh, 0)} kWh of storage`;
        }
        return `${text}.`;
    }

    Pages.register('key-equipment', context => {
        const { state } = context;
        const hybrid = state.project.systemConfiguration === 'Hybrid';
        const cards = [
            keyCard(state, 'modules', 'Solar PV modules'),
            keyCard(state, 'inverters', hybrid ? 'Hybrid inverters' : 'Inverters')
        ].concat(hybrid ? [keyCard(state, 'battery', 'Battery energy storage')] : []);

        return designedPage('Equipment', 'The key equipment', `
            ${opener(chapterNumber(context, 'equipment'), equipmentTakeaway(state),
                'The components that decide how much energy the plant makes and how long it lasts.')}
            <div class="cq-comp-list${hybrid ? ' is-three' : ''}">${cards.join('')}</div>`);
    });

    // ---------------------------------------------------------------------
    // P14. System components
    // ---------------------------------------------------------------------

    const COMPONENTS = [
        { title: 'Mounting structure', categories: ['mounting'], visual: 'mounting', photo: 'mounting' },
        { title: 'DC & AC protection', categories: ['protection'], visual: 'protection', photo: 'dcdb' },
        { title: 'Cables & connectors', categories: ['dc-cables', 'ac-cables'], visual: 'dc-cables', photo: 'connectors' },
        { title: 'Earthing & lightning protection', categories: ['earthing'], visual: 'earthing',
            text: 'Earth pits, conductors and a lightning arrester protect people and equipment, '
                + 'sized to the plant and tested for earth resistance at commissioning.' },
        { title: 'Monitoring', categories: ['monitoring'], visual: 'monitoring', monitoring: true },
        { title: 'Metering', categories: ['metering'], visual: 'metering', photo: 'metering' }
    ];

    /** One category summary for a component that may span two BOM categories. */
    function componentSummary(summary, categories) {
        const entries = summary.filter(entry => categories.includes(entry.id));
        if (!entries.length) return null;
        const items = entries.reduce((total, entry) => total + entry.itemCount, 0);
        return {
            lead: entries[0].lead,
            makes: [].concat(...entries.map(entry => entry.makes))
                .filter((make, index, list) => list.indexOf(make) === index),
            quantity: entries.length === 1 && entries[0].quantity
                ? `${number(entries[0].quantity.amount, 2)} ${entries[0].quantity.unit}`
                : `${items} ${items === 1 ? 'item' : 'items'}`,
            warranty: entries.map(entry => entry.warranty).filter(Boolean)[0] || ''
        };
    }

    function componentCard(summary, component) {
        const entry = componentSummary(summary, component.categories);
        const photo = component.photo && root.QuoteGeneratorComponentImages
            && root.QuoteGeneratorComponentImages[component.photo];
        const text = component.monitoring ? Content.TECHNOLOGY.monitoring.lead
            : component.text || (photo ? photo.description : '');

        return `
            <article class="cq-part">
                <div class="cq-part-top">
                    ${visual(component.visual, 'cq-part-photo', Boolean(entry))}
                    <div>
                        <h4>${esc(component.title)}</h4>
                        <p>${esc(text)}</p>
                    </div>
                </div>
                ${entry ? `<dl class="cq-part-spec">
                    ${spec('Offered', entry.lead)}
                    ${spec(entry.makes.length > 1 ? 'Makes' : 'Make', entry.makes.join(' / '))}
                    ${spec('Quantity', entry.quantity)}
                    ${spec('Warranty', warrantyText(entry.warranty))}
                </dl>` : '<p class="cq-part-none">Not listed in the bill of materials for this offer.</p>'}
            </article>`;
    }

    Pages.register('system-components', context => {
        const summary = context.derived.insights.bomSummary;
        return designedPage('Equipment', 'System components', `
            ${opener(chapterNumber(context, 'equipment'),
                'The balance of system: the parts that hold, connect, protect and measure the plant.',
                'Each is specified in the bill of materials; the line-by-line list is in Annexure A.')}
            <div class="cq-part-grid">${COMPONENTS.map(component => componentCard(summary, component)).join('')}</div>`);
    });

    // ---------------------------------------------------------------------
    // P15. Bill of materials, one row per category
    // ---------------------------------------------------------------------

    Pages.register('bom-summary', context => {
        const { derived } = context;
        const summary = derived.insights.bomSummary;
        const lines = summary.reduce((total, entry) => total + entry.itemCount, 0);
        const rows = summary.map((entry, index) => `
            <tr>
                <td class="cq-num">${index + 1}</td>
                <td><strong>${esc(entry.label)}</strong></td>
                <td>${esc(entry.lead)}</td>
                <td>${esc(entry.makes.join(' / ') || '—')}</td>
                <td class="cq-num">${entry.quantity
                    ? `${esc(number(entry.quantity.amount, entry.quantity.amount % 1 ? 2 : 0))} ${esc(entry.quantity.unit)}`
                    : `${entry.itemCount} ${entry.itemCount === 1 ? 'item' : 'items'}`}</td>
                <td>${esc(warrantyText(entry.warranty) || '—')}</td>
            </tr>`).join('');

        return designedPage('Equipment', 'Bill of materials', `
            ${opener(chapterNumber(context, 'equipment'),
                `${summary.length} categories of equipment and services, ${lines} line items in all.`,
                'One row per category: the lead item, its makes, the quantity or number of line items, and the warranty.')}
            <table class="cq-table cq-bom-summary">
                <colgroup><col style="width:10mm"><col style="width:24%"><col><col style="width:18%"><col style="width:11%"><col style="width:18%"></colgroup>
                <thead><tr><th class="cq-num">#</th><th>Category</th><th>Lead item</th><th>Make</th><th class="cq-num">Quantity</th><th>Warranty</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="6">No items listed.</td></tr>'}</tbody>
            </table>
            <p class="cq-table-note">The full line-by-line bill of materials, with specifications and remarks, is Annexure A.
                Quantities are as designed at the time of offer and are confirmed against the approved layout after the
                detailed site survey.</p>`);
    });

    // ---------------------------------------------------------------------
    // Annexure A. Index of annexures, then the full bill of materials
    // ---------------------------------------------------------------------

    function annexureIndex(state) {
        return `
            <h3 class="cq-t-h3">Annexures to this proposal</h3>
            <table class="cq-table cq-annex-index">
                <colgroup><col style="width:12mm"><col><col style="width:24%"><col style="width:16mm"></colgroup>
                <thead><tr><th></th><th>Annexure</th><th>Type</th><th class="cq-num">Page</th></tr></thead>
                <tbody>${Calc.annexureList(state).map(entry => `
                    <tr data-annexure-ref="${esc(entry.ref)}">
                        <td><span class="cq-annex-letter">${esc(entry.letter)}</span></td>
                        <td>${esc(entry.title)}</td>
                        <td>${esc(entry.type)}</td>
                        <td class="cq-num cq-annex-page">—</td></tr>`).join('')}
                </tbody>
            </table>`;
    }

    Pages.register('bill-of-materials', context => {
        const { state, page } = context;
        const lines = Calc.bomLines(state);
        const chunk = page.chunk || { start: 0, end: lines.length };
        const first = !page.isContinuation;
        const last = page.part === page.partCount - 1;

        const rows = lines.slice(chunk.start, chunk.end).map(line => {
            if (line.kind === 'category') {
                return `<tr class="cq-cat-row"><td colspan="7">${esc(line.label)}</td></tr>`;
            }
            const row = line.row;
            return `
                <tr>
                    <td class="cq-center">${line.number}${line.isContinuation ? '<br>cont.' : ''}</td>
                    <td>${esc(row.name)}</td>
                    <td>${esc(row.specification)}${row.remarks
                        ? `<span class="cq-cell-note"><strong>Remarks:</strong> ${esc(row.remarks)}</span>` : ''}</td>
                    <td>${esc(row.make)}</td>
                    <td class="cq-center">${esc(row.quantity)}</td>
                    <td class="cq-center">${esc(row.unit)}</td>
                    <td>${esc(warrantyText(row.warranty))}</td>
                </tr>`;
        }).join('');

        return designedPage('Annexure A: Full Bill of Materials', first ? 'Every supplied item and service' : 'Continued', `
            ${first ? opener('A', 'The full bill of materials, line by line.',
                'Specifications, makes, quantities and warranties for every item and service in the offer.') : ''}
            ${first ? annexureIndex(state) : ''}
            ${first ? '<h3 class="cq-t-h3">Bill of materials</h3>' : ''}
            <table class="cq-table cq-bom-table">
                <thead><tr>
                    <th class="cq-center" style="width:6%">S.No</th>
                    <th style="width:20%">Item</th>
                    <th style="width:28%">Specification / Model</th>
                    <th style="width:14%">Make</th>
                    <th class="cq-center" style="width:8%">Qty</th>
                    <th class="cq-center" style="width:8%">Unit</th>
                    <th style="width:16%">Warranty</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="7">No items listed.</td></tr>'}</tbody>
            </table>
            ${last ? `<p class="cq-table-note">Quantities are as designed at the time of offer and are confirmed against the
                approved layout after the detailed site survey. Makes shown are indicative of the class of equipment offered;
                the exact model is confirmed at order against availability, and any change is offered for written approval
                before supply.</p>` : ''}`, { flow: true });
    });
}(typeof self !== 'undefined' ? self : this));
