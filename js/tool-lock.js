/**
 * Tool Lock — Page-level password protection for standalone tool pages.
 * 
 * Usage: Add this script tag to any tool page with a data-tool-id attribute:
 *   <script src="../js/tool-lock.js" data-tool-id="quote-generator"></script>
 * 
 * - Shows a fullscreen lock overlay on page load, blocking all content.
 * - Fetches valid passwords from ../passwords.json based on data-tool-id.
 * - Once unlocked, stores the session in sessionStorage so the user
 *   doesn't need to re-enter for the same tool in the same browser tab.
 */
(function () {
    'use strict';

    // --- Get tool ID from script tag's data attribute ---
    const scriptTag = document.currentScript;
    const TOOL_ID = scriptTag ? scriptTag.getAttribute('data-tool-id') : null;

    if (!TOOL_ID) {
        console.warn('tool-lock.js: No data-tool-id attribute found on script tag.');
        return;
    }

    // --- Session key (unique per tool ID) ---
    const PAGE_KEY = 'tool_unlocked_' + TOOL_ID;

    // --- Check if already unlocked this session ---
    if (sessionStorage.getItem(PAGE_KEY) === 'true') {
        return; // Already authenticated, do nothing
    }

    // --- Inject CSS ---
    const style = document.createElement('style');
    style.textContent = `
        /* Lock Overlay */
        .tool-lock-overlay {
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

        .tool-lock-card {
            background: #fff;
            border-radius: 12px;
            padding: 40px 36px 32px;
            width: 90%;
            max-width: 380px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            text-align: center;
            animation: lockSlideIn 0.3s ease-out;
        }

        @keyframes lockSlideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .tool-lock-icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 16px;
            background: #f1f5f9;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tool-lock-icon svg {
            width: 28px;
            height: 28px;
            color: #475569;
        }

        .tool-lock-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px;
        }

        .tool-lock-subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 0 0 24px;
        }

        .tool-lock-input {
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

        .tool-lock-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .tool-lock-input.shake {
            animation: lockShake 0.4s ease;
            border-color: #ef4444;
        }

        @keyframes lockShake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }

        .tool-lock-error {
            font-size: 12px;
            color: #ef4444;
            margin-top: 8px;
            height: 16px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .tool-lock-error.visible {
            opacity: 1;
        }

        .tool-lock-btn {
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

        .tool-lock-btn:hover {
            background: #1d4ed8;
        }

        .tool-lock-btn:active {
            background: #1e40af;
        }

        /* Hide page content while locked */
        body.tool-locked > *:not(.tool-lock-overlay):not(script):not(style):not(link) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // --- Lock the page ---
    document.body.classList.add('tool-locked');

    // --- Create lock overlay HTML ---
    const overlay = document.createElement('div');
    overlay.className = 'tool-lock-overlay';
    overlay.innerHTML = `
        <div class="tool-lock-card">
            <div class="tool-lock-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <h2 class="tool-lock-title">Access Protected</h2>
            <p class="tool-lock-subtitle">Enter the password to access this tool</p>
            <input type="password" class="tool-lock-input" placeholder="Enter password" autocomplete="off" autofocus>
            <div class="tool-lock-error">Incorrect password. Try again.</div>
            <button class="tool-lock-btn">Unlock</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // --- Logic to fetch passwords and validate ---
    const input = overlay.querySelector('.tool-lock-input');
    const errorMsg = overlay.querySelector('.tool-lock-error');
    const unlockBtn = overlay.querySelector('.tool-lock-btn');

    let validPasswords = [];

    // Fetch passwords.json (assuming it's in the project root, so '../passwords.json' relative to 'tools/file.html')
    // We can try fetching from root just in case instructions change, but standard structure implies parent dir.
    fetch('../passwords.json')
        .then(response => {
            if (!response.ok) throw new Error("Could not load passwords config");
            return response.json();
        })
        .then(data => {
            if (data[TOOL_ID] && Array.isArray(data[TOOL_ID])) {
                validPasswords = data[TOOL_ID];
            } else {
                console.warn(`No password configuration found for tool ID: ${TOOL_ID}`);
            }
        })
        .catch(err => {
            console.error("Error loading tool passwords:", err);
            // Fallback: If fetch fails, we stay locked. No default password for security.
        });

    const attemptUnlock = () => {
        const entered = input.value;

        if (validPasswords.includes(entered)) {
            // Success — unlock
            sessionStorage.setItem(PAGE_KEY, 'true');
            document.body.classList.remove('tool-locked');
            overlay.remove();
            style.remove();
        } else {
            // Failure — shake + error
            input.classList.add('shake');
            errorMsg.classList.add('visible');
            input.value = '';
            input.focus();
            setTimeout(() => {
                input.classList.remove('shake');
            }, 400);
        }
    };

    unlockBtn.addEventListener('click', attemptUnlock);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            attemptUnlock();
        }
        // Clear error on new input
        if (errorMsg.classList.contains('visible')) {
            errorMsg.classList.remove('visible');
        }
    });

    // Focus input when overlay is shown
    requestAnimationFrame(() => input.focus());
})();
