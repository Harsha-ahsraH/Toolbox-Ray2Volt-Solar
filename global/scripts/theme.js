/**
 * Toolbox Theme — light and dark for the app chrome, one choice for every page.
 *
 * Usage: load in <head>, before the first paint, on every page:
 *   <script src="../../global/scripts/theme.js"></script>
 *
 * The chosen theme is stamped on <html> as data-theme, which is what the token
 * blocks in base.css key off. Loading it in <head> rather than with the other
 * scripts at the end of the body is deliberate: a page that painted light and
 * then flipped would flash on every navigation.
 *
 * Documents are not themed. The A4 previews and everything that prints carry
 * their own local palettes and stay on paper white in both themes; only the
 * chrome around them follows this.
 *
 * With no stored choice the toolbox follows the operating system, and keeps
 * following it as it changes. Using the toggle stores a choice, and a stored
 * choice wins from then on, on this device, until it is toggled back.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'ray2volt_toolbox_theme';
    const THEMES = ['light', 'dark'];
    const root = document.documentElement;
    const system = window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    // A browser with storage blocked still themes, it just cannot remember.
    function readChoice() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return THEMES.includes(stored) ? stored : null;
        } catch (error) {
            return null;
        }
    }

    function writeChoice(theme) {
        try {
            if (theme) localStorage.setItem(STORAGE_KEY, theme);
            else localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            /* private mode, or storage full - the page still themes */
        }
    }

    function systemTheme() {
        return system && system.matches ? 'dark' : 'light';
    }

    function resolve() {
        return readChoice() || systemTheme();
    }

    const listeners = new Set();

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        listeners.forEach((listener) => listener(theme));
    }

    // Before the body exists, so the first paint is already the right colour.
    apply(resolve());

    function set(theme) {
        if (!THEMES.includes(theme)) return;
        writeChoice(theme);
        apply(theme);
    }

    function toggle() {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        set(next);
        return next;
    }

    /**
     * Wire a button to the theme and keep it in sync — its icon, its label and
     * its pressed state — however the theme changes, including from a toggle
     * in another tab.
     */
    function attachToggle(button) {
        if (!button) return;

        const icon = button.querySelector('.material-symbols-rounded') || button;

        function sync(theme) {
            const dark = theme === 'dark';
            icon.textContent = dark ? 'light_mode' : 'dark_mode';
            button.setAttribute('aria-pressed', dark ? 'true' : 'false');
            button.setAttribute(
                'aria-label',
                dark ? 'Switch to light theme' : 'Switch to dark theme'
            );
            button.title = dark ? 'Light theme' : 'Dark theme';
        }

        button.addEventListener('click', toggle);
        listeners.add(sync);
        sync(root.getAttribute('data-theme'));
    }

    // Only while the theme is still the system's to decide.
    if (system) {
        const follow = () => {
            if (!readChoice()) apply(systemTheme());
        };
        if (system.addEventListener) system.addEventListener('change', follow);
        else if (system.addListener) system.addListener(follow);
    }

    // Toggling in one tab moves every other open tab with it.
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) apply(resolve());
    });

    /**
     * Run a callback on every theme change, for the few things CSS cannot
     * repaint on its own — a canvas chart, say. Returns an unsubscribe.
     */
    function onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    window.Ray2VoltTheme = {
        current: () => root.getAttribute('data-theme'),
        set,
        toggle,
        attachToggle,
        onChange
    };
})();
