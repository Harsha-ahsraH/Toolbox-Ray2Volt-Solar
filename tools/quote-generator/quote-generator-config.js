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
        { id: 'metering', label: 'Metering and synchronisation' },
        { id: 'safety', label: 'Safety equipment and signage' },
        { id: 'civil', label: 'Civil and miscellaneous works' },
        { id: 'installation', label: 'Installation, testing and commissioning' },
        { id: 'transport', label: 'Transportation and documentation' }
    ];

    /**
     * Comprehensive Proposal section library: the sections a user ticks. Order
     * in this array is the fixed output order; there is no reordering control
     * anywhere in the tool. Each section prints the pages listed in `pages`
     * (see PAGE_KINDS). Hybrid-only content, such as the battery, follows the
     * System Configuration inside those pages rather than being a section.
     *
     * `core: true`      - kept by "Clear Optional Sections" and by every preset.
     * `auto: true`      - generated from data, never listed as a user checkbox.
     */
    const SECTION_CATALOG = [
        { id: 'cover', title: 'Cover', group: 'Front Matter', core: true, pages: ['cover'] },
        { id: 'contents', title: 'Contents & Document Control', group: 'Front Matter', core: true,
            pages: ['contents'] },
        { id: 'executive-summary', title: 'Executive Summary', group: 'Front Matter', core: true,
            pages: ['executive-summary'] },

        { id: 'site', title: 'Your Site Today', group: 'Your Project', pages: ['site-today'] },
        { id: 'system', title: 'Proposed System', group: 'Your Project',
            pages: ['system-overview', 'design-basis'] },
        { id: 'energy', title: 'Energy', group: 'Your Project', pages: ['generation', 'energy-use'] },
        { id: 'returns', title: 'Savings & Returns', group: 'Your Project',
            pages: ['savings', 'returns', 'environment'] },

        { id: 'equipment', title: 'Equipment', group: 'Delivery',
            pages: ['key-equipment', 'system-components', 'bom-summary'] },
        { id: 'delivery', title: 'Scope & Delivery', group: 'Delivery',
            pages: ['scope', 'execution', 'quality-safety', 'warranty'] },
        { id: 'company', title: 'Why Ray2Volt', group: 'Delivery', pages: ['why-ray2volt'] },

        { id: 'commercial', title: 'Commercial Offer & Terms', group: 'Commercial & Closing', core: true,
            pages: ['commercial-offer', 'terms-conditions'] },
        { id: 'acceptance', title: 'Acceptance & Signature', group: 'Commercial & Closing',
            pages: ['acceptance'] },

        { id: 'annexures', title: 'Annexures', group: 'Annexures', auto: true,
            pages: ['bill-of-materials', 'savings-projection', 'project-background', 'annexures'] }
    ];

    /**
     * Every page the proposal can print. Most are fixed A4 compositions placed
     * whole. `flow: true` marks the pages whose length comes from what was
     * entered (the scope and terms lists, the commercial tables and the
     * annexures); the document layout flows those across as many pages as
     * they need. `annexure` letters the annexures the tool generates itself;
     * attached documents are lettered after them.
     */
    const PAGE_KINDS = {
        cover: { title: 'Cover' },
        contents: { title: 'Contents & Document Control' },
        'executive-summary': { title: 'Executive Summary' },
        'site-today': { title: 'Your Site Today' },
        'system-overview': { title: 'Proposed System' },
        'design-basis': { title: 'Design Basis & Assumptions' },
        generation: { title: 'Generation' },
        'energy-use': { title: 'Energy Use' },
        savings: { title: 'Savings' },
        returns: { title: 'Returns' },
        environment: { title: 'Environmental Impact' },
        'key-equipment': { title: 'Key Equipment' },
        'system-components': { title: 'System Components' },
        'bom-summary': { title: 'Bill of Materials' },
        scope: { title: 'Scope of Work', flow: true },
        execution: { title: 'Execution & Schedule' },
        'quality-safety': { title: 'Quality & Safety' },
        warranty: { title: 'Warranty & Support' },
        'why-ray2volt': { title: 'Why Ray2Volt' },
        'commercial-offer': { title: 'Commercial Offer', flow: true },
        'terms-conditions': { title: 'Terms & Conditions', flow: true },
        acceptance: { title: 'Acceptance & Signature' },
        'bill-of-materials': { title: 'Full Bill of Materials', flow: true, annexure: 'A' },
        'savings-projection': { title: 'Year-by-Year Projection', flow: true, annexure: 'B' },
        'project-background': { title: 'Project Background', flow: true, annexure: 'C' },
        annexures: { title: 'Annexures' }
    };

    /**
     * Section IDs saved before the redesign, and the section that now carries
     * their content, so a saved draft keeps its selection.
     */
    const LEGACY_SECTION_IDS = {
        'customer-project-profile': 'site',
        'project-objectives': 'site',
        'consumption-profile': 'site',
        'proposed-solution': 'system',
        'system-architecture': 'system',
        'installation-approach': 'system',
        'design-basis': 'system',
        'generation-assessment': 'energy',
        'energy-utilization': 'energy',
        'savings-projection': 'returns',
        'returns-analysis': 'returns',
        'environmental-impact': 'returns',
        'pv-module-technology': 'equipment',
        'inverter-technology': 'equipment',
        'battery-technology': 'equipment',
        'mounting-structure': 'equipment',
        'balance-of-system': 'equipment',
        'monitoring-scada': 'equipment',
        'bill-of-materials': 'equipment',
        'scope-inclusions': 'delivery',
        'scope-exclusions': 'delivery',
        'execution-methodology': 'delivery',
        'project-schedule': 'delivery',
        'quality-assurance': 'delivery',
        'health-safety': 'delivery',
        'warranty-support': 'delivery',
        'about-ray2volt': 'company',
        'ci-solar-benefits': 'company',
        'why-ray2volt': 'company',
        'commercial-offer': 'commercial',
        'payment-milestones': 'commercial',
        'terms-conditions': 'commercial'
    };

    /**
     * The numbered chapters the reader navigates by (the Contents page and the
     * chapter bands). Each lists the page kinds it covers; chapters are
     * numbered in the order their first page appears, so a deselected chapter
     * never leaves a gap in the numbering.
     */
    const CHAPTERS = [
        { id: 'summary', title: 'Executive Summary', summary: 'What changes for you, and the offer at a glance',
            sectionIds: ['executive-summary'] },
        { id: 'site', title: 'Your Site Today', summary: 'What you asked for, the site, and its energy use',
            sectionIds: ['site-today'] },
        { id: 'system', title: 'Proposed System', summary: 'The plant, how it connects, and the design basis',
            sectionIds: ['system-overview', 'design-basis'] },
        { id: 'energy', title: 'Energy', summary: 'What the plant generates and where the energy goes',
            sectionIds: ['generation', 'energy-use'] },
        { id: 'returns', title: 'Savings & Returns', summary: 'Savings, payback, returns and environmental impact',
            sectionIds: ['savings', 'returns', 'environment'] },
        { id: 'equipment', title: 'Equipment', summary: 'Key equipment, system components and materials',
            sectionIds: ['key-equipment', 'system-components', 'bom-summary'] },
        { id: 'delivery', title: 'Scope & Delivery', summary: 'Scope, schedule, quality, safety and warranty',
            sectionIds: ['scope', 'execution', 'quality-safety', 'warranty'] },
        { id: 'company', title: 'Why Ray2Volt', summary: 'Who builds your plant and how we work',
            sectionIds: ['why-ray2volt'] },
        { id: 'commercial', title: 'Commercial', summary: 'Price, payment milestones and terms',
            sectionIds: ['commercial-offer', 'terms-conditions'] },
        { id: 'acceptance', title: 'Acceptance', summary: 'Accepting the offer',
            sectionIds: ['acceptance'] },
        { id: 'annexures', title: 'Annexures', summary: 'Full bill of materials, year-by-year projection and documents',
            unnumbered: true,
            sectionIds: ['bill-of-materials', 'savings-projection', 'project-background', 'annexures'] }
    ];

    const SECTION_GROUPS = [
        'Front Matter',
        'Your Project',
        'Delivery',
        'Commercial & Closing',
        'Annexures'
    ];

    /**
     * Share of a year's generation in each month, January first: an indicative
     * profile for South Indian irradiance, highest before the monsoon and
     * lowest in July. It shapes the monthly chart only; the annual figure
     * always comes from the specific yield. Normalised wherever it is used.
     */
    const SEASONAL_PROFILE = [1.05, 1.06, 1.12, 1.10, 1.06, 0.90, 0.82, 0.85, 0.92, 0.98, 1.01, 1.01];

    /**
     * Indicative time from order to commissioning by plant size, and the
     * phases laid across it as fractions of that time. DISCOM processing runs
     * alongside the works and is outside Ray2Volt's control.
     */
    const SCHEDULE_BANDS = [
        { maxKwp: 100, weeks: 6 },
        { maxKwp: 500, weeks: 10 },
        { maxKwp: Infinity, weeks: 14 }
    ];

    const SCHEDULE_PHASES = [
        { title: 'Site survey and design', owner: 'Ray2Volt', start: 0, end: 0.2 },
        { title: 'DISCOM application and sanction', owner: 'DISCOM', start: 0.1, end: 0.8 },
        { title: 'Procurement and delivery', owner: 'Ray2Volt', start: 0.2, end: 0.55 },
        { title: 'Structure and civil works', owner: 'Ray2Volt', start: 0.45, end: 0.7 },
        { title: 'Modules and electrical works', owner: 'Ray2Volt', start: 0.55, end: 0.85 },
        { title: 'Net meter and inspection', owner: 'DISCOM', start: 0.8, end: 0.95 },
        { title: 'Testing and commissioning', owner: 'Ray2Volt', start: 0.85, end: 1 }
    ];

    /**
     * How much of each free-text field a designed page prints, cut at a full
     * stop. A field longer than this is printed in full in Annexure C.
     */
    const NARRATIVE_EXCERPTS = {
        objective: 440,
        specialRequirements: 440,
        existingSystem: 440,
        siteConditions: 440,
        proposedSolution: 600,
        projectNotes: 360
    };

    /** Sections a user can tick. Auto sections follow the annexure list instead. */
    function selectableSections() {
        return SECTION_CATALOG.filter(section => !section.auto);
    }

    /** Sections offered for a System Configuration (hides entries limited to another). */
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
            excludedSectionIds: ['acceptance']
        },
        {
            id: 'ci-ground-mounted',
            label: 'C&I Ground-Mounted',
            systemConfiguration: 'On-Grid',
            installationLocation: 'ground-mounted',
            excludedSectionIds: ['acceptance']
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

    function getPageKind(pageId) {
        return PAGE_KINDS[pageId] || null;
    }

    /**
     * Reorders an arbitrary selection into fixed catalog order and drops unknown
     * or auto-generated IDs. Selection order must never reach the renderer.
     * Section IDs saved before the redesign map onto the section that now
     * carries their content.
     */
    function orderSectionIds(sectionIds) {
        const wanted = {};
        (sectionIds || []).forEach(id => { wanted[LEGACY_SECTION_IDS[id] || id] = true; });

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
        PAGE_KINDS,
        LEGACY_SECTION_IDS,
        CHAPTERS,
        SECTION_GROUPS,
        SEASONAL_PROFILE,
        SCHEDULE_BANDS,
        SCHEDULE_PHASES,
        NARRATIVE_EXCERPTS,
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
        getPageKind,
        orderSectionIds
    };
}));
