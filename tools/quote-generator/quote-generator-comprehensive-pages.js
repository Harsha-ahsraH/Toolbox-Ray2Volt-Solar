/**
 * Quote Generator - Comprehensive page registry and formatting
 * Ray2Volt Solar Toolbox
 *
 * The registry every Comprehensive section renderer registers into, plus the
 * formatting helpers they share. Loaded before the -a and -b renderer files.
 *
 * A renderer receives a context and returns a descriptor:
 *
 *   { title, subtitle, body, chrome, bodyClass, pageClass }
 *
 * `body` is the inner HTML of the page; quote-generator-preview.js wraps it in
 * the A4 .quote-page shell with the running header and the "Page X of Y"
 * footer. `chrome: 'none'` opts out of the standard header (the cover uses it).
 * `pageClass` lands on the .quote-page itself, for rules that have to reach the
 * paper edge; `bodyClass` lands on the inner .cq-body.
 *
 * Renderers never calculate: every number arrives on `context.derived` from
 * quote-generator-calc.js, so preview, print and PDF cannot disagree.
 */
(function (root) {
    'use strict';

    const Config = root.QuoteGeneratorConfig;
    const Model = root.QuoteGeneratorModel;

    // ---------------------------------------------------------------------
    // Registry
    // ---------------------------------------------------------------------

    const renderers = {};

    function register(sectionId, renderer) {
        renderers[sectionId] = renderer;
    }

    // ---------------------------------------------------------------------
    // Formatting helpers
    // ---------------------------------------------------------------------

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** Renders entered text with line breaks preserved. */
    function escLines(value) {
        return esc(value).replace(/\r?\n/g, '<br>');
    }

    /**
     * Missing input placeholder. The preview stays usable with gaps, and the
     * gaps are visibly marked rather than silently blank.
     */
    function fallback(value, label) {
        const text = String(value === null || value === undefined ? '' : value).trim();
        return text ? esc(text) : `<span class="cq-placeholder">[${esc(label || 'to be confirmed')}]</span>`;
    }

    function money(value) {
        return '₹' + Math.round(Number(value) || 0).toLocaleString('en-IN');
    }

    function number(value, places) {
        const parsed = Number(value) || 0;
        return parsed.toLocaleString('en-IN', {
            minimumFractionDigits: places || 0,
            maximumFractionDigits: places === undefined ? 0 : places
        });
    }

    function formatDate(value) {
        if (!value) return '';
        const date = new Date(String(value) + 'T00:00:00');
        if (isNaN(date.getTime())) return String(value);
        return `${date.getDate()} ${Config.MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }

    function labelFor(list, id, fallbackLabel) {
        const match = list.filter(item => item.id === id)[0];
        return match ? match.label : (fallbackLabel || id || '');
    }

    /** Display name for the customer, whichever type is selected. */
    function customerName(state) {
        return state.customer.customerType === 'company'
            ? state.customer.companyName
            : state.customer.customerName;
    }

    function siteAddress(state) {
        return state.customer.sameAsBilling
            ? state.customer.billingAddress
            : state.customer.siteAddress;
    }

    function capacityLine(state) {
        const parts = [`${number(state.project.dcCapacityKwp, 2)} kWp DC`];

        if (Number(state.project.acCapacityKw) > 0) {
            parts.push(`${number(state.project.acCapacityKw, 2)} kW AC`);
        }
        if (state.project.systemConfiguration === 'Hybrid'
            && Number(state.project.batteryEnergyKwh) > 0) {
            parts.push(`${number(state.project.batteryEnergyKwh, 2)} kWh storage`);
        }

        return parts.join(' · ');
    }

    function proposalTitle(state) {
        return state.project.proposalTitle
            || `${number(state.project.dcCapacityKwp, 2)} kWp ${state.project.systemConfiguration} Solar Power Plant`;
    }

    /** Rows from a BOM category that carry a usable description. */
    function categoryRows(state, categoryId) {
        const category = Model.getBomCategory(state, categoryId);
        if (!category) return [];

        return category.rows.filter(row =>
            String(row.name || '').trim() || String(row.specification || '').trim());
    }

    /** Consistent printed units without changing stored warranty wording or periods. */
    function warrantyText(value) {
        return String(value || '').replace(/\b(\d+)\s*(?:yrs?|years?)\b/gi,
            (_, count) => `${count} ${Number(count) === 1 ? 'year' : 'years'}`);
    }

    function equipmentTable(rows, columns) {
        if (!rows.length) {
            return '<p class="cq-para">No equipment of this type is listed in the bill of materials.</p>';
        }

        return `
            <table class="cq-table">
                <thead><tr>${columns.map(column =>
                    `<th${column.className ? ` class="${column.className}"` : ''}${column.width ? ` style="width:${column.width}"` : ''}>${esc(column.label)}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(row =>
                    `<tr>${columns.map(column =>
                        `<td${column.className ? ` class="${column.className}"` : ''}>${column.value(row)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>`;
    }

    /**
     * Shortens narrative text for a summary block. An executive summary that
     * reprints several pages of pasted background is not a summary, and the
     * full text is already carried by its own section.
     */
    function excerpt(value, maxChars) {
        const text = String(value === null || value === undefined ? '' : value).trim();
        const limit = maxChars || 700;

        if (text.length <= limit) return text;

        const cut = text.slice(0, limit);
        const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
        return (lastStop > limit * 0.6 ? cut.slice(0, lastStop + 1) : cut.trim() + '…');
    }

    /** Local photographs and credits are paired so each printed image stays attributable. */
    function componentPhoto(key, compact) {
        const photo = root.QuoteGeneratorComponentImages && root.QuoteGeneratorComponentImages[key];
        if (!photo) return '';
        return `<figure class="cq-component-photo${compact ? ' cq-component-photo-compact' : ''}">
            <img src="assets/components/${esc(photo.file)}" alt="${esc(photo.alt)}"
                width="${photo.width}" height="${photo.height}">
            <figcaption>
                <strong class="cq-component-title">${esc(photo.label)}</strong>
                <p>${esc(photo.description)}</p>
                <p class="cq-component-example">Representative photograph; offered equipment follows the schedule.</p>
                <p class="cq-component-credit">Photo: ${esc(photo.author)} ·
                    <a href="${esc(photo.source)}">Wikimedia Commons</a> ·
                    <a href="${esc(photo.licenseUrl)}">${esc(photo.license)}</a></p>
            </figcaption>
        </figure>`;
    }

    function componentPhotos(keys) {
        const photos = keys.map(key => componentPhoto(key, true)).filter(Boolean);
        return photos.length ? `<div class="cq-grid-2 cq-component-gallery">${photos.join('')}</div>` : '';
    }

    const helpers = {
        componentPhoto,
        componentPhotos,
        esc,
        excerpt,
        escLines,
        fallback,
        money,
        number,
        formatDate,
        labelFor,
        customerName,
        siteAddress,
        capacityLine,
        proposalTitle,
        categoryRows,
        warrantyText,
        equipmentTable
    };

    root.QuoteGeneratorPages = {
        renderers,
        register,
        helpers
    };
}(typeof self !== 'undefined' ? self : this));
