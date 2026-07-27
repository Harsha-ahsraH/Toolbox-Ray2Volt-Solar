/**
 * Comparison Sheet — specification templates and fixed copy.
 *
 * Plain script rather than a fetched JSON file on purpose: the toolbox is
 * opened straight off disk as often as it is served, and `fetch()` of a local
 * file fails under file://. A <script> tag works either way.
 *
 * Rows carrying a `derived` key are filled from the project inputs at render
 * time; their `values` are placeholders the model overwrites.
 */
(function (root, factory) {
    'use strict';

    const content = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = content;
    }

    root.Ray2VoltComparisonContent = content;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const OPTION_LABELS = ['Option 1', 'Option 2', 'Option 3'];
    const OPTION_SUBLABELS = ['Basic build', 'Standard build', 'Ray2Volt Choice'];

    const SUITED_TO = [
        'Sites with a full in-house electrical maintenance team',
        'Sites with periodic technical supervision available',
        'Sites requiring maximum generation and minimum intervention'
    ];

    /**
     * How each cell is flagged on the printed sheet: 'poor' prints red, 'good'
     * prints green, 'fair' stays neutral so the eye goes to the extremes.
     *
     * Most rows climb from poor to good across the three builds, so that is the
     * default and only the exceptions carry a `tone` of their own. A row where
     * all three are a legitimate choice — module technology, for instance,
     * where every option is ALMM-listed — must not paint Option 1 red.
     */
    const DEFAULT_TONE = ['poor', 'fair', 'good'];

    /** Rows every build shares. Ground-mount wording, as agreed. */
    const BASE_ROWS = [
        {
            id: 'module_technology',
            label: 'Module technology',
            tone: ['fair', 'fair', 'good'],
            values: ['Mono PERC bifacial, 540–550 Wp', 'Mono PERC bifacial, 550 Wp', 'N-type TopCon bifacial, 620 Wp']
        },
        {
            id: 'rear_side',
            label: 'Rear-side generation',
            derived: 'bifacial',
            tone: ['fair', 'fair', 'good'],
            values: ['', '', '']
        },
        {
            id: 'structure_steel',
            label: 'Structure steel',
            values: ['28 kg/kWp', '38 kg/kWp', '45 kg/kWp']
        },
        {
            id: 'corrosion',
            label: 'Corrosion protection',
            values: ['Pre-galvanised', 'Hot-dip galvanised, 70 µm', 'Hot-dip galvanised, 80+ µm']
        },
        {
            id: 'foundation',
            label: 'Foundation design',
            values: ['Compression load only', 'Compression and partial uplift', 'Uplift-designed for 47 m/s wind zone']
        },
        {
            id: 'ac_cabling',
            label: 'AC cabling',
            values: ['Aluminium, sized at rated limit', 'Copper, minimal derating headroom', 'Copper, 30% derating headroom']
        },
        {
            id: 'earthing',
            label: 'Earthing',
            derived: 'earthing',
            values: ['', '', '']
        },
        {
            id: 'lightning',
            label: 'Lightning protection',
            values: ['Not included', '2 conventional Franklin rods', 'ESE arrestor, full array coverage']
        },
        {
            id: 'dc_protection',
            label: 'DC-side protection',
            values: ['Strings direct to inverter', 'DCDB with DC fuses', 'DCDB with fuses and Type-2 SPD']
        },
        {
            id: 'monitoring',
            label: 'Monitoring',
            values: ['Not included', 'Inverter-level', 'Inverter-level with remote fault alerts']
        },
        {
            id: 'liaisoning',
            label: 'CEIG and DISCOM liaisoning',
            tone: ['poor', 'good', 'good'],
            values: ['Billed separately', 'Included', 'Included']
        },
        {
            id: 'workmanship',
            label: 'Workmanship warranty',
            values: ['1 year', '5 years', '10 years']
        },
        {
            id: 'amc',
            label: 'Annual maintenance',
            derived: 'amc',
            values: ['', '', '']
        }
    ];

    /** Battery and backup rows, appended for hybrid only. */
    const HYBRID_ROWS = [
        {
            id: 'battery_chemistry',
            label: 'Battery chemistry',
            values: ['Lead-acid tubular', 'LFP, entry-grade cells', 'LFP, A-grade prismatic cells']
        },
        {
            id: 'battery_capacity',
            label: 'Usable storage',
            derived: 'battery',
            values: ['', '', '']
        },
        {
            id: 'battery_warranty',
            label: 'Battery warranty',
            values: ['2 years', '5 years or 4,000 cycles', '10 years or 6,000 cycles']
        },
        {
            id: 'hybrid_inverter',
            label: 'Hybrid inverter',
            values: ['No generator input', 'Bidirectional, generator input', 'Bidirectional, generator input and peak shaving']
        },
        {
            id: 'changeover',
            label: 'Backup changeover',
            values: ['Manual changeover', 'Automatic, 20 ms typical', 'Automatic, under 10 ms, whole load']
        }
    ];

    /**
     * Rows in print order. Battery rows sit directly after the module rows so
     * the storage story reads as part of the build, not as an afterthought
     * below the warranty lines.
     */
    function copyRow(row) {
        return {
            ...row,
            values: row.values.slice(),
            tone: (row.tone || DEFAULT_TONE).slice()
        };
    }

    function rowsFor(systemType) {
        const rows = BASE_ROWS.map(copyRow);
        if (systemType !== 'hybrid') return rows;

        const insertAt = rows.findIndex(row => row.id === 'monitoring');
        rows.splice(insertAt, 0, ...HYBRID_ROWS.map(copyRow));

        return rows;
    }

    const BASE_QUESTIONS = [
        'What is the mounting structure weight in kg per kWp, and the galvanising thickness in microns? Ask for the fabricator’s weight statement.',
        'Is the AC cable copper or aluminium, and what is the voltage-drop calculation at full rated load?',
        'How many earth pits, and are they chemical electrodes or plain GI rods? Is a lightning arrestor included?',
        'Are CEIG approval and DISCOM liaisoning inside the quoted price, or billed separately later?',
        'Is the module bifacial, what is the bifaciality factor, and what output does the warranty guarantee in year 25?',
        'What is the inverter make and model, the DC-to-AC ratio, and the standard warranty in years?',
        'What exactly does the annual maintenance charge cover — how many cleaning cycles a year, and is water included?',
        'Which test reports are handed over at commissioning — string I-V, earth resistance, and thermography?'
    ];

    const HYBRID_QUESTION =
        'What is the battery chemistry, the usable depth of discharge, and is the warranty written in years or in cycles?';

    function questionsFor(systemType) {
        return systemType === 'hybrid'
            ? BASE_QUESTIONS.concat(HYBRID_QUESTION)
            : BASE_QUESTIONS.slice();
    }

    const COUNT_WORDS = {
        8: 'Eight',
        9: 'Nine'
    };

    function questionsHeading(count) {
        return `${COUNT_WORDS[count] || count} questions worth asking every vendor`;
    }

    const MODULES_PARAGRAPH =
        'Modules. All three options use ALMM-listed, BIS and IEC certified bifacial modules. The difference between ' +
        'them is cell technology, balance-of-system specification and workmanship — not certification. Every line ' +
        'above can be verified against any competing quotation.';

    const EXCLUSIONS_PARAGRAPH =
        'Exclusions, all options. Perimeter fencing, site levelling and all HT-side work. Prices exclusive of GST.';

    const FOOTER_LEFT = 'Ray2Volt Solar Private Limited';

    return {
        OPTION_LABELS,
        OPTION_SUBLABELS,
        SUITED_TO,
        DEFAULT_TONE,
        BASE_ROWS,
        HYBRID_ROWS,
        rowsFor,
        questionsFor,
        questionsHeading,
        MODULES_PARAGRAPH,
        EXCLUSIONS_PARAGRAPH,
        FOOTER_LEFT
    };
});
