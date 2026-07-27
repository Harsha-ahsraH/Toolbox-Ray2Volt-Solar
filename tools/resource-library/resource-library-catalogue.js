/**
 * Resource Library — the catalogue.
 *
 * THIS IS THE ONLY FILE YOU EDIT TO ADD A RESOURCE.
 *
 * Plain script rather than a fetched JSON file on purpose: the toolbox is
 * opened straight off disk as often as it is served, and `fetch()` of a local
 * file fails under file://. A <script> tag works either way.
 *
 * ---------------------------------------------------------------------------
 * TWO KINDS OF ENTRY, AND THE DIFFERENCE MATTERS
 *
 *   place: 'toolbox'  The file is committed into this repository and served by
 *                     the site. One-click download, works offline.
 *                     THE REPOSITORY IS PUBLIC. Anyone on the internet can
 *                     download the file directly by URL, the tool password
 *                     does not protect it, and it stays in git history even if
 *                     you delete it later. Use this ONLY for material you are
 *                     happy for a competitor or a customer to read: brochures,
 *                     manufacturer datasheets, blank templates.
 *
 *   place: 'link'     The file lives in Drive / SharePoint and this is only a
 *                     link to it. Whoever owns that folder controls who can
 *                     open it, and your team can add files without touching
 *                     git. Use this for ANYTHING INTERNAL: price lists with
 *                     margins, vendor contracts, signed documents, templates
 *                     containing real figures.
 *
 * If you are unsure which to use, use 'link'.
 * ---------------------------------------------------------------------------
 */
(function (root, factory) {
    'use strict';

    const catalogue = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = catalogue;
    }

    root.Ray2VoltResourceCatalogue = catalogue;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    /** Shown as filter buttons, in this order. A resource must use one of these. */
    const CATEGORIES = [
        'Price lists',
        'Datasheets',
        'Brochures',
        'Templates',
        'Process and SOP',
        'Training'
    ];

    const PLACES = ['toolbox', 'link'];

    /**
     * The resources themselves.
     *
     * `path` is relative to the site root (the folder holding index.html), not
     * to this file — so `downloads/brochure.pdf`, never `../../downloads/...`.
     * `url` is a full https:// address.
     *
     * A worked example of each kind:
     *
     *   {
     *       title: 'Waaree 550 Wp Mono PERC datasheet',
     *       description: 'Manufacturer datasheet. Electrical and mechanical data.',
     *       category: 'Datasheets',
     *       place: 'toolbox',
     *       path: 'downloads/datasheets/waaree-550wp.pdf',
     *       format: 'PDF',
     *       updated: '2026-07-27'
     *   },
     *   {
     *       title: 'Dealer price list including margins',
     *       description: 'Internal. Current landed cost and margin by package.',
     *       category: 'Price lists',
     *       place: 'link',
     *       url: 'https://drive.google.com/file/d/REPLACE_ME/view',
     *       format: 'XLSX',
     *       updated: '2026-07-27'
     *   },
     */
    const RESOURCES = [
        {
            title: 'Ray2Volt Solar prices',
            description: 'Package price sheet, opens in the browser. Already published with the toolbox.',
            category: 'Price lists',
            place: 'toolbox',
            path: 'Samples/Ray2Volt Solar Prices.html',
            format: 'HTML',
            updated: '2026-04-13'
        },
        {
            title: 'Prices and packages notes',
            description: 'Working notes behind the package prices, in plain text.',
            category: 'Price lists',
            place: 'toolbox',
            path: 'MarkDown Files/prices and packages.md',
            format: 'MD',
            updated: '2026-04-13'
        },
        {
            title: 'Ray2Volt Solar sales SOP',
            description: 'The full sales standard operating procedure, opens in the browser.',
            category: 'Process and SOP',
            place: 'toolbox',
            path: 'Samples/Ray2Volt Solar Sales SOP.html',
            format: 'HTML',
            updated: '2026-04-13'
        }
    ];

    /** A stable id per resource, so the DOM can be keyed without one in the data. */
    function slug(title) {
        return String(title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /** Where the file actually is, as a URL usable from the tool page. */
    function target(resource) {
        if (resource.place === 'link') return resource.url || '';
        return '../../' + String(resource.path || '').split('/').map(encodeURIComponent).join('/');
    }

    /**
     * Problems with the catalogue, as plain sentences. Returned rather than
     * thrown so the page can show them instead of rendering nothing, and so the
     * test suite can assert the catalogue is clean.
     */
    function problems(resources) {
        const list = resources || RESOURCES;
        const found = [];
        const seen = new Set();

        list.forEach((resource, index) => {
            const where = resource.title ? `"${resource.title}"` : `entry ${index + 1}`;

            if (!resource.title) found.push(`${where} has no title.`);
            if (!resource.category) found.push(`${where} has no category.`);
            else if (!CATEGORIES.includes(resource.category)) {
                found.push(`${where} uses the unknown category "${resource.category}".`);
            }

            if (!PLACES.includes(resource.place)) {
                found.push(`${where} must set place to 'toolbox' or 'link'.`);
            }

            if (resource.place === 'toolbox' && !resource.path) {
                found.push(`${where} is in the toolbox but has no path.`);
            }
            if (resource.place === 'link' && !/^https:\/\//.test(resource.url || '')) {
                found.push(`${where} is a link but has no https:// url.`);
            }
            if (resource.place === 'toolbox' && resource.url) {
                found.push(`${where} sets both path and url; use one.`);
            }

            const id = slug(resource.title || '');
            if (id && seen.has(id)) found.push(`${where} duplicates another title.`);
            seen.add(id);
        });

        return found;
    }

    /** Categories that actually have something in them, in CATEGORIES order. */
    function usedCategories(resources) {
        const list = resources || RESOURCES;
        const present = new Set(list.map(resource => resource.category));
        return CATEGORIES.filter(category => present.has(category));
    }

    return {
        CATEGORIES,
        PLACES,
        RESOURCES,
        slug,
        target,
        problems,
        usedCategories
    };
});
