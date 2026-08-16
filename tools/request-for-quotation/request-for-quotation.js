/**
 * Request for Quotation Generator
 * Builds the preview from the same fixed A4 sheets used for printing.
 */

document.addEventListener('DOMContentLoaded', () => {
    const rfqVendorNameInput = document.getElementById('rfqVendorName');
    const rfqVendorAddressInput = document.getElementById('rfqVendorAddress');
    const rfqVendorPhoneInput = document.getElementById('rfqVendorPhone');
    const rfqVendorEmailInput = document.getElementById('rfqVendorEmail');
    const rfqVendorGstinInput = document.getElementById('rfqVendorGstin');
    const rfqHeadingInput = document.getElementById('rfqHeading');
    const rfqDateInput = document.getElementById('rfqDate');
    const rfqNumberInput = document.getElementById('rfqNumber');
    const rfqBodyInput = document.getElementById('rfqBody');
    const rfqGenerateBtn = document.getElementById('rfqGenerateBtn');
    const rfqPrintBtn = document.getElementById('rfqPrintBtn');
    const rfqPreview = document.getElementById('rfqPreview');
    const rfqPageTemplate = document.getElementById('rfqPageTemplate');

    if (rfqDateInput) {
        rfqDateInput.valueAsDate = new Date();
    }

    function setText(root, selector, value) {
        root.querySelectorAll(selector).forEach((element) => {
            element.textContent = value;
        });
    }

    function createRfqPage(documentData, includeDetails = false) {
        const page = rfqPageTemplate.content.firstElementChild.cloneNode(true);
        const details = page.querySelector('[data-rfq-first-page-details]');

        setText(page, '[data-rfq-heading]', documentData.heading);
        setText(page, '[data-rfq-number]', documentData.rfqNo);
        setText(page, '[data-rfq-footer-number]', documentData.rfqNo);
        setText(page, '[data-rfq-vendor-name]', documentData.vendorName);
        setText(page, '[data-rfq-vendor-address]', documentData.vendorAddress);
        setText(page, '[data-rfq-vendor-phone]', documentData.vendorPhone);
        setText(page, '[data-rfq-vendor-email]', documentData.vendorEmail);
        setText(page, '[data-rfq-vendor-gstin]', documentData.vendorGstin);
        setText(page, '[data-rfq-date]', documentData.dateFormatted);

        if (!includeDetails) {
            details?.remove();
        }

        rfqPreview.appendChild(page);

        return {
            page,
            main: page.querySelector('.rfq-page-main'),
            body: page.querySelector('[data-rfq-page-body]'),
            includeDetails
        };
    }

    function isPageOverflowing(pageContext) {
        return pageContext.main.scrollHeight > pageContext.main.clientHeight + 1;
    }

    function cloneTextRange(element, start, end) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;

        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        if (!textNodes.length) {
            return element.cloneNode(true);
        }

        function boundaryAt(index) {
            let consumed = 0;

            for (const textNode of textNodes) {
                const next = consumed + textNode.data.length;
                if (index <= next) {
                    return { node: textNode, offset: Math.max(0, index - consumed) };
                }
                consumed = next;
            }

            const last = textNodes[textNodes.length - 1];
            return { node: last, offset: last.data.length };
        }

        const startBoundary = boundaryAt(start);
        const endBoundary = boundaryAt(end);
        const range = document.createRange();
        range.setStart(startBoundary.node, startBoundary.offset);
        range.setEnd(endBoundary.node, endBoundary.offset);

        const clone = element.cloneNode(false);
        clone.appendChild(range.cloneContents());
        return clone;
    }

    function splitTextAcrossPages(element, initialPage, documentData) {
        const sourceText = element.textContent || '';
        const totalLength = sourceText.length;
        let pageContext = initialPage;

        if (!totalLength) {
            pageContext.body.appendChild(element.cloneNode(true));
            return pageContext;
        }

        let start = 0;
        while (start < totalLength) {
            let low = start + 1;
            let high = totalLength;
            let bestEnd = start;

            while (low <= high) {
                const midpoint = Math.floor((low + high) / 2);
                const candidate = cloneTextRange(element, start, midpoint);
                pageContext.body.appendChild(candidate);

                if (isPageOverflowing(pageContext)) {
                    high = midpoint - 1;
                } else {
                    bestEnd = midpoint;
                    low = midpoint + 1;
                }

                candidate.remove();
            }

            if (bestEnd === start) {
                pageContext = createRfqPage(documentData, false);
                continue;
            }

            if (bestEnd < totalLength) {
                const wordBoundary = sourceText.lastIndexOf(' ', bestEnd);
                if (wordBoundary > start + 20 && bestEnd - wordBoundary < 60) {
                    bestEnd = wordBoundary + 1;
                }
            }

            pageContext.body.appendChild(cloneTextRange(element, start, bestEnd));
            start = bestEnd;

            if (start < totalLength) {
                pageContext = createRfqPage(documentData, false);
            }
        }

        return pageContext;
    }

    function createTableShell(sourceTable) {
        const table = sourceTable.cloneNode(false);
        sourceTable.querySelectorAll(':scope > colgroup, :scope > thead').forEach((section) => {
            table.appendChild(section.cloneNode(true));
        });
        const body = document.createElement('tbody');
        table.appendChild(body);
        return { table, body };
    }

    function splitTableAcrossPages(sourceTable, initialPage, documentData) {
        const rows = Array.from(sourceTable.rows).filter((row) => !row.closest('thead'));
        let pageContext = initialPage;
        let hadContentBeforeTable = pageContext.body.childNodes.length > 0 || pageContext.includeDetails;
        let shell = createTableShell(sourceTable);
        pageContext.body.appendChild(shell.table);

        if (isPageOverflowing(pageContext)) {
            shell.table.remove();
            pageContext = createRfqPage(documentData, false);
            hadContentBeforeTable = false;
            shell = createTableShell(sourceTable);
            pageContext.body.appendChild(shell.table);
        }

        for (const row of rows) {
            const rowClone = row.cloneNode(true);
            shell.body.appendChild(rowClone);

            if (!isPageOverflowing(pageContext)) {
                continue;
            }

            rowClone.remove();
            if (shell.body.rows.length > 0 || hadContentBeforeTable) {
                pageContext = createRfqPage(documentData, false);
                hadContentBeforeTable = false;
                shell = createTableShell(sourceTable);
                pageContext.body.appendChild(shell.table);
            }

            shell.body.appendChild(rowClone);
            if (isPageOverflowing(pageContext)) {
                rowClone.classList.add('rfq-oversized-block');
            }
        }

        return pageContext;
    }

    function splitListAcrossPages(sourceList, initialPage, documentData) {
        const items = Array.from(sourceList.children);
        let pageContext = initialPage;
        let hadContentBeforeList = pageContext.body.childNodes.length > 0 || pageContext.includeDetails;
        let list = sourceList.cloneNode(false);
        pageContext.body.appendChild(list);

        for (const [index, item] of items.entries()) {
            const itemClone = item.cloneNode(true);
            list.appendChild(itemClone);

            if (!isPageOverflowing(pageContext)) {
                continue;
            }

            itemClone.remove();
            if (list.children.length > 0 || hadContentBeforeList) {
                pageContext = createRfqPage(documentData, false);
                hadContentBeforeList = false;
                list = sourceList.cloneNode(false);
                if (list.tagName === 'OL') {
                    list.start = (sourceList.start || 1) + index;
                }
                pageContext.body.appendChild(list);
            }

            list.appendChild(itemClone);
            if (isPageOverflowing(pageContext)) {
                itemClone.classList.add('rfq-oversized-block');
            }
        }

        return pageContext;
    }

    function appendMarkdownBlock(sourceNode, pageContext, documentData) {
        if (sourceNode.nodeType === Node.TEXT_NODE && !sourceNode.textContent.trim()) {
            return pageContext;
        }

        const tagName = sourceNode.tagName;
        const candidate = sourceNode.cloneNode(true);
        pageContext.body.appendChild(candidate);

        if (!isPageOverflowing(pageContext)) {
            return pageContext;
        }

        candidate.remove();

        if (tagName === 'TABLE') {
            return splitTableAcrossPages(sourceNode, pageContext, documentData);
        }

        if (tagName === 'UL' || tagName === 'OL') {
            return splitListAcrossPages(sourceNode, pageContext, documentData);
        }

        if (pageContext.body.childNodes.length > 0 || pageContext.includeDetails) {
            pageContext = createRfqPage(documentData, false);
            pageContext.body.appendChild(candidate);
            if (!isPageOverflowing(pageContext)) {
                return pageContext;
            }
            candidate.remove();
        }

        if (sourceNode.nodeType === Node.ELEMENT_NODE) {
            return splitTextAcrossPages(sourceNode, pageContext, documentData);
        }

        const paragraph = document.createElement('p');
        paragraph.textContent = sourceNode.textContent;
        return splitTextAcrossPages(paragraph, pageContext, documentData);
    }

    function updatePageNumbers() {
        const pages = Array.from(rfqPreview.querySelectorAll('.rfq-page'));
        const totalPages = pages.length;

        pages.forEach((page, index) => {
            const pageNumber = index + 1;
            setText(page, '[data-rfq-page-number]', `Page ${pageNumber} of ${totalPages}`);
        });
    }

    function updatePreviewScale() {
        if (!rfqPreview?.classList.contains('visible')) return;
        const page = rfqPreview.querySelector('.rfq-page');
        if (!page) return;

        rfqPreview.style.setProperty('--rfq-preview-scale', '1');
        const availableWidth = rfqPreview.clientWidth;
        const pageWidth = page.offsetWidth;
        const scale = pageWidth > 0 ? Math.min(1, availableWidth / pageWidth) : 1;
        rfqPreview.style.setProperty('--rfq-preview-scale', scale.toFixed(4));
    }

    function paginateRfqDocument(parsedHtml, documentData) {
        const markdownSource = document.createElement('template');
        markdownSource.innerHTML = parsedHtml;

        rfqPreview.replaceChildren();
        rfqPreview.style.setProperty('--rfq-preview-scale', '1');
        rfqPreview.classList.add('visible');

        let pageContext = createRfqPage(documentData, true);
        Array.from(markdownSource.content.childNodes).forEach((node) => {
            pageContext = appendMarkdownBlock(node, pageContext, documentData);
        });

        updatePageNumbers();
        updatePreviewScale();
    }

    function escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = value;
        return element.innerHTML;
    }

    function parseMarkdown(markdownText) {
        if (typeof marked !== 'undefined') {
            try {
                return marked.parse(markdownText);
            } catch (error) {
                console.error('Error parsing Markdown:', error);
            }
        }

        console.warn('marked.js is unavailable; using plain-text rendering.');
        return `<p>${escapeHtml(markdownText).replace(/\n/g, '<br>')}</p>`;
    }

    function buildDocumentData() {
        const dateValue = rfqDateInput?.value;
        const dateFormatted = dateValue
            ? new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-GB').replace(/\//g, '-')
            : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        const enteredNumber = rfqNumberInput?.value?.trim();

        let rfqNo = enteredNumber;
        if (!rfqNo) {
            const today = new Date();
            const year = today.getFullYear().toString().slice(-2);
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const randomNumber = Math.floor(100 + Math.random() * 900);
            rfqNo = `R2VRFQ${month}${year}-${randomNumber}`;
        }

        return {
            vendorName: rfqVendorNameInput?.value || 'N/A',
            vendorAddress: rfqVendorAddressInput?.value || 'N/A',
            vendorPhone: rfqVendorPhoneInput?.value || 'N/A',
            vendorEmail: rfqVendorEmailInput?.value || 'N/A',
            vendorGstin: rfqVendorGstinInput?.value || 'N/A',
            heading: rfqHeadingInput?.value || 'REQUEST FOR QUOTATION',
            dateFormatted,
            rfqNo
        };
    }

    async function generateRfqPreview({ scroll = true } = {}) {
        const documentData = buildDocumentData();
        const markdownText = rfqBodyInput?.value || 'No content provided.';
        const parsedHtml = parseMarkdown(markdownText);

        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        paginateRfqDocument(parsedHtml, documentData);

        if (scroll) {
            rfqPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    rfqGenerateBtn?.addEventListener('click', () => {
        generateRfqPreview();
    });

    rfqPrintBtn?.addEventListener('click', async () => {
        if (!rfqPreview.classList.contains('visible')) {
            await generateRfqPreview({ scroll: false });
        }
        window.print();
    });

    window.addEventListener('resize', updatePreviewScale);
});
