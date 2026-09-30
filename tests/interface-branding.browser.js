/** Run with `node tests/interface-branding.browser.js` and Playwright available. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const origin = 'http://ray2volt.test';
const pages = ['index.html', ...fs.readdirSync(path.join(root, 'tools'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `tools/${entry.name}/${entry.name}.html`)
    .filter(file => fs.existsSync(path.join(root, file)))];

async function run() {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.origin !== origin) return route.abort();
            const target = path.resolve(root, decodeURIComponent(url.pathname).replace(/^\//, ''));
            if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
                return route.fulfill({ status: 404, body: '' });
            }
            if (target.endsWith('.html')) {
                const html = fs.readFileSync(target, 'utf8')
                    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace('</body>', '<script src="/global/scripts/navigation.js"></script></body>');
                return route.fulfill({ contentType: 'text/html', body: html });
            }
            return route.fulfill({ path: target });
        });

        let views = 0;
        for (const file of pages) {
            for (const width of [320, 390, 768, 769, 1280]) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(`${origin}/${file}`);
                assert.equal(await page.locator('.mobile-header img, .sidebar img').count(), 0,
                    `${file} at ${width}px has no company images in its interface`);
                assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), 'data:,');
                if (width <= 768) {
                    assert.equal(await page.locator('.mobile-header').isVisible(), true);
                    const title = await page.locator('.mobile-brand').evaluate(el => {
                        const style = getComputedStyle(el);
                        const box = el.getBoundingClientRect();
                        const actions = el.parentElement.querySelector('.mobile-header-actions').getBoundingClientRect();
                        return { text: el.textContent, font: style.fontFamily, weight: style.fontWeight,
                            left: box.left, right: box.right, actionsLeft: actions.left };
                    });
                    assert.equal(title.text, 'Toolbox');
                    assert.match(title.font, /^"Google Sans Flex"/);
                    assert.equal(title.weight, '700');
                    assert.equal(title.left, 23);
                    assert.ok(title.right < title.actionsLeft, 'title fits beside mobile controls');
                    await page.locator('#mobileNavToggle').click();
                    assert.equal(await page.locator('.sidebar.open').count(), 1);
                    assert.equal(await page.locator('.sidebar-mobile-header .sidebar-brand').textContent(), 'Toolbox');
                    await page.locator('#sidebarCloseBtn').click();
                    await page.locator('#mobileSearchToggle').click();
                    assert.equal(await page.locator('#toolSearch').evaluate(el => el === document.activeElement), true,
                        'mobile search still focuses the search field');
                } else {
                    assert.equal(await page.locator('.mobile-header').isVisible(), false);
                    assert.equal(await page.locator('.logo-header .sidebar-brand').textContent(), 'Toolbox');
                }
                views++;
            }
        }
        assert.deepEqual(errors, []);
        console.log(`Interface branding browser checks passed: ${views} views across ${pages.length} pages; text-only headers, no branded favicons, and working mobile controls.`);
    } finally {
        await browser.close();
    }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
