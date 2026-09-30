/**
 * Toolbox Auth — one sign-in for the whole toolbox, four access levels.
 *
 * Usage: load as the first global script on every page, naming the tool where
 * the page is one:
 *   <script src="../../global/scripts/auth.js" data-tool-id="quote-generator"></script>
 *
 * The levels nest — Everyone < Sales < Admin < Owner — so a tool only has to
 * name the lowest level allowed to open it. Adding a tool is one line in
 * TOOL_LEVELS; a tool missing from that list is Owner-only, so a new page is
 * never accidentally public.
 *
 * People sign in as an account, and an account names a level. That is what
 * lets several salespeople hold their own password and show their own name in
 * the sidebar while sharing one set of tools — see ACCOUNTS.
 *
 * This runs in the visitor's browser on a public static site. It decides what
 * a signed-in person sees; it does not stop anyone fetching a tool's files by
 * URL. Treat it as a convenience gate, not a security boundary.
 */
(function () {
    'use strict';

    /** The four access levels, each nesting inside the one above it. */
    const LEVELS = [
        { level: 0, label: 'Everyone' },
        { level: 1, label: 'Sales' },
        { level: 2, label: 'Admin' },
        { level: 3, label: 'Owner' }
    ];

    /**
     * Everyone who can sign in. An account brings its own password and shows
     * its own name in the sidebar, while taking the access of the level it
     * names — so a new salesperson is one line here, not a new level.
     *
     * Passwords must be unique: the first account matching what was typed is
     * the one signed in. Everyone stays first so a blank box lands there.
     */
    const ACCOUNTS = [
        { id: 'everyone', name: 'Everyone', level: 0, password: '' },
        { id: 'sales', name: 'Sales', level: 1, password: 'sales@ray2volt' },
        { id: 'truewatt', name: 'TrueWatt Solar', level: 1, password: 'truewatt' },
        { id: 'admin', name: 'Admin', level: 2, password: 'admin@ray2volt' },
        { id: 'owner', name: 'Owner', level: 3, password: 'fjfj' }
    ];

    /** Lowest level allowed to open each tool, keyed by its tool id. */
    const TOOL_LEVELS = {
        'emi-calculator': 0,
        'gst-calculator': 0,
        'package-prices': 0,
        'sales-sop': 0,
        'solar-savings': 0,
        'comparison-sheet': 1,
        'letterhead-documents': 1,
        'proforma-invoice': 1,
        'quotation': 1,
        'quote-generator': 1,
        'resource-library': 1,
        'invoice-generator': 2,
        'margin-breakdown': 2,
        'pricing-desk': 2,
        'purchase-order': 2,
        'receipt-generator': 2,
        'request-for-quotation': 2,
        'warranty-card': 2,
        'payslip-generator': 3
    };

    /** Tool ids that do not match their page's file name. */
    const HREF_TOOL_IDS = {
        letterheadify: 'letterhead-documents',
        'pricing.ray2voltsolar.com': 'pricing-desk'
    };

    const SESSION_KEY = 'ray2volt_toolbox_session';
    const SESSION_HOURS = 12;

    const scriptTag = document.currentScript;
    const TOOL_ID = scriptTag ? scriptTag.getAttribute('data-tool-id') : null;
    const DASHBOARD_URL = scriptTag
        ? scriptTag.src.replace(/global\/scripts\/auth\.js.*$/, 'index.html')
        : 'index.html';

    // A page naming a tool we do not know about is treated as Owner-only.
    const REQUIRED_LEVEL = TOOL_ID ? (TOOL_ID in TOOL_LEVELS ? TOOL_LEVELS[TOOL_ID] : 3) : 0;

    function accountById(id) {
        return ACCOUNTS.find((account) => account.id === id) || null;
    }

    function levelInfo(level) {
        return LEVELS.find((entry) => entry.level >= level) || LEVELS[LEVELS.length - 1];
    }

    /** The signed-in account, or null when nobody is signed in or the session lapsed. */
    function readSession() {
        let stored = null;
        try {
            stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        } catch (error) {
            return null;
        }
        if (!stored || typeof stored.at !== 'number') return null;
        if (Date.now() - stored.at > SESSION_HOURS * 60 * 60 * 1000) return null;
        return accountById(stored.role);
    }

    function writeSession(accountId) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ role: accountId, at: Date.now() }));
        } catch (error) {
            /* Private browsing with storage denied — the sign-in just won't stick. */
        }
    }

    function clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (error) {
            /* Nothing to clear. */
        }
    }

    /** The tool a nav link or dashboard card points at, or null for the dashboard. */
    function toolIdFromHref(href) {
        const withoutQuery = (href || '').split(/[?#]/)[0].replace(/\/+$/, '');
        const lastSegment = withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1).toLowerCase();
        const base = lastSegment.replace(/\.html$/, '');
        if (!base || base === 'index') return null;
        return HREF_TOOL_IDS[base] || base;
    }

    const style = document.createElement('style');
    style.textContent = `
        .toolbox-auth-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(15, 23, 42, 0.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Google Sans', 'Nunito Sans', system-ui, -apple-system, sans-serif;
        }

        .toolbox-auth-card {
            background: #fff;
            border-radius: 12px;
            padding: 40px 36px 32px;
            width: 90%;
            max-width: 380px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: toolboxAuthIn 0.3s ease-out;
        }

        @keyframes toolboxAuthIn {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .toolbox-auth-icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 16px;
            background: #f1f5f9;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toolbox-auth-icon svg {
            width: 28px;
            height: 28px;
            color: #475569;
        }

        .toolbox-auth-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .toolbox-auth-subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 0 0 24px;
            line-height: 1.5;
        }

        .toolbox-auth-input {
            width: 100%;
            padding: 12px 16px;
            font-size: 14px;
            font-family: inherit;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }

        .toolbox-auth-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .toolbox-auth-input.shake {
            animation: toolboxAuthShake 0.4s ease;
            border-color: #ef4444;
        }

        @keyframes toolboxAuthShake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }

        .toolbox-auth-error {
            font-size: 12px;
            color: #ef4444;
            margin-top: 8px;
            height: 16px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .toolbox-auth-error.visible { opacity: 1; }

        .toolbox-auth-btn {
            width: 100%;
            padding: 12px;
            margin-top: 16px;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            color: #fff;
            background: #2563eb;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .toolbox-auth-btn:hover { background: #1d4ed8; }
        .toolbox-auth-btn:active { background: #1e40af; }

        .toolbox-auth-link {
            display: inline-block;
            margin-top: 14px;
            font-size: 13px;
            color: #2563eb;
            background: none;
            border: none;
            font-family: inherit;
            cursor: pointer;
            text-decoration: none;
        }

        .toolbox-auth-link:hover { text-decoration: underline; }

        body.toolbox-locked > *:not(.toolbox-auth-overlay):not(script):not(style):not(link) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    const LOCK_ICON =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
        ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
        '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';

    function lockPage(cardHtml) {
        document.body.classList.add('toolbox-locked');
        const overlay = document.createElement('div');
        overlay.className = 'toolbox-auth-overlay';
        overlay.innerHTML = `<div class="toolbox-auth-card">${cardHtml}</div>`;
        document.body.appendChild(overlay);
        return overlay;
    }

    function showSignIn() {
        const overlay = lockPage(`
            <div class="toolbox-auth-icon">${LOCK_ICON}</div>
            <h2 class="toolbox-auth-title">Ray2Volt Toolbox</h2>
            <p class="toolbox-auth-subtitle">
                Enter your team password. Leave it blank and press Enter for the
                calculators and Sales SOP.
            </p>
            <input type="password" class="toolbox-auth-input" placeholder="Team password"
                autocomplete="off" autofocus>
            <div class="toolbox-auth-error">That password isn't recognised.</div>
            <button type="button" class="toolbox-auth-btn">Sign in</button>
        `);

        const input = overlay.querySelector('.toolbox-auth-input');
        const errorMessage = overlay.querySelector('.toolbox-auth-error');

        const attemptSignIn = () => {
            const entered = input.value.trim();
            const account = ACCOUNTS.find((candidate) => candidate.password === entered);

            if (account) {
                writeSession(account.id);
                // Reload so the nav is built once, already filtered to this level.
                window.location.reload();
                return;
            }

            input.classList.add('shake');
            errorMessage.classList.add('visible');
            input.value = '';
            input.focus();
            setTimeout(() => input.classList.remove('shake'), 400);
        };

        overlay.querySelector('.toolbox-auth-btn').addEventListener('click', attemptSignIn);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                attemptSignIn();
                return;
            }
            errorMessage.classList.remove('visible');
        });

        requestAnimationFrame(() => input.focus());
    }

    function showNoAccess(account) {
        const needed = levelInfo(REQUIRED_LEVEL);
        const overlay = lockPage(`
            <div class="toolbox-auth-icon">${LOCK_ICON}</div>
            <h2 class="toolbox-auth-title">No access to this tool</h2>
            <p class="toolbox-auth-subtitle">
                You're signed in as <strong>${account.name}</strong>. This tool is open to
                <strong>${needed.label}</strong> and above.
            </p>
            <a class="toolbox-auth-btn" style="display:block;text-decoration:none;box-sizing:border-box"
                href="${DASHBOARD_URL}">Back to Dashboard</a>
            <button type="button" class="toolbox-auth-link">Sign in as someone else</button>
        `);

        overlay.querySelector('.toolbox-auth-link').addEventListener('click', () => {
            clearSession();
            window.location.reload();
        });
    }

    /** Drop every nav link and dashboard card this level cannot open. */
    function pruneNavigation(level) {
        const entries = [
            ...document.querySelectorAll('.main-nav .nav-link'),
            ...document.querySelectorAll('.tool-grid .tool-card')
        ];

        entries.forEach((element) => {
            const toolId = toolIdFromHref(element.getAttribute('href'));
            if (!toolId) return;
            const required = toolId in TOOL_LEVELS ? TOOL_LEVELS[toolId] : 3;
            if (required > level) (element.closest('li') || element).remove();
        });
    }

    function renderSessionInfo(account) {
        const mainNav = document.querySelector('.sidebar .main-nav');
        if (!mainNav) return;

        const sessionInfo = document.createElement('div');
        sessionInfo.className = 'nav-session';
        sessionInfo.title = `Signed in as ${account.name}`;
        sessionInfo.innerHTML =
            '<span class="nav-session-text">' +
            '<span class="nav-session-label">Signed in as</span>' +
            `<span class="nav-session-account-name">${account.name}</span>` +
            '</span>' +
            '<span class="nav-session-actions">' +
            '<button type="button" class="nav-session-theme" aria-pressed="false" ' +
            'aria-label="Switch to dark theme">' +
            '<span class="material-symbols-rounded" aria-hidden="true">dark_mode</span>' +
            '</button>' +
            '<button type="button" class="nav-session-out" aria-label="Sign out">' +
            '<span class="material-symbols-rounded" aria-hidden="true">logout</span>' +
            '</button>' +
            '</span>';
        mainNav.parentNode.insertBefore(sessionInfo, mainNav.nextSibling);

        // theme.js owns the icon and the pressed state from here; it loads in
        // the head, so it is always there by the time this section is built.
        if (window.Ray2VoltTheme) {
            window.Ray2VoltTheme.attachToggle(sessionInfo.querySelector('.nav-session-theme'));
        }

        sessionInfo.querySelector('.nav-session-out').addEventListener('click', () => {
            clearSession();
            window.location.reload();
        });
    }

    const session = readSession();

    if (!session) {
        showSignIn();
    } else if (session.level < REQUIRED_LEVEL) {
        showNoAccess(session);
    } else {
        pruneNavigation(session.level);
        renderSessionInfo(session);
    }
})();
