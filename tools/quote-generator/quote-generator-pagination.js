/**
 * Quote Generator - Page planning
 * Ray2Volt Solar Toolbox
 *
 * Decides how many A4 pages each selected section produces and where its
 * content is cut. The resulting plan is the single source the thumbnails, the
 * table of contents, the "Page X of Y" footers and browser print all read,
 * so those cannot disagree.
 *
 * Rows whose text wraps are measured from their content rather than counted,
 * because a bill of materials row is one, two or three lines tall depending on
 * its specification text. Every estimator rounds up: a slightly short page is
 * acceptable, a row running off the bottom of one is not.
 *
 * Split out of quote-generator-calc.js to stay inside the repository's
 * per-file line budget. It depends only on the config and the state model, not
 * on the financial calculations, so the two halves can be read separately.
 */
(function (root, factory) {
    'use strict';
    const config = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-config.js')
        : root.QuoteGeneratorConfig;
    const model = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-model.js')
        : root.QuoteGeneratorModel;

    const api = factory(config, model);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorPagination = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Model) {
    'use strict';

    const num = Model.num;
    const trimmed = Model.trimmed;
    const findCategory = Model.getBomCategory;
    const enabledClauses = Model.enabledClauses;
    const selectedSections = Model.selectedSections;
    const includedAnnexures = Model.includedAnnexures;

    /**
     * The projection horizon, read straight from state. Page planning only ever
     * needs the number of years, so it does not pull in the whole financial
     * projection and the two modules stay independent.
     */
    /**
     * How many characters may sit in one unit for a given page budget.
     *
     * A whole line is held back on top of the row's own base height: the
     * character-per-line figures are averages, so a unit measured to exactly
     * fill its budget can still render one line taller than estimated. Losing a
     * little space is free; overrunning an A4 page is not.
     */
    function maxCharsForBudget(budgetPx, basePx, linePx, charsPerLine) {
        const usable = Math.max(linePx, budgetPx - basePx - linePx);
        return Math.max(60, Math.floor(usable / linePx) * charsPerLine);
    }

    function projectionYears(state) {
        return Math.max(1, Math.round(
            num(state.savings.projectionYears, Config.DEFAULTS.projectionYears)));
    }

    // ---------------------------------------------------------------------
    // Page planning
    // ---------------------------------------------------------------------

    /**
     * Splits `totalRows` across pages, allowing the first page a smaller budget
     * because it also carries the section heading. Always returns at least one
     * chunk so an empty table still gets its page.
     */
    function chunkRows(totalRows, firstPageRows, continuationRows) {
        const chunks = [];
        const total = Math.max(0, Math.round(totalRows));

        if (total <= firstPageRows) {
            return [{ start: 0, end: total }];
        }

        chunks.push({ start: 0, end: firstPageRows });
        let cursor = firstPageRows;

        while (cursor < total) {
            const end = Math.min(total, cursor + continuationRows);
            chunks.push({ start: cursor, end });
            cursor = end;
        }

        return chunks;
    }

    /** Non-empty BOM categories, with their rows, in catalog order. */
    function activeBomCategories(state) {
        return Config.BOM_CATEGORIES
            .filter(category => !category.configurations
                || category.configurations.indexOf(state.project.systemConfiguration) !== -1)
            .map(category => {
                const stored = findCategory(state, category.id);
                const rows = stored
                    ? stored.rows.filter(row => trimmed(row.name) || trimmed(row.specification))
                    : [];
                return { id: category.id, label: category.label, rows };
            })
            .filter(category => category.rows.length > 0);
    }

    /**
     * Splits items across pages by their estimated height rather than by a flat
     * row count. An item taller than a whole page still gets its own chunk
     * instead of looping forever.
     */
    function chunkByHeight(heights, firstBudget, budget) {
        if (!heights.length) return [{ start: 0, end: 0 }];

        const chunks = [];
        let start = 0;
        let used = 0;
        let limit = firstBudget;

        for (let index = 0; index < heights.length; index++) {
            const height = heights[index];

            if (used > 0 && used + height > limit) {
                chunks.push({ start, end: index });
                start = index;
                used = 0;
                limit = budget;
            }

            used += height;
        }

        chunks.push({ start, end: heights.length });
        return chunks;
    }

    /** How many wrapped lines a cell of `text` takes in a column of that width. */
    function wrappedLines(text, charsPerLine) {
        const length = trimmed(text).length;
        return Math.max(1, Math.ceil(length / charsPerLine));
    }

    /**
     * The printed BOM as one flat list: a heading line per non-empty category,
     * then one line per row. The renderer draws exactly this list, so the page
     * plan's chunks and the drawn rows cannot drift apart.
     */
    function bomLines(state) {
        const lines = [];

        activeBomCategories(state).forEach(category => {
            lines.push({ kind: 'category', label: category.label });
            category.rows.forEach(row => lines.push({ kind: 'row', row }));
        });

        return lines;
    }

    /** Total printed lines for the BOM: one heading line per category plus rows. */
    function bomRowCount(state) {
        return bomLines(state).length;
    }

    function bomLineHeights(state) {
        const metrics = Config.PAGINATION.bom;

        return bomLines(state).map(line => {
            if (line.kind === 'category') return metrics.categoryRowPx;

            const row = line.row;
            const lines = Math.max(
                wrappedLines(row.name, metrics.charsPerLine.name),
                wrappedLines(row.specification, metrics.charsPerLine.specification),
                wrappedLines(row.make, metrics.charsPerLine.make),
                wrappedLines(row.warranty, metrics.charsPerLine.warranty)
            );

            return metrics.rowBasePx + (lines * metrics.rowLinePx);
        });
    }

    /**
     * Enabled clauses, with any single clause too tall for one page broken into
     * continuation rows. Without this a pasted clause of several thousand
     * characters would be given its own page and then run off the bottom of it.
     */
    function clauseUnits(state, listName) {
        const metrics = Config.PAGINATION.clause;
        const maxChars = maxCharsForBudget(
            Math.min(metrics.firstBudgetPx, metrics.budgetPx),
            metrics.rowBasePx, metrics.rowLinePx, metrics.charsPerLine);

        const units = [];

        enabledClauses(state, listName).forEach(clause => {
            splitLongText(clause.text, maxChars).forEach((part, index) => {
                units.push({
                    id: clause.id,
                    number: clause.number,
                    text: part,
                    isContinuation: index > 0
                });
            });
        });

        return units;
    }

    function clauseHeights(state, listName) {
        const metrics = Config.PAGINATION.clause;

        return clauseUnits(state, listName).map(unit =>
            metrics.rowBasePx + (wrappedLines(unit.text, metrics.charsPerLine) * metrics.rowLinePx));
    }

    /**
     * Table-of-contents entries, derived without reference to the page plan.
     * The entry list depends only on which sections and annexures are present,
     * so the contents section can be paginated in the same pass that lays out
     * everything else rather than needing a second pass over the plan.
     */
    function tocEntryHeights(state) {
        const metrics = Config.PAGINATION.contents;
        const entries = [];

        selectedSections(state).forEach(section => {
            if (section.id !== 'contents') entries.push(section.group);
        });

        const annexures = includedAnnexures(state);
        if (annexures.length) {
            entries.push('Annexures');
            annexures.forEach(() => entries.push('Annexures'));
        }

        let previousGroup = null;

        return entries.map(group => {
            const height = metrics.itemPx + (group === previousGroup ? 0 : metrics.groupPx);
            previousGroup = group;
            return height;
        });
    }

    /**
     * The warranty schedule: every distinct item/make/warranty combination in
     * the bill of materials. Distinct rather than one line per BOM row, because
     * a schedule listing the same warranty forty times tells the customer
     * nothing and would run to pages of repetition.
     */
    function warrantyRows(state) {
        const seen = {};
        const rows = [];

        (state.bom.categories || []).forEach(category => {
            category.rows.forEach(row => {
                const warranty = trimmed(row.warranty);
                const name = trimmed(row.name);

                if (!name || !warranty || warranty === '—') return;

                const key = `${name} ${trimmed(row.make)} ${warranty}`;
                if (seen[key]) return;

                seen[key] = true;
                rows.push({ name, make: trimmed(row.make), warranty });
            });
        });

        return rows;
    }

    function warrantyRowHeights(state) {
        const metrics = Config.PAGINATION.warranty;

        return warrantyRows(state).map(row => {
            const lines = Math.max(
                wrappedLines(row.name, metrics.charsPerLine.name),
                wrappedLines(row.make, metrics.charsPerLine.make),
                wrappedLines(row.warranty, metrics.charsPerLine.warranty)
            );

            return metrics.rowBasePx + (lines * metrics.rowLinePx);
        });
    }

    function milestoneRowHeights(state) {
        const metrics = Config.PAGINATION.milestone;

        return (state.commercial.milestones || []).map(row => {
            const lines = Math.max(
                wrappedLines(row.name, metrics.charsPerLine.name),
                wrappedLines(row.note, metrics.charsPerLine.note)
            );
            return metrics.rowBasePx + (lines * metrics.rowLinePx);
        });
    }

    function breakdownRowHeights(state) {
        const metrics = Config.PAGINATION.breakdown;

        return (state.commercial.priceBreakdown || []).map(row =>
            metrics.rowBasePx
            + (wrappedLines(row.description, metrics.charsPerLine) * metrics.rowLinePx));
    }

    function annexureIndexHeights(state) {
        const metrics = Config.PAGINATION.annexureIndex;

        return includedAnnexures(state).map((annexure, index) => {
            const title = trimmed(annexure.title) || trimmed(annexure.fileName)
                || `Annexure ${index + 1}`;
            const lines = Math.max(
                wrappedLines(title, metrics.charsPerLine.title),
                wrappedLines(annexure.type, metrics.charsPerLine.type)
            );
            return metrics.rowBasePx + (lines * metrics.rowLinePx);
        });
    }

    /**
     * The narrative sections as a flat list of drawable units, so free text a
     * salesperson pastes in can be chunked across pages like any table instead
     * of being clipped at the bottom of a fixed A4 page.
     *
     * Paragraph breaks are preserved: the text is split on blank lines first,
     * and only a single paragraph too tall for a page is broken further, at
     * word boundaries. Both this module and the renderer build the list from
     * this one function, so the page plan and what is drawn cannot disagree.
     */
    const NARRATIVE_LAYOUT = {
        'project-objectives': [
            { heading: 'Customer Objective', field: 'objective' },
            { heading: 'Existing Electrical System', field: 'existingSystem' },
            { heading: 'Site Conditions & Constraints', field: 'siteConditions' },
            { heading: 'Special Requirements', field: 'specialRequirements' },
            { heading: 'Project Notes', field: 'projectNotes' }
        ],
        // The proposed solution carries the fixed metrics, allocation and scope
        // blocks on its first page, so that page gets a much smaller text
        // budget; the rest of the narrative flows onto continuation pages.
        'proposed-solution': [
            { heading: 'Proposed Solution Summary', field: 'proposedSolution' }
        ]
    };

    /** Budget available for narrative text on the first page of each section. */
    const NARRATIVE_FIRST_BUDGET = {
        'proposed-solution': 210
    };

    function narrativeFirstBudget(sectionId) {
        const budget = Config.PAGINATION.narrative.firstBudgetPx;
        return NARRATIVE_FIRST_BUDGET[sectionId] === undefined
            ? budget
            : NARRATIVE_FIRST_BUDGET[sectionId];
    }

    function splitLongText(text, maxChars) {
        const words = trimmed(text).split(/\s+/).filter(Boolean);
        const parts = [];
        let current = '';

        words.forEach(word => {
            const candidate = current ? `${current} ${word}` : word;
            if (candidate.length > maxChars && current) {
                parts.push(current);
                current = word;
            } else {
                current = candidate;
            }
        });

        if (current) parts.push(current);
        return parts.length ? parts : [''];
    }

    function narrativeUnits(state, sectionId) {
        const layout = NARRATIVE_LAYOUT[sectionId];
        if (!layout) return [];

        const metrics = Config.PAGINATION.narrative;

        // The smallest page this section can offer, less the heading and gap
        // that every unit carries, is what one unit is allowed to fill.
        const smallestBudget = Math.min(narrativeFirstBudget(sectionId), metrics.budgetPx);
        const maxCharsPerUnit = maxCharsForBudget(smallestBudget,
            metrics.headingPx + metrics.paragraphGapPx, metrics.linePx, metrics.charsPerLine);

        const units = [];

        layout.forEach(block => {
            const text = trimmed(state.projectNarrative[block.field]);
            if (!text) return;

            let first = true;

            // Author paragraphs survive: only an oversized one is broken up.
            text.split(/\r?\n\s*\r?\n/).forEach(paragraph => {
                const cleaned = trimmed(paragraph);
                if (!cleaned) return;

                const parts = splitLongText(cleaned, maxCharsPerUnit);

                parts.forEach((part, index) => {
                    // "continued" means this paragraph was cut mid-way, not
                    // merely that another paragraph came before it.
                    const isSplit = index > 0;
                    units.push({
                        heading: isSplit ? `${block.heading} (continued)` : block.heading,
                        text: part,
                        isContinuation: isSplit,
                        repeatHeading: !first && !isSplit
                    });
                    first = false;
                });
            });
        });

        return units;
    }

    function narrativeUnitHeights(state, sectionId) {
        const metrics = Config.PAGINATION.narrative;

        return narrativeUnits(state, sectionId).map(unit =>
            metrics.headingPx
            + metrics.paragraphGapPx
            + (wrappedLines(unit.text, metrics.charsPerLine) * metrics.linePx));
    }

    /**
     * Commercial offer rows: the price breakdown followed by the named
     * discounts. Both tables sit on the same page and both can grow, so they
     * are chunked as one list and the renderer draws whichever slice lands on
     * each page.
     */
    function commercialOfferUnits(state) {
        const metrics = Config.PAGINATION.breakdown;
        const maxChars = maxCharsForBudget(metrics.budgetPx, metrics.rowBasePx,
            metrics.rowLinePx, metrics.charsPerLine);
        const units = [];

        function push(kind, row, text) {
            splitLongText(text, maxChars).forEach((part, index) => {
                units.push({ kind, row, text: part, isContinuation: index > 0 });
            });
        }

        (state.commercial.priceBreakdown || []).forEach(row =>
            push('breakdown', row, row.description));
        (state.commercial.discounts || [])
            .filter(row => num(row.amount) > 0 || trimmed(row.name))
            .forEach(row => push('discount', row, row.name));

        return units;
    }

    function commercialOfferHeights(state) {
        const metrics = Config.PAGINATION.breakdown;

        return commercialOfferUnits(state).map(unit => metrics.rowBasePx
            + (wrappedLines(unit.text, metrics.charsPerLine) * metrics.rowLinePx));
    }

    function sectionChunks(state, sectionId) {
        const pagination = Config.PAGINATION;

        if (sectionId === 'payment-milestones') {
            return chunkByHeight(milestoneRowHeights(state),
                pagination.milestone.firstBudgetPx, pagination.milestone.budgetPx);
        }
        if (sectionId === 'commercial-offer') {
            return chunkByHeight(commercialOfferHeights(state),
                pagination.breakdown.budgetPx, pagination.breakdown.budgetPx);
        }
        if (sectionId === 'annexure-index') {
            return chunkByHeight(annexureIndexHeights(state),
                pagination.annexureIndex.firstBudgetPx, pagination.annexureIndex.budgetPx);
        }
        if (sectionId === 'project-objectives' || sectionId === 'proposed-solution') {
            return chunkByHeight(narrativeUnitHeights(state, sectionId),
                narrativeFirstBudget(sectionId), pagination.narrative.budgetPx);
        }
        if (sectionId === 'warranty-support') {
            return chunkByHeight(warrantyRowHeights(state),
                pagination.warranty.budgetPx, pagination.warranty.budgetPx);
        }
        if (sectionId === 'bill-of-materials') {
            return chunkByHeight(
                bomLineHeights(state),
                pagination.bom.budgetPx - pagination.bom.theadPx,
                pagination.bom.continuationBudgetPx - pagination.bom.theadPx
            );
        }
        if (sectionId === 'terms-conditions' || sectionId === 'scope-inclusions'
            || sectionId === 'scope-exclusions') {
            const listName = sectionId === 'terms-conditions'
                ? 'terms'
                : (sectionId === 'scope-inclusions' ? 'inclusions' : 'exclusions');
            return chunkByHeight(clauseHeights(state, listName),
                pagination.clause.firstBudgetPx, pagination.clause.budgetPx);
        }
        if (sectionId === 'contents') {
            return chunkByHeight(tocEntryHeights(state),
                pagination.contents.firstBudgetPx, pagination.contents.budgetPx);
        }
        if (sectionId === 'savings-projection') {
            return chunkRows(projectionYears(state),
                pagination.savings.firstPageRows, pagination.savings.continuationRows);
        }

        return [{ start: 0, end: 0 }];
    }

    function sectionPageCount(state, sectionId) {
        const section = Config.getSection(sectionId);
        return section && section.paginates ? sectionChunks(state, sectionId).length : 1;
    }

    /**
     * The ordered list of pages the Comprehensive Proposal will produce.
     * Everything downstream — thumbnails, the table of contents, "Page X of Y"
     * and print — reads this one plan, so they all agree.
     */
    function planPages(state) {
        const pages = [];
        const sections = selectedSections(state);
        const annexures = includedAnnexures(state);

        sections.forEach(section => {
            const chunks = sectionChunks(state, section.id);
            const count = section.paginates ? chunks.length : 1;

            for (let part = 0; part < count; part++) {
                pages.push({
                    sectionId: section.id,
                    title: section.title,
                    group: section.group,
                    part,
                    partCount: count,
                    chunk: chunks[part] || { start: 0, end: 0 },
                    isContinuation: part > 0,
                    annexureId: null
                });
            }
        });

        if (annexures.length) {
            const indexChunks = sectionChunks(state, 'annexure-index');

            indexChunks.forEach((chunk, part) => {
                pages.push({
                    sectionId: 'annexure-index',
                    title: 'Annexure Index',
                    group: 'Annexures',
                    part,
                    partCount: indexChunks.length,
                    chunk,
                    isContinuation: part > 0,
                    annexureId: null
                });
            });

            annexures.forEach((annexure, index) => {
                const pageCount = Math.max(1, Math.round(num(annexure.pageCount, 1)));

                for (let part = 0; part < pageCount; part++) {
                    pages.push({
                        sectionId: 'annexures',
                        title: annexure.title
                            ? `Annexure ${index + 1}: ${annexure.title}`
                            : `Annexure ${index + 1}`,
                        group: 'Annexures',
                        part,
                        partCount: pageCount,
                        chunk: { start: part, end: part + 1 },
                        isContinuation: part > 0,
                        annexureId: annexure.id
                    });
                }
            });
        }

        return pages.map((page, index) => Object.assign(page, {
            pageNumber: index + 1,
            totalPages: pages.length
        }));
    }

    /** Table of contents entries: one line per section, at its first page. */
    function tableOfContents(pagePlan) {
        const entries = [];
        let lastKey = null;

        pagePlan.forEach(page => {
            const key = page.annexureId || page.sectionId;

            if (key !== lastKey) {
                entries.push({
                    sectionId: page.sectionId,
                    title: page.title,
                    group: page.group,
                    pageNumber: page.pageNumber
                });
                lastKey = key;
            }
        });

        return entries;
    }

    /** Pages a selection would produce, for the section picker's live estimate. */
    function estimatedPageCount(state) {
        return planPages(state).length;
    }
    return {
        chunkRows,
        chunkByHeight,
        activeBomCategories,
        bomLines,
        bomLineHeights,
        clauseHeights,
        tocEntryHeights,
        milestoneRowHeights,
        breakdownRowHeights,
        commercialOfferUnits,
        commercialOfferHeights,
        clauseUnits,
        annexureIndexHeights,
        narrativeUnits,
        narrativeUnitHeights,
        warrantyRows,
        warrantyRowHeights,
        bomRowCount,
        sectionPageCount,
        sectionChunks,
        planPages,
        tableOfContents,
        estimatedPageCount
    };
}));
