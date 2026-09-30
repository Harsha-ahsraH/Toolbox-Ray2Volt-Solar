/** Run with `node tests/sidebar-layout.browser.js` and Playwright available. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const origin = 'http://ray2volt.test';
const storageKey = 'ray2volt.sidebar-layout';

async function fixture(page) {
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
        const target = path.resolve(root, relative);
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
            return route.fulfill({ status: 404, body: '' });
        }
        if (target.endsWith('.html')) {
            // Exercise real navigation and styles without signing in or running tools.
            const html = fs.readFileSync(target, 'utf8')
                .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace('</body>', '<script src="/global/scripts/navigation.js"></script></body>');
            return route.fulfill({ contentType: 'text/html', body: html });
        }
        return route.fulfill({ path: target });
    });
}

async function expectWidth(page, width) {
    await page.waitForFunction(expected => {
        const sidebar = document.querySelector('.sidebar');
        const content = document.querySelector('.main-content');
        return Math.abs(sidebar.getBoundingClientRect().width - expected) < 1 &&
            Math.abs(parseFloat(getComputedStyle(content).marginLeft) - expected) < 1;
    }, width, { timeout: 5000 });
    assert.equal(await page.locator('[role="separator"]').getAttribute('aria-valuenow'), String(width));
}

async function startDrag(page) {
    const right = await page.locator('.sidebar').evaluate(el => el.getBoundingClientRect().right);
    await page.mouse.move(right, 180);
    await page.mouse.down();
}

async function verifyAlignment(page, mobile = false) {
    await page.waitForFunction(() => [
        document.querySelector('.sidebar'),
        document.querySelector('.sidebar-collapse-btn'),
        document.querySelector('.main-nav .nav-link')
    ].every(el => el.getAnimations().every(animation => animation.playState !== 'running')), null, { timeout: 5000 });
    const result = await page.evaluate(isMobile => {
        const title = document.querySelector(isMobile ? '.sidebar-mobile-header .sidebar-brand' : '.logo-header .sidebar-brand');
        const link = document.querySelector('.main-nav .nav-link');
        const style = getComputedStyle(link);
        const iconLeft = link.getBoundingClientRect().left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
        const heading = title.getBoundingClientRect();
        const titleStyle = getComputedStyle(title);
        const header = title.parentElement.getBoundingClientRect();
        const arrow = document.querySelector('.sidebar-collapse-btn').getBoundingClientRect();
        return {
            left: heading.left, iconLeft, text: title.textContent,
            font: titleStyle.fontFamily, weight: titleStyle.fontWeight,
            headerCenter: (header.top + header.bottom) / 2,
            arrowCenter: (arrow.top + arrow.bottom) / 2
        };
    }, mobile);
    assert.ok(Math.abs(result.left - result.iconLeft) < 1, `${page.url()} (${mobile ? 'mobile' : 'desktop'}): Toolbox aligns with the navigation icon boxes: ${JSON.stringify(result)}`);
    assert.equal(result.text, 'Toolbox');
    assert.match(result.font, /^"Google Sans Flex"/);
    assert.equal(result.weight, '700');
    if (!mobile) assert.ok(Math.abs(result.headerCenter - result.arrowCenter) < 1, 'arrow stays vertically centred');
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await fixture(page);
        await page.goto(`${origin}/index.html`);
        await expectWidth(page, 250);
        await verifyAlignment(page);
        await page.locator('.sidebar-collapse-btn').hover();
        await verifyAlignment(page);
        assert.equal(await page.locator('#dashboard-section > :first-child').getAttribute('class'), 'tool-grid');
        assert.equal(await page.locator('#dashboard-section .section-header').count(), 0);

        // During dragging the content follows immediately, without width animations.
        await startDrag(page);
        await page.mouse.move(440, 180, { steps: 8 });
        await expectWidth(page, 440);
        assert.equal(await page.locator('.sidebar').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
        await page.mouse.up();
        assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), { width: 440, collapsed: false });

        // Cross the minimum in both directions without releasing the pointer.
        await startDrag(page);
        await page.mouse.move(220, 180, { steps: 8 });
        await expectWidth(page, 220);
        await page.mouse.move(210, 180);
        await expectWidth(page, 76);
        await page.mouse.move(345, 180, { steps: 8 });
        await expectWidth(page, 345);
        await page.mouse.up();
        assert.equal(await page.locator('body.sidebar-resizing').count(), 0);

        // Collapsed state and the expanded width survive navigation to another tool.
        await page.locator('.sidebar-collapse-btn').click();
        await expectWidth(page, 76);
        await page.goto(`${origin}/tools/emi-calculator/emi-calculator.html`);
        await expectWidth(page, 76);
        await page.locator('.nav-search-input').click();
        await expectWidth(page, 345);
        await verifyAlignment(page);

        const edge = page.locator('.sidebar-resize-handle');
        await edge.focus();
        await page.keyboard.press('Home');
        await expectWidth(page, 76);
        await page.keyboard.press('ArrowRight');
        await expectWidth(page, 220);
        await page.keyboard.press('ArrowLeft');
        await expectWidth(page, 76);
        await page.keyboard.press('Enter');
        await expectWidth(page, 220);
        await page.keyboard.press('Shift+ArrowRight');
        await expectWidth(page, 268);
        await page.keyboard.press('End');
        await expectWidth(page, 960);

        // Clamp to the viewport while retaining the preferred width for larger screens.
        await page.setViewportSize({ width: 769, height: 900 });
        await expectWidth(page, 449);
        await page.setViewportSize({ width: 390, height: 900 });
        assert.equal(await edge.isVisible(), false);
        await page.locator('#mobileNavToggle').click();
        assert.equal(await page.locator('.sidebar.open').count(), 1);
        await verifyAlignment(page, true);
        await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.main-content')).marginLeft) < 1);
        await page.locator('#sidebarCloseBtn').click();
        await page.setViewportSize({ width: 1280, height: 900 });
        await expectWidth(page, 960);
        assert.equal(await page.locator('.overlay.active').count(), 0);

        // Malformed or unavailable browser storage must not break navigation.
        await page.evaluate(key => localStorage.setItem(key, 'invalid JSON'), storageKey);
        await page.reload();
        await expectWidth(page, 250);
        await page.addInitScript(() => {
            Storage.prototype.getItem = () => { throw new Error('storage blocked'); };
            Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
        });
        await page.reload();
        await edge.focus();
        await page.keyboard.press('ArrowRight');
        await expectWidth(page, 266);

        // Tool-specific styles must not change the shared header alignment.
        const pages = ['index.html', ...fs.readdirSync(path.join(root, 'tools'), { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => `tools/${entry.name}/${entry.name}.html`)
            .filter(file => fs.existsSync(path.join(root, file)))];
        for (const file of pages) {
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.goto(`${origin}/${file}`);
            await expectWidth(page, 250);
            await verifyAlignment(page);
            await page.setViewportSize({ width: 390, height: 900 });
            await page.locator('#mobileNavToggle').click();
            await verifyAlignment(page, true);
        }
        assert.deepEqual(errors, []);
        console.log(`Sidebar layout browser checks passed: alignment on ${pages.length} pages, resizing, collapse, persistence, keyboard, viewport and mobile behaviour.`);
    } finally {
        await browser.close();
    }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
