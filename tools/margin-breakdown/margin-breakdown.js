/**
 * Margin Breakdown — form wiring, preview and output.
 *
 * The document is deliberately thin: every figure on it is typed, except the
 * add-on sub-total, which is the sum of the rows above it. Nothing is inferred
 * from capacity or project type, because the whole point of handing this to a
 * consultant is that they can check each line against what they were told.
 *
 * Page fit is not enforced here the way the Comparison Sheet enforces it. This
 * document is one page and continues onto identical pages when it has to, so
 * there is nothing to refuse — see margin-breakdown-paginate.js.
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const render = window.Ray2VoltMarginRender;
    const paginate = window.Ray2VoltMarginPaginate;

    const A4_WIDTH_PX = 210 / 25.4 * 96;

    const customerNameInput = document.getElementById('mbCustomerName');
    const projectIdInput = document.getElementById('mbProjectId');
    const capacityInput = document.getElementById('mbCapacity');
    const projectTypeInput = document.getElementById('mbProjectType');
    const consultantNameInput = document.getElementById('mbConsultantName');
    const consultantIdInput = document.getElementById('mbConsultantId');
    const dateInput = document.getElementById('mbDate');
    const marginInput = document.getElementById('mbMargin');
    const notesInput = document.getElementById('mbNotes');

    const lineTableBody = document.getElementById('mbLineTableBody');
    const lineCount = document.getElementById('mbLineCount');
    const addLineBtn = document.getElementById('mbAddLineBtn');

    const referenceTableBody = document.getElementById('mbReferenceTableBody');
    const referenceCount = document.getElementById('mbReferenceCount');
    const addReferenceBtn = document.getElementById('mbAddReferenceBtn');

    const subtotalEcho = document.getElementById('mbSubtotalEcho');
    const marginEcho = document.getElementById('mbMarginEcho');

    const validationPanel = document.getElementById('mbValidation');
    const previewBtn = document.getElementById('mbPreviewBtn');
    const printBtn = document.getElementById('mbPrintBtn');
    const downloadBtn = document.getElementById('mbDownloadBtn');

    const preview = document.getElementById('marginBreakdown');
    const pageTemplate = document.getElementById('mbPageTemplate');

    /** Working copies of the two repeatable sections. */
    let lines = [];
    let references = [];

    if (dateInput) dateInput.valueAsDate = new Date();

    // --- Repeatable rows ----------------------------------------------------

    /**
     * A cell that writes straight back into the row it came from. The state
     * arrays stay the source of truth so a removed row cannot leave a stale
     * value behind in the DOM.
     */
    function cellInput(row, field, options) {
        const settings = options || {};
        const cell = document.createElement('td');
        const input = document.createElement('input');

        input.type = settings.type || 'text';
        input.value = row[field] == null ? '' : row[field];
        input.placeholder = settings.placeholder || '';
        input.spellcheck = false;
        if (settings.type === 'number') {
            input.min = '0';
            input.step = '0.01';
        }

        input.addEventListener('input', () => {
            row[field] = input.value;
            if (settings.onInput) settings.onInput();
        });

        cell.appendChild(input);
        return cell;
    }

    function removeCell(collection, row, redraw) {
        const cell = document.createElement('td');
        cell.className = 'mb-cell-action';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mb-row-remove';
        button.textContent = '×';
        button.setAttribute('aria-label', 'Remove this row');
        button.addEventListener('click', () => {
            const index = collection.indexOf(row);
            if (index > -1) collection.splice(index, 1);
            redraw();
        });

        cell.appendChild(button);
        return cell;
    }

    function serialCell(index) {
        const cell = document.createElement('td');
        cell.className = 'mb-cell-sn';
        cell.textContent = render.serial(index);
        return cell;
    }

    function renderLineTable() {
        lineTableBody.replaceChildren();

        lines.forEach((line, index) => {
            const tr = document.createElement('tr');
            tr.appendChild(serialCell(index));
            tr.appendChild(cellInput(line, 'description', { placeholder: 'e.g. Additional structure height' }));
            tr.appendChild(cellInput(line, 'amount', { type: 'number', placeholder: '0', onInput: updateTotals }));
            tr.appendChild(removeCell(lines, line, renderLineTable));
            lineTableBody.appendChild(tr);
        });

        lineCount.textContent = `${lines.length} ${lines.length === 1 ? 'row' : 'rows'}`;
        updateTotals();
    }

    function renderReferenceTable() {
        referenceTableBody.replaceChildren();

        references.forEach((reference, index) => {
            const tr = document.createElement('tr');
            tr.appendChild(serialCell(index));
            tr.appendChild(cellInput(reference, 'label', { placeholder: 'e.g. On-Grid price card, July 2026' }));
            tr.appendChild(cellInput(reference, 'number', { placeholder: 'Optional' }));
            tr.appendChild(cellInput(reference, 'link', { type: 'url', placeholder: 'Optional Drive link' }));
            tr.appendChild(removeCell(references, reference, renderReferenceTable));
            referenceTableBody.appendChild(tr);
        });

        referenceCount.textContent = references.length === 1 ? '1 document' : `${references.length} documents`;
    }

    // --- Figures ------------------------------------------------------------

    function amountOf(line) {
        const value = parseFloat(line.amount);
        return Number.isFinite(value) ? value : 0;
    }

    function subtotal() {
        return lines.reduce((total, line) => total + amountOf(line), 0);
    }

    function marginValue() {
        const value = parseFloat(marginInput.value);
        return Number.isFinite(value) ? value : 0;
    }

    function updateTotals() {
        subtotalEcho.textContent = render.rupees(subtotal());
        marginEcho.textContent = render.rupees(marginValue());
    }

    // --- The Generation Request --------------------------------------------

    function projectTypeLabel() {
        return projectTypeInput.value === 'hybrid' ? 'Hybrid' : 'On-Grid';
    }

    function formattedDate() {
        const value = dateInput.value;
        const date = value ? new Date(`${value}T00:00:00`) : new Date();
        return date.toLocaleDateString('en-GB').replace(/\//g, '-');
    }

    function parseMarkdown(text) {
        if (!text.trim()) return '';

        if (typeof marked !== 'undefined') {
            try {
                return marked.parse(text);
            } catch (error) {
                console.error('Error parsing Markdown:', error);
            }
        }

        console.warn('marked.js is unavailable; falling back to plain text.');
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph.outerHTML;
    }

    /** Blank optional fields print as an em dash rather than as a hole. */
    function orDash(value) {
        const text = String(value || '').trim();
        return text || '—';
    }

    function buildData() {
        const capacity = String(capacityInput.value || '').trim();

        return {
            customerName: orDash(customerNameInput.value),
            projectId: String(projectIdInput.value || '').trim(),
            capacity,
            projectType: projectTypeInput.value,
            projectTypeLabel: projectTypeLabel(),
            consultantName: orDash(consultantNameInput.value),
            consultantId: orDash(consultantIdInput.value),
            dateFormatted: formattedDate(),
            lines: lines
                .filter(line => String(line.description || '').trim() || amountOf(line))
                .map(line => ({ description: orDash(line.description), amount: amountOf(line) })),
            subtotal: subtotal(),
            margin: marginValue(),
            references: references
                .filter(reference => ['label', 'number', 'link'].some(field => String(reference[field] || '').trim()))
                .map(reference => ({
                    label: orDash(reference.label),
                    number: String(reference.number || '').trim(),
                    link: String(reference.link || '').trim()
                })),
            notesHtml: parseMarkdown(notesInput.value || '')
        };
    }

    // --- Validation ---------------------------------------------------------

    function collectProblems(data) {
        const blocking = [];
        const warnings = [];

        if (!String(customerNameInput.value || '').trim()) blocking.push('Enter the customer name.');
        if (!data.capacity) blocking.push('Enter the project capacity in kWp.');
        if (!data.lines.length) blocking.push('Add at least one row to the price breakdown.');

        if (!data.projectId) warnings.push('No Project ID entered — the document will print without one.');
        if (data.consultantName === '—') warnings.push('No consultant name entered.');
        if (data.consultantId === '—') warnings.push('No Consultant ID entered.');
        if (!data.margin) warnings.push('The Ray2Volt project margin is zero.');

        return { blocking, warnings };
    }

    function showMessages(blocking, warnings) {
        if (!blocking.length && !warnings.length) {
            validationPanel.hidden = true;
            validationPanel.replaceChildren();
            return;
        }

        const list = (items, className) => {
            const element = document.createElement('ul');
            element.className = className;
            items.forEach(item => {
                const entry = document.createElement('li');
                entry.textContent = item;
                element.appendChild(entry);
            });
            return element;
        };

        validationPanel.replaceChildren();
        if (blocking.length) validationPanel.appendChild(list(blocking, 'mb-validation-blocking'));
        if (warnings.length) validationPanel.appendChild(list(warnings, 'mb-validation-warning'));
        validationPanel.hidden = false;
    }

    // --- Preview ------------------------------------------------------------

    function setText(root, selector, value) {
        root.querySelectorAll(selector).forEach(element => {
            element.textContent = value;
        });
    }

    /** Every page is the same clone, which is what keeps the furniture identical. */
    function makePageFactory(data) {
        const description = render.plantDescription(data);
        const subtitle = [data.projectId ? `Project ${data.projectId}` : '', description]
            .filter(Boolean)
            .join('  ·  ');

        return function newPage() {
            const page = pageTemplate.content.firstElementChild.cloneNode(true);
            setText(page, '[data-mb-subtitle]', subtitle || data.customerName);
            setText(page, '[data-mb-footer-project]', data.projectId ? `Project ${data.projectId}` : data.customerName);
            preview.appendChild(page);

            return {
                page,
                main: page.querySelector('.mb-page-main'),
                body: page.querySelector('[data-mb-page-body]')
            };
        };
    }

    function updatePageNumbers() {
        const pages = Array.from(preview.querySelectorAll('.mb-page'));
        pages.forEach((page, index) => {
            setText(page, '[data-mb-page-number]', `Page ${index + 1} of ${pages.length}`);
        });
    }

    /** On phones the A4 canvas is zoomed down whole, never reflowed. */
    function updatePreviewScale() {
        if (!preview.classList.contains('visible')) return;

        preview.style.setProperty('--mb-preview-scale', '1');
        if (!window.matchMedia('(max-width: 768px)').matches) return;

        const available = Math.max(280, Math.min(preview.clientWidth, window.innerWidth) - 16);
        const scale = Math.min(1, Math.max(0.35, available / A4_WIDTH_PX));
        preview.style.setProperty('--mb-preview-scale', scale.toFixed(4));
    }

    /**
     * Render the document. Returns false only when a blocking problem stopped
     * it — a long document is a longer document, not a failure.
     */
    async function generatePreview({ scroll = true } = {}) {
        const data = buildData();
        const { blocking, warnings } = collectProblems(data);
        showMessages(blocking, warnings);

        if (blocking.length) {
            preview.classList.remove('visible');
            return false;
        }

        // Pagination is measured, so it has to wait for the real metrics.
        if (document.fonts?.ready) await document.fonts.ready;

        preview.replaceChildren();
        preview.style.setProperty('--mb-preview-scale', '1');
        preview.classList.add('visible');

        paginate.flow(render.documentBlocks(data), makePageFactory(data));
        updatePageNumbers();
        updatePreviewScale();

        if (scroll) preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    }

    function ensurePreview() {
        if (preview.classList.contains('visible')) {
            const data = buildData();
            const { blocking, warnings } = collectProblems(data);
            showMessages(blocking, warnings);
            return !blocking.length;
        }

        return generatePreview({ scroll: false });
    }

    /** `Customer_75 kWp_On-Grid_Margin Breakdown.pdf` */
    function filename(data) {
        return [data.customerName, `${data.capacity} kWp`, data.projectTypeLabel, 'Margin Breakdown'].join('_');
    }

    // --- Events -------------------------------------------------------------

    addLineBtn.addEventListener('click', () => {
        lines.push({ description: '', amount: '' });
        renderLineTable();
    });

    addReferenceBtn.addEventListener('click', () => {
        references.push({ label: '', number: '', link: '' });
        renderReferenceTable();
    });

    marginInput.addEventListener('input', updateTotals);

    previewBtn.addEventListener('click', () => {
        generatePreview();
    });

    printBtn.addEventListener('click', async () => {
        if (!await ensurePreview()) return;

        preview.style.setProperty('--mb-preview-scale', '1');
        window.print();
        updatePreviewScale();
    });

    downloadBtn.addEventListener('click', async () => {
        if (!await ensurePreview()) return;

        window.Ray2VoltPdfDownload?.downloadPages({
            pages: preview.querySelectorAll('.mb-page'),
            button: downloadBtn,
            filename: filename(buildData()),
            beforeCapture: () => preview.style.setProperty('--mb-preview-scale', '1'),
            afterCapture: () => updatePreviewScale()
        });
    });

    window.addEventListener('resize', updatePreviewScale);
    window.addEventListener('orientationchange', updatePreviewScale);

    // --- Start --------------------------------------------------------------

    lines = [
        { description: '', amount: '' },
        { description: '', amount: '' },
        { description: '', amount: '' }
    ];
    references = [{ label: '', number: '', link: '' }];

    renderLineTable();
    renderReferenceTable();
});
