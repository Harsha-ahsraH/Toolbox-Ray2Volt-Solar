/**
 * Payment Receipt Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const receiptNameInput = document.getElementById('receiptName');
    const receiptAddressInput = document.getElementById('receiptAddress');
    const receiptPhoneInput = document.getElementById('receiptPhone');
    const receiptEmailInput = document.getElementById('receiptEmail');
    const receiptGstinInput = document.getElementById('receiptGstin');
    const receiptCapacityInput = document.getElementById('receiptCapacity');
    const receiptTotalCostInput = document.getElementById('receiptTotalCost');
    const receiptDateInput = document.getElementById('receiptDate');
    const receiptPrevPaymentInput = document.getElementById('receiptPrevPayment');
    const receiptCurrentPaymentInput = document.getElementById('receiptCurrentPayment');
    const receiptNumberInput = document.getElementById('receiptNumber');
    const generateReceiptBtn = document.getElementById('generateReceiptBtn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const receiptPreview = document.getElementById('receiptPreview');

    // --- OUTPUT ELEMENTS ---
    const dispName = document.getElementById('dispName');
    const dispAddress = document.getElementById('dispAddress');
    const dispPhone = document.getElementById('dispPhone');
    const dispEmail = document.getElementById('dispEmail');
    const dispGst = document.getElementById('dispGst');
    const dispReceiptNo = document.getElementById('dispReceiptNo');
    const dispDate = document.getElementById('dispDate');
    const dispCapacity = document.getElementById('dispCapacity');
    const dispSysType = document.getElementById('dispSysType');
    const dispTaxableValue = document.getElementById('dispTaxableValue');
    const dispTaxableValueTotal = document.getElementById('dispTaxableValueTotal');
    const taxTableBody = document.getElementById('taxTableBody');
    const dispTaxRateTotal = document.getElementById('dispTaxRateTotal');
    const dispTaxAmountTotal = document.getElementById('dispTaxAmountTotal');
    const dispGrandTotal = document.getElementById('dispGrandTotal');
    const dispAmountWords = document.getElementById('dispAmountWords');
    const dispPrevPayment = document.getElementById('dispPrevPayment');
    const dispCurrPayment = document.getElementById('dispCurrPayment');
    const dispBalance = document.getElementById('dispBalance');
    const receiptNumberDisplay = document.getElementById('receiptNumberDisplay');

    // --- STATE ---
    let receiptSysType = 'On-Grid';
    let receiptGstType = 'Intrastate';

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

            // Crores (1,00,00,000)
            if (n >= 10000000) {
                result += convert(Math.floor(n / 10000000)) + ' Crore ';
                n %= 10000000;
            }

            // Lakhs (1,00,000)
            if (n >= 100000) {
                result += convert(Math.floor(n / 100000)) + ' Lakh ';
                n %= 100000;
            }

            // Thousands (1,000)
            if (n >= 1000) {
                result += convert(Math.floor(n / 1000)) + ' Thousand ';
                n %= 1000;
            }

            // Hundreds
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }

            // Less than 100
            if (n > 0) {
                result += convertLessThanHundred(n) + ' ';
            }

            return result.trim();
        }

        return convert(Math.round(num)) + ' Rupees Only';
    }

    // --- BUTTON GROUP EVENT LISTENERS ---
    document.querySelectorAll('.receipt-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.receipt-type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            receiptSysType = e.target.dataset.type;
        });
    });

    document.querySelectorAll('.receipt-gst-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.receipt-gst-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            receiptGstType = e.target.dataset.type;
        });
    });

    // --- GENERATE RECEIPT ---
    if (generateReceiptBtn) {
        generateReceiptBtn.addEventListener('click', () => {
            // 1. Gather Input Data
            const name = receiptNameInput?.value || 'N/A';
            const address = receiptAddressInput?.value || 'N/A';
            const phone = receiptPhoneInput?.value || 'N/A';
            const email = receiptEmailInput?.value || 'NA';
            const customerGst = receiptGstinInput?.value || 'NA';
            const capacity = receiptCapacityInput?.value || '0';
            const totalCost = parseFloat(receiptTotalCostInput?.value) || 0;
            const dateVal = receiptDateInput?.value;
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            const prevPayment = parseFloat(receiptPrevPaymentInput?.value) || 0;
            const currPayment = parseFloat(receiptCurrentPaymentInput?.value) || 0;

            // 2. Calculations (GST is INCLUDED in Total Cost, 5% standard)
            const gstRate = 0.05;
            const taxableValue = totalCost / (1 + gstRate);
            const totalTaxAmount = totalCost - taxableValue;
            const balance = totalCost - (prevPayment + currPayment);

            // 3. Get Receipt Number (manual input or generate if empty)
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

            // 4. Populate Receipt Display
            if (dispName) dispName.textContent = name;
            if (dispAddress) dispAddress.textContent = address;
            if (dispPhone) dispPhone.textContent = phone;
            if (dispEmail) dispEmail.textContent = email;
            if (dispGst) dispGst.textContent = customerGst;
            if (dispReceiptNo) dispReceiptNo.textContent = receiptNo;
            if (receiptNumberDisplay) receiptNumberDisplay.textContent = receiptNo;
            if (dispDate) dispDate.textContent = dateFormatted;
            if (dispCapacity) dispCapacity.textContent = capacity;
            if (dispSysType) dispSysType.textContent = receiptSysType;

            // Item Row Values
            if (dispTaxableValue) dispTaxableValue.textContent = formatNumber(taxableValue);
            if (dispTaxableValueTotal) dispTaxableValueTotal.textContent = formatNumber(taxableValue);

            // Tax Breakdown
            if (taxTableBody) {
                taxTableBody.innerHTML = '';

                if (receiptGstType === 'Intrastate') {
                    const halfTax = totalTaxAmount / 2;
                    taxTableBody.innerHTML = `
                        <tr>
                            <td>CGST</td>
                            <td>2.5%</td>
                            <td>${formatNumber(halfTax)}</td>
                        </tr>
                        <tr>
                            <td>SGST</td>
                            <td>2.5%</td>
                            <td>${formatNumber(halfTax)}</td>
                        </tr>
                    `;
                } else {
                    taxTableBody.innerHTML = `
                        <tr>
                            <td>IGST</td>
                            <td>5%</td>
                            <td>${formatNumber(totalTaxAmount)}</td>
                        </tr>
                    `;
                }
            }

            if (dispTaxRateTotal) dispTaxRateTotal.textContent = '5%';
            if (dispTaxAmountTotal) dispTaxAmountTotal.textContent = formatNumber(totalTaxAmount);
            if (dispGrandTotal) dispGrandTotal.textContent = formatNumber(totalCost);

            // Amount in Words
            if (dispAmountWords) dispAmountWords.textContent = numberToWords(totalCost);

            // Payments Section
            if (dispPrevPayment) dispPrevPayment.textContent = formatRupees(prevPayment);
            if (dispCurrPayment) dispCurrPayment.textContent = formatRupees(currPayment);
            if (dispBalance) dispBalance.textContent = formatRupees(balance);

            // Show Receipt Preview
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
