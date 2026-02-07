/**
 * Payment Receipt Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Supports multiple items with different GST rates
 * Single table with Grand Total - no separate tax table
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const receiptNameInput = document.getElementById('receiptName');
    const receiptAddressInput = document.getElementById('receiptAddress');
    const receiptPhoneInput = document.getElementById('receiptPhone');
    const receiptEmailInput = document.getElementById('receiptEmail');
    const receiptGstinInput = document.getElementById('receiptGstin');
    const receiptDateInput = document.getElementById('receiptDate');
    const receiptNumberInput = document.getElementById('receiptNumber');
    const receiptPrevPaymentInput = document.getElementById('receiptPrevPayment');
    const receiptCurrentPaymentInput = document.getElementById('receiptCurrentPayment');
    const receiptItemsContainer = document.getElementById('receiptItemsContainer');
    const addReceiptItemBtn = document.getElementById('addReceiptItemBtn');
    const generateReceiptBtn = document.getElementById('generateReceiptBtn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const receiptPreview = document.getElementById('receiptPreview');

    // --- OUTPUT ELEMENTS ---
    const dispName = document.getElementById('dispName');
    const dispAddress = document.getElementById('dispAddress');
    const dispPhone = document.getElementById('dispPhone');
    const dispEmail = document.getElementById('dispEmail');
    const dispGst = document.getElementById('dispGst');
    const dispDate = document.getElementById('dispDate');
    const receiptItemsTableBody = document.getElementById('receiptItemsTableBody');
    const dispGrandTotal = document.getElementById('dispGrandTotal');
    const dispAmountWords = document.getElementById('dispAmountWords');
    const dispPrevPayment = document.getElementById('dispPrevPayment');
    const dispCurrPayment = document.getElementById('dispCurrPayment');
    const dispBalance = document.getElementById('dispBalance');
    const receiptNumberDisplay = document.getElementById('receiptNumberDisplay');

    // --- STATE ---
    let itemCounter = 1;

    // --- HELPER: Format Currency (Indian Rupees) ---
    function formatRupees(num) {
        if (typeof num !== 'number' || !isFinite(num)) num = 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(num);
    }

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
        itemRow.className = 'rcpt-item-row';
        itemRow.dataset.itemIndex = index;

        itemRow.innerHTML = `
            <div class="rcpt-item-header">
                <span class="rcpt-item-number">Item ${index + 1}</span>
                <button type="button" class="rcpt-btn-remove" onclick="removeReceiptItem(this)" title="Remove Item">&times;</button>
            </div>
            <div class="rcpt-item-fields">
                <div class="rcpt-input-group">
                    <label>Description</label>
                    <textarea class="rcpt-input-field item-description" rows="2" placeholder="e.g. Supply of 10 x 550Wp Solar Panels"></textarea>
                </div>
                <div class="rcpt-input-group">
                    <label>Qty</label>
                    <input type="number" class="rcpt-input-field item-quantity" value="1" min="1">
                </div>
                <div class="rcpt-input-group">
                    <label>Total Amt (Incl. GST) ₹</label>
                    <input type="number" class="rcpt-input-field item-total-amount" placeholder="e.g. 200000">
                </div>
                <div class="rcpt-input-group">
                    <label>GST %</label>
                    <select class="rcpt-input-field item-gst-rate">
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
    if (addReceiptItemBtn) {
        addReceiptItemBtn.addEventListener('click', () => {
            const newItem = createItemRow(itemCounter);
            receiptItemsContainer.appendChild(newItem);
            itemCounter++;
            renumberItems();
        });
    }

    // --- REMOVE ITEM (Global function for onclick) ---
    window.removeReceiptItem = function (btn) {
        const itemRow = btn.closest('.rcpt-item-row');
        const allItems = receiptItemsContainer.querySelectorAll('.rcpt-item-row');

        // Prevent removing the last item
        if (allItems.length <= 1) {
            alert('You must have at least one item in the receipt.');
            return;
        }

        itemRow.remove();
        renumberItems();
    };

    // --- RENUMBER ITEMS ---
    function renumberItems() {
        const items = receiptItemsContainer.querySelectorAll('.rcpt-item-row');
        items.forEach((item, index) => {
            item.dataset.itemIndex = index;
            const itemNumber = item.querySelector('.rcpt-item-number');
            if (itemNumber) {
                itemNumber.textContent = `Item ${index + 1}`;
            }
        });
    }

    // --- GENERATE RECEIPT ---
    if (generateReceiptBtn) {
        generateReceiptBtn.addEventListener('click', () => {
            // 1. Gather Customer Data
            const name = receiptNameInput?.value || 'N/A';
            const address = receiptAddressInput?.value || 'N/A';
            const phone = receiptPhoneInput?.value || 'N/A';
            const email = receiptEmailInput?.value || 'NA';
            const customerGst = receiptGstinInput?.value || 'NA';
            const dateVal = receiptDateInput?.value;
            const prevPayment = parseFloat(receiptPrevPaymentInput?.value) || 0;
            const currPayment = parseFloat(receiptCurrentPaymentInput?.value) || 0;
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            // 2. Get Receipt Number
            const receiptNumberInputVal = receiptNumberInput?.value?.trim();
            let receiptNo;
            if (receiptNumberInputVal) {
                receiptNo = receiptNumberInputVal;
            } else {
                const today = new Date();
                const year = today.getFullYear().toString().substr(-2);
                const month = ('0' + (today.getMonth() + 1)).slice(-2);
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                receiptNo = `R2VADV${month}${year}-${randomNum}`;
            }

            // 3. Collect all items data
            const itemRows = receiptItemsContainer.querySelectorAll('.rcpt-item-row');
            const items = [];
            let totalGrandAmount = 0;

            itemRows.forEach((row, index) => {
                const description = row.querySelector('.item-description')?.value || `Item ${index + 1}`;
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
                    qty,
                    pricePerUnit,
                    gstRate,
                    taxableValue,  // This is "Amount" (before GST)
                    totalAmount    // This is "Total Amount" (with GST)
                });

                totalGrandAmount += totalAmount;
            });

            // 4. Calculate balance
            const totalPayments = prevPayment + currPayment;
            const balance = totalGrandAmount - totalPayments;

            // 5. Populate Customer Info
            if (dispName) dispName.textContent = name;
            if (dispAddress) dispAddress.textContent = address;
            if (dispPhone) dispPhone.textContent = phone;
            if (dispEmail) dispEmail.textContent = email;
            if (dispGst) dispGst.textContent = customerGst;
            if (receiptNumberDisplay) receiptNumberDisplay.textContent = receiptNo;
            if (dispDate) dispDate.textContent = dateFormatted;

            // 6. Populate Items Table
            if (receiptItemsTableBody) {
                receiptItemsTableBody.innerHTML = items.map(item => `
                    <tr>
                        <td>${item.sn}</td>
                        <td class="desc-cell">${item.description}</td>
                        <td>${item.qty}</td>
                        <td>${formatNumber(item.pricePerUnit)}</td>
                        <td>${item.gstRate}%</td>
                        <td>${formatNumber(item.taxableValue)}</td>
                        <td>${formatNumber(item.totalAmount)}</td>
                    </tr>
                `).join('');
            }

            // 7. Update Grand Total
            if (dispGrandTotal) dispGrandTotal.textContent = '₹ ' + formatNumber(totalGrandAmount);

            // 8. Amount in Words
            if (dispAmountWords) dispAmountWords.textContent = numberToWords(totalGrandAmount);

            // 9. Payment Summary
            if (dispPrevPayment) dispPrevPayment.textContent = formatRupees(prevPayment);
            if (dispCurrPayment) dispCurrPayment.textContent = formatRupees(currPayment);
            if (dispBalance) dispBalance.textContent = formatRupees(balance);

            // 10. Show Receipt Preview
            if (receiptPreview) {
                receiptPreview.classList.add('visible');
                receiptPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
