/** Measured A4 composition. The rendered document, contents, preview and print share this plan. */
(function (root) {
    'use strict';

    function compose(container, sourcePlan) {
        const sources = Array.from(container.children);
        const output = [];
        const plan = [];
        let page;
        let body;
        let currentSection = '';
        let contentsPage;
        let attachmentIndex;
        container.classList.add('cq-measuring');
        container.replaceChildren();

        function remember(source) {
            const entry = plan[plan.length - 1];
            if (entry && !entry.sectionIds.includes(source.sectionId)) {
                entry.sectionIds.push(source.sectionId);
                entry.title += ` / ${source.title}`;
            }
        }

        function start(source, original) {
            page = original.cloneNode(false);
            page.classList.add('cq-flow-page');
            const head = original.querySelector('.cq-head');
            if (head) {
                const clone = head.cloneNode(true);
                const subtitle = clone.querySelector('.cq-head-title p');
                if (subtitle && /continued/i.test(subtitle.textContent)) subtitle.textContent = 'Continued';
                page.append(clone);
            }
            body = document.createElement('div');
            body.className = 'cq-body cq-flow-body';
            page.append(body, original.querySelector('.cq-foot').cloneNode(true));
            container.append(page);
            output.push(page);
            plan.push(Object.assign({}, source, { sectionIds: [source.sectionId] }));
            remember(source);
            currentSection = source.sectionId;
        }

        function used() {
            if (!body.lastElementChild) return 0;
            const bounds = body.getBoundingClientRect();
            return body.lastElementChild.getBoundingClientRect().bottom - bounds.top;
        }

        function fits() { return used() <= body.clientHeight - 8; }

        function textParts(node, limit) {
            const text = node.textContent;
            if (text.length <= limit * 2) return [node];
            const leaves = [];
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            let offset = 0;
            while (walker.nextNode()) {
                leaves.push({ node: walker.currentNode, start: offset });
                offset += walker.currentNode.textContent.length;
            }
            function point(position) {
                const leaf = leaves.find(item => item.start + item.node.textContent.length >= position)
                    || leaves[leaves.length - 1];
                return [leaf.node, position - leaf.start];
            }
            const fragments = [];
            for (let start = 0; start < text.length;) {
                let end = Math.min(text.length, start + limit);
                if (end < text.length) {
                    const space = text.lastIndexOf(' ', end);
                    if (space > start) end = space + 1;
                }
                const range = document.createRange();
                range.setStart(...point(start));
                range.setEnd(...point(end));
                const fragment = node.cloneNode(false);
                fragment.append(range.cloneContents());
                fragments.push(fragment);
                start = end;
            }
            return fragments;
        }

        function rowParts(row) {
            const cells = Array.from(row.children);
            const longest = cells.reduce((best, cell) => cell.textContent.length > best.textContent.length ? cell : best, cells[0]);
            const chunks = textParts(longest, 500);
            if (chunks.length === 1) return [row];
            return chunks.map((chunk, index) => {
                const part = row.cloneNode(false);
                cells.forEach(cell => {
                    if (cell === longest) part.append(chunk);
                    else part.append(cell.cloneNode(index === 0));
                });
                return part;
            });
        }

        function sectionHeading(source, original) {
            const heading = document.createElement('div');
            heading.className = 'cq-flow-heading';
            heading.dataset.sectionId = source.sectionId;
            const title = document.createElement('h2');
            title.textContent = source.title;
            heading.append(title);
            const subtitle = original.querySelector('.cq-head-title p');
            if (subtitle) heading.append(subtitle.cloneNode(true));
            return heading;
        }

        function continuePage(source, original, pending) {
            // Move a trailing heading to the next page with the block it introduces.
            const trailing = [];
            while (body.lastElementChild && body.lastElementChild.matches('h2,h3,h4,.cq-flow-heading')) {
                trailing.unshift(body.lastElementChild);
                body.lastElementChild.remove();
            }
            start(source, original);
            trailing.filter(node => !node.classList.contains('cq-flow-heading')).forEach(node => body.append(node));
            if (pending) body.append(pending);
        }

        function add(node, source, original) {
            const hadContent = body.children.length > 0;
            body.append(node);
            if (!fits() && hadContent) {
                node.remove();
                continuePage(source, original, node);
            }
            remember(source);
            // Mark an unsplittable block explicitly instead of hiding content silently.
            if (!fits()) page.dataset.layoutOverflow = 'true';
        }

        function table(node, source, original) {
            const rows = Array.from(node.querySelectorAll(':scope > tbody > tr')).flatMap(rowParts);
            if (!rows.length) return add(node, source, original);
            let fragment;
            let tbody;
            function make() {
                fragment = node.cloneNode(false);
                Array.from(node.children).filter(child => child.tagName !== 'TBODY' && child.tagName !== 'TFOOT')
                    .forEach(child => fragment.append(child.cloneNode(true)));
                tbody = document.createElement('tbody');
                fragment.append(tbody);
                body.append(fragment);
            }
            const previous = body.lastElementChild;
            if (previous && previous.tagName === 'TABLE' && !previous.tFoot
                && previous.dataset.contentSection === source.sectionId
                && previous.tHead && node.tHead && previous.tHead.innerHTML === node.tHead.innerHTML) {
                fragment = previous;
                tbody = fragment.tBodies[0];
            } else make();
            rows.forEach(row => {
                tbody.append(row);
                if (!fits()) {
                    row.remove();
                    const pendingCategory = tbody.lastElementChild && tbody.lastElementChild.querySelector('td[colspan]')
                        ? tbody.lastElementChild : null;
                    if (pendingCategory) pendingCategory.remove();
                    if (!tbody.children.length) fragment.remove();
                    if (body.children.length) continuePage(source, original);
                    make();
                    if (pendingCategory) tbody.append(pendingCategory);
                    tbody.append(row);
                    if (!fits()) page.dataset.layoutOverflow = 'true';
                }
                remember(source);
            });
            if (node.tFoot) {
                const foot = node.tFoot.cloneNode(true);
                fragment.append(foot);
                if (!fits()) {
                    foot.remove();
                    const lastRow = tbody.lastElementChild;
                    if (lastRow) lastRow.remove();
                    continuePage(source, original);
                    make();
                    if (lastRow) tbody.append(lastRow);
                    fragment.append(foot);
                }
            }
        }

        function list(node, source, original) {
            let fragment = node.cloneNode(false);
            body.append(fragment);
            const items = Array.from(node.children).flatMap(item => {
                const content = item.querySelector('.cq-clause-num') ? item.lastElementChild : item;
                return textParts(content, 700).map((part, index) => {
                    if (content === item) return part;
                    const clone = item.cloneNode(false);
                    clone.append(item.firstElementChild.cloneNode(index === 0), part);
                    return clone;
                });
            });
            items.forEach(item => {
                fragment.append(item);
                if (!fits()) {
                    item.remove();
                    if (!fragment.children.length) fragment.remove();
                    if (body.children.length) continuePage(source, original);
                    fragment = node.cloneNode(false);
                    body.append(fragment);
                    fragment.append(item);
                    if (!fits()) page.dataset.layoutOverflow = 'true';
                }
                remember(source);
            });
        }

        function grid(node, source, original) {
            const columns = node.classList.contains('cq-grid-3') ? 3
                : node.classList.contains('cq-steps-1') ? 1 : 2;
            const children = Array.from(node.children);
            for (let index = 0; index < children.length; index += columns) {
                const row = node.cloneNode(false);
                children.slice(index, index + columns).forEach(child => row.append(child));
                add(row, source, original);
            }
        }

        function keyValues(node, source, original) {
            let fragment = node.cloneNode(false);
            body.append(fragment);
            const pairs = Array.from(node.children);
            for (let index = 0; index < pairs.length; index += 2) {
                const pair = pairs.slice(index, index + 2);
                pair.forEach(child => fragment.append(child));
                if (!fits()) {
                    pair.forEach(child => child.remove());
                    if (!fragment.children.length) fragment.remove();
                    if (body.children.length) continuePage(source, original);
                    fragment = node.cloneNode(false);
                    body.append(fragment);
                    pair.forEach(child => fragment.append(child));
                }
                remember(source);
            }
        }

        sources.forEach((original, index) => {
            const source = sourcePlan[index];
            if (source.sectionId === 'contents') {
                if (contentsPage) return;
                contentsPage = original;
                container.append(original);
                output.push(original);
                plan.push(Object.assign({}, source, { sectionIds: ['contents'] }));
                page = body = null;
                return;
            }
            if (source.sectionId === 'annexure-index' && source.partCount === 1
                && original.querySelectorAll('tbody tr').length <= 6) {
                attachmentIndex = original;
                return;
            }
            if (['cover', 'annexures', 'acceptance'].includes(source.sectionId)) {
                if (source.sectionId === 'acceptance') original.classList.add('cq-acceptance-page');
                container.append(original);
                output.push(original);
                plan.push(Object.assign({}, source, { sectionIds: [source.sectionId] }));
                if (source.sectionId === 'annexures' && attachmentIndex) {
                    const target = original.querySelector('.cq-body');
                    const blocks = Array.from(attachmentIndex.querySelector('.cq-body').children);
                    blocks.forEach(block => { block.dataset.contentSection = 'annexure-index'; });
                    const note = blocks.find(block => block.classList.contains('cq-note'));
                    if (note) note.textContent = 'Supporting documents are presented below and on the following pages in upload order.';
                    target.prepend(...blocks);
                    plan[plan.length - 1].sectionIds.unshift('annexure-index');
                    attachmentIndex = null;
                }
                remember(source);
                page = body = null;
                return;
            }
            if (!page) start(source, original);
            else if (currentSection !== source.sectionId) {
                if (body.clientHeight - used() < 170) start(source, original);
                else add(sectionHeading(source, original), source, original);
                currentSection = source.sectionId;
            }
            const children = Array.from(original.querySelector('.cq-body').children);
            children.forEach(node => {
                // Source-plan continuation labels become incorrect after measured reflow.
                if (node.matches('p') && /^Continued from previous page/.test(node.textContent.trim())) return;
                node.dataset.contentSection = source.sectionId;
                node.classList.remove('cq-fill-end');
                if (node.tagName === 'TABLE') table(node, source, original);
                else if (node.matches('ul,ol')) list(node, source, original);
                else if (node.matches('.cq-grid-2,.cq-grid-3,.cq-steps')) grid(node, source, original);
                else if (node.matches('.cq-kv') && node.children.length > 4) keyValues(node, source, original);
                else if (node.matches('p.cq-para,p.cq-lead')) textParts(node, 700).forEach(part => add(part, source, original));
                else add(node, source, original);
            });
        });

        // Keep a short closing continuation together as one complete closing section.
        output.forEach((node, index) => {
            const flow = node.querySelector('.cq-flow-body');
            if (!flow || node.dataset.sectionId !== 'why-ray2volt' || !index) return;
            const bounds = flow.getBoundingClientRect();
            if (!flow.lastElementChild || flow.lastElementChild.getBoundingClientRect().bottom - bounds.top
                >= flow.clientHeight * 0.75) return;
            const previous = output[index - 1].querySelector('.cq-flow-body');
            if (!previous) return;
            const closing = Array.from(previous.children).filter(block => block.dataset.contentSection === 'why-ray2volt');
            previous.querySelector('.cq-flow-heading[data-section-id="why-ray2volt"]')?.remove();
            flow.prepend(...closing);
            node.classList.add('cq-closing-page');
        });

        // Determine references from where the content actually landed, after orphan headings moved.
        output.forEach((node, index) => {
            if (!node.classList.contains('cq-flow-page')) return;
            const ids = [...new Set(Array.from(node.querySelectorAll('[data-content-section]'))
                .map(block => block.dataset.contentSection))];
            plan[index].sectionIds = ids;
            plan[index].sectionId = ids[0] || plan[index].sectionId;
            plan[index].title = ids.map(id => sourcePlan.find(source => source.sectionId === id).title).join(' / ');
        });

        if (contentsPage) {
            const entries = [];
            const seen = new Set();
            sourcePlan.forEach(source => {
                const key = source.annexureId || source.sectionId;
                if (seen.has(key) || ['cover', 'contents', 'annexures'].includes(source.sectionId)) return;
                seen.add(key);
                const index = plan.findIndex(entry => source.annexureId
                    ? entry.annexureId === source.annexureId : entry.sectionIds.includes(source.sectionId));
                entries.push({ title: source.title, group: source.group, pageNumber: index + 1 });
            });
            const content = contentsPage.querySelector('.cq-body');
            content.className = 'cq-body cq-contents-body';
            content.replaceChildren();
            const columns = document.createElement('div');
            columns.className = 'cq-contents-columns';
            const groups = [...new Set(entries.map(entry => entry.group))];
            groups.forEach(group => {
                const block = document.createElement('section');
                const heading = document.createElement('h3');
                heading.className = 'cq-subtitle';
                heading.textContent = group;
                block.append(heading);
                const rows = document.createElement('ul');
                rows.className = 'cq-toc-list';
                entries.filter(entry => entry.group === group).forEach(entry => {
                    const row = document.createElement('li');
                    const title = document.createElement('span');
                    title.className = 'cq-toc-title';
                    title.textContent = entry.title;
                    const number = document.createElement('span');
                    number.className = 'cq-toc-page';
                    number.textContent = entry.pageNumber;
                    row.append(title, number);
                    rows.append(row);
                });
                block.append(rows);
                columns.append(block);
            });
            content.append(columns);
            for (let padding = 2.75; columns.getBoundingClientRect().height > content.clientHeight - 4
                && padding >= 1.5; padding -= 0.25) {
                columns.style.setProperty('--cq-toc-row-padding', `${padding}mm`);
            }
        }

        output.forEach((node, index) => {
            node.dataset.pageIndex = index;
            node.querySelector('.cq-foot span:last-child').textContent = `Page ${index + 1} of ${output.length}`;
            plan[index].pageNumber = index + 1;
            plan[index].totalPages = output.length;
            const flow = node.querySelector('.cq-flow-body');
            if (flow) {
                const bounds = flow.getBoundingClientRect();
                const bottom = flow.lastElementChild ? flow.lastElementChild.getBoundingClientRect().bottom - bounds.top : 0;
                const gap = Math.max(0, flow.clientHeight - bottom - 12);
                const clauses = flow.querySelectorAll(':scope > .cq-clause-list > li');
                if (gap > 80 && flow.children.length <= 3 && clauses.length > 4) {
                    const extra = Math.min(14, gap / clauses.length);
                    clauses.forEach(clause => {
                        const style = getComputedStyle(clause);
                        clause.style.paddingTop = `${parseFloat(style.paddingTop) + extra / 2}px`;
                        clause.style.paddingBottom = `${parseFloat(style.paddingBottom) + extra / 2}px`;
                    });
                }
                // Share modest remaining space across blocks instead of leaving a stranded bottom note.
                if (gap < 260 && flow.children.length > 2) {
                    const extra = Math.min(22, gap / flow.children.length);
                    Array.from(flow.children).slice(0,-1).forEach(child => {
                        child.style.marginBottom = `${parseFloat(getComputedStyle(child).marginBottom) + extra}px`;
                    });
                }
                node.dataset.contentFill = Math.round(bottom / flow.clientHeight * 100);
            }
        });
        const annexureIds = [...new Set(sourcePlan.filter(source => source.annexureId).map(source => source.annexureId))];
        container.querySelectorAll('[data-content-section="annexure-index"] tbody tr').forEach(row => {
            const id = annexureIds[Number(row.firstElementChild.textContent) - 1];
            row.lastElementChild.textContent = plan.findIndex(entry => entry.annexureId === id) + 1;
        });
        container.classList.remove('cq-measuring');
        return plan;
    }

    root.QuoteGeneratorDocumentLayout = { compose };
}(typeof self !== 'undefined' ? self : this));
