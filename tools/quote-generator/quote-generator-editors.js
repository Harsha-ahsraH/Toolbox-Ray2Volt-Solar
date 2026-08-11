/**
 * Quote Generator - Comprehensive panel editors
 * Ray2Volt Solar Toolbox
 *
 * Renders the dynamic parts of the Comprehensive Inputs accordion: the section
 * checklist, the narrative fields, the BOM category editor with its capacity
 * reconciliation, every repeater, the clause editors and the annexure list.
 *
 * Each renderer rebuilds its own container from state and delegates events back
 * through the `api` object supplied by quote-generator-form.js:
 *
 *   api.update(mutator)  - apply a pure state mutation, then revalidate,
 *                          re-render and schedule an autosave
 *   api.patch(mutator)   - same, but skips the full re-render (used for typing
 *                          into a field, so the caret is never disturbed)
 *   api.confirm(message) - user confirmation for destructive actions
 *
 * No calculation happens here; every number comes from quote-generator-calc.js.
 */
(function (root, factory) {
    'use strict';
    const api = factory(
        root.QuoteGeneratorConfig,
        root.QuoteGeneratorModel,
        root.QuoteGeneratorCalc
    );

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorEditors = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Model, Calc) {
    'use strict';

    function byId(id) {
        return document.getElementById(id);
    }

    /** Escapes text destined for an innerHTML string. */
    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function money(value) {
        return '₹' + Math.round(Number(value) || 0).toLocaleString('en-IN');
    }

    function options(list, selected, valueKey, labelKey) {
        return list.map(item => {
            const value = valueKey ? item[valueKey] : item;
            const label = labelKey ? item[labelKey] : item;
            return `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`;
        }).join('');
    }

    /**
     * Wires a container so typing in any [data-row-id][data-field] control feeds
     * back into state. `text` inputs patch without re-rendering; selects and
     * checkboxes re-render because they can change what else is visible.
     */
    function bindRows(container, api, apply) {
        if (!container || container.dataset.bound === 'true') return;
        container.dataset.bound = 'true';

        function readValue(field) {
            if (field.type === 'checkbox') return field.checked;
            if (field.type === 'number') return field.value === '' ? '' : parseFloat(field.value);
            return field.value;
        }

        container.addEventListener('input', event => {
            const field = event.target.closest('[data-row-id][data-field]');
            if (!field || field.tagName === 'SELECT' || field.type === 'checkbox') return;

            api.patch(state => apply(state, field.dataset.rowId, field.dataset.field, readValue(field)));
        });

        container.addEventListener('change', event => {
            const field = event.target.closest('[data-row-id][data-field]');
            if (!field) return;
            if (field.tagName !== 'SELECT' && field.type !== 'checkbox') return;

            api.update(state => apply(state, field.dataset.rowId, field.dataset.field, readValue(field)));
        });
    }

    // ---------------------------------------------------------------------
    // Proposal sections
    // ---------------------------------------------------------------------

    function renderSectionChecklist(state, api) {
        const container = byId('qgSectionChecklist');
        if (!container) return;

        const available = Config.sectionsForConfiguration(state.project.systemConfiguration);
        const groups = Config.SECTION_GROUPS.filter(group =>
            available.some(section => section.group === group));

        container.innerHTML = groups.map(group => {
            const items = available.filter(section => section.group === group);

            return `
                <div class="qg-section-group">
                    <h4 class="qg-section-group-title">${esc(group)}</h4>
                    <div class="qg-section-items">
                        ${items.map(section => `
                            <label class="qg-section-item">
                                <input type="checkbox" data-section-id="${esc(section.id)}"
                                    ${Model.isSectionSelected(state, section.id) ? 'checked' : ''}>
                                <span>${esc(section.title)}${section.core
                                    ? ' <span class="qg-section-core">Core</span>'
                                    : ''}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>`;
        }).join('');

        if (container.dataset.bound !== 'true') {
            container.dataset.bound = 'true';
            container.addEventListener('change', event => {
                const box = event.target.closest('[data-section-id]');
                if (!box) return;
                api.update(state => Model.toggleSection(state, box.dataset.sectionId, box.checked));
            });
        }
    }

    // ---------------------------------------------------------------------
    // Project narrative
    // ---------------------------------------------------------------------

    const NARRATIVE_LABELS = {
        objective: 'Customer’s Project Objective',
        existingSystem: 'Existing Electrical-System Summary',
        proposedSolution: 'Proposed Solar Solution Summary',
        siteConditions: 'Site Conditions or Constraints',
        specialRequirements: 'Special Customer Requirements',
        projectNotes: 'General Project Notes'
    };

    function renderNarrative(state, api) {
        const container = byId('qgNarrativeFields');
        if (!container) return;

        container.innerHTML = Model.NARRATIVE_FIELDS.map(field => {
            const dirty = Model.isDirty(state, `projectNarrative.${field}`);

            return `
                <div class="qg-narrative-field">
                    <div class="qg-narrative-head">
                        <label for="cqNarrative-${esc(field)}">${esc(NARRATIVE_LABELS[field])}</label>
                        <span class="qg-narrative-flag">${dirty ? 'Edited' : 'Default'}</span>
                    </div>
                    <textarea id="cqNarrative-${esc(field)}" class="qg-input-field" rows="4"
                        data-narrative="${esc(field)}">${esc(state.projectNarrative[field])}</textarea>
                    <div class="qg-inline-actions" style="margin-top:0.4rem;margin-bottom:0;">
                        <button type="button" class="qg-btn-ghost" data-restore-narrative="${esc(field)}"
                            ${dirty ? '' : 'disabled'}>Restore Default</button>
                    </div>
                </div>`;
        }).join('');

        if (container.dataset.bound === 'true') return;
        container.dataset.bound = 'true';

        container.addEventListener('input', event => {
            const field = event.target.closest('[data-narrative]');
            if (!field) return;
            api.patch(state => Model.setNarrativeField(state, field.dataset.narrative, field.value));
        });

        container.addEventListener('click', event => {
            const button = event.target.closest('[data-restore-narrative]');
            if (!button) return;
            api.update(state => Model.restoreNarrativeField(state, button.dataset.restoreNarrative));
        });
    }

    // ---------------------------------------------------------------------
    // Bill of Materials
    // ---------------------------------------------------------------------

    const RATED_CATEGORIES = { modules: 'Wp', inverters: 'kW', battery: 'kWh' };

    function bomRowMarkup(categoryId, row) {
        const rated = RATED_CATEGORIES[categoryId];

        return `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="bom-${esc(row.id)}-name">Item</label>
                    <input type="text" id="bom-${esc(row.id)}-name" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="name" value="${esc(row.name)}">
                </div>
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="bom-${esc(row.id)}-spec">Specification / Model</label>
                    <input type="text" id="bom-${esc(row.id)}-spec" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="specification" value="${esc(row.specification)}">
                </div>
                <div class="qg-row-field">
                    <label for="bom-${esc(row.id)}-make">Make</label>
                    <input type="text" id="bom-${esc(row.id)}-make" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="make" value="${esc(row.make)}">
                </div>
                <div class="qg-row-field">
                    <label for="bom-${esc(row.id)}-qty">Quantity</label>
                    <input type="number" id="bom-${esc(row.id)}-qty" class="qg-input-field" min="0" step="any"
                        data-row-id="${esc(row.id)}" data-field="quantity" value="${esc(row.quantity)}">
                </div>
                <div class="qg-row-field">
                    <label for="bom-${esc(row.id)}-unit">Unit</label>
                    <input type="text" id="bom-${esc(row.id)}-unit" class="qg-input-field" list="qgBomUnits"
                        data-row-id="${esc(row.id)}" data-field="unit" value="${esc(row.unit)}">
                </div>
                <div class="qg-row-field">
                    <label for="bom-${esc(row.id)}-warranty">Warranty</label>
                    <input type="text" id="bom-${esc(row.id)}-warranty" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="warranty" value="${esc(row.warranty)}">
                </div>
                ${rated ? `
                <div class="qg-row-field">
                    <label for="bom-${esc(row.id)}-rating">Rating (${esc(rated)})</label>
                    <input type="number" id="bom-${esc(row.id)}-rating" class="qg-input-field" min="0" step="any"
                        data-row-id="${esc(row.id)}" data-field="rating" value="${esc(row.rating)}">
                </div>
                <div class="qg-row-field">
                    <label for="bom-${esc(row.id)}-ratingUnit">Rating Unit</label>
                    <input type="text" id="bom-${esc(row.id)}-ratingUnit" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="ratingUnit" value="${esc(row.ratingUnit)}">
                </div>` : ''}
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="bom-${esc(row.id)}-remarks">Remarks / Scope Note</label>
                    <input type="text" id="bom-${esc(row.id)}-remarks" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="remarks" value="${esc(row.remarks)}">
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost" data-bom-action="duplicate"
                        data-category="${esc(categoryId)}" data-row-id="${esc(row.id)}">Duplicate</button>
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-bom-action="remove"
                        data-category="${esc(categoryId)}" data-row-id="${esc(row.id)}">Remove</button>
                </div>
            </div>`;
    }

    function renderBom(state, api) {
        const container = byId('qgBomCategories');
        if (!container) return;

        const categories = Config.BOM_CATEGORIES.filter(category =>
            !category.configurations
            || category.configurations.indexOf(state.project.systemConfiguration) !== -1);

        container.innerHTML = `<datalist id="qgBomUnits">${
            Config.BOM_UNITS.map(unit => `<option value="${esc(unit)}"></option>`).join('')
        }</datalist>` + categories.map(category => {
            const stored = Model.getBomCategory(state, category.id);
            const rows = stored ? stored.rows : [];

            return `
                <div class="qg-bom-category">
                    <div class="qg-bom-category-head">
                        <h4>${esc(category.label)}</h4>
                        <span class="qg-bom-count">${rows.length} ${rows.length === 1 ? 'row' : 'rows'}${
                            rows.length ? '' : ' — hidden from the proposal'}</span>
                        <button type="button" class="qg-btn-ghost" data-bom-action="add"
                            data-category="${esc(category.id)}">Add Row</button>
                    </div>
                    <div class="qg-bom-rows">
                        ${rows.length
                            ? rows.map(row => bomRowMarkup(category.id, row)).join('')
                            : '<p class="qg-empty-note">No rows. Empty categories are omitted from the proposal.</p>'}
                    </div>
                </div>`;
        }).join('');

        bindRows(container, api, (state, rowId, field, value) => {
            const category = (state.bom.categories || [])
                .filter(item => item.rows.some(row => row.id === rowId))[0];
            return category ? Model.updateBomRow(state, category.id, rowId, { [field]: value }) : state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';

        container.addEventListener('click', event => {
            const button = event.target.closest('[data-bom-action]');
            if (!button) return;

            const { bomAction, category, rowId } = button.dataset;

            if (bomAction === 'add') {
                api.update(state => Model.addBomRow(state, category));
            } else if (bomAction === 'duplicate') {
                api.update(state => Model.duplicateBomRow(state, category, rowId));
            } else if (bomAction === 'remove' && api.confirm('Remove this bill of materials row?')) {
                api.update(state => Model.removeBomRow(state, category, rowId));
            }
        });
    }

    /**
     * Approved and BOM-derived capacities shown side by side. Neither figure is
     * ever overwritten silently: the match buttons are an explicit user action.
     */
    function renderReconciliation(state, derived, api) {
        const container = byId('qgReconciliation');
        if (!container) return;

        const reconciliation = derived.reconciliation;
        const cards = [
            {
                key: 'modules',
                title: 'Solar DC Capacity',
                unit: 'kWp',
                data: reconciliation.modules,
                rated: reconciliation.hasRatedModules,
                projectField: 'dcCapacityKwp'
            },
            {
                key: 'inverters',
                title: 'Inverter AC Capacity',
                unit: 'kW',
                data: reconciliation.inverters,
                rated: reconciliation.hasRatedInverters,
                projectField: 'acCapacityKw'
            }
        ];

        if (reconciliation.appliesBattery) {
            cards.push({
                key: 'batteryEnergy',
                title: 'Battery Energy',
                unit: 'kWh',
                data: reconciliation.batteryEnergy,
                rated: reconciliation.hasRatedBattery,
                projectField: 'batteryEnergyKwh'
            });
        }

        container.innerHTML = cards.map(card => {
            const state_ = !card.rated ? 'unrated' : (card.data.mismatch ? 'mismatch' : 'match');
            const message = !card.rated
                ? 'No rated rows in this category, so there is nothing to reconcile against.'
                : (card.data.mismatch
                    ? `Difference of ${card.data.difference} ${card.unit} exceeds the ${card.data.tolerance} ${card.unit} tolerance.`
                    : 'Approved and BOM-derived capacities agree.');

            return `
                <div class="qg-recon-card" data-state="${state_}">
                    <div class="qg-recon-title">${esc(card.title)}</div>
                    <div class="qg-recon-values">
                        <span>Approved: <strong>${card.data.approved} ${esc(card.unit)}</strong></span>
                        <span>From BOM: <strong>${card.data.derived} ${esc(card.unit)}</strong></span>
                    </div>
                    <p class="qg-recon-message">${esc(message)}</p>
                    ${card.data.mismatch && card.rated ? `
                        <div class="qg-recon-actions">
                            <button type="button" class="qg-btn-ghost" data-recon-match="${esc(card.projectField)}"
                                data-recon-value="${card.data.derived}">Set Project Settings to ${card.data.derived} ${esc(card.unit)}</button>
                        </div>` : ''}
                </div>`;
        }).join('');

        if (container.dataset.bound === 'true') return;
        container.dataset.bound = 'true';

        container.addEventListener('click', event => {
            const button = event.target.closest('[data-recon-match]');
            if (!button) return;

            api.update(state => {
                state.project[button.dataset.reconMatch] = parseFloat(button.dataset.reconValue);
                return state;
            });
        });
    }

    // ---------------------------------------------------------------------
    // Commercial repeaters
    // ---------------------------------------------------------------------

    function renderBreakdown(state, derived, api) {
        const container = byId('qgBreakdownRows');
        const total = byId('qgBreakdownTotal');
        if (!container) return;

        const rows = state.commercial.priceBreakdown || [];

        container.innerHTML = rows.length ? rows.map(row => `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 3;">
                    <label for="bd-${esc(row.id)}-desc">Description</label>
                    <input type="text" id="bd-${esc(row.id)}-desc" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="description" value="${esc(row.description)}">
                </div>
                <div class="qg-row-field">
                    <label for="bd-${esc(row.id)}-amt">Amount (Incl. GST)</label>
                    <input type="number" id="bd-${esc(row.id)}-amt" class="qg-input-field" min="0" step="1"
                        data-row-id="${esc(row.id)}" data-field="amount" value="${esc(row.amount)}">
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-remove-breakdown="${esc(row.id)}"
                        aria-label="Remove price breakdown line">Remove</button>
                </div>
            </div>`).join('')
            : '<p class="qg-empty-note">Optional. Leave empty to quote a single Actual Project Cost.</p>';

        if (total) {
            if (!rows.length) {
                total.textContent = '';
                total.removeAttribute('data-state');
            } else {
                total.textContent = `Breakdown total ${money(derived.commercial.breakdownTotal)} `
                    + `against Actual Project Cost ${money(derived.commercial.actualProjectCost)}.`;
                total.setAttribute('data-state', derived.commercial.breakdownMatches ? 'ok' : 'warning');
            }
        }

        bindRows(container, api, (state, rowId, field, value) => {
            state.commercial.priceBreakdown = (state.commercial.priceBreakdown || [])
                .map(row => row.id === rowId ? Object.assign({}, row, { [field]: value }) : row);
            return state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';
        container.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-breakdown]');
            if (button) api.update(state => Model.removeBreakdownRow(state, button.dataset.removeBreakdown));
        });
    }

    function renderDiscounts(state, derived, api) {
        const container = byId('qgDiscountRows');
        const total = byId('qgDiscountTotal');
        if (!container) return;

        const rows = state.commercial.discounts || [];

        container.innerHTML = rows.map(row => `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 3;">
                    <label for="dc-${esc(row.id)}-name">Discount Name</label>
                    <input type="text" id="dc-${esc(row.id)}-name" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="name" value="${esc(row.name)}">
                </div>
                <div class="qg-row-field">
                    <label for="dc-${esc(row.id)}-amt">Amount</label>
                    <input type="number" id="dc-${esc(row.id)}-amt" class="qg-input-field" min="0" step="1"
                        data-row-id="${esc(row.id)}" data-field="amount" value="${esc(row.amount)}">
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-remove-discount="${esc(row.id)}"
                        aria-label="Remove discount">Remove</button>
                </div>
            </div>`).join('');

        if (total) {
            total.textContent = `Total discount ${money(derived.commercial.discountTotal)}. `
                + `Final offered price ${money(derived.commercial.finalPrice)}.`;
            total.setAttribute('data-state',
                derived.commercial.discountTotal > derived.commercial.actualProjectCost
                    && derived.commercial.actualProjectCost > 0 ? 'error' : 'ok');
        }

        bindRows(container, api, (state, rowId, field, value) => {
            state.commercial.discounts = (state.commercial.discounts || [])
                .map(row => row.id === rowId ? Object.assign({}, row, { [field]: value }) : row);
            return state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';
        container.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-discount]');
            if (button) api.update(state => Model.removeDiscount(state, button.dataset.removeDiscount));
        });
    }

    function renderMilestones(state, derived, api) {
        const container = byId('qgMilestoneRows');
        const total = byId('qgMilestoneTotal');
        if (!container) return;

        const amounts = {};
        derived.commercial.milestones.forEach(row => { amounts[row.id] = row.amount; });
        const rows = state.commercial.milestones || [];

        container.innerHTML = rows.length ? rows.map(row => `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="ms-${esc(row.id)}-name">Milestone / Payment Trigger</label>
                    <input type="text" id="ms-${esc(row.id)}-name" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="name" value="${esc(row.name)}">
                </div>
                <div class="qg-row-field">
                    <label for="ms-${esc(row.id)}-pct">Percentage</label>
                    <input type="number" id="ms-${esc(row.id)}-pct" class="qg-input-field" min="0" max="100" step="0.01"
                        data-row-id="${esc(row.id)}" data-field="percent" value="${esc(row.percent)}">
                </div>
                <div class="qg-row-field">
                    <label>Amount</label>
                    <span class="qg-row-readonly" data-milestone-amount="${esc(row.id)}">${money(amounts[row.id] || 0)}</span>
                </div>
                <div class="qg-row-field" style="grid-column:span 3;">
                    <label for="ms-${esc(row.id)}-note">Note / Due Condition</label>
                    <input type="text" id="ms-${esc(row.id)}-note" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="note" value="${esc(row.note)}">
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-remove-milestone="${esc(row.id)}"
                        aria-label="Remove payment milestone">Remove</button>
                </div>
            </div>`).join('')
            : '<p class="qg-empty-note">Add at least one payment milestone.</p>';

        if (total) {
            const sum = derived.commercial.milestonePercentTotal;
            const ok = Calc.withinPercentTolerance(sum);
            total.textContent = `Milestones total ${sum}%${ok ? '.' : ' — they must total 100%.'}`;
            total.setAttribute('data-state', ok ? 'ok' : 'error');
        }

        bindRows(container, api, (state, rowId, field, value) => {
            state.commercial.milestones = (state.commercial.milestones || [])
                .map(row => row.id === rowId ? Object.assign({}, row, { [field]: value }) : row);
            return state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';
        container.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-milestone]');
            if (button) api.update(state => Model.removeMilestone(state, button.dataset.removeMilestone));
        });
    }

    // ---------------------------------------------------------------------
    // Savings
    // ---------------------------------------------------------------------

    function renderMonthlyRows(state, derived, api) {
        const container = byId('qgMonthlyRows');
        const totals = byId('qgConsumptionTotals');
        if (!container) return;

        container.innerHTML = (state.savings.monthlyRows || []).map((row, index) => `
            <tr>
                <th scope="row">${esc(row.month)}</th>
                <td><input type="number" class="qg-input-field" min="0" step="1"
                    aria-label="Imported energy for ${esc(row.month)}"
                    data-row-id="${index}" data-field="importedKwh" value="${esc(row.importedKwh)}"></td>
                <td><input type="number" class="qg-input-field" min="0" step="1"
                    aria-label="Bill amount for ${esc(row.month)}"
                    data-row-id="${index}" data-field="billAmount" value="${esc(row.billAmount)}"></td>
                <td><input type="number" class="qg-input-field" min="0" step="0.1"
                    aria-label="Maximum demand for ${esc(row.month)}"
                    data-row-id="${index}" data-field="maxDemandKva" value="${esc(row.maxDemandKva)}"></td>
            </tr>`).join('');

        if (totals) {
            const consumption = derived.consumption;
            totals.textContent = `Annual import ${consumption.annualKwh.toLocaleString('en-IN')} kWh · `
                + `annual bill ${money(consumption.annualBill)} · `
                + `average tariff ₹${consumption.averageTariff}/kWh · `
                + `peak demand ${consumption.maxDemandKva} kVA.`;
        }

        bindRows(container, api, (state, rowIndex, field, value) => {
            const row = (state.savings.monthlyRows || [])[Number(rowIndex)];
            if (row) row[field] = value;
            return state;
        });
    }

    function renderFutureCosts(state, api) {
        const container = byId('qgFutureCostRows');
        if (!container) return;

        const rows = state.savings.futureCosts || [];

        container.innerHTML = rows.length ? rows.map(row => `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="fc-${esc(row.id)}-name">Cost Name</label>
                    <input type="text" id="fc-${esc(row.id)}-name" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="name" value="${esc(row.name)}">
                </div>
                <div class="qg-row-field">
                    <label for="fc-${esc(row.id)}-amt">Starting Amount</label>
                    <input type="number" id="fc-${esc(row.id)}-amt" class="qg-input-field" min="0" step="1"
                        data-row-id="${esc(row.id)}" data-field="amount" value="${esc(row.amount)}">
                </div>
                <div class="qg-row-field">
                    <label for="fc-${esc(row.id)}-esc">Escalation (%/yr)</label>
                    <input type="number" id="fc-${esc(row.id)}-esc" class="qg-input-field" step="0.1"
                        data-row-id="${esc(row.id)}" data-field="escalationPercent" value="${esc(row.escalationPercent)}">
                </div>
                <div class="qg-row-field">
                    <label for="fc-${esc(row.id)}-start">Start Year</label>
                    <input type="number" id="fc-${esc(row.id)}-start" class="qg-input-field" min="1" step="1"
                        data-row-id="${esc(row.id)}" data-field="startYear" value="${esc(row.startYear)}">
                </div>
                <div class="qg-row-field">
                    <label for="fc-${esc(row.id)}-end">End Year</label>
                    <input type="number" id="fc-${esc(row.id)}-end" class="qg-input-field" min="1" step="1"
                        data-row-id="${esc(row.id)}" data-field="endYear" value="${esc(row.endYear)}">
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-remove-cost="${esc(row.id)}"
                        aria-label="Remove future cost">Remove</button>
                </div>
            </div>`).join('')
            : '<p class="qg-empty-note">No future costs. Add O&amp;M, insurance or replacement provisions here.</p>';

        bindRows(container, api, (state, rowId, field, value) => {
            state.savings.futureCosts = (state.savings.futureCosts || [])
                .map(row => row.id === rowId ? Object.assign({}, row, { [field]: value }) : row);
            return state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';
        container.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-cost]');
            if (button) api.update(state => Model.removeFutureCost(state, button.dataset.removeCost));
        });
    }

    // ---------------------------------------------------------------------
    // Mixed installation areas
    // ---------------------------------------------------------------------

    function renderMixedLocations(state, derived, api) {
        const container = byId('qgMixedLocationRows');
        const total = byId('qgMixedLocationTotal');
        if (!container) return;

        const rows = state.project.mixedLocations || [];

        container.innerHTML = rows.length ? rows.map(row => `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="ml-${esc(row.id)}-type">Location Type</label>
                    <select id="ml-${esc(row.id)}-type" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="locationType">
                        ${options(Config.INSTALLATION_LOCATIONS.filter(item => item.id !== 'mixed'),
                            row.locationType, 'id', 'label')}
                    </select>
                </div>
                <div class="qg-row-field">
                    <label for="ml-${esc(row.id)}-cap">Allocated Capacity (kWp)</label>
                    <input type="number" id="ml-${esc(row.id)}-cap" class="qg-input-field" min="0" step="0.01"
                        data-row-id="${esc(row.id)}" data-field="capacityKwp" value="${esc(row.capacityKwp)}">
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-remove-location="${esc(row.id)}"
                        aria-label="Remove installation area">Remove</button>
                </div>
            </div>`).join('')
            : '<p class="qg-empty-note">Add one area per installation type.</p>';

        if (total) {
            const allocated = derived.mixedLocationTotalKwp;
            const approved = Number(state.project.dcCapacityKwp) || 0;
            const matches = approved > 0
                && Math.abs(allocated - approved) <= Calc.capacityTolerance(approved);

            total.textContent = `Allocated ${allocated} kWp of ${approved} kWp project capacity.`;
            total.setAttribute('data-state', approved > 0 && !matches ? 'error' : 'ok');
        }

        bindRows(container, api, (state, rowId, field, value) => {
            state.project.mixedLocations = (state.project.mixedLocations || [])
                .map(row => row.id === rowId ? Object.assign({}, row, { [field]: value }) : row);
            return state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';
        container.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-location]');
            if (button) api.update(state => Model.removeMixedLocation(state, button.dataset.removeLocation));
        });
    }

    // ---------------------------------------------------------------------
    // Clause editors
    // ---------------------------------------------------------------------

    const CLAUSE_LISTS = [
        { key: 'terms', title: 'Terms and Conditions' },
        { key: 'inclusions', title: 'Scope Inclusions' },
        { key: 'exclusions', title: 'Scope Exclusions' }
    ];

    function renderClauses(state, api) {
        const container = byId('qgClauseEditors');
        if (!container) return;

        container.innerHTML = CLAUSE_LISTS.map(list => {
            const clauses = state.contract[list.key] || [];
            let printedNumber = 0;

            return `
                <div class="qg-clause-list">
                    <div class="qg-clause-head">
                        <h4>${esc(list.title)}</h4>
                        <div class="qg-inline-actions" style="margin-bottom:0;">
                            <button type="button" class="qg-btn-ghost" data-clause-add="${esc(list.key)}">Add Clause</button>
                            <button type="button" class="qg-btn-ghost" data-clause-restore="${esc(list.key)}">Restore Standard Defaults</button>
                        </div>
                    </div>
                    ${clauses.map(clause => {
                        const included = clause.include !== false && String(clause.text).trim();
                        if (included) printedNumber += 1;

                        return `
                        <div class="qg-clause-row" data-included="${clause.include !== false}">
                            <span class="qg-clause-number">${included ? printedNumber : '—'}</span>
                            <textarea class="qg-input-field" rows="2" aria-label="Clause text"
                                data-clause-list="${esc(list.key)}" data-clause-id="${esc(clause.id)}"
                                data-clause-field="text">${esc(clause.text)}</textarea>
                            <div class="qg-row-actions" style="flex-direction:column;align-items:flex-start;">
                                <label class="qg-clause-toggle">
                                    <input type="checkbox" data-clause-list="${esc(list.key)}"
                                        data-clause-id="${esc(clause.id)}" data-clause-field="include"
                                        ${clause.include !== false ? 'checked' : ''}>
                                    Include
                                </label>
                                <button type="button" class="qg-btn-ghost qg-btn-danger"
                                    data-clause-remove="${esc(clause.id)}" data-clause-list="${esc(list.key)}"
                                    aria-label="Delete clause">Delete</button>
                            </div>
                        </div>`;
                    }).join('')}
                    ${clauses.length ? '' : '<p class="qg-empty-note">No clauses in this list.</p>'}
                </div>`;
        }).join('');

        if (container.dataset.bound === 'true') return;
        container.dataset.bound = 'true';

        function updateClause(listName, clauseId, field, value) {
            return state => {
                state.contract[listName] = (state.contract[listName] || [])
                    .map(clause => clause.id === clauseId
                        ? Object.assign({}, clause, { [field]: value })
                        : clause);
                return state;
            };
        }

        container.addEventListener('input', event => {
            const field = event.target.closest('textarea[data-clause-id]');
            if (!field) return;
            api.patch(updateClause(field.dataset.clauseList, field.dataset.clauseId, 'text', field.value));
        });

        container.addEventListener('change', event => {
            const box = event.target.closest('input[type="checkbox"][data-clause-id]');
            if (!box) return;
            // Re-render so the printed numbering shifts immediately.
            api.update(updateClause(box.dataset.clauseList, box.dataset.clauseId, 'include', box.checked));
        });

        container.addEventListener('click', event => {
            const add = event.target.closest('[data-clause-add]');
            if (add) {
                api.update(state => Model.addClause(state, add.dataset.clauseAdd, ''));
                return;
            }

            const restore = event.target.closest('[data-clause-restore]');
            if (restore) {
                if (api.confirm('Replace this list with the Ray2Volt standard clauses? Your edits to this list will be lost.')) {
                    api.update(state => Model.restoreClauses(state, restore.dataset.clauseRestore));
                }
                return;
            }

            const remove = event.target.closest('[data-clause-remove]');
            if (remove && api.confirm('Delete this clause?')) {
                api.update(state => Model.removeClause(state, remove.dataset.clauseList, remove.dataset.clauseRemove));
            }
        });
    }

    // ---------------------------------------------------------------------
    // Annexures
    // ---------------------------------------------------------------------

    function renderAnnexures(state, api) {
        const container = byId('qgAnnexureRows');
        if (!container) return;

        const rows = state.annexures || [];

        container.innerHTML = rows.length ? rows.map(row => `
            <div class="qg-repeater-row" data-row="${esc(row.id)}">
                <div class="qg-row-field" style="grid-column:span 2;">
                    <label for="an-${esc(row.id)}-title">Annexure Title</label>
                    <input type="text" id="an-${esc(row.id)}-title" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="title" value="${esc(row.title)}">
                </div>
                <div class="qg-row-field">
                    <label for="an-${esc(row.id)}-type">Type</label>
                    <select id="an-${esc(row.id)}-type" class="qg-input-field"
                        data-row-id="${esc(row.id)}" data-field="type">
                        ${options(Config.ANNEXURE_TYPES, row.type, 'id', 'label')}
                    </select>
                </div>
                <div class="qg-row-field">
                    <label for="an-${esc(row.id)}-include">Include</label>
                    <label class="qg-clause-toggle">
                        <input type="checkbox" id="an-${esc(row.id)}-include"
                            data-row-id="${esc(row.id)}" data-field="include"
                            ${row.include ? 'checked' : ''}>
                        In proposal
                    </label>
                </div>
                <div class="qg-row-field" style="grid-column:span 3;">
                    <span class="qg-annexure-meta">Order ${row.order} · ${esc(row.fileName || 'no file')}
                        · ${esc(row.fileType || 'unknown type')}
                        · ${row.pageCount} ${row.pageCount === 1 ? 'page' : 'pages'}</span>
                </div>
                <div class="qg-row-actions">
                    <button type="button" class="qg-btn-ghost qg-btn-danger" data-remove-annexure="${esc(row.id)}"
                        aria-label="Remove annexure">Remove</button>
                </div>
            </div>`).join('')
            : '<p class="qg-empty-note">No annexures. Uploaded drawings, datasheets and photographs appear here.</p>';

        bindRows(container, api, (state, rowId, field, value) => {
            state.annexures = (state.annexures || [])
                .map(row => row.id === rowId ? Object.assign({}, row, { [field]: value }) : row);
            return state;
        });

        if (container.dataset.clickBound === 'true') return;
        container.dataset.clickBound = 'true';
        container.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-annexure]');
            if (button && api.confirm('Remove this annexure and its stored file?')) {
                api.removeAnnexure(button.dataset.removeAnnexure);
            }
        });
    }

    // ---------------------------------------------------------------------

    /**
     * Updates only the derived read-outs inside the panels: the running totals,
     * the calculated milestone amounts and the reconciliation cards.
     *
     * This is what runs while the user is typing. Rebuilding the whole panel on
     * every keystroke would destroy the caret position, but the spec requires
     * the running totals to track the input live, so they are refreshed in
     * place instead.
     */
    function refreshTotals(state, derived, api) {
        const commercial = derived.commercial;

        commercial.milestones.forEach(row => {
            const cell = document.querySelector(`[data-milestone-amount="${row.id}"]`);
            if (cell) cell.textContent = money(row.amount);
        });

        const milestoneTotal = byId('qgMilestoneTotal');
        if (milestoneTotal) {
            const ok = Calc.withinPercentTolerance(commercial.milestonePercentTotal);
            milestoneTotal.textContent = `Milestones total ${commercial.milestonePercentTotal}%`
                + (ok ? '.' : ' — they must total 100%.');
            milestoneTotal.setAttribute('data-state', ok ? 'ok' : 'error');
        }

        const discountTotal = byId('qgDiscountTotal');
        if (discountTotal) {
            discountTotal.textContent = `Total discount ${money(commercial.discountTotal)}. `
                + `Final offered price ${money(commercial.finalPrice)}.`;
            discountTotal.setAttribute('data-state',
                commercial.discountTotal > commercial.actualProjectCost
                    && commercial.actualProjectCost > 0 ? 'error' : 'ok');
        }

        const breakdownTotal = byId('qgBreakdownTotal');
        if (breakdownTotal && commercial.hasBreakdown) {
            breakdownTotal.textContent = `Breakdown total ${money(commercial.breakdownTotal)} `
                + `against Actual Project Cost ${money(commercial.actualProjectCost)}.`;
            breakdownTotal.setAttribute('data-state', commercial.breakdownMatches ? 'ok' : 'warning');
        }

        const consumptionTotals = byId('qgConsumptionTotals');
        if (consumptionTotals) {
            const consumption = derived.consumption;
            consumptionTotals.textContent = `Annual import ${consumption.annualKwh.toLocaleString('en-IN')} kWh · `
                + `annual bill ${money(consumption.annualBill)} · `
                + `average tariff ₹${consumption.averageTariff}/kWh · `
                + `peak demand ${consumption.maxDemandKva} kVA.`;
        }

        const locationTotal = byId('qgMixedLocationTotal');
        if (locationTotal) {
            const allocated = derived.mixedLocationTotalKwp;
            const approved = Number(state.project.dcCapacityKwp) || 0;
            const matches = approved > 0
                && Math.abs(allocated - approved) <= Calc.capacityTolerance(approved);
            locationTotal.textContent = `Allocated ${allocated} kWp of ${approved} kWp project capacity.`;
            locationTotal.setAttribute('data-state', approved > 0 && !matches ? 'error' : 'ok');
        }

        renderReconciliation(state, derived, api);
    }

    function renderAll(state, derived, api) {
        renderSectionChecklist(state, api);
        renderNarrative(state, api);
        renderBom(state, api);
        renderReconciliation(state, derived, api);
        renderBreakdown(state, derived, api);
        renderDiscounts(state, derived, api);
        renderMilestones(state, derived, api);
        renderMonthlyRows(state, derived, api);
        renderFutureCosts(state, api);
        renderMixedLocations(state, derived, api);
        renderClauses(state, api);
        renderAnnexures(state, api);
    }

    return {
        renderAll,
        refreshTotals,
        renderSectionChecklist,
        renderNarrative,
        renderBom,
        renderReconciliation,
        renderBreakdown,
        renderDiscounts,
        renderMilestones,
        renderMonthlyRows,
        renderFutureCosts,
        renderMixedLocations,
        renderClauses,
        renderAnnexures,
        esc,
        money
    };
}));
