/**
 * Toolbox shell — builds the mobile header, the sidebar and the dashboard
 * cards from the registry in tools.js, then wires sidebar resizing, the mobile
 * drawer and the tool search.
 *
 * Usage: the last shared script on every page, after tools.js and auth.js.
 * A page only supplies its content:
 *   <div class="app-container">
 *       <main class="main-content">...</main>
 *   </div>
 * and, on the dashboard, an empty <div class="tool-grid"></div>.
 *
 * It runs as soon as it loads rather than on DOMContentLoaded: the script sits
 * at the end of <body>, so the page is already parsed, and building the shell
 * before the first paint keeps the sidebar from popping in.
 */
(function () {
    'use strict';

    const registry = window.Ray2VoltTools;
    const auth = window.Ray2VoltAuth;
    const appContainer = document.querySelector('.app-container');
    if (!registry || !appContainer) return;

    /* --- Shell ---------------------------------------------------------- */

    const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]
    ));

    const MENU_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
    const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>';

    // With nobody signed in the page is locked anyway; list nothing behind it.
    const visibleTools = registry.list.filter((tool) => auth && auth.canOpen(tool.id));
    const currentPage = location.pathname.split('/').pop() || 'index.html';

    function navItem(tool, index) {
        const href = registry.hrefFor(tool);
        const classes = ['nav-link'];
        if (!tool.href && href.split('/').pop() === currentPage) classes.push('active');
        if (tool.href) classes.push('is-external');
        return `<li style="--i: ${index}"><a href="${href}" class="${classes.join(' ')}" data-icon="${tool.icon}"` +
            ` data-keywords="${escapeHtml(tool.keywords || '')}"` +
            `${classes.includes('active') ? ' aria-current="page"' : ''}>${escapeHtml(tool.label)}</a></li>`;
    }

    // The tools in each group's order, skipping groups this account can open
    // nothing in. A tool naming no known group still gets listed, last and
    // unheaded, rather than vanishing.
    const groupIds = new Set(registry.groups.map((group) => group.id));
    const toolSections = registry.groups
        .map((group) => ({ group, tools: visibleTools.filter((tool) => tool.group === group.id) }))
        .filter((section) => section.tools.length > 0);
    const ungroupedTools = visibleTools.filter((tool) => !groupIds.has(tool.group));
    if (ungroupedTools.length) toolSections.push({ group: null, tools: ungroupedTools });

    // --i keeps counting across groups: it staggers the mobile drawer's rows.
    let navIndex = 0;
    const navItems = (tools) => tools.map((tool) => navItem(tool, navIndex++)).join('');

    const navList = navItems([registry.dashboard]) + toolSections.map(({ group, tools }) => {
        if (!group) return navItems(tools);
        const labelId = `nav-group-${group.id}`;
        return `<li class="nav-group"><span class="nav-group-label" id="${labelId}">${escapeHtml(group.label)}</span>` +
            `<ul aria-labelledby="${labelId}">${navItems(tools)}</ul></li>`;
    }).join('');

    const header = document.createElement('header');
    header.className = 'mobile-header';
    header.innerHTML = '<span class="sidebar-brand mobile-brand">Toolbox</span>' +
        `<button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Open navigation menu">${MENU_ICON}</button>`;

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    sidebar.innerHTML =
        '<div class="sidebar-mobile-header"><h2 class="sidebar-brand">Toolbox</h2>' +
        `<button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Close menu">${CLOSE_ICON}</button></div>` +
        '<div><div class="logo-header"><h2 class="sidebar-brand">Toolbox</h2></div>' +
        `<nav class="main-nav" aria-label="Tools"><ul>${navList}</ul></nav>` +
        '</div>';

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';

    appContainer.prepend(header, sidebar);
    document.body.appendChild(overlay);

    // The dashboard's card grid is the same list, with descriptions, under the
    // same group headings. A heading spans the grid's full width.
    const toolGrid = document.querySelector('.tool-grid');
    if (toolGrid) {
        toolGrid.innerHTML = toolSections.map(({ group, tools }) =>
            (group ? `<h2 class="tool-grid-heading">${escapeHtml(group.label)}</h2>` : '') +
            tools.map((tool) =>
                `<a href="${registry.hrefFor(tool)}" class="tool-card${tool.href ? ' is-external' : ''}"` +
                ` data-keywords="${escapeHtml(tool.keywords || '')}">` +
                `<h3 data-icon="${tool.icon}">${escapeHtml(tool.label)}</h3>` +
                `<p>${escapeHtml(tool.description)}</p></a>`
            ).join('')
        ).join('');
    }

    const mainNav = sidebar.querySelector('.main-nav');
    const mobileNavToggle = header.querySelector('#mobileNavToggle');
    const sidebarCloseBtn = sidebar.querySelector('#sidebarCloseBtn');

    /* --- Who is signed in ------------------------------------------------ */

    if (auth && auth.account) {
        const sessionInfo = document.createElement('div');
        sessionInfo.className = 'nav-session';
        sessionInfo.title = `Signed in as ${auth.account.name}`;
        sessionInfo.innerHTML =
            '<span class="nav-session-text">' +
            '<span class="nav-session-label">Signed in as</span>' +
            `<span class="nav-session-account-name">${escapeHtml(auth.account.name)}</span>` +
            '</span>' +
            '<span class="nav-session-actions">' +
            '<button type="button" class="nav-session-theme" aria-pressed="false" ' +
            'aria-label="Switch to dark theme">' +
            '<span class="material-symbols-rounded" aria-hidden="true">dark_mode</span>' +
            '</button>' +
            '<button type="button" class="nav-session-out" aria-label="Sign out" title="Sign out">' +
            '<span class="material-symbols-rounded" aria-hidden="true">logout</span>' +
            '</button>' +
            '</span>';
        mainNav.parentNode.insertBefore(sessionInfo, mainNav.nextSibling);

        // theme.js owns the icon and the pressed state; it loads in the head.
        if (window.Ray2VoltTheme) {
            window.Ray2VoltTheme.attachToggle(sessionInfo.querySelector('.nav-session-theme'));
        }
        sessionInfo.querySelector('.nav-session-out').addEventListener('click', auth.signOut);
    }

    /* --- Collapse and resize (desktop) ----------------------------------- */

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

    const navLinks = mainNav.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
        link.title = link.textContent.trim();
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

    /* --- Mobile drawer --------------------------------------------------- */

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileNavToggle.setAttribute('aria-expanded', 'true');
        // The drawer covers the page and the overlay blocks what is behind it,
        // so the keyboard belongs inside it from the moment it opens.
        sidebarCloseBtn.focus();
    }

    function closeSidebar() {
        const wasOpen = sidebar.classList.contains('open');

        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        clearToolSearch();

        // Hand the keyboard back to the button that opened the drawer, but
        // only if the drawer was actually open — a resize past the desktop
        // threshold calls this too, and must not steal focus from the page.
        if (wasOpen && sidebar.contains(document.activeElement)) mobileNavToggle.focus();
    }

    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNavToggle.setAttribute('aria-controls', sidebar.id);
    mobileNavToggle.addEventListener('click', openSidebar);
    sidebarCloseBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // The drawer reads as a modal, so Escape closes it and Tab stays inside it.
    // Escape inside a filled search box means "clear the query", and that
    // handler marks the event handled; one press should not both clear the
    // search and shut the drawer the user is still searching in.
    document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || !sidebar.classList.contains('open')) return;
        if (event.key === 'Escape') {
            closeSidebar();
        } else if (event.key === 'Tab') {
            const controls = Array.from(sidebar.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled)'))
                .filter((control) => control.getClientRects().length > 0);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    // Close the drawer once the sidebar goes back to its desktop position.
    // The threshold has to be the one the stylesheets use — responsive.css
    // stops drawing the drawer above 768px; any other number leaves a band
    // where an invisible overlay swallows every click.
    window.addEventListener('resize', () => {
        finishSidebarResize();
        applySidebarWidth();
        if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
            closeSidebar();
        }
    });

    /* --- Tool search ----------------------------------------------------- */

    const searchTextFor = (element) =>
        `${element.textContent} ${element.dataset.keywords || ''}`.toLowerCase().replace(/\s+/g, ' ');

    const navEntries = Array.from(navLinks).map((link) => ({
        target: link.closest('li'),
        link,
        haystack: searchTextFor(link)
    }));

    // On the dashboard the same query also narrows the card grid.
    const cardEntries = Array.from(document.querySelectorAll('.tool-grid .tool-card')).map((card) => ({
        target: card,
        link: card,
        haystack: searchTextFor(card)
    }));
    const gridHeadings = Array.from(document.querySelectorAll('.tool-grid .tool-grid-heading'));

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
    let gridEmptyState = null;
    if (toolGrid) {
        gridEmptyState = document.createElement('p');
        gridEmptyState.className = 'tool-grid-empty';
        gridEmptyState.hidden = true;
        toolGrid.after(gridEmptyState);
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

        // A group heading only stands over tools the search left showing.
        mainNav.querySelectorAll('.nav-group').forEach((group) => {
            group.hidden = !group.querySelector('li:not([hidden])');
        });

        gridHeadings.forEach((heading) => {
            let next = heading.nextElementSibling;
            let anyShown = false;
            while (next && !next.matches('.tool-grid-heading')) {
                if (!next.hidden) anyShown = true;
                next = next.nextElementSibling;
            }
            heading.hidden = !anyShown;
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
    const actions = document.createElement('div');
    actions.className = 'mobile-header-actions';
    header.insertBefore(actions, mobileNavToggle);

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
})();
