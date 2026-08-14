/**
 * Quote Generator - Comprehensive workspace markup
 * Ray2Volt Solar Toolbox
 *
 * The Inputs accordion and the Proposal Preview workspace, injected into the
 * page before quote-generator-form.js initializes. This follows the same
 * deterministic synchronous insertion that quote-generator-pages.js already
 * uses for the Short Proposal templates, and it keeps quote-generator.html
 * inside the repository's per-file line budget.
 *
 * Markup only. The section checklist, every repeater body, the clause editors
 * and the annexure list are rendered from state by quote-generator-form.js.
 */
(function insertComprehensiveWorkspace() {
    'use strict';

    const placeholder = document.getElementById('qgComprehensiveWorkspacePlaceholder');

    if (!placeholder) {
        console.error('Comprehensive workspace placeholder is missing.');
        return;
    }

    /**
     * Panel icons, in the same stroked 24x24 family the Short form's card
     * headings already use, so a Comprehensive panel reads as the same kind of
     * object as a Short Quotation form card.
     */
    const ICONS = {
        sections: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>'
            + '<polyline points="2 17 12 22 22 17"></polyline>'
            + '<polyline points="2 12 12 17 22 12"></polyline>',
        customer: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>'
            + '<circle cx="12" cy="7" r="4"></circle>',
        project: '<line x1="4" y1="21" x2="4" y2="14"></line>'
            + '<line x1="4" y1="10" x2="4" y2="3"></line>'
            + '<line x1="12" y1="21" x2="12" y2="12"></line>'
            + '<line x1="12" y1="8" x2="12" y2="3"></line>'
            + '<line x1="20" y1="21" x2="20" y2="16"></line>'
            + '<line x1="20" y1="12" x2="20" y2="3"></line>'
            + '<line x1="1" y1="14" x2="7" y2="14"></line>'
            + '<line x1="9" y1="8" x2="15" y2="8"></line>'
            + '<line x1="17" y1="16" x2="23" y2="16"></line>',
        narrative: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>'
            + '<polyline points="14 2 14 8 20 8"></polyline>'
            + '<line x1="16" y1="13" x2="8" y2="13"></line>'
            + '<line x1="16" y1="17" x2="8" y2="17"></line>',
        bom: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>'
            + '<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>'
            + '<line x1="12" y1="22.08" x2="12" y2="12"></line>',
        commercial: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>'
            + '<line x1="1" y1="10" x2="23" y2="10"></line>',
        savings: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
        contract: '<path d="M9 11l3 3L22 4"></path>'
            + '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
        annexures: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>'
    };

    /**
     * One panel heading. Writing the nine headings from one function keeps the
     * icon, the disclosure chevron and the aria wiring identical across panels
     * — they only ever differ in name, icon and starting state.
     */
    function panelHead(panel, label, state, expanded) {
        const stateLabel = state === 'complete' ? 'Complete' : 'Incomplete';

        return `<h2 class="qg-panel-heading">
                    <button type="button" class="qg-panel-toggle" id="qgPanelToggle-${panel}"
                        aria-expanded="${expanded ? 'true' : 'false'}" aria-controls="qgPanel-${panel}">
                        <svg class="qg-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            ${ICONS[panel]}
                        </svg>
                        <span class="qg-panel-name">${label}</span>
                        <span class="qg-panel-state" data-state="${state}">${stateLabel}</span>
                        <svg class="qg-panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </h2>`;
    }

    placeholder.outerHTML = `
<!-- ============================================
     COMPREHENSIVE WORKSPACE
     ============================================ -->
<div id="qgComprehensiveWorkspace" hidden>

    <!-- ---------- Workspace bar ----------
         Inputs/Preview switch on the left, draft-level controls on the right.
         Everything here belongs to the Comprehensive draft, so it lives inside
         this workspace and disappears with it in Short mode. -->
    <div class="qg-workspace-bar">
        <div class="qg-workspace-switch" id="qgWorkspaceTabs" role="tablist" aria-label="Workspace">
            <button type="button" class="qg-workspace-tab is-active" id="qgWorkspaceInputsTab" role="tab"
                aria-selected="true" aria-controls="qgComprehensiveInputs">Inputs</button>
            <button type="button" class="qg-workspace-tab" id="qgWorkspacePreviewTab" role="tab"
                aria-selected="false" aria-controls="qgComprehensivePreviewWorkspace">Proposal Preview</button>
        </div>

        <div class="qg-workspace-meta">
            <div class="qg-preset-control" id="qgPresetGroup">
                <label for="qgPreset">Preset</label>
                <select id="qgPreset" class="qg-input-field qg-preset-select">
                    <option value="ci-on-grid-rooftop" selected>C&amp;I On-Grid Rooftop</option>
                    <option value="ci-ground-mounted">C&amp;I Ground-Mounted</option>
                    <option value="ci-hybrid">C&amp;I Hybrid</option>
                </select>
            </div>
            <span class="qg-save-status" id="qgSaveStatus" role="status" aria-live="polite"
                data-state="idle">Draft not saved yet</span>
            <button type="button" class="qg-btn-ghost" id="qgNewQuotation">New Quotation</button>
        </div>
    </div>

    <!-- ---------- Inputs workspace ---------- -->
    <div id="qgComprehensiveInputs" role="tabpanel" aria-labelledby="qgWorkspaceInputsTab">

        <!-- Validation summary -->
        <div class="qg-validation-summary" id="qgValidationSummary" role="region"
            aria-labelledby="qgValidationSummaryTitle" tabindex="-1" hidden>
            <h2 class="qg-validation-title" id="qgValidationSummaryTitle">Before you can export</h2>
            <ul class="qg-validation-list" id="qgValidationList"></ul>
        </div>

        <div class="qg-accordion-controls">
            <button type="button" class="qg-btn-ghost" id="qgExpandAll">Expand All</button>
            <button type="button" class="qg-btn-ghost" id="qgCollapseAll">Collapse All</button>
            <span class="qg-page-estimate" id="qgPageEstimate" role="status" aria-live="polite"></span>
        </div>

        <div class="qg-accordion" id="qgAccordion">

            <!-- 1. Proposal Sections -->
            <section class="qg-panel" data-panel="sections">
                ${panelHead('sections', 'Proposal Sections', 'complete', true)}
                <div class="qg-panel-body" id="qgPanel-sections" role="region"
                    aria-labelledby="qgPanelToggle-sections">
                    <div class="qg-inline-actions">
                        <button type="button" class="qg-btn-ghost" id="qgSectionsRecommended">Select
                            Recommended</button>
                        <button type="button" class="qg-btn-ghost" id="qgSectionsAll">Select
                            All</button>
                        <button type="button" class="qg-btn-ghost" id="qgSectionsClear">Clear
                            Optional Sections</button>
                    </div>
                    <div class="qg-section-checklist" id="qgSectionChecklist"></div>
                </div>
            </section>

            <!-- 2. Customer Details -->
            <section class="qg-panel" data-panel="customer">
                ${panelHead('customer', 'Customer Details', 'incomplete', true)}
                <div class="qg-panel-body" id="qgPanel-customer" role="region"
                    aria-labelledby="qgPanelToggle-customer">
                    <div class="qg-input-group">
                        <label for="cqCustomerType">Customer Type</label>
                        <select id="cqCustomerType" class="qg-input-field" data-bind="customer.customerType">
                            <option value="company" selected>Company</option>
                            <option value="individual">Individual</option>
                        </select>
                    </div>
                    <div class="qg-field-grid">
                        <div class="qg-input-group qg-customer-company">
                            <label for="cqCompanyName">Legal Company Name *</label>
                            <input type="text" id="cqCompanyName" class="qg-input-field"
                                data-bind="customer.companyName" placeholder="Registered name as per GST">
                        </div>
                        <div class="qg-input-group qg-customer-individual" hidden>
                            <label for="cqCustomerName">Customer Name *</label>
                            <input type="text" id="cqCustomerName" class="qg-input-field"
                                data-bind="customer.customerName" placeholder="Full name">
                        </div>
                        <div class="qg-input-group qg-customer-company">
                            <label for="cqContactPerson">Contact Person *</label>
                            <input type="text" id="cqContactPerson" class="qg-input-field"
                                data-bind="customer.contactPerson">
                        </div>
                        <div class="qg-input-group qg-customer-company">
                            <label for="cqDesignation">Designation</label>
                            <input type="text" id="cqDesignation" class="qg-input-field"
                                data-bind="customer.designation">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqPhone">Phone Number *</label>
                            <input type="text" id="cqPhone" class="qg-input-field" data-bind="customer.phone">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqEmail">Email Address</label>
                            <input type="email" id="cqEmail" class="qg-input-field" data-bind="customer.email">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqGstin">GSTIN</label>
                            <input type="text" id="cqGstin" class="qg-input-field" data-bind="customer.gstin"
                                placeholder="e.g. 37AAOCR4626E1Z6">
                        </div>
                        <div class="qg-input-group qg-customer-company">
                            <label for="cqCin">CIN</label>
                            <input type="text" id="cqCin" class="qg-input-field" data-bind="customer.cin">
                        </div>
                    </div>
                    <div class="qg-input-group">
                        <label for="cqBillingAddress">Registered / Billing Address *</label>
                        <textarea id="cqBillingAddress" class="qg-input-field" rows="2"
                            data-bind="customer.billingAddress"></textarea>
                    </div>
                    <div class="qg-input-group qg-checkbox-row">
                        <label for="cqSameAsBilling">
                            <input type="checkbox" id="cqSameAsBilling" data-bind="customer.sameAsBilling">
                            Same as registered address
                        </label>
                    </div>
                    <div class="qg-input-group" id="cqSiteAddressGroup">
                        <label for="cqSiteAddress">Project / Site Address *</label>
                        <textarea id="cqSiteAddress" class="qg-input-field" rows="2"
                            data-bind="customer.siteAddress"></textarea>
                    </div>
                </div>
            </section>

            <!-- 3. Project Settings -->
            <section class="qg-panel" data-panel="project">
                ${panelHead('project', 'Project Settings', 'incomplete', true)}
                <div class="qg-panel-body" id="qgPanel-project" role="region"
                    aria-labelledby="qgPanelToggle-project">
                    <h3 class="qg-subheading">Document Identity</h3>
                    <div class="qg-field-grid">
                        <div class="qg-input-group">
                            <label for="cqQuoteDate">Quote Date *</label>
                            <input type="date" id="cqQuoteDate" class="qg-input-field" data-bind="project.quoteDate">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqQuoteNumber">Quotation Number *</label>
                            <input type="text" id="cqQuoteNumber" class="qg-input-field"
                                data-bind="project.quoteNumber">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqSiteName">Project / Site Name</label>
                            <input type="text" id="cqSiteName" class="qg-input-field" data-bind="project.siteName">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqPreparedBy">Prepared By</label>
                            <input type="text" id="cqPreparedBy" class="qg-input-field" data-bind="project.preparedBy">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqRevision">Proposal Revision</label>
                            <input type="text" id="cqRevision" class="qg-input-field" data-bind="project.revision">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqValidityDays">Quotation Validity (days)</label>
                            <input type="number" id="cqValidityDays" class="qg-input-field" min="0" step="1"
                                data-bind="project.validityDays">
                        </div>
                    </div>
                    <div class="qg-input-group">
                        <label for="cqProposalTitle">Project / Proposal Title</label>
                        <input type="text" id="cqProposalTitle" class="qg-input-field"
                            data-bind="project.proposalTitle">
                        <p class="qg-field-hint">Generated from capacity and configuration until you edit it.</p>
                    </div>

                    <h3 class="qg-subheading">System Definition</h3>
                    <div class="qg-field-grid">
                        <div class="qg-input-group">
                            <label for="cqSystemConfiguration">System Configuration</label>
                            <select id="cqSystemConfiguration" class="qg-input-field"
                                data-bind="project.systemConfiguration">
                                <option value="On-Grid" selected>On-Grid</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div class="qg-input-group">
                            <label for="cqDcCapacity">Solar DC Capacity (kWp) *</label>
                            <input type="number" id="cqDcCapacity" class="qg-input-field" min="0" step="0.01"
                                data-bind="project.dcCapacityKwp">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqAcCapacity">Inverter AC Capacity (kW) *</label>
                            <input type="number" id="cqAcCapacity" class="qg-input-field" min="0" step="0.01"
                                data-bind="project.acCapacityKw">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqDcAcRatio">DC / AC Ratio</label>
                            <input type="text" id="cqDcAcRatio" class="qg-input-field" readonly tabindex="-1">
                        </div>
                        <div class="qg-input-group qg-hybrid-only" hidden>
                            <label for="cqBatteryEnergy">Battery Energy (kWh) *</label>
                            <input type="number" id="cqBatteryEnergy" class="qg-input-field" min="0" step="0.01"
                                data-bind="project.batteryEnergyKwh">
                        </div>
                        <div class="qg-input-group qg-hybrid-only" hidden>
                            <label for="cqBatteryPower">Battery Power (kW) *</label>
                            <input type="number" id="cqBatteryPower" class="qg-input-field" min="0" step="0.01"
                                data-bind="project.batteryPowerKw">
                        </div>
                    </div>

                    <h3 class="qg-subheading">Installation Location</h3>
                    <div class="qg-input-group">
                        <label for="cqInstallationLocation">Installation Location</label>
                        <select id="cqInstallationLocation" class="qg-input-field"
                            data-bind="project.installationLocation">
                            <option value="rcc-rooftop" selected>RCC rooftop</option>
                            <option value="metal-sheet-rooftop">Metal-sheet rooftop</option>
                            <option value="ground-mounted">Ground-mounted</option>
                            <option value="carport">Carport</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </div>
                    <div class="qg-repeater qg-mixed-only" id="qgMixedLocations" hidden>
                        <div class="qg-repeater-head">
                            <h4>Installation Areas</h4>
                            <button type="button" class="qg-btn-ghost" id="qgAddMixedLocation">Add Area</button>
                        </div>
                        <div class="qg-repeater-rows" id="qgMixedLocationRows"></div>
                        <p class="qg-derived-line" id="qgMixedLocationTotal"></p>
                    </div>
                </div>
            </section>

            <!-- 4. Project Description & Scope -->
            <section class="qg-panel" data-panel="narrative">
                ${panelHead('narrative', 'Project Description &amp; Scope', 'complete', false)}
                <div class="qg-panel-body" id="qgPanel-narrative" role="region"
                    aria-labelledby="qgPanelToggle-narrative" hidden>
                    <div class="qg-inline-actions">
                        <button type="button" class="qg-btn-ghost" id="qgRestoreAllNarrative">Restore All
                            Defaults</button>
                    </div>
                    <div id="qgNarrativeFields"></div>
                </div>
            </section>

            <!-- 5. Bill of Materials -->
            <section class="qg-panel" data-panel="bom">
                ${panelHead('bom', 'Bill of Materials', 'complete', false)}
                <div class="qg-panel-body" id="qgPanel-bom" role="region"
                    aria-labelledby="qgPanelToggle-bom" hidden>
                    <div class="qg-reconciliation" id="qgReconciliation"></div>
                    <div class="qg-inline-actions">
                        <button type="button" class="qg-btn-ghost" id="qgResetBom">Reset to Defaults</button>
                    </div>
                    <div id="qgBomCategories"></div>
                </div>
            </section>

            <!-- 6. Commercial Offer -->
            <section class="qg-panel" data-panel="commercial">
                ${panelHead('commercial', 'Commercial Offer', 'incomplete', false)}
                <div class="qg-panel-body" id="qgPanel-commercial" role="region"
                    aria-labelledby="qgPanelToggle-commercial" hidden>
                    <div class="qg-field-grid">
                        <div class="qg-input-group">
                            <label for="cqActualProjectCost">Actual Project Cost (Incl. GST) *</label>
                            <input type="number" id="cqActualProjectCost" class="qg-input-field" min="0" step="1"
                                data-bind="commercial.actualProjectCost">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqGstType">GST Type</label>
                            <select id="cqGstType" class="qg-input-field" data-bind="commercial.gstType">
                                <option value="intra" selected>Intra-State (CGST + SGST)</option>
                                <option value="inter">Inter-State (IGST)</option>
                            </select>
                        </div>
                        <div class="qg-input-group">
                            <label for="cqGstRate">GST Percentage</label>
                            <input type="number" id="cqGstRate" class="qg-input-field" min="0" max="28" step="0.01"
                                data-bind="commercial.gstRate">
                        </div>
                    </div>

                    <div class="qg-repeater">
                        <div class="qg-repeater-head">
                            <h4>Price Breakdown (optional)</h4>
                            <button type="button" class="qg-btn-ghost" id="qgAddBreakdown">Add Line</button>
                        </div>
                        <div class="qg-repeater-rows" id="qgBreakdownRows"></div>
                        <p class="qg-derived-line" id="qgBreakdownTotal"></p>
                    </div>

                    <div class="qg-repeater">
                        <div class="qg-repeater-head">
                            <h4>Discounts</h4>
                            <button type="button" class="qg-btn-ghost" id="qgAddDiscount">Add Discount</button>
                        </div>
                        <div class="qg-repeater-rows" id="qgDiscountRows"></div>
                        <p class="qg-derived-line" id="qgDiscountTotal"></p>
                    </div>

                    <div class="qg-repeater">
                        <div class="qg-repeater-head">
                            <h4>Payment Milestones</h4>
                            <button type="button" class="qg-btn-ghost" id="qgAddMilestone">Add Milestone</button>
                        </div>
                        <div class="qg-repeater-rows" id="qgMilestoneRows"></div>
                        <p class="qg-derived-line" id="qgMilestoneTotal"></p>
                    </div>
                </div>
            </section>

            <!-- 7. Savings Projections -->
            <section class="qg-panel" data-panel="savings">
                ${panelHead('savings', 'Savings Projections', 'complete', false)}
                <div class="qg-panel-body" id="qgPanel-savings" role="region"
                    aria-labelledby="qgPanelToggle-savings" hidden>
                    <div class="qg-input-group">
                        <label for="cqConsumptionMethod">Consumption Entry Method</label>
                        <select id="cqConsumptionMethod" class="qg-input-field"
                            data-bind="savings.consumptionMethod">
                            <option value="simple" selected>Simple</option>
                            <option value="detailed">Detailed C&amp;I</option>
                        </select>
                    </div>
                    <div class="qg-field-grid qg-consumption-simple" id="qgConsumptionSimple">
                        <div class="qg-input-group">
                            <label for="cqTariffRate">Current Tariff (₹/kWh)</label>
                            <input type="number" id="cqTariffRate" class="qg-input-field" min="0" step="0.01"
                                data-bind="savings.tariffRate">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqMonthlyConsumption">Average Monthly Consumption (kWh)</label>
                            <input type="number" id="cqMonthlyConsumption" class="qg-input-field" min="0" step="1"
                                data-bind="savings.monthlyConsumptionKwh">
                        </div>
                    </div>
                    <div class="qg-consumption-detailed" id="qgConsumptionDetailed" hidden>
                        <h4 class="qg-subheading">12-Month Consumption</h4>
                        <div class="qg-table-scroll">
                            <table class="qg-editor-table" id="qgMonthlyTable">
                                <thead>
                                    <tr>
                                        <th scope="col">Month</th>
                                        <th scope="col">Imported (kWh)</th>
                                        <th scope="col">Bill Amount (₹)</th>
                                        <th scope="col">Max Demand (kVA)</th>
                                    </tr>
                                </thead>
                                <tbody id="qgMonthlyRows"></tbody>
                            </table>
                        </div>
                        <p class="qg-derived-line" id="qgConsumptionTotals"></p>
                    </div>

                    <h4 class="qg-subheading">Generation &amp; Utilization Assumptions</h4>
                    <div class="qg-field-grid">
                        <div class="qg-input-group">
                            <label for="cqAnnualGeneration">Annual Generation (kWh/kWp)</label>
                            <input type="number" id="cqAnnualGeneration" class="qg-input-field" min="0" step="1"
                                data-bind="savings.annualGenerationPerKwp">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqTariffEscalation">Tariff Escalation (%/year)</label>
                            <input type="number" id="cqTariffEscalation" class="qg-input-field" step="0.1"
                                data-bind="savings.tariffEscalationPercent">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqDegradation">Module Degradation (%/year)</label>
                            <input type="number" id="cqDegradation" class="qg-input-field" min="0" max="100"
                                step="0.01" data-bind="savings.degradationPercent">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqProjectionYears">Projection Period (years)</label>
                            <input type="number" id="cqProjectionYears" class="qg-input-field" min="1" step="1"
                                data-bind="savings.projectionYears">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqSelfConsumption">Self-Consumption (%)</label>
                            <input type="number" id="cqSelfConsumption" class="qg-input-field" min="0" max="100"
                                step="0.01" data-bind="savings.selfConsumptionPercent">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqExportPercent">Grid Export (%)</label>
                            <input type="number" id="cqExportPercent" class="qg-input-field" min="0" max="100"
                                step="0.01" data-bind="savings.exportPercent">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqExportCreditRate">Export Credit Rate (₹/kWh)</label>
                            <input type="number" id="cqExportCreditRate" class="qg-input-field" min="0" step="0.01"
                                data-bind="savings.exportCreditRate">
                        </div>
                        <div class="qg-input-group">
                            <label for="cqArrangementType">Arrangement Type</label>
                            <select id="cqArrangementType" class="qg-input-field"
                                data-bind="savings.arrangementType">
                                <option value="net-metering" selected>Net Metering</option>
                                <option value="gross-metering">Gross Metering</option>
                                <option value="open-access">Open Access</option>
                                <option value="captive">Captive</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <p class="qg-derived-line" id="qgUtilizationTotal"></p>

                    <div class="qg-repeater">
                        <div class="qg-repeater-head">
                            <h4>Future Costs</h4>
                            <button type="button" class="qg-btn-ghost" id="qgAddFutureCost">Add Cost</button>
                        </div>
                        <div class="qg-repeater-rows" id="qgFutureCostRows"></div>
                        <p class="qg-field-hint">Enter the same start and end year for a one-time cost.</p>
                    </div>
                </div>
            </section>

            <!-- 8. Terms, Inclusions & Exclusions -->
            <section class="qg-panel" data-panel="contract">
                ${panelHead('contract', 'Terms, Inclusions &amp; Exclusions', 'complete', false)}
                <div class="qg-panel-body" id="qgPanel-contract" role="region"
                    aria-labelledby="qgPanelToggle-contract" hidden>
                    <div id="qgClauseEditors"></div>
                </div>
            </section>

            <!-- 9. Annexures -->
            <section class="qg-panel" data-panel="annexures">
                ${panelHead('annexures', 'Annexures', 'complete', false)}
                <div class="qg-panel-body" id="qgPanel-annexures" role="region"
                    aria-labelledby="qgPanelToggle-annexures" hidden>
                    <div class="qg-inline-actions">
                        <label class="qg-file-button" for="qgAnnexureFile">Add Annexure</label>
                        <input type="file" id="qgAnnexureFile" class="qg-file-input"
                            accept="image/*,application/pdf" multiple>
                    </div>
                    <p class="qg-field-hint">Images and PDFs are appended after the main proposal in
                        upload order. Files stay on this device and are never uploaded.</p>
                    <p class="qg-annexure-error" id="qgAnnexureError" role="alert" hidden></p>
                    <div class="qg-repeater-rows" id="qgAnnexureRows"></div>
                </div>
            </section>

        </div>
    </div>

    <!-- ---------- Proposal Preview workspace ---------- -->
    <div id="qgComprehensivePreviewWorkspace" role="tabpanel"
        aria-labelledby="qgWorkspacePreviewTab" hidden>
        <div class="qg-preview-toolbar">
            <div class="qg-preview-meta">
                <span class="qg-preview-position" id="qgPreviewPosition" role="status"
                    aria-live="polite">Page 1 of 1</span>
            </div>
            <div class="qg-preview-actions">
                <button type="button" class="qg-btn-primary" id="qgComprehensiveGenerate">Generate
                    Preview</button>
                <button type="button" class="qg-btn-secondary" id="qgComprehensivePrint">Print / Save
                    as PDF</button>
            </div>
        </div>
        <p class="qg-export-blocked" id="qgExportBlocked" role="status" hidden>
            Fix the critical errors listed in Inputs before exporting.
        </p>

        <div class="qg-preview-selector">
            <label for="qgPageSelect">Page</label>
            <select id="qgPageSelect" class="qg-input-field"></select>
        </div>

        <div class="qg-preview-split">
            <nav class="qg-thumb-rail" id="qgThumbRail" aria-label="Proposal pages"></nav>
            <div class="qg-preview-stage" id="qgPreviewStage" tabindex="-1"
                aria-label="Selected proposal page"></div>
        </div>
    </div>
</div>
`;
}());
