/**
 * Quote Generator - Comprehensive mode controller
 * Ray2Volt Solar Toolbox
 *
 * Owns the Comprehensive workspace: the mode toggle, the Inputs/Preview tabs,
 * the accordion, two-way binding for the fixed fields, validation display,
 * presets and autosave. The dynamic panel bodies are rendered by
 * quote-generator-editors.js and the document itself by
 * quote-generator-preview.js.
 *
 * The Short Quotation form is deliberately untouched. This controller only
 * shows or hides it, and copies the shared field values across on a mode
 * switch so nothing the salesperson typed is lost.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const Config = window.QuoteGeneratorConfig;
        const Model = window.QuoteGeneratorModel;
        const Calc = window.QuoteGeneratorCalc;
        const Storage = window.QuoteGeneratorStorage;
        const Editors = window.QuoteGeneratorEditors;
        const Preview = window.QuoteGeneratorPreview;
        const Annexures = window.QuoteGeneratorAnnexures;

        if (!Config || !Model || !Calc || !Storage || !Editors) {
            console.error('Comprehensive quote generator modules failed to load.');
            return;
        }

        const byId = id => document.getElementById(id);

        const refs = {
            modeShort: byId('qgModeShort'),
            modeComprehensive: byId('qgModeComprehensive'),
            presetGroup: byId('qgPresetGroup'),
            preset: byId('qgPreset'),
            saveStatus: byId('qgSaveStatus'),
            newQuotation: byId('qgNewQuotation'),
            workspaceTabs: byId('qgWorkspaceTabs'),
            inputsTab: byId('qgWorkspaceInputsTab'),
            previewTab: byId('qgWorkspacePreviewTab'),
            shortWorkspace: byId('qgShortWorkspace'),
            comprehensiveWorkspace: byId('qgComprehensiveWorkspace'),
            comprehensiveInputs: byId('qgComprehensiveInputs'),
            previewWorkspace: byId('qgComprehensivePreviewWorkspace'),
            accordion: byId('qgAccordion'),
            validationSummary: byId('qgValidationSummary'),
            validationList: byId('qgValidationList'),
            pageEstimate: byId('qgPageEstimate'),
            shortPreview: byId('quotePreview')
        };

        let state = null;
        let derived = null;
        let validation = null;
        let suspendBinding = false;

        const autosave = Storage.createAutosave({
            onStatus(status) {
                if (!refs.saveStatus) return;

                const labels = {
                    saving: 'Saving…',
                    saved: 'Saved locally',
                    failed: 'Save failed'
                };

                refs.saveStatus.dataset.state = status;
                refs.saveStatus.textContent = labels[status] || 'Draft not saved yet';
            }
        });

        // -----------------------------------------------------------------
        // State plumbing
        // -----------------------------------------------------------------

        const api = {
            /** Apply a mutation, then revalidate and re-render everything. */
            update(mutator) {
                mutator(state);
                refresh();
                autosave.schedule(state);
            },
            /**
             * Apply a mutation without rebuilding the panel that raised it, so
             * the caret stays put while the user is typing. Derived readouts and
             * validation still refresh.
             */
            patch(mutator) {
                mutator(state);
                recompute();
                renderValidation();
                renderDerivedReadouts();
                Editors.refreshTotals(state, derived, api);
                renderPageEstimate();
                if (Preview) Preview.invalidate();
                autosave.schedule(state);
            },
            confirm(message) {
                return window.confirm(message);
            },
            removeAnnexure(annexureId) {
                if (Annexures) {
                    Annexures.remove(annexureId, state, api);
                } else {
                    api.update(s => Model.removeAnnexure(s, annexureId));
                }
            },
            getState() {
                return state;
            },
            getDerived() {
                return derived;
            },
            getValidation() {
                return validation;
            },
            /**
             * Re-render and save. Used by callers that have already mutated
             * state directly and asynchronously — the annexure module, whose
             * uploads and PDF page counts resolve after the fact. `refresh`
             * alone only redraws, so persisting has to be explicit here or the
             * attachment metadata never reaches the saved draft.
             */
            persist() {
                refresh();
                autosave.schedule(state);
            },
            refresh
        };

        function recompute() {
            derived = Calc.derived(state);
            validation = Calc.validate(state);
        }

        function refresh() {
            recompute();
            syncConditionalVisibility();
            writeFieldsFromState();
            Editors.renderAll(state, derived, api);
            renderValidation();
            renderDerivedReadouts();
            renderPageEstimate();

            if (Preview) Preview.invalidate();
        }

        // -----------------------------------------------------------------
        // Two-way binding for the fixed fields
        // -----------------------------------------------------------------

        function pathGet(object, path) {
            return path.split('.').reduce((current, key) =>
                (current === null || current === undefined) ? current : current[key], object);
        }

        function pathSet(object, path, value) {
            const keys = path.split('.');
            const last = keys.pop();
            const target = keys.reduce((current, key) => current[key], object);
            target[last] = value;
        }

        function boundFields() {
            return Array.prototype.slice.call(document.querySelectorAll('[data-bind]'));
        }

        function readControl(control) {
            if (control.type === 'checkbox') return control.checked;
            if (control.type === 'number') {
                return control.value === '' ? 0 : parseFloat(control.value);
            }
            return control.value;
        }

        function writeFieldsFromState() {
            suspendBinding = true;

            boundFields().forEach(control => {
                const value = pathGet(state, control.dataset.bind);

                if (control.type === 'checkbox') {
                    control.checked = Boolean(value);
                } else if (document.activeElement !== control) {
                    control.value = value === null || value === undefined ? '' : value;
                }
            });

            const ratio = byId('cqDcAcRatio');
            if (ratio) {
                ratio.value = derived.dcAcRatio > 0 ? `${derived.dcAcRatio} : 1` : '—';
            }

            suspendBinding = false;
        }

        function bindFixedFields() {
            boundFields().forEach(control => {
                const eventName = (control.tagName === 'SELECT' || control.type === 'checkbox')
                    ? 'change'
                    : 'input';

                control.addEventListener(eventName, () => {
                    if (suspendBinding) return;

                    const path = control.dataset.bind;
                    pathSet(state, path, readControl(control));

                    if (path === 'project.proposalTitle') {
                        state.project.proposalTitleTouched = true;
                    }

                    // These change what else is visible or what defaults apply,
                    // so they need the full re-render.
                    const structural = [
                        'customer.customerType',
                        'customer.sameAsBilling',
                        'project.systemConfiguration',
                        'project.installationLocation',
                        'savings.consumptionMethod'
                    ];

                    if (structural.indexOf(path) !== -1) {
                        if (path === 'project.systemConfiguration') {
                            onConfigurationChanged();
                        }
                        api.update(() => state);
                    } else {
                        maybeRegenerateTitle();
                        api.patch(() => state);
                    }
                });
            });
        }

        /**
         * A configuration change drops sections that no longer apply (battery on
         * an On-Grid plant) and reloads narrative defaults for untouched fields.
         * Entered data is never discarded.
         */
        function onConfigurationChanged() {
            state.selectedSectionIds = Config.orderSectionIds(
                state.selectedSectionIds.filter(id => {
                    const section = Config.getSection(id);
                    return !section
                        || !section.configurations
                        || section.configurations.indexOf(state.project.systemConfiguration) !== -1;
                })
            );

            if (state.project.systemConfiguration === 'Hybrid') {
                const battery = Config.getSection('battery-technology');
                if (battery && state.selectedSectionIds.indexOf(battery.id) === -1) {
                    Model.toggleSection(state, battery.id, true);
                }
            }

            Model.applyNarrativeDefaults(state);
        }

        function maybeRegenerateTitle() {
            if (state.project.proposalTitleTouched) return;

            const capacity = Number(state.project.dcCapacityKwp) || 0;
            const configuration = state.project.systemConfiguration;

            state.project.proposalTitle = capacity > 0
                ? `${capacity} kWp ${configuration} Solar Power Plant — Techno-Commercial Proposal`
                : `${configuration} Solar Power Plant — Techno-Commercial Proposal`;
        }

        function syncConditionalVisibility() {
            const isCompany = state.customer.customerType === 'company';
            const isHybrid = state.project.systemConfiguration === 'Hybrid';
            const isMixed = state.project.installationLocation === 'mixed';
            const isDetailed = state.savings.consumptionMethod === 'detailed';

            // Hidden company/individual fields keep their stored values; only
            // their containers are hidden.
            toggleAll('.qg-customer-company', isCompany);
            toggleAll('.qg-customer-individual', !isCompany);
            toggleAll('.qg-hybrid-only', isHybrid);
            toggleAll('.qg-mixed-only', isMixed);

            const siteGroup = byId('cqSiteAddressGroup');
            if (siteGroup) siteGroup.hidden = Boolean(state.customer.sameAsBilling);

            const simple = byId('qgConsumptionSimple');
            const detailed = byId('qgConsumptionDetailed');
            if (simple) simple.hidden = isDetailed;
            if (detailed) detailed.hidden = !isDetailed;
        }

        function toggleAll(selector, visible) {
            Array.prototype.forEach.call(document.querySelectorAll(selector), element => {
                element.hidden = !visible;
            });
        }

        // -----------------------------------------------------------------
        // Validation display
        // -----------------------------------------------------------------

        const PANEL_LABELS = {
            sections: 'Proposal Sections',
            customer: 'Customer Details',
            project: 'Project Settings',
            narrative: 'Project Description & Scope',
            bom: 'Bill of Materials',
            commercial: 'Commercial Offer',
            savings: 'Savings Projections',
            contract: 'Terms, Inclusions & Exclusions',
            annexures: 'Annexures'
        };

        const STATE_LABELS = {
            complete: 'Complete',
            incomplete: 'Incomplete',
            error: 'Error'
        };

        function renderValidation() {
            Object.keys(validation.panels).forEach(panel => {
                const badge = document.querySelector(`.qg-panel[data-panel="${panel}"] .qg-panel-state`);
                if (!badge) return;

                const value = validation.panels[panel];
                badge.dataset.state = value;
                badge.textContent = STATE_LABELS[value];
            });

            if (!refs.validationSummary || !refs.validationList) return;

            const issues = validation.issues;

            if (!issues.length) {
                refs.validationSummary.hidden = true;
                refs.validationList.innerHTML = '';
                return;
            }

            refs.validationSummary.hidden = false;
            refs.validationSummary.dataset.severity = validation.hasCriticalErrors ? 'critical' : 'warning';

            const title = refs.validationSummary.querySelector('.qg-validation-title');
            if (title) {
                title.textContent = validation.hasCriticalErrors
                    ? `${validation.criticalIssues.length} issue${validation.criticalIssues.length === 1 ? '' : 's'} must be fixed before exporting`
                    : `${issues.length} thing${issues.length === 1 ? '' : 's'} to check`;
            }

            refs.validationList.innerHTML = issues.map(item => `
                <li>
                    <span class="qg-validation-badge" data-severity="${item.severity}">${
                        item.severity === 'critical' ? 'Error' : 'Check'}</span>
                    <button type="button" class="qg-validation-link" data-goto-panel="${Editors.esc(item.panel)}">
                        ${Editors.esc(PANEL_LABELS[item.panel] || item.panel)}: ${Editors.esc(item.message)}
                    </button>
                </li>`).join('');
        }

        function renderDerivedReadouts() {
            const utilization = byId('qgUtilizationTotal');

            if (utilization) {
                const total = Number(state.savings.selfConsumptionPercent)
                    + Number(state.savings.exportPercent);
                const ok = Calc.withinPercentTolerance(total);

                utilization.textContent = `Self-consumption plus export totals ${Math.round(total * 100) / 100}%`
                    + (ok ? '.' : ' — it must total 100%.');
                utilization.setAttribute('data-state', ok ? 'ok' : 'error');
            }

            const ratio = byId('cqDcAcRatio');
            if (ratio) ratio.value = derived.dcAcRatio > 0 ? `${derived.dcAcRatio} : 1` : '—';
        }

        function renderPageEstimate() {
            if (!refs.pageEstimate) return;

            const pages = Calc.planPages(state);
            const annexurePages = pages.filter(page => page.group === 'Annexures').length;

            refs.pageEstimate.textContent = annexurePages
                ? `${pages.length} pages (${pages.length - annexurePages} + ${annexurePages} annexure)`
                : `${pages.length} pages`;
        }

        function openPanel(panelName, focus) {
            const toggle = byId(`qgPanelToggle-${panelName}`);
            const body = byId(`qgPanel-${panelName}`);
            if (!toggle || !body) return;

            toggle.setAttribute('aria-expanded', 'true');
            body.hidden = false;

            if (focus !== false) {
                toggle.focus();
                toggle.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // -----------------------------------------------------------------
        // Accordion
        // -----------------------------------------------------------------

        /**
         * Adds a Reset Panel control to the top of every panel body. Injected
         * here rather than written into the markup nine times, so the control
         * and its confirmation stay in one place.
         */
        function setupPanelReset() {
            if (!refs.accordion) return;

            Array.prototype.forEach.call(refs.accordion.querySelectorAll('.qg-panel'), panel => {
                const name = panel.dataset.panel;
                const body = panel.querySelector('.qg-panel-body');
                if (!name || !body) return;

                const bar = document.createElement('div');
                bar.className = 'qg-inline-actions qg-panel-reset';
                bar.innerHTML = `<button type="button" class="qg-btn-ghost qg-btn-danger"
                    data-reset-panel="${Editors.esc(name)}">Reset Current Panel</button>`;
                body.insertBefore(bar, body.firstChild);
            });

            refs.accordion.addEventListener('click', event => {
                const button = event.target.closest('[data-reset-panel]');
                if (!button) return;

                const name = button.dataset.resetPanel;
                const label = PANEL_LABELS[name] || name;

                if (!window.confirm(`Reset "${label}" to its defaults? Everything entered in this panel will be lost. Other panels are unaffected.`)) {
                    return;
                }

                if (name === 'annexures') {
                    Storage.clearAnnexureFiles().catch(() => null);
                }

                api.update(s => Model.resetPanel(s, name));
            });
        }

        function setupAccordion() {
            if (!refs.accordion) return;

            refs.accordion.addEventListener('click', event => {
                const toggle = event.target.closest('.qg-panel-toggle');
                if (!toggle) return;

                const body = byId(toggle.getAttribute('aria-controls'));
                const expanded = toggle.getAttribute('aria-expanded') === 'true';

                toggle.setAttribute('aria-expanded', String(!expanded));
                if (body) body.hidden = expanded;
            });

            const setAll = expanded => {
                Array.prototype.forEach.call(
                    refs.accordion.querySelectorAll('.qg-panel-toggle'),
                    toggle => {
                        toggle.setAttribute('aria-expanded', String(expanded));
                        const body = byId(toggle.getAttribute('aria-controls'));
                        if (body) body.hidden = !expanded;
                    }
                );
            };

            const expandAll = byId('qgExpandAll');
            const collapseAll = byId('qgCollapseAll');
            if (expandAll) expandAll.addEventListener('click', () => setAll(true));
            if (collapseAll) collapseAll.addEventListener('click', () => setAll(false));

            document.addEventListener('click', event => {
                const link = event.target.closest('[data-goto-panel]');
                if (link) openPanel(link.dataset.gotoPanel);
            });
        }

        // -----------------------------------------------------------------
        // Mode and workspace switching
        // -----------------------------------------------------------------

        /**
         * Fields that exist in both forms. On a mode switch these are copied
         * from the mode being left to the mode being entered, so the last value
         * typed follows the user across the toggle.
         */
        const SHARED_FIELDS = [
            { short: 'qgCustomerName', get: s => s.customer.customerType === 'company' ? s.customer.companyName : s.customer.customerName, set: (s, v) => { if (s.customer.customerType === 'company') s.customer.companyName = v; else s.customer.customerName = v; } },
            { short: 'qgCustomerPhone', get: s => s.customer.phone, set: (s, v) => { s.customer.phone = v; } },
            { short: 'qgCustomerAddress', get: s => s.customer.billingAddress, set: (s, v) => { s.customer.billingAddress = v; } },
            { short: 'qgCustomerGstin', get: s => s.customer.gstin, set: (s, v) => { s.customer.gstin = v; } },
            { short: 'qgQuoteDate', get: s => s.project.quoteDate, set: (s, v) => { s.project.quoteDate = v; } },
            { short: 'qgQuoteNumber', get: s => s.project.quoteNumber, set: (s, v) => { s.project.quoteNumber = v; } },
            { short: 'qgSystemCapacity', get: s => s.project.dcCapacityKwp, set: (s, v) => { s.project.dcCapacityKwp = parseFloat(v) || 0; }, numeric: true },
            { short: 'qgInstallationType', get: s => s.project.systemConfiguration, set: (s, v) => { s.project.systemConfiguration = v; } },
            { short: 'qgTotalPrice', get: s => s.commercial.actualProjectCost, set: (s, v) => { s.commercial.actualProjectCost = parseFloat(v) || 0; }, numeric: true },
            { short: 'qgGstType', get: s => s.commercial.gstType, set: (s, v) => { s.commercial.gstType = v; } },
            { short: 'qgGstRate', get: s => s.commercial.gstRate, set: (s, v) => { s.commercial.gstRate = parseFloat(v) || 0; }, numeric: true },
            { short: 'qgTariffRate', get: s => s.savings.tariffRate, set: (s, v) => { s.savings.tariffRate = parseFloat(v) || 0; }, numeric: true },
            { short: 'qgUnitsPerKwp', get: s => s.savings.annualGenerationPerKwp, set: (s, v) => { s.savings.annualGenerationPerKwp = parseFloat(v) || 0; }, numeric: true }
        ];

        function hasValue(value, numeric) {
            if (numeric) return Number(value) > 0;
            return String(value === null || value === undefined ? '' : value).trim() !== '';
        }

        function pullFromShortForm() {
            SHARED_FIELDS.forEach(field => {
                const control = byId(field.short);
                if (!control) return;
                if (hasValue(control.value, field.numeric)) field.set(state, control.value);
            });

            // The Short discount field maps onto the first named discount row.
            const discount = byId('qgDiscountAmount');
            if (discount && Number(discount.value) > 0) {
                if (!state.commercial.discounts.length) Model.addDiscount(state);
                state.commercial.discounts[0].amount = parseFloat(discount.value) || 0;
                if (!state.commercial.discounts[0].name) {
                    state.commercial.discounts[0].name = 'Discount';
                }
            }

            maybeRegenerateTitle();
        }

        function pushToShortForm() {
            SHARED_FIELDS.forEach(field => {
                const control = byId(field.short);
                if (!control) return;

                const value = field.get(state);
                if (!hasValue(value, field.numeric)) return;

                control.value = value;
                control.dispatchEvent(new Event('change', { bubbles: true }));
            });

            const discount = byId('qgDiscountAmount');
            if (discount && derived.commercial.discountTotal > 0) {
                discount.value = derived.commercial.discountTotal;
            }
        }

        function setMode(mode, options) {
            const settings = options || {};
            const isComprehensive = mode === Config.MODES.COMPREHENSIVE;

            if (!settings.silent) {
                if (isComprehensive) pullFromShortForm(); else pushToShortForm();
            }

            state.mode = mode;

            if (refs.modeShort) {
                refs.modeShort.classList.toggle('is-active', !isComprehensive);
                refs.modeShort.setAttribute('aria-selected', String(!isComprehensive));
            }
            if (refs.modeComprehensive) {
                refs.modeComprehensive.classList.toggle('is-active', isComprehensive);
                refs.modeComprehensive.setAttribute('aria-selected', String(isComprehensive));
            }

            if (refs.shortWorkspace) refs.shortWorkspace.hidden = isComprehensive;
            if (refs.comprehensiveWorkspace) refs.comprehensiveWorkspace.hidden = !isComprehensive;
            if (refs.presetGroup) refs.presetGroup.hidden = !isComprehensive;
            if (refs.workspaceTabs) refs.workspaceTabs.hidden = !isComprehensive;
            if (refs.newQuotation) refs.newQuotation.hidden = !isComprehensive;
            if (refs.shortPreview) refs.shortPreview.hidden = isComprehensive;

            document.body.classList.toggle('qg-print-comprehensive', isComprehensive);
            document.body.classList.toggle('qg-print-short', !isComprehensive);

            if (isComprehensive) refresh();
            if (!settings.silent) autosave.schedule(state);
        }

        function setWorkspace(workspace) {
            const isPreview = workspace === 'preview';

            if (refs.inputsTab) {
                refs.inputsTab.classList.toggle('is-active', !isPreview);
                refs.inputsTab.setAttribute('aria-selected', String(!isPreview));
            }
            if (refs.previewTab) {
                refs.previewTab.classList.toggle('is-active', isPreview);
                refs.previewTab.setAttribute('aria-selected', String(isPreview));
            }
            if (refs.comprehensiveInputs) refs.comprehensiveInputs.hidden = isPreview;
            if (refs.previewWorkspace) refs.previewWorkspace.hidden = !isPreview;

            if (isPreview && Preview) Preview.render(state, derived, validation);
        }

        // -----------------------------------------------------------------
        // Presets, reset and new quotation
        // -----------------------------------------------------------------

        function setupPresets() {
            if (!refs.preset) return;

            refs.preset.addEventListener('change', () => {
                const requested = refs.preset.value;

                const confirmed = window.confirm(
                    'Applying this preset replaces the selected sections, the narrative defaults and '
                    + 'the bill of materials defaults. Customer and commercial data are kept. Continue?'
                );

                if (!confirmed) {
                    refs.preset.value = state.preset;
                    return;
                }

                api.update(s => Model.applyPreset(s, requested));
            });
        }

        function generateQuotationNumber() {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = String(now.getFullYear()).slice(-2);
            let sequence = 1;

            try {
                const key = `r2v_quote_seq_${month}${year}`;
                sequence = parseInt(window.localStorage.getItem(key) || '0', 10) + 1;
                window.localStorage.setItem(key, String(sequence));
            } catch (error) {
                sequence = Math.floor(Math.random() * 1000) + 1;
            }

            return `R2VQ${month}${year}-${String(sequence).padStart(4, '0')}`;
        }

        function setupNewQuotation() {
            if (!refs.newQuotation) return;

            refs.newQuotation.addEventListener('click', () => {
                const confirmed = window.confirm(
                    'Start a new quotation? The current draft and every stored annexure file on this '
                    + 'device will be cleared. This cannot be undone.'
                );

                if (!confirmed) return;

                Storage.clearAll().then(() => {
                    state = Model.createInitialState({
                        mode: Config.MODES.COMPREHENSIVE,
                        preset: state.preset,
                        quoteDate: new Date().toISOString().split('T')[0],
                        quoteNumber: generateQuotationNumber()
                    });

                    maybeRegenerateTitle();
                    if (refs.preset) refs.preset.value = state.preset;
                    refresh();
                    autosave.flush(state);
                });
            });
        }

        // -----------------------------------------------------------------
        // Panel buttons
        // -----------------------------------------------------------------

        function setupPanelActions() {
            const actions = [
                ['qgSectionsRecommended', () => api.update(s => Model.selectRecommendedSections(s))],
                ['qgSectionsAll', () => api.update(s => Model.selectAllSections(s))],
                ['qgSectionsClear', () => {
                    if (api.confirm('Clear every optional section? Core sections stay selected and no entered content is deleted.')) {
                        api.update(s => Model.clearOptionalSections(s));
                    }
                }],
                ['qgRestoreAllNarrative', () => {
                    if (api.confirm('Restore all narrative fields to their defaults? Your edits will be lost.')) {
                        api.update(s => Model.restoreAllNarrative(s));
                    }
                }],
                ['qgResetBom', () => {
                    if (api.confirm('Reset the bill of materials to the preset defaults? Every edit and added row will be lost.')) {
                        api.update(s => Model.resetBom(s));
                    }
                }],
                ['qgAddBreakdown', () => api.update(s => Model.addBreakdownRow(s))],
                ['qgAddDiscount', () => api.update(s => Model.addDiscount(s))],
                ['qgAddMilestone', () => api.update(s => Model.addMilestone(s))],
                ['qgAddFutureCost', () => api.update(s => Model.addFutureCost(s))],
                ['qgAddMixedLocation', () => api.update(s => Model.addMixedLocation(s))]
            ];

            actions.forEach(([id, handler]) => {
                const button = byId(id);
                if (button) button.addEventListener('click', handler);
            });
        }

        // -----------------------------------------------------------------
        // Boot
        // -----------------------------------------------------------------

        function bootState() {
            const stored = Storage.loadDraft();

            if (stored.ok && stored.state) {
                state = stored.state;
                return;
            }

            if (stored.reason === 'future-version') {
                window.alert(
                    'The saved draft was written by a newer version of the Quote Generator and cannot '
                    + 'be opened here. Starting a new draft; the saved one is left untouched.'
                );
            }

            // Reuse the number the Short generator already issued for this page
            // load rather than burning a second one from the same sequence.
            const shortNumber = byId('qgQuoteNumber');
            const shortDate = byId('qgQuoteDate');

            state = Model.createInitialState({
                mode: Config.MODES.SHORT,
                quoteNumber: shortNumber && shortNumber.value ? shortNumber.value : generateQuotationNumber(),
                quoteDate: shortDate && shortDate.value
                    ? shortDate.value
                    : new Date().toISOString().split('T')[0]
            });

            maybeRegenerateTitle();
        }

        bootState();
        recompute();

        if (refs.preset) refs.preset.value = state.preset;

        bindFixedFields();
        setupPanelReset();
        setupAccordion();
        setupPresets();
        setupNewQuotation();
        setupPanelActions();

        if (refs.modeShort) {
            refs.modeShort.addEventListener('click', () => setMode(Config.MODES.SHORT));
        }
        if (refs.modeComprehensive) {
            refs.modeComprehensive.addEventListener('click', () => setMode(Config.MODES.COMPREHENSIVE));
        }
        if (refs.inputsTab) refs.inputsTab.addEventListener('click', () => setWorkspace('inputs'));
        if (refs.previewTab) refs.previewTab.addEventListener('click', () => setWorkspace('preview'));

        if (Preview) Preview.init(api);
        if (Annexures) Annexures.init(api);

        setMode(state.mode, { silent: true });
        refresh();

        // Restoring a draft must not look like an unsaved change.
        if (refs.saveStatus && Storage.loadDraft().ok) {
            refs.saveStatus.dataset.state = 'saved';
            refs.saveStatus.textContent = 'Saved locally';
        }

        window.QuoteGeneratorApp = api;
    });
}());
