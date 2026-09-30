/**
 * Toolbox Auth — one sign-in for the whole toolbox, four access levels.
 *
 * Usage: load after tools.js and before navigation.js on every page, naming the
 * tool where the page is one:
 *   <script src="../../global/scripts/auth.js" data-tool-id="quote-generator"></script>
 *
 * The levels nest — Everyone < Sales < Admin < Owner — so a tool only names the
 * lowest level allowed to open it, as `level` in its tools.js entry. A tool
 * missing from the registry is Owner-only, so a new page is never accidentally
 * public.
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

    const OWNER_ONLY = 3;
    const SESSION_KEY = 'ray2volt_toolbox_session';
    const SESSION_HOURS = 12;

    const registry = window.Ray2VoltTools;
    const scriptTag = document.currentScript;
    const TOOL_ID = scriptTag ? scriptTag.getAttribute('data-tool-id') : null;
    const DASHBOARD_URL = registry ? registry.hrefFor(registry.dashboard) : 'index.html';

    /** Lowest level that may open a tool id; unknown tools are Owner-only. */
    function requiredLevel(toolId) {
        const tool = registry && registry.byId(toolId);
        return tool ? tool.level : OWNER_ONLY;
    }

    const REQUIRED_LEVEL = TOOL_ID ? requiredLevel(TOOL_ID) : 0;

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

    function signOut() {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (error) {
            /* Nothing to clear. */
        }
        window.location.reload();
    }

    const LOCK_ICON = '<span class="material-symbols-rounded" aria-hidden="true">lock</span>';

    function lockPage(cardHtml) {
        document.body.classList.add('toolbox-locked');
        const overlay = document.createElement('div');
        overlay.className = 'toolbox-auth-overlay';
        overlay.innerHTML = `<div class="toolbox-auth-card" role="dialog" aria-modal="true"
            aria-labelledby="toolboxAuthTitle">${cardHtml}</div>`;
        document.body.appendChild(overlay);
        return overlay;
    }

    function showSignIn() {
        const overlay = lockPage(`
            <div class="toolbox-auth-icon">${LOCK_ICON}</div>
            <h2 class="toolbox-auth-title" id="toolboxAuthTitle">Ray2Volt Toolbox</h2>
            <p class="toolbox-auth-subtitle">
                Enter your team password. Leave it blank and press Enter for the
                calculators and Sales SOP.
            </p>
            <input type="password" class="toolbox-auth-input" placeholder="Team password"
                aria-label="Team password" autocomplete="off" autofocus>
            <div class="toolbox-auth-error" role="alert">That password isn't recognised.</div>
            <button type="button" class="btn btn-primary btn-block">Sign in</button>
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

        overlay.querySelector('.btn-primary').addEventListener('click', attemptSignIn);
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
            <h2 class="toolbox-auth-title" id="toolboxAuthTitle">No access to this tool</h2>
            <p class="toolbox-auth-subtitle">
                You're signed in as <strong>${account.name}</strong>. This tool is open to
                <strong>${needed.label}</strong> and above.
            </p>
            <a class="btn btn-primary btn-block" href="${DASHBOARD_URL}">Back to Dashboard</a>
            <button type="button" class="toolbox-auth-link">Sign in as someone else</button>
        `);

        overlay.querySelector('.toolbox-auth-link').addEventListener('click', signOut);
    }

    const session = readSession();

    // navigation.js reads this to build a sidebar that only lists what this
    // account may open, and to show who is signed in.
    window.Ray2VoltAuth = Object.freeze({
        account: session,
        canOpen: (toolId) => !!session && requiredLevel(toolId) <= session.level,
        signOut
    });

    if (!session) {
        showSignIn();
    } else if (session.level < REQUIRED_LEVEL) {
        showNoAccess(session);
    }
})();
