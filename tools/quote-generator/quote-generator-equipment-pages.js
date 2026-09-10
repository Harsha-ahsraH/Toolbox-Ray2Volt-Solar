/**
 * Equipment schedules can exceed the space beside a technology introduction.
 * Keep the designed first page, then carry the remaining equipment onto A4
 * continuation pages using the same units as the page planner.
 */
(function (root) {
    'use strict';

    const Pages = root.QuoteGeneratorPages;
    const Calc = root.QuoteGeneratorCalc;
    const Config = root.QuoteGeneratorConfig;
    const { esc, equipmentTable } = Pages.helpers;
    const sectionIds = ['pv-module-technology', 'inverter-technology', 'battery-technology',
        'mounting-structure', 'balance-of-system', 'monitoring-scada'];

    function columnsFor(sectionId) {
        const { specCell, ratingCell } = Pages.blocks;
        const rated = sectionId.indexOf('technology') !== -1;
        const widths = rated ? ['22%', '29%', '15%', '9%']
            : sectionId === 'mounting-structure' ? ['26%', '38%', '18%', '18%']
                : sectionId === 'balance-of-system' ? ['28%', '44%', '16%', '12%']
                    : ['30%', '40%', '16%', '14%'];
        const columns = [
            { label: 'Item', width: widths[0], value: row => esc(row.name || (row.continued ? 'Continued' : '')) },
            { label: 'Specification', width: widths[1], value: specCell },
            { label: 'Make', width: widths[2], value: row => esc(row.make) }
        ];
        if (rated) columns.push({ label: 'Rating', width: '10%', className: 'cq-center', value: ratingCell });
        columns.push({ label: 'Qty', width: widths[3], className: 'cq-center',
            value: row => `${esc(row.quantity)} ${esc(row.unit)}` });
        if (rated) columns.push({ label: 'Warranty', width: '15%', value: row => esc(Pages.helpers.warrantyText(row.warranty)) });
        return columns;
    }

    sectionIds.forEach(sectionId => {
        const original = Pages.renderers[sectionId];
        Pages.register(sectionId, context => {
            const units = Calc.equipmentUnits(context.state, sectionId);
            const chunk = context.page.chunk || { start: 0, end: units.length };
            const slice = units.slice(chunk.start, chunk.end);
            const categories = context.state.bom.categories.map(category => Object.assign({}, category, {
                rows: slice.filter(unit => unit.categoryId === category.id).map(unit => Object.assign({}, unit.row, {
                    name: unit.row.name || (unit.row.continued ? 'Continued' : '')
                }))
            }));
            const state = Object.assign({}, context.state, { bom: Object.assign({}, context.state.bom, { categories }) });

            if (!context.page.isContinuation) return original(Object.assign({}, context, {
                state, photoState: context.state
            }));

            const groups = [];
            slice.forEach(unit => {
                let group = groups[groups.length - 1];
                if (!group || group.id !== unit.categoryId) {
                    group = { id: unit.categoryId, label: unit.label, rows: [] };
                    groups.push(group);
                }
                group.rows.push(unit.row);
            });

            return {
                title: Config.getSection(sectionId).title,
                subtitle: `Equipment continued — page ${context.page.part + 1} of ${context.page.partCount}`,
                body: groups.map(group => `<h3 class="cq-subtitle">${esc(group.label)}</h3>`
                    + equipmentTable(group.rows, columnsFor(sectionId))).join('')
            };
        });
    });
}(typeof self !== 'undefined' ? self : this));
