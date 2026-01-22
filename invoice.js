/**
 * Invoice Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const invoiceNameInput = document.getElementById('invoiceName');
    const invoiceAddressInput = document.getElementById('invoiceAddress');
    const invoicePhoneInput = document.getElementById('invoicePhone');
    const invoiceEmailInput = document.getElementById('invoiceEmail');
    const invoiceGstinInput = document.getElementById('invoiceGstin');
    const invoiceCapacityInput = document.getElementById('invoiceCapacity');
    const invoiceTotalCostInput = document.getElementById('invoiceTotalCost');
    const invoiceDateInput = document.getElementById('invoiceDate');
    const invoiceHsnInput = document.getElementById('invoiceHsn');
    const invoiceNumberInput = document.getElementById('invoiceNumber');
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
    const invDispCapacity = document.getElementById('invDispCapacity');
    const invDispSysType = document.getElementById('invDispSysType');
    const invDispHsn = document.getElementById('invDispHsn');
    const invDispTaxableValue = document.getElementById('invDispTaxableValue');
    const invDispTaxableValueTotal = document.getElementById('invDispTaxableValueTotal');
    const invTaxTableBody = document.getElementById('invTaxTableBody');
    const invDispTaxRateTotal = document.getElementById('invDispTaxRateTotal');
    const invDispTaxAmountTotal = document.getElementById('invDispTaxAmountTotal');
    const invDispGrandTotal = document.getElementById('invDispGrandTotal');
    const invDispAmountWords = document.getElementById('invDispAmountWords');
    const invoiceNumberDisplay = document.getElementById('invoiceNumberDisplay');

    // --- STATE ---
    let invoiceSysType = 'On-Grid';
    let invoiceGstType = 'Intrastate';

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
    document.querySelectorAll('.invoice-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.invoice-type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            invoiceSysType = e.target.dataset.type;
        });
    });

    document.querySelectorAll('.invoice-gst-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.invoice-gst-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            invoiceGstType = e.target.dataset.type;
        });
    });

    // --- GENERATE INVOICE ---
    if (generateInvoiceBtn) {
        generateInvoiceBtn.addEventListener('click', () => {
            // 1. Gather Input Data
            const name = invoiceNameInput?.value || 'N/A';
            const address = invoiceAddressInput?.value || 'N/A';
            const phone = invoicePhoneInput?.value || 'N/A';
            const email = invoiceEmailInput?.value || 'NA';
            const customerGst = invoiceGstinInput?.value || 'NA';
            const capacity = invoiceCapacityInput?.value || '0';
            const totalCost = parseFloat(invoiceTotalCostInput?.value) || 0;
            const dateVal = invoiceDateInput?.value;
            const hsnCode = invoiceHsnInput?.value || '8541';
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            // 2. Calculations (GST is INCLUDED in Total Cost, 5% standard)
            const gstRate = 0.05;
            const taxableValue = totalCost / (1 + gstRate);
            const totalTaxAmount = totalCost - taxableValue;

            // 3. Get Invoice Number (manual input or generate if empty)
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

            // 4. Populate Invoice Display
            if (invDispName) invDispName.textContent = name;
            if (invDispAddress) invDispAddress.textContent = address;
            if (invDispPhone) invDispPhone.textContent = phone;
            if (invDispEmail) invDispEmail.textContent = email;
            if (invDispGst) invDispGst.textContent = customerGst;
            if (invDispInvoiceNo) invDispInvoiceNo.textContent = invoiceNo;
            if (invoiceNumberDisplay) invoiceNumberDisplay.textContent = invoiceNo;
            if (invDispDate) invDispDate.textContent = dateFormatted;
            if (invDispCapacity) invDispCapacity.textContent = capacity;
            if (invDispSysType) invDispSysType.textContent = invoiceSysType;
            if (invDispHsn) invDispHsn.textContent = hsnCode;

            // Item Row Values
            if (invDispTaxableValue) invDispTaxableValue.textContent = formatNumber(taxableValue);
            if (invDispTaxableValueTotal) invDispTaxableValueTotal.textContent = formatNumber(taxableValue);

            // Tax Breakdown
            if (invTaxTableBody) {
                invTaxTableBody.innerHTML = '';

                if (invoiceGstType === 'Intrastate') {
                    const halfTax = totalTaxAmount / 2;
                    invTaxTableBody.innerHTML = `
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
                    invTaxTableBody.innerHTML = `
                        <tr>
                            <td>IGST</td>
                            <td>5%</td>
                            <td>${formatNumber(totalTaxAmount)}</td>
                        </tr>
                    `;
                }
            }

            if (invDispTaxRateTotal) invDispTaxRateTotal.textContent = '5%';
            if (invDispTaxAmountTotal) invDispTaxAmountTotal.textContent = formatNumber(totalTaxAmount);
            if (invDispGrandTotal) invDispGrandTotal.textContent = formatNumber(totalCost);

            // Amount in Words
            if (invDispAmountWords) invDispAmountWords.textContent = numberToWords(totalCost);

            // Show Invoice Preview
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
