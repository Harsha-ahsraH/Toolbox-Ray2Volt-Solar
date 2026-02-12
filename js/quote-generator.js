/**
 * Quote Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Generates 5-page A4 solar project proposals
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const qgCustomerName = document.getElementById('qgCustomerName');
    const qgCustomerPhone = document.getElementById('qgCustomerPhone');
    const qgCustomerAddress = document.getElementById('qgCustomerAddress');
    const qgCustomerGstin = document.getElementById('qgCustomerGstin');

    const qgQuoteDate = document.getElementById('qgQuoteDate');
    const qgQuoteNumber = document.getElementById('qgQuoteNumber');
    const qgSystemCapacity = document.getElementById('qgSystemCapacity');
    const qgInstallationType = document.getElementById('qgInstallationType');

    const qgGstType = document.getElementById('qgGstType');
    const qgGstRate = document.getElementById('qgGstRate');
    const qgSubsidyEligible = document.getElementById('qgSubsidyEligible');
    const qgAdvancePercent = document.getElementById('qgAdvancePercent');
    const qgFinalPercent = document.getElementById('qgFinalPercent');

    const qgTotalPrice = document.getElementById('qgTotalPrice');

    const qgTariffRate = document.getElementById('qgTariffRate');
    const qgUnitsPerKwp = document.getElementById('qgUnitsPerKwp');
    const qgTariffEscalation = document.getElementById('qgTariffEscalation');

    // Buttons
    const qgGenerateBtn = document.getElementById('qgGenerateBtn');
    const qgPrintBtn = document.getElementById('qgPrintBtn');
    const qgSaveDraftBtn = document.getElementById('qgSaveDraftBtn');
    const qgLoadDraftBtn = document.getElementById('qgLoadDraftBtn');
    const qgClearBtn = document.getElementById('qgClearBtn');

    const quotePreview = document.getElementById('quotePreview');

    // --- INITIALIZE ---
    initializeDefaults();
    setupEventListeners();
    updateSummary();

    /**
     * Initialize default values
     */
    function initializeDefaults() {
        // Set today's date
        const today = new Date();
        qgQuoteDate.value = today.toISOString().split('T')[0];

        // Generate quotation number
        qgQuoteNumber.value = generateQuotationNumber();

        // Set default capacity
        if (!qgSystemCapacity.value) {
            qgSystemCapacity.value = 3;
        }

        // Update panel quantity - DEPRECATED
        // updatePanelQuantity();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Panel wattage change -> update summary (quantity is now manual)
        // Removed automatic quantity update listeners

        // Total price input -> update summary
        qgTotalPrice.addEventListener('input', updateSummary);

        // GST settings -> update summary
        qgGstType.addEventListener('change', updateSummary);
        qgGstRate.addEventListener('input', updateSummary);

        // Payment terms sync
        qgAdvancePercent.addEventListener('input', () => {
            const advance = parseFloat(qgAdvancePercent.value) || 0;
            qgFinalPercent.value = Math.max(0, 100 - advance);
        });

        // Generate button
        qgGenerateBtn.addEventListener('click', generateQuotePreview);

        // Print button
        qgPrintBtn.addEventListener('click', () => {
            if (!quotePreview.classList.contains('visible')) {
                generateQuotePreview();
            }
            setTimeout(() => window.print(), 300);
        });

        // Save draft
        qgSaveDraftBtn.addEventListener('click', saveDraft);

        // Load draft
        qgLoadDraftBtn.addEventListener('click', loadDraft);

        // Clear form
        qgClearBtn.addEventListener('click', clearForm);
    }

    /**
     * Generate quotation number in format R2VQ[MMYY]-[Sequential]
     */
    function generateQuotationNumber() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);

        // Get sequential number from localStorage
        const storageKey = `r2v_quote_seq_${month}${year}`;
        let seq = parseInt(localStorage.getItem(storageKey) || '0') + 1;
        localStorage.setItem(storageKey, seq.toString());

        return `R2VQ${month}${year}-${String(seq).padStart(4, '0')}`;
    }

    /**
     * Update panel quantity - DEPRECATED
     * Quantity is now manually managed in the BOM table
     */
    function updatePanelQuantity() {
        // No-op
    }

    /**
     * Get total taxable value from Commercial Offer input
     */
    function getTaxableValue() {
        return parseFloat(qgTotalPrice.value) || 0;
    }

    /**
     * Update summary display
     */
    function updateSummary() {
        const taxable = getTaxableValue();
        const gstRate = parseFloat(qgGstRate.value) || 5;
        const gstAmount = taxable * (gstRate / 100);
        const grandTotal = taxable + gstAmount;

        document.getElementById('qgSummaryTaxable').textContent = `₹${formatCurrency(taxable)}`;
        document.getElementById('qgSummaryGst').textContent = `₹${formatCurrency(gstAmount)}`;
        document.getElementById('qgSummaryTotal').textContent = `₹${formatCurrency(grandTotal)}`;
    }

    /**
     * Format currency with commas (Indian format)
     */
    function formatCurrency(amount) {
        return amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    /**
     * Format date to DD Month YYYY
     */
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    /**
     * Add days to a date and return formatted string
     */
    function addDays(dateStr, days) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return formatDate(date.toISOString().split('T')[0]);
    }

    /**
     * Convert number to words (Indian format)
     */
    function numberToWords(num) {
        if (num === 0) return 'Zero Rupees Only';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function convertLessThanThousand(n) {
            if (n === 0) return '';
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
        }

        let result = '';
        num = Math.round(num);

        // Crores
        if (num >= 10000000) {
            result += convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
            num %= 10000000;
        }

        // Lakhs
        if (num >= 100000) {
            result += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
            num %= 100000;
        }

        // Thousands
        if (num >= 1000) {
            result += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
            num %= 1000;
        }

        // Hundreds and below
        if (num > 0) {
            result += convertLessThanThousand(num);
        }

        return result.trim() + ' Rupees Only';
    }

    /**
     * Calculate PM Surya Ghar subsidy amount
     */
    function calculateSubsidy(capacityKwp) {
        if (capacityKwp <= 0) return 0;

        if (capacityKwp <= 2) {
            return capacityKwp * 30000;
        } else if (capacityKwp <= 3) {
            return 60000 + (capacityKwp - 2) * 30000; // 60k for 2kW + 30k/kW for remaining
        } else {
            return 78000 + (capacityKwp - 3) * 18000; // Max 78k for first 3kW + 18k/kW for rest
        }
    }

    /**
     * Calculate savings projections
     */
    function calculateSavings(annualGeneration, tariffRate, years, includeEscalation) {
        let totalSavings = 0;
        let currentTariff = tariffRate;
        const escalationRate = 0.05; // 5% per year

        for (let i = 0; i < years; i++) {
            totalSavings += annualGeneration * currentTariff;
            if (includeEscalation) {
                currentTariff *= (1 + escalationRate);
            }
        }

        return Math.round(totalSavings);
    }

    /**
     * Generate the quote preview
     */
    function generateQuotePreview() {
        // Gather input data
        const customerName = qgCustomerName.value || 'Valued Customer';
        const customerPhone = qgCustomerPhone.value || '-';
        const customerAddress = qgCustomerAddress.value || '-';
        const customerGstin = qgCustomerGstin.value || '';

        const quoteDate = qgQuoteDate.value;
        const quoteNumber = qgQuoteNumber.value;
        const capacityKwp = parseFloat(qgSystemCapacity.value) || 3;
        const installationType = qgInstallationType.value;

        const gstType = qgGstType.value;
        const gstRate = parseFloat(qgGstRate.value) || 5;
        const subsidyEligible = qgSubsidyEligible.checked;
        const advancePercent = parseFloat(qgAdvancePercent.value) || 80;
        const finalPercent = parseFloat(qgFinalPercent.value) || 20;

        const tariffRate = parseFloat(qgTariffRate.value) || 7;
        const unitsPerKwp = parseFloat(qgUnitsPerKwp.value) || 1440;
        const includeEscalation = qgTariffEscalation.value === 'yes';

        // Component data - read from the new editable BOM table
        const bomRows = document.querySelectorAll('#bomInputTableBody tr[data-row]');
        const bomItems = [];

        bomRows.forEach(row => {
            const itemInput = row.querySelector('.bom-item');
            const qtyInput = row.querySelector('.bom-qty');
            const unitInput = row.querySelector('.bom-unit');
            const makeInput = row.querySelector('.bom-make');

            if (itemInput && qtyInput && unitInput && makeInput) {
                bomItems.push({
                    sno: row.getAttribute('data-row'),
                    item: itemInput.value,
                    qty: qtyInput.value,
                    unit: unitInput.value,
                    make: makeInput.value
                });
            }
        });

        // Get key component specs from BOM rows for the specs display
        const panelSpec = bomItems.find(i => i.item.toLowerCase().includes('module')) || bomItems[0];
        const inverterSpec = bomItems.find(i => i.item.toLowerCase().includes('inverter')) || bomItems[1];
        const mountingSpec = bomItems.find(i => i.item.toLowerCase().includes('structure')) || bomItems[2];
        const cableSpec = bomItems.find(i => i.item.toLowerCase().includes('cable')) || bomItems[5];

        // Calculations - using Commercial Offer total price
        const taxableValue = getTaxableValue();
        const halfGstRate = gstRate / 2;
        const cgstAmount = gstType === 'intra' ? taxableValue * (halfGstRate / 100) : 0;
        const sgstAmount = gstType === 'intra' ? taxableValue * (halfGstRate / 100) : 0;
        const igstAmount = gstType === 'inter' ? taxableValue * (gstRate / 100) : 0;
        const gstAmount = cgstAmount + sgstAmount + igstAmount;
        const grandTotal = taxableValue + gstAmount;

        const advanceAmount = grandTotal * (advancePercent / 100);
        const finalAmount = grandTotal * (finalPercent / 100);

        const annualGeneration = capacityKwp * unitsPerKwp;
        const annualSavings = annualGeneration * tariffRate;
        const subsidyAmount = subsidyEligible ? calculateSubsidy(capacityKwp) : 0;
        const effectiveCost = grandTotal - subsidyAmount;
        const paybackYears = effectiveCost > 0 ? Math.round(effectiveCost / annualSavings) : 0;

        // Environmental calculations
        const co2ReductionKg = annualGeneration * 0.82; // 0.82 kg CO2 per kWh
        const co2ReductionTonnes = co2ReductionKg / 1000;
        const treesEquivalent = Math.round(co2ReductionKg / 21.77); // 21.77 kg CO2 per tree/year
        const carsEquivalent = (co2ReductionTonnes / 4.6).toFixed(2); // 4.6 tonnes CO2 per car/year

        // 30-year savings
        const savings30NoEsc = calculateSavings(annualGeneration, tariffRate, 30, false);
        const savings30Esc = calculateSavings(annualGeneration, tariffRate, 30, true);

        // --- POPULATE PAGE 1 ---
        document.getElementById('p1QuoteNumber').textContent = quoteNumber;
        document.getElementById('p1QuoteDate').textContent = formatDate(quoteDate);
        document.getElementById('p1Capacity').textContent = `${capacityKwp}-kWp`;
        document.getElementById('p1Type').textContent = `${installationType} Solar System`;
        document.getElementById('p1CustomerName').textContent = customerName;
        document.getElementById('p1CustomerAddress').textContent = customerAddress;
        document.getElementById('p1CustomerPhone').textContent = customerPhone;

        if (customerGstin) {
            document.getElementById('p1CustomerGstinRow').style.display = 'block';
            document.getElementById('p1CustomerGstin').textContent = customerGstin;
        } else {
            document.getElementById('p1CustomerGstinRow').style.display = 'none';
        }

        // --- POPULATE PAGE 2 ---
        document.getElementById('p2SystemOverview').textContent = `This proposal is for a ${capacityKwp}-kWp ${installationType} Solar Power Plant designed to meet your energy requirements while maximizing savings and environmental benefits.`;

        // Update Specs Table
        if (panelSpec) document.getElementById('p2PanelSpecs').textContent = `${panelSpec.qty} × ${panelSpec.item}`;
        if (inverterSpec) document.getElementById('p2InverterSpecs').textContent = `${inverterSpec.qty} × ${inverterSpec.item}`;
        if (mountingSpec) document.getElementById('p2MountingSpecs').textContent = `${mountingSpec.item}`;
        if (cableSpec) document.getElementById('p2CableSpecs').textContent = `${cableSpec.item}`;

        // Update BOM table in Preview
        const bomTableBody = document.getElementById('p2BomTableBody');
        let bomHtml = '';

        bomItems.forEach(item => {
            bomHtml += `
                <tr>
                    <td>${item.sno}</td>
                    <td>${item.item}</td>
                    <td>${item.qty}</td>
                    <td>${item.unit}</td>
                    <td>${item.make}</td>
                </tr>`;
        });

        // Add accessories header if needed, but for now just listing all items
        // The original logic separated accessories but since we have a single table now, just dump it all
        // or we can visually separate if we want, but user asked for "editable BOM" to propagate

        bomTableBody.innerHTML = bomHtml;

        // --- POPULATE PAGE 3 ---
        document.getElementById('p3CustomerName').textContent = customerName;
        document.getElementById('p3CustomerAddress').textContent = customerAddress;
        document.getElementById('p3QuoteNumber').textContent = quoteNumber;
        document.getElementById('p3QuoteDate').textContent = formatDate(quoteDate);
        document.getElementById('p3ValidUntil').textContent = addDays(quoteDate, 30);

        if (customerGstin) {
            document.getElementById('p3CustomerGstinRow').style.display = 'block';
            document.getElementById('p3CustomerGstin').textContent = customerGstin;
        } else {
            document.getElementById('p3CustomerGstinRow').style.display = 'none';
        }

        // Price table - simplified to show only total
        document.getElementById('p3SystemDesc').textContent = `Complete ${capacityKwp}-kWp ${installationType} Solar Power System (Turnkey)`;
        document.getElementById('p3TaxableValue').textContent = formatCurrency(taxableValue);


        // GST rows
        if (gstType === 'intra') {
            document.getElementById('p3CgstRow').style.display = '';
            document.getElementById('p3SgstRow').style.display = '';
            document.getElementById('p3IgstRow').style.display = 'none';
            document.getElementById('p3CgstRate').textContent = halfGstRate;
            document.getElementById('p3SgstRate').textContent = halfGstRate;
            document.getElementById('p3CgstAmount').textContent = formatCurrency(cgstAmount);
            document.getElementById('p3SgstAmount').textContent = formatCurrency(sgstAmount);
        } else {
            document.getElementById('p3CgstRow').style.display = 'none';
            document.getElementById('p3SgstRow').style.display = 'none';
            document.getElementById('p3IgstRow').style.display = '';
            document.getElementById('p3IgstRate').textContent = gstRate;
            document.getElementById('p3IgstAmount').textContent = formatCurrency(igstAmount);
        }

        document.getElementById('p3GrandTotal').innerHTML = `<strong>₹${formatCurrency(grandTotal)}</strong>`;
        document.getElementById('p3AmountWords').textContent = numberToWords(grandTotal);

        // Subsidy section
        if (subsidyEligible) {
            document.getElementById('p3SubsidySection').style.display = 'block';
            document.getElementById('p3SubsidyAmount').textContent = formatCurrency(subsidyAmount);
        } else {
            document.getElementById('p3SubsidySection').style.display = 'none';
        }

        // Payment terms
        document.getElementById('p3AdvancePercent').textContent = advancePercent;
        document.getElementById('p3AdvanceAmount').textContent = formatCurrency(advanceAmount);
        document.getElementById('p3FinalPercent').textContent = finalPercent;
        document.getElementById('p3FinalAmount').textContent = formatCurrency(finalAmount);

        // --- POPULATE PAGE 4 ---
        document.getElementById('p4AnnualGeneration').textContent = formatCurrency(annualGeneration);
        document.getElementById('p4AnnualSavings').textContent = `₹${formatCurrency(annualSavings)}`;
        document.getElementById('p4PaybackPeriod').textContent = `~${paybackYears}`;

        // Savings table
        const savings5NoEsc = calculateSavings(annualGeneration, tariffRate, 5, false);
        const savings5Esc = calculateSavings(annualGeneration, tariffRate, 5, true);
        const savings10NoEsc = calculateSavings(annualGeneration, tariffRate, 10, false);
        const savings10Esc = calculateSavings(annualGeneration, tariffRate, 10, true);
        const savings20NoEsc = calculateSavings(annualGeneration, tariffRate, 20, false);
        const savings20Esc = calculateSavings(annualGeneration, tariffRate, 20, true);

        document.getElementById('p4SavingsTableBody').innerHTML = `
            <tr><td>Year 1</td><td>₹${formatCurrency(annualSavings)}</td><td>₹${formatCurrency(annualSavings)}</td></tr>
            <tr><td>Year 5</td><td>₹${formatCurrency(savings5NoEsc)}</td><td>₹${formatCurrency(savings5Esc)}</td></tr>
            <tr><td>Year 10</td><td>₹${formatCurrency(savings10NoEsc)}</td><td>₹${formatCurrency(savings10Esc)}</td></tr>
            <tr><td>Year 20</td><td>₹${formatCurrency(savings20NoEsc)}</td><td>₹${formatCurrency(savings20Esc)}</td></tr>
            <tr class="highlight-row"><td><strong>Year 30</strong></td><td><strong>₹${formatCurrency(savings30NoEsc)}</strong></td><td><strong>₹${formatCurrency(savings30Esc)}</strong></td></tr>
        `;

        document.getElementById('p4Savings30NoEsc').textContent = `₹${formatCurrency(savings30NoEsc)}`;
        document.getElementById('p4Savings30Esc').textContent = `₹${formatCurrency(savings30Esc)}`;

        // Environmental impact
        document.getElementById('p4Co2Reduction').textContent = co2ReductionTonnes.toFixed(2);
        document.getElementById('p4TreesEquivalent').textContent = treesEquivalent;
        document.getElementById('p4CarsOffRoad').textContent = carsEquivalent;

        // Before/After comparison
        const monthlyBill = Math.round(annualSavings / 12);
        document.getElementById('p4BeforeBill').textContent = `₹${formatCurrency(monthlyBill)}/month`;

        // Show preview
        quotePreview.classList.add('visible');
        quotePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Save form data to localStorage
     */
    function saveDraft() {
        const data = {
            customerName: qgCustomerName.value,
            customerPhone: qgCustomerPhone.value,
            customerAddress: qgCustomerAddress.value,
            customerGstin: qgCustomerGstin.value,
            quoteDate: qgQuoteDate.value,
            quoteNumber: qgQuoteNumber.value,
            systemCapacity: qgSystemCapacity.value,
            installationType: qgInstallationType.value,
            gstType: qgGstType.value,
            gstRate: qgGstRate.value,
            subsidyEligible: qgSubsidyEligible.checked,
            advancePercent: qgAdvancePercent.value,
            tariffRate: qgTariffRate.value,
            unitsPerKwp: qgUnitsPerKwp.value,
            tariffEscalation: qgTariffEscalation.value,
            // Commercial offer
            totalPrice: qgTotalPrice.value,
            // BOM Data
            bomItems: []
        };

        // Collect BOM items
        document.querySelectorAll('#bomInputTableBody tr[data-row]').forEach(row => {
            const itemInput = row.querySelector('.bom-item');
            const qtyInput = row.querySelector('.bom-qty');
            const unitInput = row.querySelector('.bom-unit');
            const makeInput = row.querySelector('.bom-make');

            if (itemInput) {
                data.bomItems.push({
                    sno: row.getAttribute('data-row'),
                    item: itemInput.value,
                    qty: qtyInput.value,
                    unit: unitInput.value,
                    make: makeInput.value
                });
            }
        });

        localStorage.setItem('r2v_quote_draft', JSON.stringify(data));
        alert('Draft saved successfully!');
    }

    /**
     * Load form data from localStorage
     */
    function loadDraft() {
        const saved = localStorage.getItem('r2v_quote_draft');
        if (!saved) {
            alert('No saved draft found.');
            return;
        }

        const data = JSON.parse(saved);

        qgCustomerName.value = data.customerName || '';
        qgCustomerPhone.value = data.customerPhone || '';
        qgCustomerAddress.value = data.customerAddress || '';
        qgCustomerGstin.value = data.customerGstin || '';
        qgQuoteDate.value = data.quoteDate || '';
        qgQuoteNumber.value = data.quoteNumber || '';
        qgSystemCapacity.value = data.systemCapacity || 3;
        qgInstallationType.value = data.installationType || 'On-Grid';
        qgGstType.value = data.gstType || 'intra';
        qgGstRate.value = data.gstRate || 5;
        qgSubsidyEligible.checked = data.subsidyEligible !== false;
        qgAdvancePercent.value = data.advancePercent || 80;
        qgFinalPercent.value = 100 - (parseFloat(data.advancePercent) || 80);
        qgTariffRate.value = data.tariffRate || 7;
        qgUnitsPerKwp.value = data.unitsPerKwp || 1440;
        qgTariffEscalation.value = data.tariffEscalation || 'yes';

        // Commercial offer
        if (data.totalPrice) qgTotalPrice.value = data.totalPrice;

        // Restore BOM Items
        if (data.bomItems && Array.isArray(data.bomItems)) {
            data.bomItems.forEach(item => {
                const row = document.querySelector(`#bomInputTableBody tr[data-row="${item.sno}"]`);
                if (row) {
                    const itemInput = row.querySelector('.bom-item');
                    const qtyInput = row.querySelector('.bom-qty');
                    const unitInput = row.querySelector('.bom-unit');
                    const makeInput = row.querySelector('.bom-make');

                    if (itemInput) itemInput.value = item.item;
                    if (qtyInput) qtyInput.value = item.qty;
                    if (unitInput) unitInput.value = item.unit;
                    if (makeInput) makeInput.value = item.make;
                }
            });
        }

        updateSummary();

        alert('Draft loaded successfully!');
    }

    /**
     * Clear all form fields
     */
    function clearForm() {
        if (!confirm('Are you sure you want to clear all form fields? This will refresh the page.')) return;
        location.reload();
    }

});