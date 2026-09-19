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
 *
 * The commercial financial decks are the one deliberate exception. They are
 * customer-facing and they publish the 50-950 kW price ladder, which the owner
 * chose to make public on 2026-09-18 so the sales team can send a link without
 * asking anyone for access. Regenerate them with
 * `node scripts/financial-decks/build.js` after editing
 * scripts/financial-decks/assumptions.js; do not hand-edit the PDFs. That one
 * command also rebuilds the combined 59-page set, so the twenty entries below
 * always carry the same figures and the same build date.
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
        'Financial decks',
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
            title: 'Price card and packages',
            description: 'Customer-facing on-grid price card. Subsidy, four packages, down payments and EMI from 2 kWp to 10 kWp.',
            category: 'Price lists',
            place: 'toolbox',
            path: 'downloads/price-lists/ray2volt-price-card-and-packages.pdf',
            format: 'PDF',
            updated: '2026-09-11'
        },
        {
            title: 'Price card and packages (Telugu)',
            description: 'Telugu edition of the customer-facing on-grid price card. Same capacities, packages and EMI figures.',
            category: 'Price lists',
            place: 'toolbox',
            path: 'downloads/price-lists/ray2volt-price-card-and-packages-telugu.pdf',
            format: 'PDF',
            updated: '2026-09-11'
        },
        {
            title: 'Sales requirements and project commissioning form',
            description: 'Blank customer onboarding and project commissioning checklist with on-grid and hybrid schematics.',
            category: 'Templates',
            place: 'toolbox',
            path: 'downloads/templates/sales-requirements-project-commissioning-form.pdf',
            format: 'PDF',
            updated: '2026-07-23'
        },
        {
            title: 'All commercial financial decks, 50 to 950 kWp',
            description: 'Every one of the nineteen decks in a single 59-page PDF, behind a cover and a comparison ladder putting all nineteen capacities \u2014 price, payback, IRR and levelised cost \u2014 on one page. 3.9 MB; download this rather than nineteen files when you want the whole range on a laptop.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-decks-50-950kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '50 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 50 kWp rooftop plant on the APSPDCL LT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-050kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '100 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 100 kWp rooftop plant on the APSPDCL LT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-100kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '150 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 150 kWp rooftop plant on the APSPDCL LT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-150kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '200 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 200 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-200kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '250 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 250 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-250kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '300 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 300 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-300kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '350 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 350 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-350kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '400 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 400 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-400kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '450 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 450 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-450kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '500 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 500 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-500kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '550 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 550 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-550kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '600 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 600 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-600kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '650 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 650 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-650kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '700 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 700 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-700kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '750 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 750 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-750kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '800 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 800 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-800kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '850 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 850 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-850kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '900 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 900 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-900kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
        },
        {
            title: '950 kWp commercial financial analysis',
            description: 'Thirty-year post-tax cash flow, 40% written-down-value depreciation schedule and return metrics for a 950 kWp rooftop plant on the APSPDCL HT commercial tariff.',
            category: 'Financial decks',
            place: 'toolbox',
            path: 'downloads/financial-decks/ray2volt-commercial-financial-deck-950kw.pdf',
            format: 'PDF',
            updated: '2026-09-19'
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
