/**
 * Quote Generator - Pure state model
 * Ray2Volt Solar Toolbox
 *
 * State creation, repeater operations and selectors for the Comprehensive
 * Proposal, plus draft serialization and migration. Every mutation is a plain
 * function of state, and every repeatable row is addressed by a stable ID rather
 * than by its index.
 *
 * Derived totals, validation and page planning live in quote-generator-calc.js,
 * which reads this module. Nothing here touches the DOM.
 */
(function (root, factory) {
    'use strict';
    const config = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-config.js')
        : root.QuoteGeneratorConfig;
    const content = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-content.js')
        : root.QuoteGeneratorContent;
    const bomDefaults = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-bom-defaults.js')
        : root.QuoteGeneratorBomDefaults;

    const api = factory(config, content, bomDefaults);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorModel = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Content, BomDefaults) {
    'use strict';

    // ---------------------------------------------------------------------
    // Small shared helpers
    // ---------------------------------------------------------------------

    let idCounter = 0;

    /** Stable-enough unique row ID. Rows are matched by ID, never by index. */
    function makeId(prefix) {
        idCounter += 1;
        return `${prefix || 'row'}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
    }

    function num(value, fallback) {
        const parsed = typeof value === 'number' ? value : parseFloat(value);
        return isFinite(parsed) ? parsed : (fallback === undefined ? 0 : fallback);
    }

    function str(value) {
        return value === null || value === undefined ? '' : String(value);
    }

    function trimmed(value) {
        return str(value).trim();
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function round(value, places) {
        const factor = Math.pow(10, places || 0);
        return Math.round(value * factor) / factor;
    }

    // ---------------------------------------------------------------------
    // State creation
    // ---------------------------------------------------------------------

    function emptyCustomer() {
        return {
            customerType: 'company',
            companyName: '',
            contactPerson: '',
            designation: '',
            customerName: '',
            phone: '',
            email: '',
            gstin: '',
            cin: '',
            billingAddress: '',
            siteAddress: '',
            sameAsBilling: false
        };
    }

    function emptyProject(presetId) {
        const preset = Config.getPreset(presetId);

        return {
            quoteDate: '',
            quoteNumber: '',
            proposalTitle: '',
            proposalTitleTouched: false,
            siteName: '',
            preparedBy: '',
            revision: Config.DEFAULTS.revision,
            validityDays: Config.DEFAULTS.validityDays,
            systemConfiguration: preset.systemConfiguration,
            dcCapacityKwp: 0,
            acCapacityKw: 0,
            batteryEnergyKwh: 0,
            batteryPowerKw: 0,
            installationLocation: preset.installationLocation,
            mixedLocations: []
        };
    }

    function emptyNarrative() {
        return {
            objective: '',
            existingSystem: '',
            proposedSolution: '',
            siteConditions: '',
            specialRequirements: '',
            projectNotes: ''
        };
    }

    function emptyCommercial() {
        return {
            actualProjectCost: 0,
            gstType: 'intra',
            gstRate: Config.DEFAULTS.gstRate,
            priceBreakdown: [],
            discounts: [{ id: makeId('discount'), name: '', amount: 0 }],
            milestones: []
        };
    }

    function emptySavings() {
        return {
            consumptionMethod: 'simple',
            tariffRate: Config.DEFAULTS.tariffRate,
            monthlyConsumptionKwh: 0,
            monthlyRows: Config.MONTHS.map(month => ({
                month,
                importedKwh: 0,
                billAmount: 0,
                maxDemandKva: 0
            })),
            annualGenerationPerKwp: Config.DEFAULTS.annualGenerationPerKwp,
            tariffEscalationPercent: Config.DEFAULTS.tariffEscalationPercent,
            degradationPercent: Config.DEFAULTS.degradationPercent,
            projectionYears: Config.DEFAULTS.projectionYears,
            selfConsumptionPercent: Config.DEFAULTS.selfConsumptionPercent,
            exportPercent: Config.DEFAULTS.exportPercent,
            exportCreditRate: Config.DEFAULTS.exportCreditRate,
            arrangementType: 'net-metering',
            futureCosts: []
        };
    }

    function clauseRows(texts) {
        return texts.map(text => ({ id: makeId('clause'), text, include: true }));
    }

    function emptyContract() {
        return {
            terms: clauseRows(Content.CLAUSES.terms),
            inclusions: clauseRows(Content.CLAUSES.inclusions),
            exclusions: clauseRows(Content.CLAUSES.exclusions)
        };
    }

    /**
     * Builds the full BOM category list for a configuration, seeded with the
     * default rows. Categories that do not apply to the configuration are
     * present but empty so a later configuration change can fill them.
     */
    function buildBomCategories(context) {
        const defaults = BomDefaults.defaultBomRows(context);

        return Config.BOM_CATEGORIES.map(category => ({
            id: category.id,
            rows: (defaults[category.id] || []).map(row => Object.assign({ id: makeId('bom') }, row))
        }));
    }

    function createInitialState(options) {
        const settings = options || {};
        const presetId = settings.preset || Config.DEFAULT_PRESET_ID;
        const preset = Config.getPreset(presetId);
        const project = emptyProject(presetId);

        if (settings.quoteDate) project.quoteDate = settings.quoteDate;
        if (settings.quoteNumber) project.quoteNumber = settings.quoteNumber;

        const bomContext = {
            systemConfiguration: project.systemConfiguration,
            installationLocation: project.installationLocation,
            dcCapacityKwp: project.dcCapacityKwp,
            acCapacityKw: project.acCapacityKw,
            batteryEnergyKwh: project.batteryEnergyKwh
        };

        const state = {
            schemaVersion: Config.SCHEMA_VERSION,
            mode: settings.mode || Config.MODES.SHORT,
            preset: preset.id,
            selectedSectionIds: Config.presetSectionIds(preset.id),
            customer: emptyCustomer(),
            project,
            projectNarrative: emptyNarrative(),
            bom: { categories: buildBomCategories(bomContext) },
            commercial: emptyCommercial(),
            savings: emptySavings(),
            contract: emptyContract(),
            annexures: [],
            dirtyDefaultFields: [],
            updatedAt: new Date().toISOString()
        };

        state.commercial.milestones = BomDefaults.defaultMilestones().map(milestone =>
            Object.assign({ id: makeId('milestone') }, milestone));
        state.savings.futureCosts = BomDefaults.defaultFutureCosts({
            projectionYears: state.savings.projectionYears
        }).map(cost => Object.assign({ id: makeId('cost') }, cost));

        applyNarrativeDefaults(state, { force: true });

        return state;
    }

    // ---------------------------------------------------------------------
    // Narrative defaults and dirty tracking
    // ---------------------------------------------------------------------

    const NARRATIVE_FIELDS = [
        'objective',
        'existingSystem',
        'proposedSolution',
        'siteConditions',
        'specialRequirements',
        'projectNotes'
    ];

    function narrativeContext(state) {
        const location = Config.INSTALLATION_LOCATIONS
            .filter(item => item.id === state.project.installationLocation)[0];

        return {
            systemConfiguration: state.project.systemConfiguration,
            installationLocation: state.project.installationLocation,
            installationLocationLabel: location ? location.label.toLowerCase() : '',
            dcCapacityKwp: state.project.dcCapacityKwp
        };
    }

    function isDirty(state, fieldKey) {
        return (state.dirtyDefaultFields || []).indexOf(fieldKey) !== -1;
    }

    function markDirty(state, fieldKey) {
        if (!state.dirtyDefaultFields) state.dirtyDefaultFields = [];
        if (!isDirty(state, fieldKey)) state.dirtyDefaultFields.push(fieldKey);
        return state;
    }

    function clearDirty(state, fieldKey) {
        state.dirtyDefaultFields = (state.dirtyDefaultFields || [])
            .filter(key => key !== fieldKey);
        return state;
    }

    /**
     * Loads narrative defaults into fields the user has not edited. An edited
     * field is identified by its explicit dirty flag, never by comparing its
     * text against the default string.
     */
    function applyNarrativeDefaults(state, options) {
        const settings = options || {};
        const defaults = Content.narrativeDefaults(narrativeContext(state));

        NARRATIVE_FIELDS.forEach(field => {
            const key = `projectNarrative.${field}`;
            if (settings.force || !isDirty(state, key)) {
                state.projectNarrative[field] = defaults[field];
            }
        });

        return state;
    }

    function setNarrativeField(state, field, value) {
        state.projectNarrative[field] = str(value);
        markDirty(state, `projectNarrative.${field}`);
        return state;
    }

    function restoreNarrativeField(state, field) {
        const defaults = Content.narrativeDefaults(narrativeContext(state));
        state.projectNarrative[field] = defaults[field];
        clearDirty(state, `projectNarrative.${field}`);
        return state;
    }

    function restoreAllNarrative(state) {
        NARRATIVE_FIELDS.forEach(field => restoreNarrativeField(state, field));
        return state;
    }

    // ---------------------------------------------------------------------
    // Section selection
    // ---------------------------------------------------------------------

    function selectedSections(state) {
        const selected = {};
        (state.selectedSectionIds || []).forEach(id => { selected[id] = true; });
        const configuration = state.project.systemConfiguration;

        return Config.SECTION_CATALOG.filter(section => {
            if (section.auto) return false;
            if (section.configurations && section.configurations.indexOf(configuration) === -1) return false;
            return Boolean(selected[section.id]);
        });
    }

    function isSectionSelected(state, sectionId) {
        return (state.selectedSectionIds || []).indexOf(sectionId) !== -1;
    }

    function toggleSection(state, sectionId, include) {
        const wanted = include === undefined ? !isSectionSelected(state, sectionId) : Boolean(include);
        const current = (state.selectedSectionIds || []).filter(id => id !== sectionId);

        if (wanted) current.push(sectionId);
        state.selectedSectionIds = Config.orderSectionIds(current);

        return state;
    }

    function selectAllSections(state) {
        state.selectedSectionIds = Config.orderSectionIds(
            Config.sectionsForConfiguration(state.project.systemConfiguration).map(section => section.id)
        );
        return state;
    }

    function selectRecommendedSections(state) {
        state.selectedSectionIds = Config.presetSectionIds(state.preset);
        return state;
    }

    function clearOptionalSections(state) {
        state.selectedSectionIds = Config.orderSectionIds(Config.coreSectionIds());
        return state;
    }

    /**
     * Applies a preset: replaces section selection, project configuration
     * defaults, narrative defaults and BOM defaults. Customer and commercial
     * data are deliberately untouched.
     */
    function applyPreset(state, presetId) {
        const preset = Config.getPreset(presetId);

        state.preset = preset.id;
        state.project.systemConfiguration = preset.systemConfiguration;
        state.project.installationLocation = preset.installationLocation;
        state.selectedSectionIds = Config.presetSectionIds(preset.id);
        state.bom.categories = buildBomCategories({
            systemConfiguration: preset.systemConfiguration,
            installationLocation: preset.installationLocation,
            dcCapacityKwp: state.project.dcCapacityKwp,
            acCapacityKw: state.project.acCapacityKw,
            batteryEnergyKwh: state.project.batteryEnergyKwh
        });

        applyNarrativeDefaults(state, { force: true });
        state.dirtyDefaultFields = (state.dirtyDefaultFields || [])
            .filter(key => key.indexOf('projectNarrative.') !== 0);

        return state;
    }

    // ---------------------------------------------------------------------
    // Repeater operations (all pure, all keyed by row ID)
    // ---------------------------------------------------------------------

    function findCategory(state, categoryId) {
        return (state.bom.categories || []).filter(category => category.id === categoryId)[0] || null;
    }

    /** Public alias so quote-generator-calc.js can read a category by ID. */
    const getBomCategory = findCategory;

    function emptyBomRow() {
        return {
            id: makeId('bom'),
            name: '',
            specification: '',
            make: '',
            quantity: 1,
            unit: 'Nos',
            warranty: '',
            remarks: '',
            rating: 0,
            ratingUnit: ''
        };
    }

    function addBomRow(state, categoryId, row) {
        const category = findCategory(state, categoryId);
        if (!category) return state;

        category.rows.push(Object.assign(emptyBomRow(), row || {}, { id: makeId('bom') }));
        return state;
    }

    function removeBomRow(state, categoryId, rowId) {
        const category = findCategory(state, categoryId);
        if (!category) return state;

        category.rows = category.rows.filter(row => row.id !== rowId);
        return state;
    }

    function duplicateBomRow(state, categoryId, rowId) {
        const category = findCategory(state, categoryId);
        if (!category) return state;

        const index = category.rows.map(row => row.id).indexOf(rowId);
        if (index === -1) return state;

        const copy = Object.assign({}, clone(category.rows[index]), { id: makeId('bom') });
        category.rows.splice(index + 1, 0, copy);
        return state;
    }

    function updateBomRow(state, categoryId, rowId, patch) {
        const category = findCategory(state, categoryId);
        if (!category) return state;

        category.rows = category.rows.map(row =>
            row.id === rowId ? Object.assign({}, row, patch) : row);
        return state;
    }

    function resetBom(state) {
        state.bom.categories = buildBomCategories({
            systemConfiguration: state.project.systemConfiguration,
            installationLocation: state.project.installationLocation,
            dcCapacityKwp: state.project.dcCapacityKwp,
            acCapacityKw: state.project.acCapacityKw,
            batteryEnergyKwh: state.project.batteryEnergyKwh
        });
        return state;
    }

    function addListRow(list, row, prefix) {
        list.push(Object.assign({ id: makeId(prefix) }, row || {}));
        return list;
    }

    function removeListRow(list, rowId) {
        return list.filter(row => row.id !== rowId);
    }

    function addDiscount(state, row) {
        addListRow(state.commercial.discounts, Object.assign({ name: '', amount: 0 }, row), 'discount');
        return state;
    }

    function removeDiscount(state, rowId) {
        state.commercial.discounts = removeListRow(state.commercial.discounts, rowId);
        return state;
    }

    function addMilestone(state, row) {
        addListRow(state.commercial.milestones, Object.assign({ name: '', percent: 0, note: '' }, row), 'milestone');
        return state;
    }

    function removeMilestone(state, rowId) {
        state.commercial.milestones = removeListRow(state.commercial.milestones, rowId);
        return state;
    }

    function addBreakdownRow(state, row) {
        addListRow(state.commercial.priceBreakdown, Object.assign({ description: '', amount: 0 }, row), 'breakdown');
        return state;
    }

    function removeBreakdownRow(state, rowId) {
        state.commercial.priceBreakdown = removeListRow(state.commercial.priceBreakdown, rowId);
        return state;
    }

    function addFutureCost(state, row) {
        addListRow(state.savings.futureCosts, Object.assign({
            name: '',
            amount: 0,
            escalationPercent: 0,
            startYear: 1,
            endYear: state.savings.projectionYears
        }, row), 'cost');
        return state;
    }

    function removeFutureCost(state, rowId) {
        state.savings.futureCosts = removeListRow(state.savings.futureCosts, rowId);
        return state;
    }

    function addMixedLocation(state, row) {
        addListRow(state.project.mixedLocations, Object.assign({
            locationType: 'rcc-rooftop',
            capacityKwp: 0
        }, row), 'location');
        return state;
    }

    function removeMixedLocation(state, rowId) {
        state.project.mixedLocations = removeListRow(state.project.mixedLocations, rowId);
        return state;
    }

    function addClause(state, listName, text) {
        addListRow(state.contract[listName], { text: str(text), include: true }, 'clause');
        return state;
    }

    function removeClause(state, listName, rowId) {
        state.contract[listName] = removeListRow(state.contract[listName], rowId);
        return state;
    }

    function restoreClauses(state, listName) {
        const library = {
            terms: Content.CLAUSES.terms,
            inclusions: Content.CLAUSES.inclusions,
            exclusions: Content.CLAUSES.exclusions
        }[listName];

        if (library) state.contract[listName] = clauseRows(library);
        return state;
    }

    /**
     * Enabled clauses, renumbered from 1. Disabling clause 3 must not leave a
     * gap in the printed numbering.
     */
    function enabledClauses(state, listName) {
        return (state.contract[listName] || [])
            .filter(clause => clause.include && trimmed(clause.text))
            .map((clause, index) => ({
                id: clause.id,
                number: index + 1,
                text: trimmed(clause.text)
            }));
    }

    function addAnnexure(state, annexure) {
        const order = (state.annexures || []).length + 1;

        state.annexures.push(Object.assign({
            id: makeId('annexure'),
            title: '',
            type: 'drawing',
            include: true,
            order,
            fileName: '',
            fileType: '',
            fileSize: 0,
            pageCount: 1
        }, annexure || {}));

        return state;
    }

    function removeAnnexure(state, annexureId) {
        state.annexures = (state.annexures || [])
            .filter(annexure => annexure.id !== annexureId)
            .map((annexure, index) => Object.assign({}, annexure, { order: index + 1 }));
        return state;
    }

    function includedAnnexures(state) {
        return (state.annexures || [])
            .filter(annexure => annexure.include)
            .slice()
            .sort((a, b) => num(a.order) - num(b.order));
    }


    // ---------------------------------------------------------------------
    // Serialization and migration
    // ---------------------------------------------------------------------

    function serialize(state) {
        return JSON.stringify(Object.assign({}, state, {
            schemaVersion: Config.SCHEMA_VERSION,
            updatedAt: new Date().toISOString()
        }));
    }

    /**
     * Parses a stored draft. An unknown future schema version is reported, never
     * thrown, so page load always succeeds and the user is offered a new draft.
     */
    function deserialize(raw) {
        if (!raw) {
            return { ok: false, reason: 'empty', state: null };
        }

        let parsed;

        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            return { ok: false, reason: 'corrupt', state: null };
        }

        if (!parsed || typeof parsed !== 'object') {
            return { ok: false, reason: 'corrupt', state: null };
        }

        const version = num(parsed.schemaVersion, 0);

        if (version > Config.SCHEMA_VERSION) {
            return { ok: false, reason: 'future-version', version, state: null };
        }

        return { ok: true, reason: 'ok', version, state: migrate(parsed) };
    }

    /**
     * Fills a parsed draft out to the current shape. Missing branches are taken
     * from a fresh state so an older or partial draft never renders undefined.
     */
    function migrate(parsed) {
        const base = createInitialState({ mode: parsed.mode, preset: parsed.preset });

        const state = {
            schemaVersion: Config.SCHEMA_VERSION,
            mode: parsed.mode === Config.MODES.COMPREHENSIVE ? Config.MODES.COMPREHENSIVE : Config.MODES.SHORT,
            preset: Config.getPreset(parsed.preset).id,
            selectedSectionIds: Config.orderSectionIds(parsed.selectedSectionIds || base.selectedSectionIds),
            customer: Object.assign({}, base.customer, parsed.customer || {}),
            project: Object.assign({}, base.project, parsed.project || {}),
            projectNarrative: Object.assign({}, base.projectNarrative, parsed.projectNarrative || {}),
            bom: { categories: mergeBomCategories(base.bom.categories, parsed.bom) },
            commercial: Object.assign({}, base.commercial, parsed.commercial || {}),
            savings: Object.assign({}, base.savings, parsed.savings || {}),
            contract: {
                terms: mergeClauses(base.contract.terms, parsed.contract && parsed.contract.terms),
                inclusions: mergeClauses(base.contract.inclusions, parsed.contract && parsed.contract.inclusions),
                exclusions: mergeClauses(base.contract.exclusions, parsed.contract && parsed.contract.exclusions)
            },
            annexures: (parsed.annexures || []).map((annexure, index) => Object.assign({
                id: makeId('annexure'),
                title: '',
                type: 'other',
                include: true,
                order: index + 1,
                fileName: '',
                fileType: '',
                fileSize: 0,
                pageCount: 1
            }, annexure)),
            dirtyDefaultFields: (parsed.dirtyDefaultFields || []).slice(),
            updatedAt: str(parsed.updatedAt) || new Date().toISOString()
        };

        // Repeaters must always carry IDs, even from a draft written before one existed.
        ['discounts', 'milestones', 'priceBreakdown'].forEach(key => {
            state.commercial[key] = (state.commercial[key] || []).map(row =>
                row && row.id ? row : Object.assign({ id: makeId(key) }, row || {}));
        });

        state.savings.futureCosts = (state.savings.futureCosts || []).map(row =>
            row && row.id ? row : Object.assign({ id: makeId('cost') }, row || {}));
        state.savings.monthlyRows = (state.savings.monthlyRows || []).length === 12
            ? state.savings.monthlyRows
            : base.savings.monthlyRows;
        state.project.mixedLocations = (state.project.mixedLocations || []).map(row =>
            row && row.id ? row : Object.assign({ id: makeId('location') }, row || {}));

        return state;
    }

    function mergeBomCategories(baseCategories, storedBom) {
        const stored = (storedBom && storedBom.categories) || [];
        const byId = {};

        stored.forEach(category => {
            if (category && category.id) byId[category.id] = category;
        });

        return baseCategories.map(category => {
            const saved = byId[category.id];
            if (!saved) return category;

            return {
                id: category.id,
                rows: (saved.rows || []).map(row =>
                    Object.assign(emptyBomRow(), row, { id: (row && row.id) || makeId('bom') }))
            };
        });
    }

    function mergeClauses(baseClauses, storedClauses) {
        if (!Array.isArray(storedClauses)) return baseClauses;

        return storedClauses.map(clause => ({
            id: (clause && clause.id) || makeId('clause'),
            text: str(clause && clause.text),
            include: clause ? clause.include !== false : true
        }));
    }

    return {
        // creation
        createInitialState,
        migrate,
        serialize,
        deserialize,
        makeId,

        // narrative
        applyNarrativeDefaults,
        setNarrativeField,
        restoreNarrativeField,
        restoreAllNarrative,
        isDirty,
        markDirty,
        clearDirty,
        NARRATIVE_FIELDS,

        // sections
        selectedSections,
        isSectionSelected,
        toggleSection,
        selectAllSections,
        selectRecommendedSections,
        clearOptionalSections,
        applyPreset,

        // BOM
        buildBomCategories,
        addBomRow,
        removeBomRow,
        duplicateBomRow,
        updateBomRow,
        resetBom,
        getBomCategory,

        // repeaters
        addDiscount,
        removeDiscount,
        addMilestone,
        removeMilestone,
        addBreakdownRow,
        removeBreakdownRow,
        addFutureCost,
        removeFutureCost,
        addMixedLocation,
        removeMixedLocation,
        addClause,
        removeClause,
        restoreClauses,
        enabledClauses,
        addAnnexure,
        removeAnnexure,
        includedAnnexures,

        // shared numeric helpers, reused by quote-generator-calc.js
        num,
        str,
        trimmed,
        round
    };
}));
