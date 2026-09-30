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

    function formatDateInput(dateValue) {
        if (!dateValue) {
            return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        }

        return new Date(dateValue).toLocaleDateString('en-GB').replace(/\//g, '-');
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

    function createItemRow(documentRef, config, index) {
        const {
            prefix,
            fieldClassPrefix = '',
            removeFunctionName,
            includeHsn = false
        } = config;
        const itemRow = documentRef.createElement('div');
        const fieldClass = (name) => `${fieldClassPrefix}${name}`;
        const rowClass = `${prefix}-item-row`;
        const inputClass = `${prefix}-input-field`;

        itemRow.className = rowClass;
        itemRow.dataset.itemIndex = index;
        itemRow.innerHTML = `
            <div class="${prefix}-item-header">
                <span class="${prefix}-item-number">Item ${index + 1}</span>
                <button type="button" class="${prefix}-btn-remove" onclick="${removeFunctionName}(this)" title="Remove Item">&times;</button>
            </div>
            <div class="${prefix}-item-fields">
                <div class="${prefix}-input-group">
                    <label>Description</label>
                    <textarea class="${inputClass} ${fieldClass('item-description')}" rows="2" placeholder="e.g. Supply of 10 x 550Wp Solar Panels"></textarea>
                </div>
                ${includeHsn ? `
                <div class="${prefix}-input-group">
                    <label>HSN/SAC</label>
                    <input type="text" class="${inputClass} ${fieldClass('item-hsn-code')}" value="8541" placeholder="e.g. 8541">
                </div>` : ''}
                <div class="${prefix}-input-group">
                    <label>Qty</label>
                    <input type="number" class="${inputClass} ${fieldClass('item-quantity')}" value="1" min="1">
                </div>
                <div class="${prefix}-input-group">
                    <label>Total Amt (Incl. GST) \u20b9</label>
                    <input type="number" class="${inputClass} ${fieldClass('item-total-amount')}" placeholder="e.g. 200000">
                </div>
                <div class="${prefix}-input-group">
                    <label>GST %</label>
                    <select class="${inputClass} ${fieldClass('item-gst-rate')}">
                        ${GST_RATES.map(rate => `<option value="${rate}"${rate === 5 ? ' selected' : ''}>${rate}%</option>`).join('')}
                    </select>
                </div>
            </div>
        `;

        return itemRow;
    }

    function setupLineItems(config) {
        const {
            container,
            addButton,
            prefix,
            fieldClassPrefix = '',
            removeFunctionName,
            minItemsMessage,
            includeHsn = false
        } = config;

        const rowSelector = `.${prefix}-item-row`;
        const numberSelector = `.${prefix}-item-number`;
        const fieldSelector = (name) => `.${fieldClassPrefix}${name}`;
        const selectors = {
            description: fieldSelector('item-description'),
            hsnCode: fieldSelector('item-hsn-code'),
            quantity: fieldSelector('item-quantity'),
            totalAmount: fieldSelector('item-total-amount'),
            gstRate: fieldSelector('item-gst-rate')
        };
        let nextIndex = container ? container.querySelectorAll(rowSelector).length : 0;

        function renumberItems() {
            if (!container) return;

            container.querySelectorAll(rowSelector).forEach((item, index) => {
                item.dataset.itemIndex = index;
                const itemNumber = item.querySelector(numberSelector);
                if (itemNumber) {
                    itemNumber.textContent = `Item ${index + 1}`;
                }
            });
        }

        function addItem() {
            if (!container) return;

            const item = createItemRow(container.ownerDocument, config, nextIndex);
            container.appendChild(item);
            nextIndex++;
            renumberItems();
        }

        function removeItem(button) {
            if (!container) return;

            const itemRow = button.closest(rowSelector);
            const allItems = container.querySelectorAll(rowSelector);

            if (allItems.length <= 1) {
                alert(minItemsMessage || 'You must have at least one item.');
                return;
            }

            itemRow?.remove();
            renumberItems();
        }

        if (removeFunctionName) {
            globalThis[removeFunctionName] = removeItem;
        }

        if (addButton) {
            addButton.addEventListener('click', addItem);
        }

        function collectItems() {
            if (!container) return [];

            return collectInclusiveGstItems(container.querySelectorAll(rowSelector), selectors, { includeHsn });
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
