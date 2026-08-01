/**
 * Margin Breakdown — document blocks.
 *
 * Turns one Generation Request into the ordered list of blocks the paginator
 * lays across pages. It calculates nothing beyond formatting: the sub-total
 * arrives already summed, so the screen and the document can never disagree.
 *
 * Block order is deliberate. The price breakdown comes first because it is the
 * subject of the document and has to be on page one; reference documents and
 * notes are supporting material and are allowed to run over.
 */
(function (root) {
    'use strict';

    const RUPEE = '₹';

    /** `₹ 1,23,456`. Whole rupees — the house documents never print paise. */
    function rupees(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return `${RUPEE} 0`;

        return `${RUPEE} ${Math.round(number).toLocaleString('en-IN')}`;
    }

    /** `01`, `02` … `12`. Matches the serial column in the reference table. */
    function serial(index) {
        return String(index + 1).padStart(2, '0');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** The one place raw HTML becomes nodes. Returns the top-level elements. */
    function nodesFrom(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return Array.from(template.content.childNodes);
    }

    function block(html) {
        return nodesFrom(html)[0];
    }

    function heading(text) {
        return block(`<h2 class="mb-heading">${escapeHtml(text)}</h2>`);
    }

    /** `10 kWp On-Grid`, the phrase both the header and the meta block use. */
    function plantDescription(data) {
        const capacity = String(data.capacity || '').trim();
        const parts = [];
        if (capacity) parts.push(`${capacity} kWp`);
        if (data.projectTypeLabel) parts.push(data.projectTypeLabel);

        return parts.join(' ');
    }

    function metaBlock(data) {
        const description = plantDescription(data);
        const detail = [data.projectId ? `Project ${data.projectId}` : '', description]
            .filter(Boolean)
            .join('  ·  ');

        return block(`
        <div class="mb-meta">
            <div class="mb-meta-customer">
                <span class="mb-meta-label">Prepared for</span>
                <p class="mb-meta-name">${escapeHtml(data.customerName)}</p>
                <p class="mb-meta-detail">${escapeHtml(detail)}</p>
            </div>
            <table class="mb-meta-table">
                <tbody>
                    <tr><th>Consultant</th><td>${escapeHtml(data.consultantName)}</td></tr>
                    <tr><th>Consultant ID</th><td>${escapeHtml(data.consultantId)}</td></tr>
                    <tr><th>Date</th><td>${escapeHtml(data.dateFormatted)}</td></tr>
                </tbody>
            </table>
        </div>`);
    }

    /**
     * The breakdown table.
     *
     * The two closing rows share a `data-mb-group`, which is the paginator's
     * instruction to keep them on one page: a sub-total stranded from the
     * margin it precedes is the one break this document cannot afford.
     */
    function breakdownTable(data) {
        const lines = data.lines.map((line, index) => `
            <tr>
                <td class="mb-sn">${serial(index)}</td>
                <td class="mb-line-description">${escapeHtml(line.description)}</td>
                <td class="mb-amount">${rupees(line.amount)}</td>
            </tr>`).join('');

        return block(`
        <table class="mb-doc-table mb-breakdown-table">
            <colgroup>
                <col style="width: 12%;">
                <col style="width: 58%;">
                <col style="width: 30%;">
            </colgroup>
            <thead>
                <tr>
                    <th>SN</th>
                    <th>Description</th>
                    <th class="mb-amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${lines}
                <tr class="mb-summary-row mb-subtotal-row" data-mb-group="summary">
                    <th colspan="2">Add-on sub-total</th>
                    <td class="mb-amount">${rupees(data.subtotal)}</td>
                </tr>
                <tr class="mb-summary-row mb-margin-row" data-mb-group="summary">
                    <th colspan="2">Ray2Volt Project Margin</th>
                    <td class="mb-amount">${rupees(data.margin)}</td>
                </tr>
            </tbody>
        </table>`);
    }

    /** A Drive link prints as its address: a PDF has nothing to click. */
    function referenceTable(references) {
        const rows = references.map((reference, index) => `
            <tr>
                <td class="mb-sn">${serial(index)}</td>
                <td>${escapeHtml(reference.label)}</td>
                <td>${escapeHtml(reference.number) || '—'}</td>
                <td>${reference.link
                    ? `<a class="mb-ref-link" href="${escapeHtml(reference.link)}">${escapeHtml(reference.link)}</a>`
                    : '—'}</td>
            </tr>`).join('');

        return block(`
        <table class="mb-doc-table mb-ref-table">
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 34%;">
                <col style="width: 20%;">
                <col style="width: 36%;">
            </colgroup>
            <thead>
                <tr>
                    <th>SN</th>
                    <th>Document</th>
                    <th>Reference no.</th>
                    <th>Link</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`);
    }

    /**
     * Compiled Markdown, one block per top-level node.
     *
     * Each node carries `.mb-notes` itself rather than sitting inside a styled
     * wrapper, so a long note can be moved paragraph by paragraph instead of
     * being one indivisible block the height of the whole note.
     */
    function noteBlocks(notesHtml) {
        return nodesFrom(notesHtml)
            .filter(node => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim())
            .map(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    const paragraph = document.createElement('p');
                    paragraph.textContent = node.textContent;
                    node = paragraph;
                }

                node.classList.add('mb-notes');
                return node;
            });
    }

    function documentBlocks(data) {
        const blocks = [metaBlock(data), heading('Price breakdown'), breakdownTable(data)];

        const notes = noteBlocks(data.notesHtml || '');
        if (notes.length) {
            blocks.push(heading('Notes'), ...notes);
        }

        if (data.references.length) {
            blocks.push(heading('Reference documents'), referenceTable(data.references));
        }

        return blocks;
    }

    root.Ray2VoltMarginRender = {
        documentBlocks,
        metaBlock,
        breakdownTable,
        referenceTable,
        noteBlocks,
        plantDescription,
        rupees,
        serial
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
