/** Focused Comprehensive editors. All fields and existing event bindings stay in place. */
(function (root) {
    'use strict';

    const STEPS = [
        ['customer', 'Customer', 'Customer details', 'Contact, company and site addresses.'],
        ['project', 'Project', 'Project settings', 'Document details and the approved system configuration.'],
        ['narrative', 'Project scope', 'Project description & scope', 'Describe the site, the proposed solution and customer requirements.'],
        ['bom', 'Equipment', 'Bill of materials', 'Review equipment, specifications and quantities by category.'],
        ['commercial', 'Commercials', 'Commercial offer', 'Set the price, discounts and payment milestones.'],
        ['savings', 'Savings', 'Savings projections', 'Review generation, consumption and financial assumptions.'],
        ['contract', 'Terms & scope', 'Terms, inclusions & exclusions', 'Review the clauses included in this quotation.'],
        ['sections', 'Proposal pages', 'Proposal sections', 'Choose the sections to include in the final document.'],
        ['annexures', 'Attachments', 'Annexures', 'Add drawings, datasheets and supporting documents.']
    ];

    let active = 'customer';
    let host;
    let nav;
    let picker;

    function refresh() {
        [['qgBomCategories', '.qg-bom-category', 'Equipment category'],
            ['qgClauseEditors', '.qg-clause-list', 'Clause group']].forEach(([id, selector, label]) => {
            const container = document.getElementById(id);
            if (!container) return;
            const groups = Array.from(container.querySelectorAll(selector));
            if (!groups.length) return;
            const field = document.createElement('div');
            field.className = 'qg-collection-picker';
            const input = document.createElement('select');
            input.className = 'qg-input-field';
            input.id = `${id}Picker`;
            const caption = document.createElement('label');
            caption.htmlFor = input.id;
            caption.textContent = label;
            groups.forEach((group, index) => input.add(new Option(group.querySelector('h4').textContent, String(index))));
            input.add(new Option('Show all', 'all'));
            input.value = container.dataset.selection || '0';
            if (!input.value) input.value = '0';
            const show = () => {
                container.dataset.selection = input.value;
                groups.forEach((group, index) => { group.hidden = input.value !== 'all' && Number(input.value) !== index; });
            };
            input.addEventListener('change', show);
            field.append(caption, input);
            container.prepend(field);
            show();
        });
    }

    function revealGroups(name) {
        const panel = document.getElementById(`qgPanel-${name}`);
        if (!panel) return;
        panel.querySelectorAll('.qg-collection-picker select').forEach(input => {
            input.value = 'all';
            input.dispatchEvent(new Event('change'));
        });
    }

    function select(name, focus) {
        if (!host || !STEPS.some(step => step[0] === name)) return;
        active = name;
        host.querySelectorAll('.qg-panel').forEach(panel => {
            const current = panel.dataset.panel === name;
            panel.hidden = !current;
            panel.querySelector('.qg-panel-body').hidden = false;
            panel.querySelector('.qg-panel-toggle').setAttribute('aria-expanded', 'true');
        });
        nav.querySelectorAll('[data-editor-step]').forEach(button => {
            const current = button.dataset.editorStep === name;
            button.setAttribute('aria-current', current ? 'step' : 'false');
        });
        picker.value = name;
        const index = STEPS.findIndex(step => step[0] === name);
        const previous = document.getElementById('qgEditorPrevious');
        const next = document.getElementById('qgEditorNext');
        previous.hidden = index === 0;
        previous.textContent = index > 0 ? `Back: ${STEPS[index - 1][1]}` : 'Back';
        next.textContent = index < STEPS.length - 1 ? `Next: ${STEPS[index + 1][1]}` : 'Review proposal';
        document.getElementById('qgEditorProgress').textContent = `${index + 1} of ${STEPS.length}`;
        if (focus) {
            const heading = document.getElementById(`qgPanelToggle-${name}`);
            heading.focus({ preventScroll: true });
            const target = picker.offsetParent ? picker.parentElement : host;
            target.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }

    function init() {
        host = document.getElementById('qgAccordion');
        if (!host) return;
        const layout = document.createElement('div');
        layout.className = 'qg-editor-layout';
        host.before(layout);
        nav = document.createElement('nav');
        nav.className = 'qg-editor-nav';
        nav.setAttribute('aria-label', 'Quotation inputs');
        nav.innerHTML = '<p class="qg-editor-nav-label">Build your quotation</p>' + STEPS.map((step, index) =>
            `<button type="button" class="qg-editor-step" data-editor-step="${step[0]}" aria-controls="qgPanel-${step[0]}">
                <span class="qg-editor-step-number">${String(index + 1).padStart(2, '0')}</span>
                <span>${step[1]}</span><span class="qg-editor-step-status" aria-hidden="true"></span>
            </button>`).join('');
        const main = document.createElement('div');
        main.className = 'qg-editor-main';
        const mobile = document.createElement('div');
        mobile.className = 'qg-editor-mobile';
        mobile.innerHTML = '<label for="qgEditorPicker">Editing section</label><select class="qg-input-field" id="qgEditorPicker">'
            + STEPS.map((step, index) => `<option value="${step[0]}">${index + 1}. ${step[2]}</option>`).join('') + '</select>';
        main.append(mobile, host);
        layout.append(nav, main);
        picker = document.getElementById('qgEditorPicker');
        const footer = document.createElement('div');
        footer.className = 'qg-editor-footer';
        footer.innerHTML = '<button type="button" class="qg-btn-ghost" id="qgEditorPrevious">Back</button>'
            + '<span id="qgEditorProgress"></span><button type="button" class="qg-btn-primary" id="qgEditorNext">Next</button>';
        main.append(footer);
        STEPS.forEach(step => {
            const panel = host.querySelector(`[data-panel="${step[0]}"]`);
            const button = panel.querySelector('.qg-panel-toggle');
            const description = document.createElement('p');
            description.className = 'qg-editor-description';
            description.textContent = step[3];
            button.parentElement.after(description);
            const reset = panel.querySelector('.qg-panel-reset');
            if (reset) panel.querySelector('.qg-panel-body').append(reset);
        });
        // Existing validation links use the same route, so an error always reveals its editor.
        nav.addEventListener('click', event => {
            const button = event.target.closest('[data-editor-step]');
            if (button) select(button.dataset.editorStep, true);
        });
        picker.addEventListener('change', () => select(picker.value, true));
        document.getElementById('qgEditorPrevious').addEventListener('click', () => {
            const index = STEPS.findIndex(step => step[0] === active);
            if (index > 0) select(STEPS[index - 1][0], true);
        });
        document.getElementById('qgEditorNext').addEventListener('click', () => {
            const index = STEPS.findIndex(step => step[0] === active);
            if (index < STEPS.length - 1) select(STEPS[index + 1][0], true);
            else document.getElementById('qgWorkspacePreviewTab').click();
        });
        // Panel headings now identify the active editor instead of collapsing its fields.
        host.addEventListener('click', event => {
            if (!event.target.closest('.qg-panel-toggle')) return;
            event.stopImmediatePropagation();
        }, true);
        const syncStatus = () => STEPS.forEach(step => {
            const state = host.querySelector(`[data-panel="${step[0]}"] .qg-panel-state`);
            const button = nav.querySelector(`[data-editor-step="${step[0]}"]`);
            button.dataset.state = state ? state.dataset.state : '';
            button.setAttribute('aria-label', `${step[1]}: ${state ? state.textContent : ''}`);
        });
        new MutationObserver(syncStatus).observe(host, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
        const customerBody = document.getElementById('qgPanel-customer');
        const customerType = customerBody.querySelector('.qg-input-group');
        customerBody.querySelector('.qg-field-grid').prepend(customerType);
        syncStatus();
        select(active, false);
    }

    root.QuoteGeneratorInputNavigation = { init, select, refresh, revealGroups };
}(typeof self !== 'undefined' ? self : this));
