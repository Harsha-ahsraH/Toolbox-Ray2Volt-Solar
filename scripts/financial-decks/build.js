/**
 * Commercial Financial Deck — the build.
 *
 *     node scripts/financial-decks/build.js            HTML, then PDFs
 *     node scripts/financial-decks/build.js --html     HTML only, no PDFs
 *
 * Renders every capacity in assumptions.js to A4 HTML under `output/`, then
 * converts each to PDF in `downloads/financial-decks/` using the Chrome or
 * Edge already installed on this machine. There is no npm dependency and no
 * package.json here on purpose: the toolbox is a static site with none, and
 * adding a node_modules tree for nineteen PDFs would not earn its keep.
 *
 * `output/` is gitignored; `downloads/` is committed and PUBLIC. See the
 * catalogue header in tools/resource-library/resource-library-catalogue.js.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const Assumptions = require('./assumptions.js');
const Model = require('./model.js');
const Template = require('./deck-template.js');

const ROOT = path.join(__dirname, '..', '..');
const HTML_DIR = path.join(ROOT, 'output', 'financial-decks');
const PDF_DIR = path.join(ROOT, 'downloads', 'financial-decks');

const HTML_ONLY = process.argv.includes('--html');

/** Zero-padded so nineteen files sort correctly in a folder and a catalogue. */
function slugFor(capacityKw) {
    return `ray2volt-commercial-financial-deck-${String(capacityKw).padStart(3, '0')}kw`;
}

/** The browser to drive, or null. Chrome first; Edge is the fallback. */
function findBrowser() {
    const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function toPdf(browser, htmlPath, pdfPath) {
    execFileSync(browser, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-pdf-header-footer',
        '--run-all-compositor-stages-before-draw',
        // Fonts come from Google Fonts over the network; give them time to
        // arrive before the page is drawn, or the PDF falls back to Arial.
        //
        // To check afterwards that they made it: Chrome embeds a web font as a
        // /Subtype /Type3 font, which has NO /BaseFont key. Grepping a deck for
        // /BaseFont finds nothing and means nothing. Grep for /Type3 instead.
        '--virtual-time-budget=8000',
        `--print-to-pdf=${pdfPath}`,
        `file:///${htmlPath.replace(/\\/g, '/')}`
    ], { stdio: 'pipe', timeout: 90000 });
}

function main() {
    const problems = Assumptions.problems();
    if (problems.length) {
        console.error('The assumptions file is not coherent:\n');
        problems.forEach(problem => console.error(`  · ${problem}`));
        process.exitCode = 1;
        return;
    }

    fs.mkdirSync(HTML_DIR, { recursive: true });
    fs.mkdirSync(PDF_DIR, { recursive: true });

    fs.copyFileSync(path.join(__dirname, 'deck.css'), path.join(HTML_DIR, 'deck.css'));

    const buildDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const browser = HTML_ONLY ? null : findBrowser();
    if (!HTML_ONLY && !browser) {
        console.error('No Chrome or Edge found. Run with --html and print the pages yourself.');
        process.exitCode = 1;
        return;
    }

    const built = [];

    Assumptions.CAPACITIES_KW.forEach(capacityKw => {
        const deck = Model.deckFor(capacityKw);
        const slug = slugFor(capacityKw);
        const htmlPath = path.join(HTML_DIR, `${slug}.html`);

        fs.writeFileSync(htmlPath, Template.render(deck, buildDate, 'deck.css'), 'utf8');

        if (!HTML_ONLY) {
            toPdf(browser, htmlPath, path.join(PDF_DIR, `${slug}.pdf`));
        }

        built.push({ capacityKw, slug, deck });

        const payback = deck.payback === null ? '—' : `${deck.payback.toFixed(2)} yrs`;
        console.log(
            `${String(capacityKw).padStart(3)} kWp  `
            + `₹${deck.rupeesPerWp.toFixed(2)}/Wp  `
            + `${deck.tariff.category.padEnd(34)}  `
            + `payback ${payback.padStart(9)}  `
            + `IRR ${deck.irr.toFixed(1)}%  `
            + `LCOE ₹${deck.lcoe.toFixed(2)}`
        );
    });

    console.log(`\n${built.length} decks built.`);
    console.log(`  HTML  ${path.relative(ROOT, HTML_DIR)}`);
    if (!HTML_ONLY) console.log(`  PDF   ${path.relative(ROOT, PDF_DIR)}`);

    return built;
}

if (require.main === module) main();

module.exports = { slugFor, HTML_DIR, PDF_DIR };
