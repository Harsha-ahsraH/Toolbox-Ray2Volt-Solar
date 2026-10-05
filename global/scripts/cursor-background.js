/**
 * Cursor dots for the shared toolbox background. Load at the end of the body.
 * Only the feathered mask moves; the dot pattern stays still. Animation stops
 * once it catches up, and touch/reduced-motion users get a still corner patch.
 */
(function () {
    'use strict';

    const main = document.querySelector('.main-content');
    if (!main || document.querySelector('.cursor-dot-background')) return;

    const layer = document.createElement('div');
    layer.className = 'cursor-dot-background';
    layer.setAttribute('aria-hidden', 'true');
    document.body.prepend(layer);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let printing = false;
    let frame = null;
    let previousTime = null;
    let current;
    let target;

    function restingPoint() {
        const bounds = main.getBoundingClientRect();
        const left = Math.max(0, bounds.left);
        const right = Math.min(window.innerWidth, bounds.right);
        return {
            x: left + Math.max(0, right - left) * 0.82,
            y: Math.min(window.innerHeight - 24, Math.max(24, bounds.top) + window.innerHeight * 0.12)
        };
    }

    function paint() {
        layer.style.setProperty('--cursor-dot-x', `${current.x.toFixed(2)}px`);
        layer.style.setProperty('--cursor-dot-y', `${current.y.toFixed(2)}px`);
    }

    function stop() {
        if (frame !== null) window.cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
    }

    function canTrack() {
        return !printing && !document.hidden && !reducedMotion.matches && finePointer.matches;
    }

    function reset() {
        stop();
        current = restingPoint();
        target = { ...current };
        paint();
    }

    function step(time) {
        frame = null;
        if (!canTrack()) {
            reset();
            return;
        }

        // The preview's 7% lag at 60 Hz, independent of display refresh rate.
        const elapsed = previousTime === null ? 1000 / 60 : Math.min(64, time - previousTime);
        previousTime = time;
        const blend = 1 - Math.pow(0.93, elapsed / (1000 / 60));
        current.x += (target.x - current.x) * blend;
        current.y += (target.y - current.y) * blend;

        if (Math.hypot(target.x - current.x, target.y - current.y) < 0.3) {
            current = { ...target };
            previousTime = null;
        } else {
            frame = window.requestAnimationFrame(step);
        }
        paint();
    }

    function follow(point) {
        if (!canTrack()) return;
        target = point;
        if (frame === null) frame = window.requestAnimationFrame(step);
    }

    main.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'touch') follow({ x: event.clientX, y: event.clientY });
    }, { passive: true });
    main.addEventListener('pointerleave', () => follow(restingPoint()), { passive: true });

    reducedMotion.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    window.addEventListener('resize', reset, { passive: true });
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', reset);
    window.addEventListener('beforeprint', () => {
        printing = true;
        stop();
    });
    window.addEventListener('afterprint', () => {
        printing = false;
        reset();
    });

    reset();
})();
