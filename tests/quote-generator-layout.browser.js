/** Run in a local quotation fixture after preview generation; no customer data is sent anywhere. */
(function () {
    'use strict';

    window.verifyQuotationLayout = function () {
        const app = window.QuoteGeneratorApp;
        const state = app.getState();
        const originalPlan = QuoteGeneratorCalc.planPages(state);
        const actualPlan = QuoteGeneratorPreview.getPlan();
        const container = document.getElementById('qgComprehensivePages');
        const nodes = Array.from(container.children);
        const failures = [];
        container.querySelectorAll('.cq-component-photo img, .cq-figure img').forEach(img => {
            if (!img.complete || !img.naturalWidth) failures.push(`Unloaded proposal image: ${img.getAttribute('src')}`);
        });
        const preview = document.getElementById('qgPreviewStage');
        if (preview && preview.querySelectorAll('.quote-page').length !== nodes.length) {
            failures.push('Continuous preview does not contain every document page');
        }
        if (document.getElementById('qgPageSelect') || document.getElementById('qgThumbRail')) {
            failures.push('Obsolete page picker remains in the preview');
        }
        const actualText = nodes.map(node => node.querySelector('.cq-body').textContent).join(' ')
            .replace(/\s+/g, ' ');
        let checkedTextRuns = 0;
        const actualWords = actualText.split(/\s+/);
        function containsWords(text) {
            if (actualText.includes(text)) return true;
            const words = text.split(/\s+/);
            let cursor = 0;
            for (const word of actualWords) {
                if (word === words[cursor]) cursor += 1;
                if (cursor === words.length) return true;
            }
            return false;
        }
        const context = { state, derived: app.getDerived(), validation: app.getValidation(),
            pagePlan: originalPlan, toc: QuoteGeneratorCalc.tableOfContents(originalPlan) };

        originalPlan.filter(page => !['contents', 'annexures'].includes(page.sectionId)).forEach(page => {
            const descriptor = QuoteGeneratorPages.renderers[page.sectionId]({ ...context, page });
            const source = document.createElement('div');
            source.innerHTML = descriptor.body;
            const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const text = walker.currentNode.textContent.replace(/\s+/g, ' ').trim();
                if (/^Continued from previous page/.test(text)) continue;
                if (page.sectionId === 'annexure-index' && (walker.currentNode.parentElement.closest('.cq-note')
                    || walker.currentNode.parentElement.closest('td:last-child'))) continue;
                if (text.length < 3) continue;
                checkedTextRuns += 1;
                if (!containsWords(text)) failures.push(`Missing text in ${page.sectionId}: ${text.slice(0, 100)}`);
            }
        });

        container.classList.add('cq-measuring');
        const measurements = nodes.map((node, index) => {
            const body = node.querySelector('.cq-body');
            const bounds = body.getBoundingClientRect();
            const bottom = Math.max(bounds.top, ...Array.from(body.children).map(child => child.getBoundingClientRect().bottom));
            const fill = Math.round((bottom - bounds.top) / bounds.height * 100);
            const sectionId = actualPlan[index].sectionId;
            const lastOfSection = !actualPlan[index + 1]
                || actualPlan[index + 1].sectionId !== sectionId;
            if (lastOfSection && (bottom - bounds.top) / bounds.height < 0.8) {
                failures.push(`Section ends below 80% on page ${index + 1}: ${sectionId}`);
            }
            if (actualPlan[index].sectionIds.length !== 1) {
                failures.push(`Sections share page ${index + 1}`);
            }
            if (body.scrollHeight > body.clientHeight + 2 || body.scrollWidth > body.clientWidth + 2) {
                failures.push(`Overflow on page ${index + 1}`);
            }
            const expectedFooter = `Page ${index + 1} of ${nodes.length}`;
            node.querySelectorAll('th,td').forEach(cell => {
                const range = document.createRange();
                range.selectNodeContents(cell);
                const cellBounds = cell.getBoundingClientRect();
                if (Array.from(range.getClientRects()).some(rect => rect.width > 0
                    && (rect.left < cellBounds.left - 1 || rect.right > cellBounds.right + 1))) {
                    failures.push(`Table text crosses a cell boundary on page ${index + 1}: ${cell.textContent.trim().slice(0, 55)}`);
                }
            });
            const opening = actualPlan[index].sectionIds?.[0];
            const openingTitle = originalPlan.find(entry => entry.sectionId === opening)?.title;
            if (body.classList.contains('cq-flow-body') && openingTitle
                && node.dataset.headerSection !== opening
                && !node.querySelector('.cq-head-title').textContent.includes(openingTitle)) {
                failures.push(`Opening section is unidentified on page ${index + 1}: ${openingTitle}`);
            }
            if (node.querySelector('.cq-foot span:last-child').textContent !== expectedFooter) {
                failures.push(`Incorrect footer on page ${index + 1}`);
            }
            if (actualPlan[index].pageNumber !== index + 1) failures.push(`Incorrect plan number ${index + 1}`);
            body.querySelectorAll(':scope > .cq-flow-heading').forEach(heading => {
                const previous = heading.previousElementSibling;
                if (previous && (previous.getBoundingClientRect().bottom - bounds.top) / bounds.height > 0.755) {
                    failures.push(`New section starts after 75% on page ${index + 1}`);
                }
            });
            const sectionAreas = new Map();
            Array.from(body.children).forEach(block => {
                const id = block.dataset.contentSection || block.dataset.sectionId;
                if (!id) return;
                const style = getComputedStyle(block);
                const occupied = block.getBoundingClientRect().height
                    + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
                sectionAreas.set(id, (sectionAreas.get(id) || 0) + occupied);
            });
            const dominant = [...sectionAreas].sort((a, b) => b[1] - a[1])[0]?.[0];
            if (body.classList.contains('cq-flow-body') && node.dataset.headerSection !== dominant) {
                failures.push(`Header does not name the dominant section on page ${index + 1}`);
            }
            return { page: index + 1, title: actualPlan[index].title, header: node.dataset.headerSection, fill };
        });
        container.classList.remove('cq-measuring');

        const toc = nodes.find(node => node.dataset.sectionId === 'contents');
        if (toc) {
            toc.querySelectorAll('.cq-toc-list li').forEach(row => {
                const title = row.querySelector('.cq-toc-title').textContent;
                const source = originalPlan.find(page => page.title === title);
                const expected = actualPlan.findIndex(page => source.annexureId
                    ? page.annexureId === source.annexureId : page.sectionIds.includes(source.sectionId)) + 1;
                if (Number(row.querySelector('.cq-toc-page').textContent) !== expected) {
                    failures.push(`Incorrect contents reference: ${title}`);
                }
            });
        }
        const annexureIds = [...new Set(originalPlan.filter(page => page.annexureId).map(page => page.annexureId))];
        container.querySelectorAll('[data-content-section="annexure-index"] tbody tr').forEach(row => {
            const id = annexureIds[Number(row.firstElementChild.textContent) - 1];
            const expected = actualPlan.findIndex(page => page.annexureId === id) + 1;
            if (Number(row.lastElementChild.textContent) !== expected) failures.push('Incorrect annexure index reference');
        });
        return { passed: failures.length === 0, checkedTextRuns, pages: nodes.length, failures, measurements };
    };
}());
