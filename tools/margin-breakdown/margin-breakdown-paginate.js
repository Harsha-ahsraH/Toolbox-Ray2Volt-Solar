/**
 * Margin Breakdown — pagination.
 *
 * The document is one page. When the content runs longer it continues on
 * further pages that carry exactly the same header and footer, because every
 * page is cloned from the same template.
 *
 * Nothing here knows what a margin is. It takes a list of blocks and a factory
 * that makes empty pages, and places the blocks by measurement: append, ask the
 * page whether it now overflows, and if it does, take the block back and either
 * split it or move it on. The page's fixed height and `overflow: hidden` in
 * margin-breakdown-document.css are what make that question answerable.
 */
(function (root) {
    'use strict';

    /** Rows or blocks that must not be separated carry this attribute. */
    const GROUP_ATTRIBUTE = 'data-mb-group';

    /** A heading is never left stranded at the foot of a page. */
    const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6, [data-mb-keep-with-next]';

    function isOverflowing(context) {
        return context.main.scrollHeight > context.main.clientHeight + 1;
    }

    /**
     * Move a trailing heading onto the page its content just went to. Called
     * after a new page is opened, with the page the heading was left on.
     */
    function carryHeading(previous, next) {
        const trailing = previous.body.lastElementChild;
        if (!trailing || !trailing.matches(HEADING_SELECTOR)) return;

        previous.body.removeChild(trailing);
        next.body.insertBefore(trailing, next.body.firstChild);
    }

    function hasContent(context) {
        return context.body.childNodes.length > 0;
    }

    /** A table shell for a continuation page: same columns, same header band. */
    function createTableShell(sourceTable) {
        const table = sourceTable.cloneNode(false);
        sourceTable.querySelectorAll(':scope > colgroup, :scope > thead').forEach(section => {
            table.appendChild(section.cloneNode(true));
        });

        const body = document.createElement('tbody');
        table.appendChild(body);

        return { table, body };
    }

    /**
     * The rows that have to travel together, starting at `index`. Rows sharing
     * a `data-mb-group` value are one unit — that is what keeps the add-on
     * sub-total and the project margin on the same page.
     */
    function groupAt(rows, index) {
        const group = rows[index].getAttribute(GROUP_ATTRIBUTE);
        if (!group) return [rows[index]];

        const unit = [];
        for (let cursor = index; cursor < rows.length; cursor++) {
            if (rows[cursor].getAttribute(GROUP_ATTRIBUTE) !== group) break;
            unit.push(rows[cursor]);
        }

        return unit;
    }

    function splitTable(sourceTable, startContext, newPage) {
        const rows = Array.from(sourceTable.rows).filter(row => !row.closest('thead'));
        let context = startContext;

        // Whether this page holds anything besides the table. It decides
        // whether a row that will not fit can be given a page of its own, or
        // is simply taller than any page and has to be kept where it is.
        let pageHasOtherContent = hasContent(context);

        let shell = createTableShell(sourceTable);
        context.body.appendChild(shell.table);

        // Not even the header band fits: start the table on a fresh page.
        if (isOverflowing(context) && pageHasOtherContent) {
            shell.table.remove();
            const next = newPage();
            carryHeading(context, next);
            context = next;
            pageHasOtherContent = false;
            shell = createTableShell(sourceTable);
            context.body.appendChild(shell.table);
        }

        let index = 0;
        while (index < rows.length) {
            const unit = groupAt(rows, index);
            const clones = unit.map(row => row.cloneNode(true));
            clones.forEach(clone => shell.body.appendChild(clone));

            if (!isOverflowing(context)) {
                index += unit.length;
                continue;
            }

            clones.forEach(clone => clone.remove());

            // Only open a new page if this one has something to show for itself.
            if (shell.body.rows.length > 0 || pageHasOtherContent) {
                context = newPage();
                pageHasOtherContent = false;
                shell = createTableShell(sourceTable);
                context.body.appendChild(shell.table);
            }

            clones.forEach(clone => shell.body.appendChild(clone));
            if (isOverflowing(context)) {
                clones.forEach(clone => clone.classList.add('mb-oversized-block'));
            }

            index += unit.length;
        }

        return context;
    }

    function splitList(sourceList, startContext, newPage) {
        const items = Array.from(sourceList.children);
        let context = startContext;
        let pageHasOtherContent = hasContent(context);
        let list = sourceList.cloneNode(false);
        context.body.appendChild(list);

        items.forEach((item, index) => {
            const clone = item.cloneNode(true);
            list.appendChild(clone);

            if (!isOverflowing(context)) return;

            clone.remove();
            if (list.children.length > 0 || pageHasOtherContent) {
                context = newPage();
                pageHasOtherContent = false;
                list = sourceList.cloneNode(false);
                // A numbered list has to resume at the right number.
                if (list.tagName === 'OL') list.start = (sourceList.start || 1) + index;
                context.body.appendChild(list);
            }

            list.appendChild(clone);
            if (isOverflowing(context)) clone.classList.add('mb-oversized-block');
        });

        return context;
    }

    /**
     * The character offsets of a run of text inside `element`, as a shallow
     * clone holding just that run. Used to cut a paragraph mid-way.
     */
    function cloneTextRange(element, start, end) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;

        while ((node = walker.nextNode())) textNodes.push(node);
        if (!textNodes.length) return element.cloneNode(true);

        function boundaryAt(index) {
            let consumed = 0;

            for (const textNode of textNodes) {
                const next = consumed + textNode.data.length;
                if (index <= next) return { node: textNode, offset: Math.max(0, index - consumed) };
                consumed = next;
            }

            const last = textNodes[textNodes.length - 1];
            return { node: last, offset: last.data.length };
        }

        const from = boundaryAt(start);
        const to = boundaryAt(end);
        const range = document.createRange();
        range.setStart(from.node, from.offset);
        range.setEnd(to.node, to.offset);

        const clone = element.cloneNode(false);
        clone.appendChild(range.cloneContents());
        return clone;
    }

    /**
     * A paragraph longer than a page, cut across pages. The binary search asks
     * the layout how much fits rather than guessing a character count, so it
     * holds whatever the font and page geometry happen to be.
     */
    function splitText(element, startContext, newPage) {
        const source = element.textContent || '';
        const total = source.length;
        let context = startContext;

        if (!total) {
            context.body.appendChild(element.cloneNode(true));
            return context;
        }

        let start = 0;
        while (start < total) {
            let low = start + 1;
            let high = total;
            let best = start;

            while (low <= high) {
                const midpoint = Math.floor((low + high) / 2);
                const candidate = cloneTextRange(element, start, midpoint);
                context.body.appendChild(candidate);

                if (isOverflowing(context)) {
                    high = midpoint - 1;
                } else {
                    best = midpoint;
                    low = midpoint + 1;
                }

                candidate.remove();
            }

            if (best === start) {
                // Nothing fits at all — only a fresh page can help.
                context = newPage();
                continue;
            }

            // Prefer a word boundary, but not at the cost of half a page.
            if (best < total) {
                const boundary = source.lastIndexOf(' ', best);
                if (boundary > start + 20 && best - boundary < 60) best = boundary + 1;
            }

            context.body.appendChild(cloneTextRange(element, start, best));
            start = best;

            if (start < total) context = newPage();
        }

        return context;
    }

    function placeBlock(node, startContext, newPage) {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return startContext;

        let context = startContext;
        const candidate = node.cloneNode(true);
        context.body.appendChild(candidate);

        if (!isOverflowing(context)) return context;

        candidate.remove();

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'TABLE') return splitTable(node, context, newPage);
            if (node.tagName === 'UL' || node.tagName === 'OL') return splitList(node, context, newPage);
        }

        // Whole-block move: try the block on a page of its own first.
        if (hasContent(context)) {
            const next = newPage();
            carryHeading(context, next);
            context = next;
            context.body.appendChild(candidate);
            if (!isOverflowing(context)) return context;
            candidate.remove();
        }

        if (node.nodeType === Node.ELEMENT_NODE) return splitText(node, context, newPage);

        const paragraph = document.createElement('p');
        paragraph.textContent = node.textContent;
        return splitText(paragraph, context, newPage);
    }

    /**
     * Lay `blocks` across as many pages as they need.
     *
     * `newPage()` must create an empty page, attach it to the document, and
     * return `{ main, body }` — `main` being the region that is allowed to
     * overflow and `body` the element blocks are appended to.
     */
    function flow(blocks, newPage) {
        let context = newPage();
        blocks.forEach(block => {
            context = placeBlock(block, context, newPage);
        });

        return context;
    }

    root.Ray2VoltMarginPaginate = {
        flow,
        placeBlock,
        isOverflowing,
        groupAt,
        GROUP_ATTRIBUTE
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
