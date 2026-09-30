/**
 * Shared financial document module for Ray2Volt document generators.
 * Owns line-item rows, inclusive GST math, money formatting, and amount words.
 */
(function (root, factory) {
    'use strict';

    const financialDocuments = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = financialDocuments;
    }

    root.Ray2VoltFinancialDocuments = financialDocuments;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const GST_RATES = [0, 5, 12, 18, 28];

    function asNumber(value, fallback = 0) {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function asPositiveInteger(value, fallback = 1) {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(asNumber(num));
    }

    function formatRupees(num) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(asNumber(num));
    }

    function formatRupeeTotal(num) {
        return '\u20b9 ' + formatNumber(num);
    }

    function numberToWords(num) {
        const rounded = Math.round(asNumber(num));
        if (rounded === 0) return 'Zero Rupees Only';
        if (rounded < 0) return 'Negative ' + numberToWords(Math.abs(rounded));

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
            'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function convertLessThanHundred(n) {
            if (n < 20) return ones[n];
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        }

        function convert(n) {
            if (n === 0) return '';

            let result = '';

            if (n >= 10000000) {
                result += convert(Math.floor(n / 10000000)) + ' Crore ';
                n %= 10000000;
            }

            if (n >= 100000) {
                result += convert(Math.floor(n / 100000)) + ' Lakh ';
                n %= 100000;
            }

            if (n >= 1000) {
                result += convert(Math.floor(n / 1000)) + ' Thousand ';
                n %= 1000;
            }

            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }

            if (n > 0) {
                result += convertLessThanHundred(n) + ' ';
            }

            return result.trim();
        }

        return convert(rounded) + ' Rupees Only';
    }

    // A date input's YYYY-MM-DD becomes DD-MM-YYYY; an empty one means today.
    function formatDateInput(dateValue) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || '');
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;

        const date = dateValue ? new Date(dateValue) : new Date();
        return date.toLocaleDateString('en-GB').replace(/\//g, '-');
    }

    function generateDocumentNumber(prefix, date = new Date(), random = Math.random) {
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const randomNum = Math.floor(1000 + random() * 9000);

        return `${prefix}${month}${year}-${randomNum}`;
    }

    function valueFrom(row, selector, fallback = '') {
        const value = row.querySelector(selector)?.value;
        return value === undefined || value === '' ? fallback : value;
    }

    function collectInclusiveGstItems(rows, selectors, options = {}) {
        const includeHsn = Boolean(options.includeHsn);
        const defaultHsn = options.defaultHsn ?? '8541';

        return Array.from(rows).map((row, index) => {
            const description = valueFrom(row, selectors.description, `Item ${index + 1}`);
            const qty = asPositiveInteger(valueFrom(row, selectors.quantity), 1);
            const totalAmount = asNumber(valueFrom(row, selectors.totalAmount), 0);
            const gstRate = asNumber(valueFrom(row, selectors.gstRate), 5);
            const gstRateDecimal = gstRate / 100;
            const taxableValue = gstRateDecimal === 0 ? totalAmount : totalAmount / (1 + gstRateDecimal);
            const pricePerUnit = taxableValue / qty;
            const item = {
                sn: index + 1,
                description,
                qty,
                pricePerUnit,
                gstRate,
                taxableValue,
                totalAmount
            };

            if (includeHsn) {
                item.hsnCode = valueFrom(row, selectors.hsnCode, defaultHsn);
            }

            return item;
        });
    }

    function totalAmount(items) {
        return items.reduce((sum, item) => sum + asNumber(item.totalAmount), 0);
    }

    function renderItemsTable(items, options = {}) {
        const includeHsn = Boolean(options.includeHsn);

        return items.map(item => `
            <tr>
                <td>${item.sn}</td>
                <td class="desc-cell">${escapeHtml(item.description)}</td>
                ${includeHsn ? `<td>${escapeHtml(item.hsnCode)}</td>` : ''}
                <td>${item.qty}</td>
                <td>${formatNumber(item.pricePerUnit)}</td>
                <td>${formatNumber(item.gstRate).replace('.00', '')}%</td>
                <td>${formatNumber(item.taxableValue)}</td>
                <td>${formatNumber(item.totalAmount)}</td>
            </tr>
        `).join('');
    }

    const ITEM_SELECTORS = Object.freeze({
        description: '.item-description',
        hsnCode: '.item-hsn-code',
        quantity: '.item-quantity',
        totalAmount: '.item-total-amount',
        gstRate: '.item-gst-rate'
    });

    let rowSerial = 0;

    // One line-item row, built from the shared .item-* components.
    function createItemRow(documentRef, includeHsn) {
        const id = (name) => `line-item-${rowSerial}-${name}`;
        const field = (name, label, control) => `
                <div class="field">
                    <label for="${id(name)}">${label}</label>
                    ${control}
                </div>`;
        const itemRow = documentRef.createElement('div');

        rowSerial++;
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <div class="item-header">
                <span class="item-number"></span>
                <button type="button" class="btn-remove" aria-label="Remove item" title="Remove item">&times;</button>
            </div>
            <div class="item-fields">
                ${field('description', 'Description', `<textarea id="${id('description')}" class="input item-description" rows="2" placeholder="e.g. Supply of 10 x 550Wp Solar Panels"></textarea>`)}
                ${includeHsn ? field('hsn', 'HSN/SAC', `<input type="text" id="${id('hsn')}" class="input item-hsn-code" value="8541" placeholder="e.g. 8541">`) : ''}
                ${field('qty', 'Qty', `<input type="number" id="${id('qty')}" class="input item-quantity" value="1" min="1" inputmode="numeric">`)}
                ${field('total', 'Total Amt (Incl. GST) ₹', `<input type="number" id="${id('total')}" class="input item-total-amount" placeholder="e.g. 200000" inputmode="decimal">`)}
                ${field('gst', 'GST %', `<select id="${id('gst')}" class="input item-gst-rate">
                        ${GST_RATES.map(rate => `<option value="${rate}"${rate === 5 ? ' selected' : ''}>${rate}%</option>`).join('')}
                    </select>`)}
            </div>`;

        return itemRow;
    }

    // Owns the line-item list inside `container`: renders the first row, adds
    // rows from `addButton`, removes them by delegation, and keeps at least one.
    function setupLineItems({ container, addButton, includeHsn = false }) {
        const rows = () => container ? container.querySelectorAll('.item-row') : [];

        function renumberItems() {
            const all = rows();
            all.forEach((item, index) => {
                const itemNumber = item.querySelector('.item-number');
                if (itemNumber) itemNumber.textContent = `Item ${index + 1}`;
                const remove = item.querySelector('.btn-remove');
                if (remove) remove.disabled = all.length <= 1;
            });
        }

        function addItem() {
            if (!container) return null;

            const item = createItemRow(container.ownerDocument, includeHsn);
            container.appendChild(item);
            renumberItems();
            return item;
        }

        function removeItem(button) {
            if (rows().length <= 1) return;

            button.closest('.item-row')?.remove();
            renumberItems();
        }

        if (container) {
            container.addEventListener('click', (event) => {
                const button = event.target.closest('.btn-remove');
                if (button && container.contains(button)) removeItem(button);
            });

            if (!rows().length) addItem();
            renumberItems();
        }

        if (addButton) {
            addButton.addEventListener('click', () => {
                addItem()?.querySelector('.item-description')?.focus();
            });
        }

        function collectItems() {
            return collectInclusiveGstItems(rows(), ITEM_SELECTORS, { includeHsn });
        }

        return {
            collectItems,
            renumberItems,
            addItem,
            removeItem
        };
    }

    function setText(element, value) {
        if (element) element.textContent = value;
    }

    function showPreview(preview) {
        if (!preview) return;

        preview.classList.add('visible');
        preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return {
        collectInclusiveGstItems,
        escapeHtml,
        formatDateInput,
        formatNumber,
        formatRupees,
        formatRupeeTotal,
        generateDocumentNumber,
        numberToWords,
        renderItemsTable,
        setupLineItems,
        setText,
        showPreview,
        totalAmount
    };
});
