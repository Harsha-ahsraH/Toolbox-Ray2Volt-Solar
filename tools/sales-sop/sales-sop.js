const PLAYBOOK_KEY = 'r2v-sales-sop-playbook';
const CAPACITY_KEY = 'r2v-sales-sop-capacity';

/** Rupees, Indian grouping, no paise. */
function inr(value) {
    return '\u20B9' + Math.round(value).toLocaleString('en-IN');
}

/** Rupees to two paise, for a per-unit rate. */
function rate(value) {
    return '\u20B9' + value.toFixed(2);
}

/** Lakh or crore, because a year of savings on a 950 kWp plant is unreadable in full. */
function money(value) {
    if (value >= 10000000) return '\u20B9' + (value / 10000000).toFixed(2) + ' crore';
    if (value >= 100000) return '\u20B9' + (value / 100000).toFixed(2) + ' lakh';
    return inr(value);
}

function units(value) {
    return Math.round(value).toLocaleString('en-IN') + ' kWh';
}

function bar(label, valueText, fraction, modifier) {
    const width = Math.max(0, Math.min(1, fraction)) * 100;
    return '<li class="sop-bar' + (modifier ? ' ' + modifier : '') + '">'
        + '<span class="sop-bar-label">' + label + '</span>'
        + '<span class="sop-bar-track"><span class="sop-bar-fill" style="width:' + width.toFixed(1) + '%"></span></span>'
        + '<span class="sop-bar-value">' + valueText + '</span>'
        + '</li>';
}

function billRow(line, moves, detail) {
    return '<tr class="' + (moves ? 'is-moves' : 'is-fixed') + '">'
        + '<th scope="row">' + line + '</th>'
        + '<td><span class="material-symbols-rounded" aria-hidden="true">'
        + (moves ? 'check_circle' : 'do_not_disturb_on') + '</span>'
        + (moves ? 'Falls' : 'Unchanged') + '</td>'
        + '<td>' + detail + '</td></tr>';
}

/**
 * The C&I capacity selector. Everything in the "Metering, Credits & ToD" block
 * is derived from sales-sop-figures.js, which mirrors the assumptions the
 * pre-built financial decks are generated from.
 */
function initCapacityFigures() {
    const select = document.getElementById('ciCapacity');
    const Figures = window.Ray2VoltSopFigures;
    if (!select || !Figures) return;

    // The ruler runs 0 to 1000 kWp so the 500 kWp ceiling lands exactly halfway
    // and the marker can be positioned by simple proportion.
    const RULER_MAX_KW = 1000;

    function render(capacityKw) {
        const figures = Figures.figuresFor(capacityKw);
        const ceiling = Figures.NET_METERING_MAX_KWP;

        const marker = document.getElementById('ciMarker');
        if (marker) {
            marker.style.left = ((capacityKw / RULER_MAX_KW) * 100).toFixed(1) + '%';
            marker.classList.toggle('is-blocked', !figures.netMetered);
            document.getElementById('ciMarkerLabel').textContent = capacityKw + ' kWp';
        }

        document.getElementById('ciSupply').textContent =
            figures.tariff.label + ' \u00B7 ' + rate(figures.tariff.rate);
        document.getElementById('ciMetering').textContent = figures.meteringLabel;
        document.getElementById('ciGeneration').textContent = units(figures.generationKwh);

        const metering = document.getElementById('ciMetering');
        metering.classList.toggle('is-warning', !figures.netMetered);

        const note = document.getElementById('ciPickerNote');
        if (note) {
            note.textContent = figures.netMetered
                ? 'Within the 500 kWp net metering ceiling.'
                : 'Above the 500 kWp ceiling \u2014 no net metering on this plant.';
            note.classList.toggle('is-warning', !figures.netMetered);
        }

        // --- 2. What a unit is worth ------------------------------------
        const full = figures.tariff.rate;
        document.getElementById('ciValueBars').innerHTML =
            bar('Used on site as it is made', rate(full), 1)
            + bar('Banked, then drawn back inside the year', rate(full) + ' &middot; unit for unit', 1)
            + (figures.netMetered
                ? bar('Still unadjusted on 31 March', rate(figures.surplusRate),
                    figures.surplusRate / full, 'is-weak')
                : bar('Cannot be exported above ' + ceiling + ' kWp', 'Earns nothing', 0, 'is-zero'));

        document.getElementById('ciCreditLine').innerHTML = figures.netMetered
            ? '<strong>Size to the load, not to the roof.</strong> On this plant the '
                + Figures.EXPORT_PERCENT + '% that leaves the site is ' + units(figures.surplusKwh)
                + ' a year. Consumed on site those units are worth ' + money(figures.surplusIfSelfConsumed)
                + '; settled as surplus they fetch ' + money(figures.surplusValue)
                + '. The gap is ' + money(figures.surplusGap) + ' a year, every year.'
            : '<strong>Above the ceiling, surplus is simply lost.</strong> There is no net metering at '
                + capacityKw + ' kWp, so the ' + Figures.EXPORT_PERCENT + '% the site cannot absorb \u2014 '
                + units(figures.surplusKwh) + ' a year \u2014 earns nothing at all. Those same units are worth '
                + money(figures.surplusIfSelfConsumed) + ' if the day-time load can take them, which is the whole '
                + 'design question on a plant this size.';

        // --- 3. The same units under ToD --------------------------------
        const peak = figures.peakRate;
        document.getElementById('ciTodBars').innerHTML =
            bar('Solar hours \u2014 where this plant generates', rate(figures.solarHourRate),
                figures.solarHourRate / peak, 'is-solar')
            + bar('Normal hours', rate(full), full / peak)
            + bar('Evening peak \u2014 where the money is', rate(peak), 1, 'is-peak');

        document.getElementById('ciTodLine').innerHTML =
            '<strong>The trap, in rupees.</strong> A savings estimate built on the flat '
            + rate(full) + ' rate values this plant\u2019s ' + units(figures.selfKwh)
            + ' of self-consumed generation at ' + money(figures.selfValue)
            + ' in year one. Those units are made entirely inside the solar-hours window, where they are worth '
            + money(figures.selfValue - figures.todOverstatement) + '. On a ToD connection the flat estimate '
            + 'overstates year one by ' + money(figures.todOverstatement) + '.';

        // --- 4. Which bill lines move -----------------------------------
        document.getElementById('ciBillLines').innerHTML =
            billRow('Energy charge', true, 'Down about ' + money(figures.selfValue)
                + ' a year at the flat rate' + (figures.netMetered
                    ? ', plus ' + money(figures.surplusValue) + ' of surplus credit'
                    : ''))
            + billRow('Electricity duty', true, 'Falls with the units the meter shows the site drew')
            + billRow('Demand charge, on kVA', false, 'Contract demand must still cover the full load at night')
            + billRow('Fixed charge', false, 'Billed on sanctioned load, not on units')
            + billRow('Minimum charge', false, 'Can strand generation once the plant outruns the day-time load');
    }

    let remembered = null;
    try {
        remembered = localStorage.getItem(CAPACITY_KEY);
    } catch (error) {
        /* storage unavailable \u2014 fall through to the default capacity */
    }
    if (remembered && select.querySelector('option[value="' + remembered + '"]')) {
        select.value = remembered;
    }

    select.addEventListener('change', () => {
        render(Number(select.value));
        try {
            localStorage.setItem(CAPACITY_KEY, select.value);
        } catch (error) {
            /* storage unavailable \u2014 the selector still works for this visit */
        }
    });

    render(Number(select.value));
}


document.addEventListener('DOMContentLoaded', () => {
    initCapacityFigures();

    const systemColumns = document.querySelectorAll('.sop-system-column');

    systemColumns.forEach((column) => {
        const cards = column.querySelectorAll('.sop-card');

        cards.forEach((card) => {
            card.addEventListener('toggle', () => {
                if (!card.open) return;

                cards.forEach((sibling) => {
                    if (sibling !== card) sibling.open = false;
                });
            });
        });
    });

    const tabs = Array.from(document.querySelectorAll('.sop-tab'));
    if (!tabs.length) return;

    function selectTab(tab, moveFocus) {
        tabs.forEach((candidate) => {
            const isActive = candidate === tab;
            const panel = document.getElementById(candidate.dataset.panel);

            candidate.classList.toggle('is-active', isActive);
            candidate.setAttribute('aria-selected', String(isActive));
            // Only the selected tab stays in the tab order; the arrow keys below
            // move between them, which is what a tablist is expected to do.
            candidate.tabIndex = isActive ? 0 : -1;
            if (panel) panel.hidden = !isActive;
        });

        if (moveFocus) tab.focus();

        // A salesperson who only sells one of the two should not re-pick the tab
        // on every visit. A blocked or full store must not break the page.
        try {
            localStorage.setItem(PLAYBOOK_KEY, tab.dataset.panel);
        } catch (error) {
            /* storage unavailable — the tab still works for this visit */
        }
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => selectTab(tab, false));

        tab.addEventListener('keydown', (event) => {
            const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!step) return;

            event.preventDefault();
            const next = (tabs.indexOf(tab) + step + tabs.length) % tabs.length;
            selectTab(tabs[next], true);
        });
    });

    let remembered = null;
    try {
        remembered = localStorage.getItem(PLAYBOOK_KEY);
    } catch (error) {
        /* storage unavailable — fall through to the default tab */
    }

    const restored = remembered && tabs.find((tab) => tab.dataset.panel === remembered);
    if (restored) selectTab(restored, false);
});
