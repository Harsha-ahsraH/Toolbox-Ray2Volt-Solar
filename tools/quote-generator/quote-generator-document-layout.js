/** Measured A4 composition. The rendered document, contents, preview and print share this plan. */
(function (root) {
    'use strict';

    function composePass(container, sourcePlan, compact) {
        const sources = Array.from(container.children);
        const output = [];
        const plan = [];
        let page;
        let body;
        let currentSection = '';
        let contentsPage;
        const sectionHeaders = new Map();
        sourcePlan.forEach((source, index) => {
            if (!sectionHeaders.has(source.sectionId)) {
                sectionHeaders.set(source.sectionId, sources[index].querySelector('.cq-head-title'));
            }
        });
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
            if (compact.has(source.sectionId)) page.classList.add('cq-compact-page');
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
            const single = ['execution-methodology', 'quality-assurance', 'health-safety', 'why-ray2volt']
                .includes(source.sectionId);
            if (single) node.classList.add('cq-reading-stack');
            const columns = single ? 1 : node.classList.contains('cq-grid-3') ? 3
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
                    // Keep at least two pairs together when the final pair carries over.
                    const carry = index === pairs.length - 2 && fragment.children.length >= 4
                        ? Array.from(fragment.children).slice(-2) : [];
                    carry.forEach(child => child.remove());
                    if (!fragment.children.length) fragment.remove();
                    if (body.children.length) continuePage(source, original);
                    fragment = node.cloneNode(false);
                    body.append(fragment);
                    carry.concat(pair).forEach(child => fragment.append(child));
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
            if (['cover', 'annexures', 'acceptance'].includes(source.sectionId)) {
                if (source.sectionId === 'acceptance') original.classList.add('cq-acceptance-page');
                container.append(original);
                output.push(original);
                plan.push(Object.assign({}, source, { sectionIds: [source.sectionId] }));
                remember(source);
                page = body = null;
                return;
            }
            if (!page) start(source, original);
            else if (currentSection !== source.sectionId) {
                start(source, original);
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
                node.dataset.contentFill = Math.round(bottom / flow.clientHeight * 100);
            }
        });
        // Running headers describe the section that occupies most of the page.
        output.forEach((node, index) => {
            const flow = node.querySelector('.cq-flow-body');
            if (!flow) return;
            const areas = new Map();
            Array.from(flow.children).forEach(block => {
                const id = block.dataset.contentSection || block.dataset.sectionId;
                if (!id) return;
                const style = getComputedStyle(block);
                const height = block.getBoundingClientRect().height
                    + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
                areas.set(id, (areas.get(id) || 0) + height);
            });
            const dominant = [...areas].sort((a, b) => b[1] - a[1])[0]?.[0];
            const sourceHeader = sectionHeaders.get(dominant);
            const header = node.querySelector('.cq-head-title');
            if (!sourceHeader || !header) return;
            header.replaceChildren(...Array.from(sourceHeader.children, child => child.cloneNode(true)));
            // The running title follows the dominant section; its subtitle identifies
            // opening content when a different section or a continuation starts here.
            const opening = plan[index].sectionIds[0];
            const previous = plan.slice(0, index).findLastIndex(entry => entry.sectionIds.includes(opening));
            const subtitle = header.querySelector('p');
            const openingTitle = sourcePlan.find(source => source.sectionId === opening)?.title;
            if (subtitle && opening !== dominant) {
                subtitle.textContent = previous >= 0
                    ? `${openingTitle} · Continued from page ${previous + 1}`
                    : `${openingTitle} starts below`;
            } else if (subtitle && previous >= 0) {
                subtitle.textContent = `Continued from page ${previous + 1}`;
            }
            node.dataset.headerSection = dominant;
            plan[index].headerSectionId = dominant;
        });
        const annexureIds = [...new Set(sourcePlan.filter(source => source.annexureId).map(source => source.annexureId))];
        container.querySelectorAll('[data-content-section="annexure-index"] tbody tr').forEach(row => {
            const id = annexureIds[Number(row.firstElementChild.textContent) - 1];
            row.lastElementChild.textContent = plan.findIndex(entry => entry.annexureId === id) + 1;
        });
        container.classList.remove('cq-measuring');
        return plan;
    }

    function compose(container, sourcePlan) {
        const originals = Array.from(container.children, node => node.cloneNode(true));
        const compact = new Set();
        let plan;
        // Recompose from pristine source nodes: repeated passes cannot lose content
        // or accumulate inline spacing. Only continuation sections need balancing.
        for (let pass = 0; pass < 2; pass += 1) {
            if (pass) container.replaceChildren(...originals.map(node => node.cloneNode(true)));
            plan = composePass(container, sourcePlan, compact);
            const groups = new Map();
            Array.from(container.children).forEach(page => {
                if (!page.classList.contains('cq-flow-page')) return;
                const id = page.dataset.sectionId;
                if (!groups.has(id)) groups.set(id, []);
                groups.get(id).push(Number(page.dataset.contentFill) / 100);
            });
            let changed = false;
            groups.forEach((fills, id) => {
                if (fills.length < 2 || fills.at(-1) >= 0.8) return;
                const total = fills.reduce((sum, value) => sum + value, 0);
                if (!compact.has(id) && total / (fills.length - 1) < 1.2) {
                    compact.add(id);
                    changed = true;
                }
            });
            if (!changed) break;
        }
        root.QuoteGeneratorSectionSpacing.balance(container);
        root.QuoteGeneratorSectionSpacing.finish(container);
        return plan;
    }

    root.QuoteGeneratorDocumentLayout = { compose };
}(typeof self !== 'undefined' ? self : this));
