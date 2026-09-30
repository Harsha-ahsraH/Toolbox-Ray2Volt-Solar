/**
 * Shared Navigation Script for Ray2Volt Toolbox
 * Handles sidebar resizing, mobile toggles, tool search, and responsive behavior
 */

/**
 * Extra words a tool answers to. The visible label is always searched; these
 * cover what someone actually types — "bill" for the Tax Invoice,
 * "tax" for GST, "rfq" for Request for Quotation.
 */
const TOOL_SEARCH_KEYWORDS = {
    'index.html': 'dashboard home overview all tools',
    'emi-calculator.html': 'loan emi finance installment interest monthly bank repayment amortization',
    'gst-calculator.html': 'tax gst percent cgst sgst igst inclusive exclusive',
    'package-prices.html': 'price pricing package cost rate kw capacity on-grid',
    'sales-sop.html': 'sop sales process pitch script subsidy financing training faq',
    'solar-savings.html': 'savings roi irr payback breakeven capex resco returns bill units',
    'receipt-generator.html': 'receipt payment paid advance acknowledgement money',
    'invoice-generator.html': 'invoice generator bill billing tax gst supply',
    'proforma-invoice.html': 'proforma invoice advance estimate pi',
    'quotation.html': 'quotation quote 1-page one page customer gst',
    'purchase-order.html': 'po purchase order vendor supplier procurement buy',
    'payslip-generator.html': 'payslip salary payroll employee wages commission staff',
    'warranty-card.html': 'warranty certificate guarantee card cover',
    'quote-generator.html': 'quote quotation proposal offer bom pricing customer',
    'comparison-sheet.html': 'comparison compare options build standard basic choice',
    'margin-breakdown.html': 'margin breakdown add-on addon consultant channel partner price split commission',
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

    const DESKTOP_MIN_WIDTH = 769;
    const MIN_SIDEBAR_WIDTH = 220;
    const LAYOUT_STORAGE_KEY = 'ray2volt.sidebar-layout';
    const root = document.documentElement;
    const rootStyle = getComputedStyle(root);
    const collapsedWidth = parseFloat(rootStyle.getPropertyValue('--sidebar-collapsed-width')) || 76;
    let expandedWidth = parseFloat(rootStyle.getPropertyValue('--sidebar-width')) || 250;
    let currentWidth = expandedWidth;
    let savedCollapsed = false;

    try {
        const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY));
        if (saved && Number.isFinite(saved.width) && saved.width >= MIN_SIDEBAR_WIDTH) {
            expandedWidth = saved.width;
            savedCollapsed = saved.collapsed === true;
        }
    } catch (_) {
        // Resizing still works when this browser does not allow storage.
    }

    const resizeHandle = document.createElement('span');
    resizeHandle.className = 'sidebar-resize-handle';
    resizeHandle.tabIndex = 0;
    resizeHandle.setAttribute('role', 'separator');
    resizeHandle.setAttribute('aria-label', 'Resize sidebar');
    resizeHandle.setAttribute('aria-orientation', 'vertical');
    resizeHandle.setAttribute('aria-controls', sidebar.id);
    resizeHandle.setAttribute('aria-valuemin', String(collapsedWidth));
    resizeHandle.title = 'Drag to resize. Arrow keys adjust width; Home collapses; End expands.';
    sidebar.appendChild(resizeHandle);

    function maxSidebarWidth() {
        return Math.max(MIN_SIDEBAR_WIDTH, window.innerWidth - 320);
    }

    function updateResizeControl() {
        const collapsed = sidebar.classList.contains('collapsed');
        const width = collapsed ? collapsedWidth : currentWidth;
        resizeHandle.setAttribute('aria-valuemax', String(maxSidebarWidth()));
        resizeHandle.setAttribute('aria-valuenow', String(width));
        resizeHandle.setAttribute('aria-valuetext', collapsed ? 'Collapsed' : `${width} pixels wide`);
    }

    function applySidebarWidth() {
        currentWidth = Math.round(Math.min(expandedWidth, maxSidebarWidth()));
        root.style.setProperty('--sidebar-width', `${currentWidth}px`);
        updateResizeControl();
    }

    function saveSidebarLayout() {
        try {
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({
                width: expandedWidth,
                collapsed: sidebar.classList.contains('collapsed')
            }));
        } catch (_) {
            // The current page keeps its layout even without persistence.
        }
    }

    const navLinks = sidebar.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach((link) => {
        if (!link.title) link.title = link.textContent.trim();
    });

    function setSidebarCollapsed(collapsed, persist = true) {
        sidebar.classList.toggle('collapsed', collapsed);
        collapseIcon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));
        collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        if (collapsed) clearToolSearch();
        updateResizeControl();
        if (persist) saveSidebarLayout();
    }

    applySidebarWidth();
    setSidebarCollapsed(savedCollapsed, false);
    collapseBtn.addEventListener('click', () => {
        setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
    });

    function resizeSidebar(width) {
        if (width < MIN_SIDEBAR_WIDTH) {
            setSidebarCollapsed(true, false);
        } else {
            expandedWidth = Math.round(Math.min(width, maxSidebarWidth()));
            applySidebarWidth();
            setSidebarCollapsed(false, false);
        }
    }

    let resizeDrag = null;

    function finishSidebarResize(cancelled = false) {
        if (!resizeDrag) return;
        const drag = resizeDrag;
        resizeDrag = null;
        document.body.classList.remove('sidebar-resizing');
        if (cancelled) {
            expandedWidth = drag.width;
            applySidebarWidth();
            setSidebarCollapsed(drag.collapsed, false);
        } else {
            saveSidebarLayout();
        }
        if (resizeHandle.hasPointerCapture(drag.pointerId)) {
            resizeHandle.releasePointerCapture(drag.pointerId);
        }
    }

    resizeHandle.addEventListener('pointerdown', (event) => {
        if (window.innerWidth < DESKTOP_MIN_WIDTH || event.button !== 0 || resizeDrag) return;
        event.preventDefault();
        resizeDrag = {
            pointerId: event.pointerId,
            offset: event.clientX - sidebar.getBoundingClientRect().width,
            width: expandedWidth,
            collapsed: sidebar.classList.contains('collapsed')
        };
        document.body.classList.add('sidebar-resizing');
        resizeHandle.setPointerCapture(event.pointerId);
    });

    resizeHandle.addEventListener('pointermove', (event) => {
        if (!resizeDrag || event.pointerId !== resizeDrag.pointerId) return;
        resizeSidebar(event.clientX - resizeDrag.offset);
    });

    resizeHandle.addEventListener('pointerup', (event) => {
        if (resizeDrag && event.pointerId === resizeDrag.pointerId) finishSidebarResize();
    });
    resizeHandle.addEventListener('pointercancel', () => finishSidebarResize(true));
    resizeHandle.addEventListener('lostpointercapture', () => finishSidebarResize());

    resizeHandle.addEventListener('keydown', (event) => {
        if (window.innerWidth < DESKTOP_MIN_WIDTH) return;
        const collapsed = sidebar.classList.contains('collapsed');
        const step = event.shiftKey ? 48 : 16;
        if (event.key === 'ArrowLeft') resizeSidebar(collapsed ? collapsedWidth : currentWidth - step);
        else if (event.key === 'ArrowRight') resizeSidebar(collapsed ? MIN_SIDEBAR_WIDTH : currentWidth + step);
        else if (event.key === 'Home') setSidebarCollapsed(true, false);
        else if (event.key === 'End') resizeSidebar(maxSidebarWidth());
        else if (event.key === 'Enter' || event.key === ' ') setSidebarCollapsed(!collapsed, false);
        else return;
        event.preventDefault();
        saveSidebarLayout();
    });

    function openSidebar() {
        sidebar?.classList.add('open');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileNavToggle?.setAttribute('aria-expanded', 'true');
        // The drawer covers the page and the overlay blocks what is behind it,
        // so the keyboard belongs inside it from the moment it opens.
        sidebarCloseBtn?.focus();
    }

    function closeSidebar() {
        const wasOpen = sidebar?.classList.contains('open');

        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
        mobileNavToggle?.setAttribute('aria-expanded', 'false');
        clearToolSearch();

        // Hand the keyboard back to the button that opened the drawer, but
        // only if the drawer was actually open — a resize past the desktop
        // threshold calls this too, and must not steal focus from the page.
        if (wasOpen && document.activeElement !== document.body) {
            const insideDrawer = sidebar?.contains(document.activeElement);
            if (insideDrawer) mobileNavToggle?.focus();
        }
    }

    if (mobileNavToggle && sidebarCloseBtn && overlay) {
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        mobileNavToggle.addEventListener('click', openSidebar);
        sidebarCloseBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);

        // The drawer reads as a modal — it covers the page and the overlay
        // blocks what is behind it — so Escape has to be a way out of it.
        // Escape inside a filled search box means "clear the query", and that
        // handler marks the event handled; one press should not both clear the
        // search and shut the drawer the user is still searching in.
        document.addEventListener('keydown', (event) => {
            if (event.defaultPrevented) return;
            if (event.key === 'Escape' && sidebar?.classList.contains('open')) {
                closeSidebar();
            }
        });
    }

    // Close the drawer once the sidebar goes back to its desktop position.
    // The threshold has to be the one the stylesheets use — responsive.css
    // stops drawing the drawer above 768px. Closing at 992 instead left a
    // 769-992px band where the sidebar had already returned to the page but
    // .open, the overlay and the body scroll lock were all still set: an
    // invisible overlay sitting at pointer-events:auto over a desktop layout,
    // swallowing every click, with the page unable to scroll.
    window.addEventListener('resize', () => {
        finishSidebarResize();
        applySidebarWidth();
        if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
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
