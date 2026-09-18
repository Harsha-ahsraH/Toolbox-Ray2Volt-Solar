const PLAYBOOK_KEY = 'r2v-sales-sop-playbook';

document.addEventListener('DOMContentLoaded', () => {
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
