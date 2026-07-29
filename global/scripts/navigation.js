/**
 * Shared Navigation Script for Ray2Volt Toolbox
 * Handles sidebar toggle for mobile, the tool search, and responsive behavior
 */

/**
 * Extra words a tool answers to. The visible label is always searched; these
 * cover what someone actually types — "bill" for the Invoice Generator,
 * "tax" for GST, "rfq" for Request For Quotation.
 */
const TOOL_SEARCH_KEYWORDS = {
    'index.html': 'dashboard home overview all tools',
    'emi-calculator.html': 'loan emi finance installment interest monthly bank repayment amortization',
    'gst-calculator.html': 'tax gst percent cgst sgst igst inclusive exclusive',
    'package-prices.html': 'price pricing package cost rate kw capacity on-grid',
    'sales-sop.html': 'sop sales process pitch script subsidy financing training faq',
    'solar-savings.html': 'savings roi irr payback breakeven capex resco returns bill units',
    'receipt-generator.html': 'receipt payment paid advance acknowledgement money',
    'invoice-generator.html': 'invoice bill billing tax gst supply',
    'proforma-invoice.html': 'proforma invoice advance estimate pi',
    'purchase-order.html': 'po purchase order vendor supplier procurement buy',
    'payslip-generator.html': 'payslip salary payroll employee wages commission staff',
    'warranty-card.html': 'warranty certificate guarantee card cover',
    'quote-generator.html': 'quote quotation proposal offer bom pricing customer',
    'comparison-sheet.html': 'comparison compare options build standard basic choice',
    'request-for-quotation.html': 'rfq request for quotation vendor enquiry supplier',
    'letterheadify.html': 'letterhead pdf brand stationery header stamp',
    'resource-library.html': 'resource library download template datasheet brochure document file drive',
    // Keyed by host, not file name — the Pricing Desk is a separate site.
    'pricing.ray2voltsolar.com': 'pricing desk consultant consultants management package prices rates portal'
};

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const mobileHeader = document.querySelector('.mobile-header');
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('overlay');

    if (!sidebar) return;

    sidebar.id = sidebar.id || 'sidebar';

    // Assigned once the search is built; a no-op until then.
    let clearToolSearch = () => {};

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'sidebar-collapse-btn';
    collapseBtn.setAttribute('aria-controls', sidebar.id);

    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'material-symbols-rounded';
    collapseIcon.setAttribute('aria-hidden', 'true');
    collapseBtn.appendChild(collapseIcon);
    sidebar.insertBefore(collapseBtn, sidebar.firstChild);

    const navLinks = sidebar.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach((link) => {
        if (!link.title) link.title = link.textContent.trim();
    });

    function setSidebarCollapsed(collapsed) {
        sidebar.classList.toggle('collapsed', collapsed);
        collapseIcon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));
        collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        if (collapsed) clearToolSearch();
    }

    setSidebarCollapsed(false);
    collapseBtn.addEventListener('click', () => {
        setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
    });

    function openSidebar() {
        sidebar?.classList.add('open');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
        clearToolSearch();
    }

    if (mobileNavToggle && sidebarCloseBtn && overlay) {
        mobileNavToggle.addEventListener('click', openSidebar);
        sidebarCloseBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when window resizes to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });

    /* --- Tool Search ---------------------------------------------------- */

    const mainNav = sidebar.querySelector('.main-nav');
    if (!mainNav) return;

    /**
     * The file name of a tool page, used to tie a nav link to its card. An
     * external tool has no file name, so its host stands in — which is why the
     * trailing slash has to go first.
     */
    function toolKey(href) {
        const withoutQuery = (href || '').split(/[?#]/)[0].replace(/\/+$/, '');
        return withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1).toLowerCase();
    }

    function searchTextFor(element, href) {
        const key = toolKey(href);
        return `${element.textContent} ${TOOL_SEARCH_KEYWORDS[key] || ''}`
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    const navEntries = Array.from(navLinks).map((link) => ({
        target: link.closest('li') || link,
        link,
        haystack: searchTextFor(link, link.getAttribute('href'))
    }));

    // On the dashboard the same query also narrows the card grid.
    const cardEntries = Array.from(document.querySelectorAll('.tool-grid .tool-card')).map((card) => ({
        target: card,
        link: card,
        haystack: searchTextFor(card, card.getAttribute('href'))
    }));

    const searchWrap = document.createElement('div');
    searchWrap.className = 'nav-search';
    searchWrap.innerHTML =
        '<div class="nav-search-field">' +
        '<span class="nav-search-icon material-symbols-rounded" aria-hidden="true">search</span>' +
        '<input type="search" id="toolSearch" class="nav-search-input" placeholder="Search tools"' +
        ' aria-label="Search tools" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="nav-search-clear" id="toolSearchClear" aria-label="Clear search" hidden>' +
        '<span class="material-symbols-rounded" aria-hidden="true">close</span>' +
        '</button>' +
        '</div>';
    mainNav.parentNode.insertBefore(searchWrap, mainNav);

    const searchField = searchWrap.querySelector('.nav-search-field');
    const searchInput = searchWrap.querySelector('.nav-search-input');
    const searchClear = searchWrap.querySelector('.nav-search-clear');

    const emptyState = document.createElement('p');
    emptyState.className = 'nav-search-empty';
    emptyState.hidden = true;
    mainNav.appendChild(emptyState);

    // A dashboard grid that empties out needs to say why.
    const toolGrid = document.querySelector('.tool-grid');
    let gridEmptyState = null;
    if (toolGrid) {
        gridEmptyState = document.createElement('p');
        gridEmptyState.className = 'tool-grid-empty';
        gridEmptyState.hidden = true;
        toolGrid.parentNode.insertBefore(gridEmptyState, toolGrid.nextSibling);
    }

    function visibleLinks() {
        return navEntries.filter((entry) => !entry.target.hidden).map((entry) => entry.link);
    }

    function applyFilter(rawQuery) {
        const query = rawQuery.trim();
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const filtering = terms.length > 0;
        let navMatches = 0;
        let cardMatches = 0;

        const show = (entry) => !filtering || terms.every((term) => entry.haystack.includes(term));

        navEntries.forEach((entry) => {
            entry.target.hidden = !show(entry);
            if (!entry.target.hidden) navMatches += 1;
        });

        cardEntries.forEach((entry) => {
            entry.target.hidden = !show(entry);
            if (!entry.target.hidden) cardMatches += 1;
        });

        const message = `No tool matches “${query}”`;
        mainNav.classList.toggle('is-filtering', filtering);
        searchClear.hidden = !filtering;
        emptyState.hidden = !filtering || navMatches > 0;
        emptyState.textContent = message;

        if (gridEmptyState) {
            gridEmptyState.hidden = !filtering || cardMatches > 0;
            gridEmptyState.textContent = message;
        }
    }

    clearToolSearch = () => {
        if (!searchInput.value) return;
        searchInput.value = '';
        applyFilter('');
    };

    searchInput.addEventListener('input', () => applyFilter(searchInput.value));

    searchClear.addEventListener('click', () => {
        clearToolSearch();
        searchInput.focus();
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (searchInput.value) {
                event.preventDefault();
                clearToolSearch();
            } else {
                searchInput.blur();
            }
            return;
        }

        const [first] = visibleLinks();
        if (event.key === 'Enter' && first) {
            event.preventDefault();
            first.click();
        } else if (event.key === 'ArrowDown' && first) {
            event.preventDefault();
            first.focus();
        }
    });

    mainNav.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const links = visibleLinks();
        const current = links.indexOf(document.activeElement);
        if (current === -1) return;

        event.preventDefault();
        const next = current + (event.key === 'ArrowDown' ? 1 : -1);
        if (next < 0) searchInput.focus();
        else if (links[next]) links[next].focus();
    });

    // Expanding first keeps the field usable when the desktop sidebar is collapsed.
    searchField.addEventListener('mousedown', () => {
        if (sidebar.classList.contains('collapsed')) setSidebarCollapsed(false);
    });

    /* Mobile: the sidebar is behind the hamburger, so give search its own
       control in the fixed header that opens the drawer straight into it. */
    if (mobileHeader && mobileNavToggle) {
        const actions = document.createElement('div');
        actions.className = 'mobile-header-actions';
        mobileHeader.insertBefore(actions, mobileNavToggle);

        const searchToggle = document.createElement('button');
        searchToggle.type = 'button';
        searchToggle.className = 'mobile-search-toggle';
        searchToggle.id = 'mobileSearchToggle';
        searchToggle.setAttribute('aria-label', 'Search tools');
        searchToggle.setAttribute('aria-controls', sidebar.id);
        searchToggle.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">search</span>';

        actions.appendChild(searchToggle);
        actions.appendChild(mobileNavToggle);

        // focus() must stay inside the tap handler or iOS keeps the keyboard shut.
        searchToggle.addEventListener('click', () => {
            openSidebar();
            searchInput.focus();
        });
    }

    document.addEventListener('keydown', (event) => {
        const isShortcut = event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k');
        if (!isShortcut || event.altKey) return;

        const active = document.activeElement;
        const typing = active && (active.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName));
        if (typing) return;

        event.preventDefault();
        if (sidebar.classList.contains('collapsed')) setSidebarCollapsed(false);
        if (window.innerWidth <= 768) openSidebar();
        searchInput.focus();
        searchInput.select();
    });
});
