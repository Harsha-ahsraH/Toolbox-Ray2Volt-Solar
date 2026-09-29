/**
 * Quote Generator - Comprehensive icons and charts
 * Ray2Volt Solar Toolbox
 *
 * The document's icon set (Feather-style outlines, never Material Symbols or
 * emoji) and the chart builders. Charts are plain HTML/SVG strings: no
 * library, no script at print time, and they survive html2canvas.
 *
 * Builders draw what they are given. Every number arrives already computed on
 * `derived` from quote-generator-calc.js; this file only scales and labels it.
 */
(function (root) {
    'use strict';

    const PATHS = {
        sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>'
            + '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>'
            + '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>'
            + '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
        zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
        trendDown: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        rupee: '<path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10"/>',
        leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>'
            + '<path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
        check: '<polyline points="20 6 9 17 4 12"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
        grid: '<rect x="2" y="7" width="20" height="10" rx="1"/><path d="M7 7v10M12 7v10M17 7v10M2 12h20"/>',
        box: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/>',
        tower: '<path d="M12 2 7 22M12 2l5 20M8.5 15h7M9.8 9h4.4M5 6h14"/>',
        gauge: '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M8 5.5 7 3M16 5.5 17 3"/>',
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        arrowDown: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
        battery: '<rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="13" x2="23" y2="11"/>'
            + '<line x1="5" y1="10" x2="5" y2="14"/><line x1="9" y1="10" x2="9" y2="14"/>',
        layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/>'
            + '<polyline points="2 12 12 17 22 12"/>',
        tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91'
            + 'a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'
            + '<rect x="8" y="2" width="8" height="4" rx="1"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>'
            + '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1'
            + ' 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
        activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>'
            + '<circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
        pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>'
            + '<path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
        alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'
            + '<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>'
            + '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
        earth: '<line x1="12" y1="2" x2="12" y2="12"/><line x1="5" y1="12" x2="19" y2="12"/>'
            + '<line x1="8" y1="16" x2="16" y2="16"/><line x1="10.5" y1="20" x2="13.5" y2="20"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'
            + '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'
    };

    /** An outlined 24x24 icon; stroke follows the text colour it sits in. */
    function icon(name, className) {
        return `<svg class="cq-ic${className ? ` ${className}` : ''}" viewBox="0 0 24 24" fill="none"`
            + ` stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
            + ` aria-hidden="true">${PATHS[name] || ''}</svg>`;
    }

    /**
     * Money in Indian units for headlines and chart labels: ₹ L up to ₹99 L,
     * then ₹ Cr. Exact rupee amounts stay with Pages.helpers.money.
     */
    /** Rupees in full, with Indian digit grouping: ₹52,52,625. */
    function inr(value) {
        const amount = Number(value) || 0;
        const sign = amount < 0 ? '−' : '';
        return `${sign}₹${Math.round(Math.abs(amount)).toLocaleString('en-IN')}`;
    }

    // ---------------------------------------------------------------------
    // Paired bars: today against with Ray2Volt
    // ---------------------------------------------------------------------

    function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
    }

    /**
     * One before/after comparison: two or more horizontal bars on a shared
     * scale, each split into parts, with a key that names every part and its
     * value. Parts are drawn in the order given; the grid part leads, so the
     * eye compares grey with grey. `kind` picks the fill: grid (context grey),
     * solar (amber), plant (navy), costs (light blue) or kept (dashed outline).
     *
     *   { title, change, rows: [{ label, value, parts: [{ kind, amount }] }],
     *     key: [{ kind, label, value }] }
     *
     * Text arrives escaped by the caller except labels, which are escaped here.
     */
    function barPair(spec) {
        const totals = spec.rows.map(row => row.parts.reduce((sum, part) => sum + Math.max(0, part.amount), 0));
        const scale = Math.max(...totals) || 1;
        const rows = spec.rows.map(row => {
            const parts = row.parts.filter(part => part.amount > 0).map(part => {
                const width = Math.max(0.6, (part.amount / scale) * 100);
                return `<i class="cq-seg cq-seg-${part.kind}" style="width:${Math.round(width * 100) / 100}%"></i>`;
            }).join('');
            return `
                <div class="cq-pair-row">
                    <span class="cq-pair-label">${escapeHtml(row.label)}</span>
                    <span class="cq-pair-track">${parts}</span>
                    <span class="cq-pair-value">${row.value}</span>
                </div>`;
        }).join('');
        const key = spec.key.map(item => `
            <span><i class="cq-seg cq-seg-${item.kind}"></i>${escapeHtml(item.label)}${item.value
                ? ` <strong>${item.value}</strong>` : ''}</span>`).join('');

        return `
            <div class="cq-pair">
                <div class="cq-pair-head">
                    <h4>${escapeHtml(spec.title)}</h4>
                    ${spec.change ? `<span class="cq-pair-change">${spec.change}</span>` : ''}
                </div>
                ${rows}
                <div class="cq-pair-key">${key}</div>
            </div>`;
    }

    // ---------------------------------------------------------------------
    // Shared scale
    // ---------------------------------------------------------------------

    const pct = value => `${Math.round(value * 100) / 100}%`;

    /** A round step that splits `range` into about `count` intervals. */
    function niceStep(range, count) {
        const raw = Math.max(range, 1e-9) / (count || 4);
        const power = Math.pow(10, Math.floor(Math.log10(raw)));
        return [1, 2, 2.5, 5, 10].filter(step => step * power >= raw)[0] * power;
    }

    /** Axis bounds that always include zero and land on round ticks. */
    function scale(values, count) {
        const low = Math.min(0, ...values);
        const high = Math.max(0, ...values);
        // Of about `count` to `count + 2` intervals, keep the one whose axis
        // wastes the least room above and below the data.
        const fit = [count, count + 1, count + 2].map(intervals => {
            const size = niceStep(high - low || 1, intervals);
            const upper = Math.ceil(high / size) * size || size;
            const lower = Math.floor(low / size) * size;
            return { size, upper, lower, used: (high - low || 1) / (upper - lower) };
        }).reduce((best, option) => (option.used > best.used + 1e-9 ? option : best));
        const step = fit.size;
        const top = fit.upper;
        const bottom = fit.lower;
        const ticks = [];
        for (let value = bottom; value <= top + step / 2; value += step) ticks.push(Math.round(value * 1e6) / 1e6);
        return { bottom, top, ticks, at: value => ((value - bottom) / (top - bottom)) * 100 };
    }

    // ---------------------------------------------------------------------
    // Column chart
    // ---------------------------------------------------------------------

    /**
     * Vertical bars built from HTML, so the plot takes whatever height its
     * figure gives it and the page stays full without stretching type.
     *
     *   { categories, series: [{ kind, values }], format(value), ticks,
     *     showCategory(index), labels: [{ series, index }], marker: { index, text },
     *     kindOf(value, seriesIndex) }
     *
     * `kind` picks the fill (see .cq-bar-*). Values arrive computed.
     */
    function columns(spec) {
        const all = [].concat(...spec.series.map(series => series.values));
        const axis = scale(all, spec.ticks || 4);
        const zero = axis.at(0);
        const format = spec.format || (value => String(value));
        const labelled = {};
        (spec.labels || []).forEach(label => { labelled[`${label.series}:${label.index}`] = true; });

        // The label gutter widens for full rupee figures such as ₹8,00,00,000.
        const axisWidth = Math.max(13, Math.max(...axis.ticks.map(value => String(format(value, 'axis')).length)) * 1.3 + 3);
        const ticks = axis.ticks.map(value => `
            <span class="cq-cols-tick${value === 0 ? ' is-zero' : ''}" style="bottom:${pct(axis.at(value))}">
                <b>${escapeHtml(format(value, 'axis'))}</b></span>`).join('');

        const groups = spec.categories.map((category, index) => `
            <span class="cq-cols-group">${spec.series.map((series, seriesIndex) => {
                const value = series.values[index] || 0;
                const end = axis.at(value);
                const kind = spec.kindOf ? spec.kindOf(value, seriesIndex) : series.kind;
                const label = labelled[`${seriesIndex}:${index}`]
                    ? `<em class="cq-cols-value" style="${value < 0 ? `top:${pct(100 - end)}` : `bottom:${pct(end)}`}">`
                        + `${escapeHtml(format(value, 'value'))}</em>` : '';
                return `<span class="cq-cols-slot"><i class="cq-bar cq-bar-${kind}${value < 0 ? ' is-down' : ''}"
                    style="bottom:${pct(Math.min(zero, end))};height:${pct(Math.abs(end - zero))}"></i>${label}</span>`;
            }).join('')}</span>`).join('');

        const marker = spec.marker ? `
            <span class="cq-cols-marker" style="left:${pct(((spec.marker.index + 0.5) / spec.categories.length) * 100)};bottom:${pct(zero)}">
                <b>${escapeHtml(spec.marker.text)}</b></span>` : '';

        const show = spec.showCategory || (() => true);
        return `
            <div class="cq-cols${spec.series.length > 1 ? ' is-grouped' : ''}" style="--cq-cols-n:${spec.categories.length};--cq-axis-w:${axisWidth}mm">
                <div class="cq-cols-plot">${ticks}<div class="cq-cols-bars">${groups}</div>${marker}</div>
                <div class="cq-cols-x">${spec.categories.map((category, index) =>
                    `<span>${show(index) ? escapeHtml(category) : ''}</span>`).join('')}</div>
            </div>`;
    }

    // ---------------------------------------------------------------------
    // Horizontal bars
    // ---------------------------------------------------------------------

    /**
     * One labelled bar per row on a shared scale, with the value written at
     * the bar's end. `axis` adds a tick row under the bars (the warranty
     * timeline); without it the value labels carry the scale.
     *
     *   { rows: [{ label, note, value, text, kind }], max, axis: [values], axisLabel(value) }
     */
    function hbars(spec) {
        const max = spec.max || Math.max(...spec.rows.map(row => row.value), 1);
        const rows = spec.rows.map(row => `
            <div class="cq-hbar-row">
                <span class="cq-hbar-label">${escapeHtml(row.label)}${row.note
                    ? `<small>${escapeHtml(row.note)}</small>` : ''}</span>
                <span class="cq-hbar-track">
                    <i class="cq-bar-h cq-bar-${row.kind || 'plant'}" style="width:${pct(Math.max(0.8, (row.value / max) * 100))}"></i>
                    <b style="left:${pct(Math.min(100, (row.value / max) * 100))}">${escapeHtml(row.text)}</b>
                </span>
            </div>`).join('');
        const axis = spec.axis ? `
            <div class="cq-hbar-axis">${spec.axis.map(value =>
                `<span style="left:${pct((value / max) * 100)}">${escapeHtml(spec.axisLabel ? spec.axisLabel(value) : value)}</span>`)
                .join('')}</div>` : '';
        const grid = spec.axis ? spec.axis.map(value =>
            `<i class="cq-hbar-grid" style="left:${pct((value / max) * 100)}"></i>`).join('') : '';

        return `<div class="cq-hbars${spec.axis ? ' has-axis' : ''}"><div class="cq-hbar-plot">${grid}</div>${rows}${axis}</div>`;
    }

    // ---------------------------------------------------------------------
    // Share of a whole: ring and stacked bar
    // ---------------------------------------------------------------------

    const RING_COLOURS = { plant: 'var(--cq-s1)', export: 'var(--cq-s3)', solar: 'var(--cq-s2)', grid: 'var(--cq-ctx)' };

    /** A ring of two or three shares, the lead share written in the middle. */
    function donut(parts, centre, caption) {
        const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0) || 1;
        const cx = 50;
        const radius = 38;
        let angle = -Math.PI / 2;
        const arcs = parts.filter(part => part.value > 0).map(part => {
            const share = part.value / total;
            const gap = share < 1 ? 0.035 : 0;
            const end = angle + share * 2 * Math.PI - gap;
            const point = a => `${(cx + radius * Math.cos(a)).toFixed(2)},${(cx + radius * Math.sin(a)).toFixed(2)}`;
            const path = share >= 1
                ? `<circle cx="${cx}" cy="${cx}" r="${radius}" fill="none" stroke="${RING_COLOURS[part.kind]}" stroke-width="15"/>`
                : `<path d="M${point(angle)} A${radius},${radius} 0 ${share > 0.5 ? 1 : 0} 1 ${point(end)}" fill="none"`
                    + ` stroke="${RING_COLOURS[part.kind]}" stroke-width="15"/>`;
            angle = end + gap;
            return path;
        }).join('');

        return `<svg class="cq-donut" viewBox="0 0 100 100" aria-hidden="true">${arcs}
            <text x="50" y="52" text-anchor="middle" class="cq-donut-value">${escapeHtml(centre)}</text>
            <text x="50" y="64" text-anchor="middle" class="cq-donut-caption">${escapeHtml(caption)}</text></svg>`;
    }

    /** Milestones as one bar, light to dark as the project progresses. */
    const RAMP = ['#C9DAEB', '#8FB3D6', '#4F7FAE', '#1F4E79', '#17395A', '#0F2940'];

    function stack(parts) {
        // Up to four parts end on the house navy; more run on into the darker steps.
        const first = Math.max(0, 4 - parts.length);
        const colour = index => RAMP[Math.min(RAMP.length - 1, first + index)];
        return `
            <div class="cq-stack">${parts.map((part, index) =>
                `<i style="flex:${Math.max(0.5, part.percent)};background:${colour(index)}"></i>`).join('')}</div>
            <div class="cq-stack-key" style="--cq-stack-cols:${Math.min(parts.length, 4)}">${parts.map((part, index) => `
                <span><i style="background:${colour(index)}"></i><b>${escapeHtml(part.share)}</b>
                    ${escapeHtml(part.label)}<small>${escapeHtml(part.amount)}</small></span>`).join('')}</div>`;
    }

    // ---------------------------------------------------------------------
    // Schedule
    // ---------------------------------------------------------------------

    /** An indicative Gantt: one row per phase on a week scale. */
    function gantt(spec) {
        const weeks = spec.weeks;
        const step = weeks > 10 ? 2 : 1;
        const at = week => pct((week / weeks) * 100);
        const lines = [];
        for (let week = 0; week <= weeks; week += step) lines.push(week);

        return `
            <div class="cq-gantt">
                <div class="cq-gantt-grid">${lines.map(week => `<i style="left:${at(week)}"></i>`).join('')}</div>
                ${spec.rows.map(row => `
                    <div class="cq-gantt-row">
                        <span class="cq-gantt-label">${escapeHtml(row.label)}<small>${escapeHtml(row.owner)}</small></span>
                        <span class="cq-gantt-track"><i class="cq-bar-h cq-bar-${row.kind}"
                            style="left:${at(row.start)};width:${at(Math.max(0.25, row.end - row.start))}"></i></span>
                    </div>`).join('')}
                <div class="cq-gantt-axis">${lines.map(week =>
                    `<span style="left:${at(week)}">${week === 0 ? 'Order' : `Wk ${week}`}</span>`).join('')}</div>
            </div>`;
    }

    // ---------------------------------------------------------------------
    // Tree pictogram
    // ---------------------------------------------------------------------

    const TREE = '<path d="M12 2 5 13h4l-3.5 6h13L15 13h4z"/><path d="M11 19h2v3h-2z"/>';

    /** Up to 60 tree marks, each standing for a round number of trees. */
    function trees(count) {
        const total = Math.max(0, Math.round(count));
        const raw = total / 60;
        const power = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
        const each = total <= 60 ? 1 : [1, 2, 5, 10].filter(step => step * power >= raw)[0] * power;
        const marks = Math.max(1, Math.round(total / each));

        return {
            each,
            html: `<div class="cq-trees">${Array.from({ length: marks }, () =>
                `<svg viewBox="0 0 24 24" aria-hidden="true">${TREE}</svg>`).join('')}</div>`
        };
    }

    /** A thin share bar for table cells. */
    function meter(percent) {
        return `<span class="cq-meter"><i style="width:${pct(Math.max(0, Math.min(100, percent)))}"></i></span>`;
    }

    root.QuoteGeneratorCharts = { icon, inr, barPair, columns, hbars, donut, stack, gantt, trees, meter };
}(typeof self !== 'undefined' ? self : this));
