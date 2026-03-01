/**
 * Purchase Order Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Supports multiple items with different GST rates
 * Single table with Grand Total - no separate tax table
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const poNameInput = document.getElementById('poName');
    const poAddressInput = document.getElementById('poAddress');
    const poPhoneInput = document.getElementById('poPhone');
    const poEmailInput = document.getElementById('poEmail');
    const poGstinInput = document.getElementById('poGstin');
    const poDateInput = document.getElementById('poDate');
    const poNumberInput = document.getElementById('poNumber');
    const poDeliveryAddressInput = document.getElementById('poDeliveryAddress');
    const poItemsContainer = document.getElementById('poItemsContainer');
    const poAddItemBtn = document.getElementById('poAddItemBtn');
    const poGenerateBtn = document.getElementById('poGenerateBtn');
    const poPrintBtn = document.getElementById('poPrintBtn');
    const poPreview = document.getElementById('purchaseOrderPreview');

    // --- OUTPUT ELEMENTS ---
    const poDispName = document.getElementById('poDispName');
    const poDispAddress = document.getElementById('poDispAddress');
    const poDispPhone = document.getElementById('poDispPhone');
    const poDispEmail = document.getElementById('poDispEmail');
    const poDispGst = document.getElementById('poDispGst');
    const poDispOrderNo = document.getElementById('poDispOrderNo');
    const poDispDate = document.getElementById('poDispDate');
    const poDispDeliveryRow = document.getElementById('poDispDeliveryRow');
    const poDispDelivery = document.getElementById('poDispDelivery');
    const poItemsTableBody = document.getElementById('poItemsTableBody');
    const poDispGrandTotal = document.getElementById('poDispGrandTotal');
    const poDispAmountWords = document.getElementById('poDispAmountWords');
    const poNumberDisplay = document.getElementById('poNumberDisplay');

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
        itemRow.className = 'po-item-row';
        itemRow.dataset.itemIndex = index;

        itemRow.innerHTML = `
            <div class="po-item-header">
                <span class="po-item-number">Item ${index + 1}</span>
                <button type="button" class="po-btn-remove" onclick="removePoItem(this)" title="Remove Item">&times;</button>
            </div>
            <div class="po-item-fields">
                <div class="po-input-group">
                    <label>Description</label>
                    <textarea class="po-input-field po-item-description" rows="2" placeholder="e.g. Supply of 10 x 550Wp Solar Panels"></textarea>
                </div>
                <div class="po-input-group">
                    <label>HSN/SAC</label>
                    <input type="text" class="po-input-field po-item-hsn-code" value="8541" placeholder="e.g. 8541">
                </div>
                <div class="po-input-group">
                    <label>Qty</label>
                    <input type="number" class="po-input-field po-item-quantity" value="1" min="1">
                </div>
                <div class="po-input-group">
                    <label>Total Amt (Incl. GST) ₹</label>
                    <input type="number" class="po-input-field po-item-total-amount" placeholder="e.g. 200000">
                </div>
                <div class="po-input-group">
                    <label>GST %</label>
                    <select class="po-input-field po-item-gst-rate">
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
    if (poAddItemBtn) {
        poAddItemBtn.addEventListener('click', () => {
            const newItem = createItemRow(itemCounter);
            poItemsContainer.appendChild(newItem);
            itemCounter++;
            renumberItems();
        });
    }

    // --- REMOVE ITEM (Global function for onclick) ---
    window.removePoItem = function (btn) {
        const itemRow = btn.closest('.po-item-row');
        const allItems = poItemsContainer.querySelectorAll('.po-item-row');

        // Prevent removing the last item
        if (allItems.length <= 1) {
            alert('You must have at least one item in the purchase order.');
            return;
        }

        itemRow.remove();
        renumberItems();
    };

    // --- RENUMBER ITEMS ---
    function renumberItems() {
        const items = poItemsContainer.querySelectorAll('.po-item-row');
        items.forEach((item, index) => {
            item.dataset.itemIndex = index;
            const itemNumber = item.querySelector('.po-item-number');
            if (itemNumber) {
                itemNumber.textContent = `Item ${index + 1}`;
            }
        });
    }

    // --- GENERATE PURCHASE ORDER ---
    if (poGenerateBtn) {
        poGenerateBtn.addEventListener('click', () => {
            // 1. Gather Vendor Data
            const name = poNameInput?.value || 'N/A';
            const address = poAddressInput?.value || 'N/A';
            const phone = poPhoneInput?.value || 'N/A';
            const email = poEmailInput?.value || 'NA';
            const vendorGst = poGstinInput?.value || 'NA';
            const deliveryAddress = poDeliveryAddressInput?.value?.trim() || '';
            const dateVal = poDateInput?.value;
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            // 2. Get PO Number
            const poNumberInputVal = poNumberInput?.value?.trim();
            let poNo;
            if (poNumberInputVal) {
                poNo = poNumberInputVal;
            } else {
                const today = new Date();
                const year = today.getFullYear().toString().substr(-2);
                const month = ('0' + (today.getMonth() + 1)).slice(-2);
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                poNo = `R2VPO${month}${year}-${randomNum}`;
            }

            // 3. Collect all items data
            const itemRows = poItemsContainer.querySelectorAll('.po-item-row');
            const items = [];
            let totalGrandAmount = 0;

            itemRows.forEach((row, index) => {
                const description = row.querySelector('.po-item-description')?.value || `Item ${index + 1}`;
                const hsnCode = row.querySelector('.po-item-hsn-code')?.value || '8541';
                const qty = parseInt(row.querySelector('.po-item-quantity')?.value) || 1;
                const totalAmount = parseFloat(row.querySelector('.po-item-total-amount')?.value) || 0;
                const gstRate = parseFloat(row.querySelector('.po-item-gst-rate')?.value) || 5;

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

            // 4. Populate Vendor Info
            if (poDispName) poDispName.textContent = name;
            if (poDispAddress) poDispAddress.textContent = address;
            if (poDispPhone) poDispPhone.textContent = phone;
            if (poDispEmail) poDispEmail.textContent = email;
            if (poDispGst) poDispGst.textContent = vendorGst;
            if (poDispOrderNo) poDispOrderNo.textContent = poNo;
            if (poNumberDisplay) poNumberDisplay.textContent = poNo;
            if (poDispDate) poDispDate.textContent = dateFormatted;

            // 5. Handle Delivery Address
            if (deliveryAddress && poDispDeliveryRow && poDispDelivery) {
                poDispDelivery.textContent = deliveryAddress;
                poDispDeliveryRow.style.display = 'block';
            } else if (poDispDeliveryRow) {
                poDispDeliveryRow.style.display = 'none';
            }

            // 6. Populate Items Table
            if (poItemsTableBody) {
                poItemsTableBody.innerHTML = items.map(item => `
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

            // 7. Update Grand Total
            if (poDispGrandTotal) poDispGrandTotal.textContent = '₹ ' + formatNumber(totalGrandAmount);

            // 8. Amount in Words
            if (poDispAmountWords) poDispAmountWords.textContent = numberToWords(totalGrandAmount);

            // 9. Show Preview
            if (poPreview) {
                poPreview.classList.add('visible');
                poPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (poPrintBtn) {
        poPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
