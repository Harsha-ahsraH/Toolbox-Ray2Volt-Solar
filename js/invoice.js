/**
 * Invoice Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Supports multiple items with different GST rates
 * Single table with Grand Total - no separate tax table
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const invoiceNameInput = document.getElementById('invoiceName');
    const invoiceAddressInput = document.getElementById('invoiceAddress');
    const invoicePhoneInput = document.getElementById('invoicePhone');
    const invoiceEmailInput = document.getElementById('invoiceEmail');
    const invoiceGstinInput = document.getElementById('invoiceGstin');
    const invoiceDateInput = document.getElementById('invoiceDate');
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    const invoiceItemsContainer = document.getElementById('invoiceItemsContainer');
    const addInvoiceItemBtn = document.getElementById('addInvoiceItemBtn');
    const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    const invoicePreview = document.getElementById('invoicePreview');

    // --- OUTPUT ELEMENTS ---
    const invDispName = document.getElementById('invDispName');
    const invDispAddress = document.getElementById('invDispAddress');
    const invDispPhone = document.getElementById('invDispPhone');
    const invDispEmail = document.getElementById('invDispEmail');
    const invDispGst = document.getElementById('invDispGst');
    const invDispInvoiceNo = document.getElementById('invDispInvoiceNo');
    const invDispDate = document.getElementById('invDispDate');
    const invItemsTableBody = document.getElementById('invItemsTableBody');
    const invDispGrandTotal = document.getElementById('invDispGrandTotal');
    const invDispAmountWords = document.getElementById('invDispAmountWords');
    const invoiceNumberDisplay = document.getElementById('invoiceNumberDisplay');

    // --- STATE ---
    let itemCounter = 1;

    // --- HELPER: Format Number without Symbol ---
    function formatNumber(num) {
        if (typeof num !== 'number' || !isFinite(num)) num = 0;
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    // --- HELPER: Number to Words (Indian System) ---
    function numberToWords(num) {
        if (num === 0) return "Zero Rupees Only";

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
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

        return convert(Math.round(num)) + ' Rupees Only';
    }

    // --- ADD NEW ITEM ROW ---
    function createItemRow(index) {
        const itemRow = document.createElement('div');
        itemRow.className = 'inv-item-row';
        itemRow.dataset.itemIndex = index;

        itemRow.innerHTML = `
            <div class="inv-item-header">
                <span class="inv-item-number">Item ${index + 1}</span>
                <button type="button" class="inv-btn-remove" onclick="removeInvoiceItem(this)" title="Remove Item">&times;</button>
            </div>
            <div class="inv-item-fields">
                <div class="inv-input-group">
                    <label>Description</label>
                    <textarea class="inv-input-field item-description" rows="2" placeholder="e.g. Supply of 10 x 550Wp Solar Panels"></textarea>
                </div>
                <div class="inv-input-group">
                    <label>HSN/SAC</label>
                    <input type="text" class="inv-input-field item-hsn-code" value="8541" placeholder="e.g. 8541">
                </div>
                <div class="inv-input-group">
                    <label>Qty</label>
                    <input type="number" class="inv-input-field item-quantity" value="1" min="1">
                </div>
                <div class="inv-input-group">
                    <label>Total Amt (Incl. GST) ₹</label>
                    <input type="number" class="inv-input-field item-total-amount" placeholder="e.g. 200000">
                </div>
                <div class="inv-input-group">
                    <label>GST %</label>
                    <select class="inv-input-field item-gst-rate">
                        <option value="5" selected>5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                    </select>
                </div>
            </div>
        `;

        return itemRow;
    }

    // Add item button click handler
    if (addInvoiceItemBtn) {
        addInvoiceItemBtn.addEventListener('click', () => {
            const newItem = createItemRow(itemCounter);
            invoiceItemsContainer.appendChild(newItem);
            itemCounter++;
            renumberItems();
        });
    }

    // --- REMOVE ITEM (Global function for onclick) ---
    window.removeInvoiceItem = function (btn) {
        const itemRow = btn.closest('.inv-item-row');
        const allItems = invoiceItemsContainer.querySelectorAll('.inv-item-row');

        // Prevent removing the last item
        if (allItems.length <= 1) {
            alert('You must have at least one item in the invoice.');
            return;
        }

        itemRow.remove();
        renumberItems();
    };

    // --- RENUMBER ITEMS ---
    function renumberItems() {
        const items = invoiceItemsContainer.querySelectorAll('.inv-item-row');
        items.forEach((item, index) => {
            item.dataset.itemIndex = index;
            const itemNumber = item.querySelector('.inv-item-number');
            if (itemNumber) {
                itemNumber.textContent = `Item ${index + 1}`;
            }
        });
    }

    // --- GENERATE INVOICE ---
    if (generateInvoiceBtn) {
        generateInvoiceBtn.addEventListener('click', () => {
            // 1. Gather Customer Data
            const name = invoiceNameInput?.value || 'N/A';
            const address = invoiceAddressInput?.value || 'N/A';
            const phone = invoicePhoneInput?.value || 'N/A';
            const email = invoiceEmailInput?.value || 'NA';
            const customerGst = invoiceGstinInput?.value || 'NA';
            const dateVal = invoiceDateInput?.value;
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            // 2. Get Invoice Number
            const invoiceNumberInputVal = invoiceNumberInput?.value?.trim();
            let invoiceNo;
            if (invoiceNumberInputVal) {
                invoiceNo = invoiceNumberInputVal;
            } else {
                const today = new Date();
                const year = today.getFullYear().toString().substr(-2);
                const month = ('0' + (today.getMonth() + 1)).slice(-2);
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                invoiceNo = `R2VINV${month}${year}-${randomNum}`;
            }

            // 3. Collect all items data
            const itemRows = invoiceItemsContainer.querySelectorAll('.inv-item-row');
            const items = [];
            let totalGrandAmount = 0;

            itemRows.forEach((row, index) => {
                const description = row.querySelector('.item-description')?.value || `Item ${index + 1}`;
                const hsnCode = row.querySelector('.item-hsn-code')?.value || '8541';
                const qty = parseInt(row.querySelector('.item-quantity')?.value) || 1;
                const totalAmount = parseFloat(row.querySelector('.item-total-amount')?.value) || 0;
                const gstRate = parseFloat(row.querySelector('.item-gst-rate')?.value) || 5;

                // Calculate taxable value from total (GST included)
                const gstRateDecimal = gstRate / 100;
                const taxableValue = totalAmount / (1 + gstRateDecimal);
                const pricePerUnit = taxableValue / qty;

                items.push({
                    sn: index + 1,
                    description,
                    hsnCode,
                    qty,
                    pricePerUnit,
                    gstRate,
                    taxableValue,  // This is "Amount" (before GST)
                    totalAmount    // This is "Total Amount" (with GST)
                });

                totalGrandAmount += totalAmount;
            });

            // 4. Populate Customer Info
            if (invDispName) invDispName.textContent = name;
            if (invDispAddress) invDispAddress.textContent = address;
            if (invDispPhone) invDispPhone.textContent = phone;
            if (invDispEmail) invDispEmail.textContent = email;
            if (invDispGst) invDispGst.textContent = customerGst;
            if (invDispInvoiceNo) invDispInvoiceNo.textContent = invoiceNo;
            if (invoiceNumberDisplay) invoiceNumberDisplay.textContent = invoiceNo;
            if (invDispDate) invDispDate.textContent = dateFormatted;

            // 5. Populate Items Table
            if (invItemsTableBody) {
                invItemsTableBody.innerHTML = items.map(item => `
                    <tr>
                        <td>${item.sn}</td>
                        <td class="desc-cell">${item.description}</td>
                        <td>${item.hsnCode}</td>
                        <td>${item.qty}</td>
                        <td>${formatNumber(item.pricePerUnit)}</td>
                        <td>${item.gstRate}%</td>
                        <td>${formatNumber(item.taxableValue)}</td>
                        <td>${formatNumber(item.totalAmount)}</td>
                    </tr>
                `).join('');
            }

            // 6. Update Grand Total
            if (invDispGrandTotal) invDispGrandTotal.textContent = '₹ ' + formatNumber(totalGrandAmount);

            // 7. Amount in Words
            if (invDispAmountWords) invDispAmountWords.textContent = numberToWords(totalGrandAmount);

            // 8. Show Invoice Preview
            if (invoicePreview) {
                invoicePreview.classList.add('visible');
                invoicePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
