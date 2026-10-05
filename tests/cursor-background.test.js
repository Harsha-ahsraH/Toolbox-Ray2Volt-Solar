const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { repoRoot, toolFolders } = require('./helpers/registry');

const source = fs.readFileSync(path.join(repoRoot, 'global/scripts/cursor-background.js'), 'utf8');
const css = fs.readFileSync(path.join(repoRoot, 'global/styles/cursor-background.css'), 'utf8');

function events() {
    const listeners = new Map();
    return {
        addEventListener(name, callback) {
            if (!listeners.has(name)) listeners.set(name, []);
            listeners.get(name).push(callback);
        },
        emit(name, event = {}) {
            for (const callback of listeners.get(name) || []) callback(event);
        }
    };
}

function fixture({ reduced = false, fine = true, hasMain = true } = {}) {
    const main = { ...events(), getBoundingClientRect: () => ({ left: 250, right: 1200, top: 0 }) };
    const media = {
        '(prefers-reduced-motion: reduce)': { ...events(), matches: reduced },
        '(hover: hover) and (pointer: fine)': { ...events(), matches: fine }
    };
    const layers = [];
    const frames = new Map();
    let nextFrame = 0;
    let time = 0;
    const document = {
        ...events(),
        hidden: false,
        body: { prepend: layer => layers.push(layer) },
        querySelector: selector => selector === '.main-content' ? (hasMain ? main : null) : layers[0],
        createElement: () => ({
            attributes: {},
            properties: {},
            setAttribute(name, value) { this.attributes[name] = value; },
            style: { setProperty(name, value) { layers[0].properties[name] = value; } }
        })
    };
    const window = {
        ...events(),
        innerWidth: 1200,
        innerHeight: 800,
        matchMedia: query => media[query],
        requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
        cancelAnimationFrame(id) { frames.delete(id); }
    };
    const run = () => vm.runInNewContext(source, { window, document, Math });
    run();
    return {
        main, media, document, window, layers, frames, run,
        move(x = 500, y = 350, pointerType = 'mouse') {
            main.emit('pointermove', { clientX: x, clientY: y, pointerType });
        },
        tick() {
            time += 1000 / 60;
            const batch = [...frames];
            frames.clear();
            for (const [, callback] of batch) callback(time);
        },
        settle() {
            for (let i = 0; i < 300 && frames.size; i++) this.tick();
            assert.equal(frames.size, 0, 'animation must stop once the mask catches up');
        },
        point() {
            const props = layers[0].properties;
            return { x: parseFloat(props['--cursor-dot-x']), y: parseFloat(props['--cursor-dot-y']) };
        }
    };
}

const pointer = fixture();
assert.equal(pointer.layers.length, 1);
assert.equal(pointer.layers[0].attributes['aria-hidden'], 'true');
assert.equal(pointer.frames.size, 0, 'a still page must not run an idle animation loop');
pointer.run();
assert.equal(pointer.layers.length, 1, 'loading twice must not duplicate layers or listeners');
const resting = pointer.point();
pointer.move();
assert.equal(pointer.frames.size, 1);
pointer.tick();
assert.ok(pointer.point().x < resting.x && pointer.point().x > 500, 'the mask should lag gently behind the pointer');
pointer.move(620, 400);
assert.equal(pointer.frames.size, 1, 'rapid pointer events must share one pending frame');
pointer.settle();
assert.deepEqual(pointer.point(), { x: 620, y: 400 });
pointer.main.emit('pointerleave');
pointer.settle();
assert.deepEqual(pointer.point(), resting, 'leaving the tool returns the dots to their resting corner');
pointer.move(10, 10, 'touch');
assert.equal(pointer.frames.size, 0, 'touch scrolling must not animate the dots');

for (const options of [{ reduced: true }, { fine: false }]) {
    const still = fixture(options);
    still.move();
    assert.equal(still.frames.size, 0, 'reduced-motion and coarse-pointer devices get a still pattern');
}

const motion = fixture();
motion.move();
motion.media['(prefers-reduced-motion: reduce)'].matches = true;
motion.media['(prefers-reduced-motion: reduce)'].emit('change');
assert.equal(motion.frames.size, 0, 'changing to reduced motion cancels an active animation');
motion.move();
assert.equal(motion.frames.size, 0);
motion.media['(prefers-reduced-motion: reduce)'].matches = false;
motion.media['(prefers-reduced-motion: reduce)'].emit('change');
motion.move();
assert.equal(motion.frames.size, 1, 'tracking can resume when reduced motion is disabled');

const lifecycle = fixture();
lifecycle.move();
lifecycle.document.hidden = true;
lifecycle.document.emit('visibilitychange');
assert.equal(lifecycle.frames.size, 0);
lifecycle.move();
assert.equal(lifecycle.frames.size, 0, 'hidden pages cannot schedule motion');
lifecycle.document.hidden = false;
lifecycle.document.emit('visibilitychange');
lifecycle.move();
lifecycle.window.emit('beforeprint');
assert.equal(lifecycle.frames.size, 0);
lifecycle.move();
assert.equal(lifecycle.frames.size, 0, 'printing suspends tracking');
lifecycle.window.emit('afterprint');
lifecycle.move();
assert.equal(lifecycle.frames.size, 1);
lifecycle.window.emit('pagehide');
assert.equal(lifecycle.frames.size, 0, 'navigation cancels a pending frame');
lifecycle.window.emit('pageshow');
assert.equal(lifecycle.frames.size, 0);
lifecycle.main.getBoundingClientRect = () => ({ left: 76, right: 1200, top: 0 });
lifecycle.window.emit('resize');
assert.equal(lifecycle.point().x, 997.68, 'the resting patch follows the current content bounds');
assert.equal(fixture({ hasMain: false }).layers.length, 0);

assert.match(css, /--cursor-dot-color: color-mix\(in srgb, var\(--primary-text\) 33%, transparent\)/);
assert.match(css, /:root\[data-theme="dark"\][\s\S]*?14%, transparent/);
assert.match(css, /pointer-events:\s*none/);
assert.match(css, /z-index:\s*-1/);
assert.match(css, /@media print\s*{\s*\.cursor-dot-background\s*{\s*display:\s*none !important/);

const pages = ['index.html', ...toolFolders().map(tool => `tools/${tool}/${tool}.html`)];
for (const page of pages) {
    const html = fs.readFileSync(path.join(repoRoot, page), 'utf8');
    for (const asset of ['styles/cursor-background.css', 'scripts/cursor-background.js']) {
        assert.equal(html.split(`global/${asset}?v=20261005-cursor-dots`).length - 1, 1, `${page} must load ${asset} once`);
    }
    assert.ok(html.indexOf('scripts/cursor-background.js') > html.indexOf('scripts/navigation.js'));
}

console.log(`cursor background tests passed (${pages.length} pages)`);
