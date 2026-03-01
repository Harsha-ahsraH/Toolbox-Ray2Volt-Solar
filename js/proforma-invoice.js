/**
 * Proforma Invoice Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Supports multiple items with different GST rates
 * Single table with Grand Total - no separate tax table
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const piNameInput = document.getElementById('piName');
    const piAddressInput = document.getElementById('piAddress');
    const piPhoneInput = document.getElementById('piPhone');
    const piEmailInput = document.getElementById('piEmail');
    const piGstinInput = document.getElementById('piGstin');
    const piDateInput = document.getElementById('piDate');
    const piNumberInput = document.getElementById('piNumber');
    const piItemsContainer = document.getElementById('piItemsContainer');
    const piAddItemBtn = document.getElementById('piAddItemBtn');
    const piGenerateBtn = document.getElementById('piGenerateBtn');
    const piPrintBtn = document.getElementById('piPrintBtn');
    const piPreview = document.getElementById('proformaInvoicePreview');

    // --- OUTPUT ELEMENTS ---
    const piDispName = document.getElementById('piDispName');
    const piDispAddress = document.getElementById('piDispAddress');
    const piDispPhone = document.getElementById('piDispPhone');
    const piDispEmail = document.getElementById('piDispEmail');
    const piDispGst = document.getElementById('piDispGst');
    const piDispInvoiceNo = document.getElementById('piDispInvoiceNo');
    const piDispDate = document.getElementById('piDispDate');
    const piItemsTableBody = document.getElementById('piItemsTableBody');
    const piDispGrandTotal = document.getElementById('piDispGrandTotal');
    const piDispAmountWords = document.getElementById('piDispAmountWords');
    const piNumberDisplay = document.getElementById('piNumberDisplay');

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
        itemRow.className = 'pi-item-row';
        itemRow.dataset.itemIndex = index;

        itemRow.innerHTML = `
            <div class="pi-item-header">
                <span class="pi-item-number">Item ${index + 1}</span>
                <button type="button" class="pi-btn-remove" onclick="removePiItem(this)" title="Remove Item">&times;</button>
            </div>
            <div class="pi-item-fields">
                <div class="pi-input-group">
                    <label>Description</label>
                    <textarea class="pi-input-field pi-item-description" rows="2" placeholder="e.g. Supply of 10 x 550Wp Solar Panels"></textarea>
                </div>
                <div class="pi-input-group">
                    <label>HSN/SAC</label>
                    <input type="text" class="pi-input-field pi-item-hsn-code" value="8541" placeholder="e.g. 8541">
                </div>
                <div class="pi-input-group">
                    <label>Qty</label>
                    <input type="number" class="pi-input-field pi-item-quantity" value="1" min="1">
                </div>
                <div class="pi-input-group">
                    <label>Total Amt (Incl. GST) ₹</label>
                    <input type="number" class="pi-input-field pi-item-total-amount" placeholder="e.g. 200000">
                </div>
                <div class="pi-input-group">
                    <label>GST %</label>
                    <select class="pi-input-field pi-item-gst-rate">
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
    if (piAddItemBtn) {
        piAddItemBtn.addEventListener('click', () => {
            const newItem = createItemRow(itemCounter);
            piItemsContainer.appendChild(newItem);
            itemCounter++;
            renumberItems();
        });
    }

    // --- REMOVE ITEM (Global function for onclick) ---
    window.removePiItem = function (btn) {
        const itemRow = btn.closest('.pi-item-row');
        const allItems = piItemsContainer.querySelectorAll('.pi-item-row');

        // Prevent removing the last item
        if (allItems.length <= 1) {
            alert('You must have at least one item in the proforma invoice.');
            return;
        }

        itemRow.remove();
        renumberItems();
    };

    // --- RENUMBER ITEMS ---
    function renumberItems() {
        const items = piItemsContainer.querySelectorAll('.pi-item-row');
        items.forEach((item, index) => {
            item.dataset.itemIndex = index;
            const itemNumber = item.querySelector('.pi-item-number');
            if (itemNumber) {
                itemNumber.textContent = `Item ${index + 1}`;
            }
        });
    }

    // --- GENERATE PROFORMA INVOICE ---
    if (piGenerateBtn) {
        piGenerateBtn.addEventListener('click', () => {
            // 1. Gather Customer Data
            const name = piNameInput?.value || 'N/A';
            const address = piAddressInput?.value || 'N/A';
            const phone = piPhoneInput?.value || 'N/A';
            const email = piEmailInput?.value || 'NA';
            const customerGst = piGstinInput?.value || 'NA';
            const dateVal = piDateInput?.value;
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            // 2. Get PI Number
            const piNumberInputVal = piNumberInput?.value?.trim();
            let piNo;
            if (piNumberInputVal) {
                piNo = piNumberInputVal;
            } else {
                const today = new Date();
                const year = today.getFullYear().toString().substr(-2);
                const month = ('0' + (today.getMonth() + 1)).slice(-2);
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                piNo = `R2VPI${month}${year}-${randomNum}`;
            }

            // 3. Collect all items data
            const itemRows = piItemsContainer.querySelectorAll('.pi-item-row');
            const items = [];
            let totalGrandAmount = 0;

            itemRows.forEach((row, index) => {
                const description = row.querySelector('.pi-item-description')?.value || `Item ${index + 1}`;
                const hsnCode = row.querySelector('.pi-item-hsn-code')?.value || '8541';
                const qty = parseInt(row.querySelector('.pi-item-quantity')?.value) || 1;
                const totalAmount = parseFloat(row.querySelector('.pi-item-total-amount')?.value) || 0;
                const gstRate = parseFloat(row.querySelector('.pi-item-gst-rate')?.value) || 5;

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
                    taxableValue,
                    totalAmount
                });

                totalGrandAmount += totalAmount;
            });

            // 4. Populate Customer Info
            if (piDispName) piDispName.textContent = name;
            if (piDispAddress) piDispAddress.textContent = address;
            if (piDispPhone) piDispPhone.textContent = phone;
            if (piDispEmail) piDispEmail.textContent = email;
            if (piDispGst) piDispGst.textContent = customerGst;
            if (piDispInvoiceNo) piDispInvoiceNo.textContent = piNo;
            if (piNumberDisplay) piNumberDisplay.textContent = piNo;
            if (piDispDate) piDispDate.textContent = dateFormatted;

            // 5. Populate Items Table
            if (piItemsTableBody) {
                piItemsTableBody.innerHTML = items.map(item => `
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
            if (piDispGrandTotal) piDispGrandTotal.textContent = '₹ ' + formatNumber(totalGrandAmount);

            // 7. Amount in Words
            if (piDispAmountWords) piDispAmountWords.textContent = numberToWords(totalGrandAmount);

            // 8. Show Preview
            if (piPreview) {
                piPreview.classList.add('visible');
                piPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (piPrintBtn) {
        piPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
