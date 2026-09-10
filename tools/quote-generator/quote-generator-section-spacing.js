/** Finish measured sections with readable row spacing, without scaling type. */
(function (root) {
    'use strict';

    function occupied(body) {
        const bounds = body.getBoundingClientRect();
        return Math.max(0, ...Array.from(body.children, child =>
            child.getBoundingClientRect().bottom - bounds.top));
    }

    function transfer(previous, next) {
        const last = previous.lastElementChild;
        if (!last || previous.children.length === 1 && last.children.length < 2) return false;
        const first = next.firstElementChild;
        if (last.matches('table') && last.tBodies[0]?.rows.length > 1) {
            let table = first?.matches('table') && first.tHead?.innerHTML === last.tHead?.innerHTML
                ? first : null;
            if (!table) {
                table = last.cloneNode(false);
                Array.from(last.children).filter(child => !child.matches('tbody,tfoot'))
                    .forEach(child => table.append(child.cloneNode(true)));
                table.append(document.createElement('tbody'));
                next.prepend(table);
            }
            if (last.tFoot) table.append(last.tFoot);
            table.tBodies[0].prepend(last.tBodies[0].lastElementChild);
            const category = last.tBodies[0].lastElementChild;
            if (category?.matches('.cq-cat-row,.cq-group-row')) table.tBodies[0].prepend(category);
            if (!last.tBodies[0].rows.length) last.remove();
        } else if (last.matches('ul,ol') && last.children.length > 1) {
            let list = first?.tagName === last.tagName && first.className === last.className ? first : null;
            if (!list) {
                list = last.cloneNode(false);
                next.prepend(list);
            }
            list.prepend(last.lastElementChild);
            if (list.tagName === 'OL' && !list.classList.contains('cq-clause-list')) {
                list.start = (last.start || 1) + last.children.length;
            }
        } else if (last.matches('.cq-kv') && last.children.length > 4) {
            let target = first?.matches('.cq-kv') ? first : null;
            if (!target) {
                target = last.cloneNode(false);
                next.prepend(target);
            }
            target.prepend(...Array.from(last.children).slice(-2));
        } else {
            if (previous.children.length < 2) return false;
            next.prepend(last);
        }
        while (previous.lastElementChild?.matches('h2,h3,h4')) next.prepend(previous.lastElementChild);
        return true;
    }

    function balance(container) {
        container.classList.add('cq-measuring');
        const groups = new Map();
        container.querySelectorAll('.cq-flow-page').forEach(page => {
            if (!groups.has(page.dataset.sectionId)) groups.set(page.dataset.sectionId, []);
            groups.get(page.dataset.sectionId).push(page.querySelector('.cq-body'));
        });
        groups.forEach(bodies => {
            // Work backwards. Refill each donor from its predecessor, retaining
            // reading order and the existing page count and contents references.
            for (let index = bodies.length - 1; index > 0; index -= 1) {
                const next = bodies[index];
                const previous = bodies[index - 1];
                const average = bodies.reduce((sum, body) => sum + occupied(body), 0) / bodies.length;
                const target = Math.min(next.clientHeight * 0.82, average);
                for (let count = 0; occupied(next) < target && count < 200; count += 1) {
                    const before = previous.innerHTML;
                    const after = next.innerHTML;
                    if (!transfer(previous, next)) break;
                    if (occupied(next) > next.clientHeight - 8 || !previous.children.length) {
                        previous.innerHTML = before;
                        next.innerHTML = after;
                        break;
                    }
                }
            }
        });
        container.classList.remove('cq-measuring');
    }

    function finish(container) {
        container.classList.add('cq-measuring');
        container.querySelectorAll('.cq-flow-page').forEach(page => {
            const body = page.querySelector('.cq-body');
            const target = body.clientHeight * 0.815;
            // On a short illustrated page, give the actual photograph more room
            // before increasing whitespace around the explanatory material.
            const photo = body.querySelector(':scope > .cq-component-photo > img');
            if (photo && occupied(body) < target) {
                const height = photo.getBoundingClientRect().height;
                const aspectHeight = photo.getBoundingClientRect().width * photo.naturalHeight / photo.naturalWidth;
                for (let value = height; occupied(body) < target && value < Math.min(300, aspectHeight); value += 2) {
                    photo.style.height = `${value}px`;
                }
            }
            const slots = Array.from(body.querySelectorAll(
                '.cq-table tbody td, .cq-kv > dt, .cq-kv > dd, .cq-clause-list > li,'
                + ' .cq-card, .cq-step, .cq-reading-block'));
            const initial = slots.map(node => {
                const style = getComputedStyle(node);
                return [parseFloat(style.paddingTop), parseFloat(style.paddingBottom)];
            });
            // Add breathing room inside content first; keep it modest and retain
            // the same font sizes and line heights throughout the proposal.
            for (let extra = 1; occupied(body) < target && extra <= 12; extra += 1) {
                slots.forEach((node, index) => {
                    const card = node.classList.contains('cq-card');
                    node.style.paddingTop = `${initial[index][0] + (card ? 0 : extra)}px`;
                    node.style.paddingBottom = `${initial[index][1] + extra * (card ? 2 : 1)}px`;
                });
                if (occupied(body) > body.clientHeight - 8) {
                    slots.forEach((node, index) => {
                        const card = node.classList.contains('cq-card');
                        node.style.paddingTop = `${initial[index][0] + (card ? 0 : extra - 1)}px`;
                        node.style.paddingBottom = `${initial[index][1] + (extra - 1) * (card ? 2 : 1)}px`;
                    });
                    break;
                }
            }
            const blocks = Array.from(body.children).slice(0, -1);
            const margins = blocks.map(node => parseFloat(getComputedStyle(node).marginBottom));
            for (let extra = 1; occupied(body) < target && extra <= 22; extra += 1) {
                blocks.forEach((node, index) => {
                    node.style.marginBottom = `${margins[index] + extra}px`;
                });
            }
            page.dataset.contentFill = (occupied(body) / body.clientHeight * 100).toFixed(1);
            page.dataset.sectionFillStatus = occupied(body) >= body.clientHeight * 0.8 ? 'complete' : 'short';
        });
        container.classList.remove('cq-measuring');
    }

    root.QuoteGeneratorSectionSpacing = { balance, finish };
}(typeof self !== 'undefined' ? self : this));
