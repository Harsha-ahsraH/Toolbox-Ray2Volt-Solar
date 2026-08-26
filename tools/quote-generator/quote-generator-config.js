/**
 * Quote Generator - Comprehensive mode configuration
 * Ray2Volt Solar Toolbox
 *
 * Section catalog, presets, enumerations and pagination budgets for the
 * Comprehensive (C&I) Proposal. Pure data plus small pure helpers: no DOM
 * access, so Node tests can require this file directly.
 *
 * Maintained prose lives in quote-generator-content.js. Keep this file to
 * structure and identifiers.
 */
(function (root, factory) {
    'use strict';
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorConfig = api;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const SCHEMA_VERSION = 1;

    const MODES = {
        SHORT: 'short',
        COMPREHENSIVE: 'comprehensive'
    };

    const SYSTEM_CONFIGURATIONS = ['On-Grid', 'Hybrid'];

    const INSTALLATION_LOCATIONS = [
        { id: 'rcc-rooftop', label: 'RCC rooftop' },
        { id: 'metal-sheet-rooftop', label: 'Metal-sheet rooftop' },
        { id: 'ground-mounted', label: 'Ground-mounted' },
        { id: 'carport', label: 'Carport' },
        { id: 'mixed', label: 'Mixed' }
    ];

    const CUSTOMER_TYPES = [
        { id: 'company', label: 'Company' },
        { id: 'individual', label: 'Individual' }
    ];

    const GST_TYPES = [
        { id: 'intra', label: 'Intra-State (CGST + SGST)' },
        { id: 'inter', label: 'Inter-State (IGST)' }
    ];

    const CONSUMPTION_METHODS = [
        { id: 'simple', label: 'Simple' },
        { id: 'detailed', label: 'Detailed C&I' }
    ];

    const ARRANGEMENT_TYPES = [
        { id: 'net-metering', label: 'Net Metering' },
        { id: 'gross-metering', label: 'Gross Metering' },
        { id: 'open-access', label: 'Open Access' },
        { id: 'captive', label: 'Captive' },
        { id: 'other', label: 'Other' }
    ];

    const ANNEXURE_TYPES = [
        { id: 'drawing', label: 'Drawing' },
        { id: 'datasheet', label: 'Datasheet' },
        { id: 'certificate', label: 'Certificate' },
        { id: 'site-photograph', label: 'Site Photograph' },
        { id: 'other', label: 'Other' }
    ];

    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const BOM_UNITS = ['Nos', 'Set', 'Mtrs', 'Lot', 'Job', 'Pairs', 'Trip', 'Sq.m', 'Kg'];

    /**
     * The fourteen approved Comprehensive BOM categories, in output order.
     * `configurations` limits a category to specific System Configurations;
     * omitted means the category applies to every configuration.
     */
    const BOM_CATEGORIES = [
        { id: 'modules', label: 'Solar PV modules', rated: 'dc', ratingUnit: 'Wp' },
        { id: 'inverters', label: 'Inverters', rated: 'ac', ratingUnit: 'kW' },
        { id: 'battery', label: 'Battery system', rated: 'battery', ratingUnit: 'kWh', configurations: ['Hybrid'] },
        { id: 'mounting', label: 'Module mounting structures' },
        { id: 'dc-cables', label: 'DC cables and connectors' },
        { id: 'ac-cables', label: 'AC cables and power evacuation' },
        { id: 'protection', label: 'DCDB, ACDB and protection devices' },
        { id: 'earthing', label: 'Earthing and lightning protection' },
        { id: 'monitoring', label: 'Monitoring, communication and SCADA' },
        { id: 'metering', label: 'Metering and synchronization' },
        { id: 'safety', label: 'Safety equipment and signage' },
        { id: 'civil', label: 'Civil and miscellaneous works' },
        { id: 'installation', label: 'Installation, testing and commissioning' },
        { id: 'transport', label: 'Transportation and documentation' }
    ];

    /**
     * Comprehensive Proposal section library. Order in this array is the fixed
     * output order; there is no reordering control anywhere in the tool.
     *
     * `core: true`      - kept by "Clear Optional Sections" and by every preset.
     * `auto: true`      - generated from data, never listed as a user checkbox.
     * `configurations`  - section is only offered for these System Configurations.
     */
    const SECTION_CATALOG = [
        { id: 'cover', title: 'Cover', group: 'Front Matter', core: true },
        { id: 'document-control', title: 'Document Control', group: 'Front Matter', core: true },
        { id: 'contents', title: 'Table of Contents', group: 'Front Matter', core: true, paginates: true },
        { id: 'executive-summary', title: 'Executive Summary', group: 'Front Matter', core: true },

        { id: 'customer-project-profile', title: 'Customer & Project Profile', group: 'Project Context' },
        { id: 'project-objectives', title: 'Project Objectives & Background', group: 'Project Context', paginates: true },
        { id: 'about-ray2volt', title: 'About Ray2Volt', group: 'Project Context', maintained: true },
        { id: 'ci-solar-benefits', title: 'Why C&I Solar', group: 'Project Context', maintained: true },

        { id: 'proposed-solution', title: 'Proposed Solution', group: 'Technical Solution', paginates: true },
        { id: 'system-architecture', title: 'System Architecture', group: 'Technical Solution' },
        { id: 'installation-approach', title: 'Installation Approach', group: 'Technical Solution' },
        { id: 'design-basis', title: 'Design Basis & Assumptions', group: 'Technical Solution' },
        { id: 'pv-module-technology', title: 'PV Module Technology', group: 'Technical Solution' },
        { id: 'inverter-technology', title: 'Inverter Technology', group: 'Technical Solution' },
        {
            id: 'battery-technology',
            title: 'Battery Energy Storage',
            group: 'Technical Solution',
            configurations: ['Hybrid']
        },
        { id: 'mounting-structure', title: 'Mounting Structure', group: 'Technical Solution' },
        { id: 'balance-of-system', title: 'Balance of System', group: 'Technical Solution' },
        { id: 'monitoring-scada', title: 'Monitoring & SCADA', group: 'Technical Solution' },
        { id: 'bill-of-materials', title: 'Bill of Materials', group: 'Technical Solution', core: true, paginates: true },

        { id: 'generation-assessment', title: 'Generation Assessment', group: 'Energy & Financial Analysis' },
        { id: 'consumption-profile', title: 'Consumption Profile', group: 'Energy & Financial Analysis' },
        { id: 'energy-utilization', title: 'Energy Utilization', group: 'Energy & Financial Analysis' },
        {
            id: 'savings-projection',
            title: 'Savings Projection',
            group: 'Energy & Financial Analysis',
            paginates: true
        },
        { id: 'returns-analysis', title: 'Returns Analysis', group: 'Energy & Financial Analysis' },
        { id: 'environmental-impact', title: 'Environmental Impact', group: 'Energy & Financial Analysis' },

        { id: 'scope-inclusions', title: 'Scope Inclusions', group: 'Scope & Execution', paginates: true },
        { id: 'scope-exclusions', title: 'Scope Exclusions', group: 'Scope & Execution', paginates: true },
        { id: 'execution-methodology', title: 'Execution Methodology', group: 'Scope & Execution', maintained: true },
        { id: 'project-schedule', title: 'Project Schedule', group: 'Scope & Execution', maintained: true },
        { id: 'quality-assurance', title: 'Quality Assurance', group: 'Scope & Execution', maintained: true },
        { id: 'health-safety', title: 'Health & Safety', group: 'Scope & Execution', maintained: true },
        { id: 'warranty-support', title: 'Warranty & Support', group: 'Scope & Execution', paginates: true },

        { id: 'commercial-offer', title: 'Commercial Offer', group: 'Commercial & Closing', core: true, paginates: true },
        { id: 'payment-milestones', title: 'Payment Milestones', group: 'Commercial & Closing', core: true, paginates: true },
        { id: 'terms-conditions', title: 'Terms & Conditions', group: 'Commercial & Closing', core: true, paginates: true },
        { id: 'why-ray2volt', title: 'Why Ray2Volt', group: 'Commercial & Closing', maintained: true },
        { id: 'acceptance', title: 'Acceptance & Signature', group: 'Commercial & Closing' },

        { id: 'annexure-index', title: 'Annexure Index', group: 'Annexures', auto: true, paginates: true },
        { id: 'annexures', title: 'Annexures', group: 'Annexures', auto: true, paginates: true }
    ];

    const SECTION_GROUPS = [
        'Front Matter',
        'Project Context',
        'Technical Solution',
        'Energy & Financial Analysis',
        'Scope & Execution',
        'Commercial & Closing',
        'Annexures'
    ];

    /** Sections a user can tick. Auto sections follow the annexure list instead. */
    function selectableSections() {
        return SECTION_CATALOG.filter(section => !section.auto);
    }

    /** Sections offered for a System Configuration (hides Hybrid-only entries). */
    function sectionsForConfiguration(systemConfiguration) {
        return selectableSections().filter(section =>
            !section.configurations || section.configurations.indexOf(systemConfiguration) !== -1);
    }

    function coreSectionIds() {
        return SECTION_CATALOG.filter(section => section.core).map(section => section.id);
    }

    /**
     * The three approved starting presets. Each selects every section valid for
     * its System Configuration except the optional acceptance block, which sales
     * turns on deliberately. That is comfortably above the 20-page floor.
     */
    const PRESETS = [
        {
            id: 'ci-on-grid-rooftop',
            label: 'C&I On-Grid Rooftop',
            systemConfiguration: 'On-Grid',
            installationLocation: 'rcc-rooftop',
            excludedSectionIds: ['battery-technology', 'acceptance']
        },
        {
            id: 'ci-ground-mounted',
            label: 'C&I Ground-Mounted',
            systemConfiguration: 'On-Grid',
            installationLocation: 'ground-mounted',
            excludedSectionIds: ['battery-technology', 'acceptance']
        },
        {
            id: 'ci-hybrid',
            label: 'C&I Hybrid',
            systemConfiguration: 'Hybrid',
            installationLocation: 'rcc-rooftop',
            excludedSectionIds: ['acceptance']
        }
    ];

    const DEFAULT_PRESET_ID = 'ci-on-grid-rooftop';

    function getPreset(presetId) {
        return PRESETS.filter(preset => preset.id === presetId)[0] || PRESETS[0];
    }

    /** Section IDs a preset selects, in catalog order. */
    function presetSectionIds(presetId) {
        const preset = getPreset(presetId);
        const excluded = preset.excludedSectionIds || [];

        return sectionsForConfiguration(preset.systemConfiguration)
            .filter(section => excluded.indexOf(section.id) === -1)
            .map(section => section.id);
    }

    function getSection(sectionId) {
        return SECTION_CATALOG.filter(section => section.id === sectionId)[0] || null;
    }

    /**
     * Reorders an arbitrary selection into fixed catalog order and drops unknown
     * or auto-generated IDs. Selection order must never reach the renderer.
     */
    function orderSectionIds(sectionIds) {
        const wanted = {};
        (sectionIds || []).forEach(id => { wanted[id] = true; });

        return SECTION_CATALOG
            .filter(section => !section.auto && wanted[section.id])
            .map(section => section.id);
    }

    /**
     * Pagination budgets for the tables that span pages.
     *
     * All values are CSS pixels measured in the browser against the real A4
     * page: a .cq-page is 297mm tall with 12/24mm vertical padding, and the
     * running header and footer leave exactly 904px of body height.
     *
     * Rows whose text wraps are estimated from their content rather than
     * assumed to be one line, because a bill of materials row can be one, two
     * or three lines tall depending on the specification text. The estimator
     * deliberately rounds up: a slightly short page is acceptable, a row
     * running off the bottom of the page is not.
     */
    const PAGINATION = {
        bodyHeightPx: 904,

        bom: {
            // Header row plus the closing note, which only appears on the last
            // page but is reserved on every page so the budget stays uniform.
            budgetPx: 780,
            // A continuation page also carries a "Continued from previous page"
            // line that the first page does not, so it gets a smaller budget.
            continuationBudgetPx: 740,
            theadPx: 40,
            categoryRowPx: 27,
            rowBasePx: 12,
            rowLinePx: 15,
            charsPerLine: { name: 20, specification: 24, make: 13, warranty: 15 }
        },

        clause: {
            // The last page carries a closing note, and continuation pages a
            // "Continued" subtitle, so neither budget is the full body height.
            firstBudgetPx: 730,
            budgetPx: 760,
            rowBasePx: 11,
            rowLinePx: 17,
            // Measured: the clause text column is 650px wide at 11.3px, which
            // wraps at about 127 characters. 155 was optimistic and let a long
            // terms list run past the bottom of its last page.
            charsPerLine: 127
        },

        // Projection rows carry only numbers, so they never wrap.
        savings: {
            firstPageRows: 27,
            continuationRows: 29
        },

        contents: {
            // Rounded up from the measured 28px row and 29px group header, so a
            // long index with many annexures still breaks a page early rather
            // than one row late.
            firstBudgetPx: 830,
            budgetPx: 860,
            itemPx: 30,
            groupPx: 33
        },

        // The warranty schedule shares its page with the workmanship and
        // support copy, which is reserved for on every page so the last one
        // always has room for it.
        warranty: {
            budgetPx: 440,
            rowBasePx: 12,
            rowLinePx: 15,
            charsPerLine: { name: 40, make: 26, warranty: 30 }
        },

        milestone: {
            firstBudgetPx: 700,
            budgetPx: 800,
            rowBasePx: 12,
            rowLinePx: 15,
            charsPerLine: { name: 30, note: 20 }
        },

        // The price breakdown shares its page with the offer summary and the
        // tax disclosure, both reserved for on every page.
        breakdown: {
            // Small, because the closing page also carries the offer summary
            // and the tax disclosure tables beneath these rows.
            budgetPx: 280,
            rowBasePx: 12,
            rowLinePx: 15,
            charsPerLine: 60
        },

        annexureIndex: {
            firstBudgetPx: 740,
            budgetPx: 790,
            rowBasePx: 12,
            rowLinePx: 15,
            charsPerLine: { title: 46, type: 22 }
        },

        // Free-text narrative. A salesperson can paste an arbitrary amount into
        // these fields, so they are chunked by estimated height like any table.
        narrative: {
            firstBudgetPx: 830,
            budgetPx: 890,
            headingPx: 30,
            paragraphGapPx: 12,
            // Measured in the browser: .cq-para resolves to an 18.6px line box
            // about 102 characters wide in the 680px text column. Rounded to
            // over-estimate height, so a paragraph never runs off the page.
            linePx: 19,
            charsPerLine: 96
        }
    };

    /** Tolerance for capacity reconciliation: max(absolute, 0.5% of approved). */
    const CAPACITY_TOLERANCE = {
        absolute: 0.1,
        relative: 0.005
    };

    /** Percentage totals (milestones, utilization split) must land inside this. */
    const PERCENT_TOLERANCE = 0.01;

    const STORAGE = {
        draftKey: 'ray2volt.quote-generator.draft.v1',
        databaseName: 'ray2volt-quote-generator',
        databaseVersion: 1,
        annexureStore: 'annexures',
        autosaveDelayMs: 500
    };

    const DEFAULTS = {
        validityDays: 15,
        revision: 'Rev 0',
        gstRate: 5,
        annualGenerationPerKwp: 1533,
        tariffEscalationPercent: 4,
        degradationPercent: 0.5,
        projectionYears: 30,
        selfConsumptionPercent: 80,
        exportPercent: 20,
        exportCreditRate: 3,
        tariffRate: 8,
        dcAcRatioTarget: 1.2
    };

    return {
        SCHEMA_VERSION,
        MODES,
        SYSTEM_CONFIGURATIONS,
        INSTALLATION_LOCATIONS,
        CUSTOMER_TYPES,
        GST_TYPES,
        CONSUMPTION_METHODS,
        ARRANGEMENT_TYPES,
        ANNEXURE_TYPES,
        MONTHS,
        BOM_UNITS,
        BOM_CATEGORIES,
        SECTION_CATALOG,
        SECTION_GROUPS,
        PRESETS,
        DEFAULT_PRESET_ID,
        PAGINATION,
        CAPACITY_TOLERANCE,
        PERCENT_TOLERANCE,
        STORAGE,
        DEFAULTS,
        selectableSections,
        sectionsForConfiguration,
        coreSectionIds,
        getPreset,
        presetSectionIds,
        getSection,
        orderSectionIds
    };
}));
