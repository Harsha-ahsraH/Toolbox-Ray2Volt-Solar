/**
 * Quote Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Handles form initialization and preview generation
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const qgQuoteDate = document.getElementById('qgQuoteDate');
    const qgQuoteNumber = document.getElementById('qgQuoteNumber');
    const qgSystemCapacity = document.getElementById('qgSystemCapacity');
    const qgAdvancePercent = document.getElementById('qgAdvancePercent');
    const qgFinalPercent = document.getElementById('qgFinalPercent');
    const qgCustomerName = document.getElementById('qgCustomerName');
    const qgCustomerPhone = document.getElementById('qgCustomerPhone');
    const qgCustomerAddress = document.getElementById('qgCustomerAddress');
    const qgCustomerGstin = document.getElementById('qgCustomerGstin');
    const qgInstallationType = document.getElementById('qgInstallationType');
    const qgTotalPrice = document.getElementById('qgTotalPrice');
    const qgGstType = document.getElementById('qgGstType');
    const qgGstRate = document.getElementById('qgGstRate');
    const qgSubsidyEligible = document.getElementById('qgSubsidyEligible');
    const qgTariffRate = document.getElementById('qgTariffRate');
    const qgUnitsPerKwp = document.getElementById('qgUnitsPerKwp');
    const qgTariffEscalation = document.getElementById('qgTariffEscalation');

    // --- BUTTONS ---
    const generateBtn = document.getElementById('qgGenerateBtn');
    const printBtn = document.getElementById('qgPrintBtn');
    const quotePreview = document.getElementById('quotePreview');

    // --- INITIALIZE ---
    initializeDefaults();
    setupEventListeners();

    /**
     * Initialize default values
     */
    function initializeDefaults() {
        const today = new Date();
        if (qgQuoteDate) qgQuoteDate.value = today.toISOString().split('T')[0];
        if (qgQuoteNumber) qgQuoteNumber.value = generateQuotationNumber();
        if (qgSystemCapacity && !qgSystemCapacity.value) {
            qgSystemCapacity.value = 3;
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Payment terms sync
        if (qgAdvancePercent) {
            qgAdvancePercent.addEventListener('input', () => {
                const advance = parseFloat(qgAdvancePercent.value) || 0;
                if (qgFinalPercent) qgFinalPercent.value = Math.max(0, 100 - advance);
            });
        }

        // Generate Preview button
        if (generateBtn) {
            generateBtn.addEventListener('click', generatePreview);
        }

        // Print / Save as PDF button
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

    }

    /**
     * Generate the 5-page preview
     */
    function generatePreview() {
        // --- Read form values ---
        const customerName = val(qgCustomerName) || '—';
        const customerPhone = val(qgCustomerPhone) || '—';
        const customerAddress = val(qgCustomerAddress) || '—';
        const customerGstin = val(qgCustomerGstin) || 'N/A';
        const quoteDate = qgQuoteDate ? qgQuoteDate.value : '';
        const quoteNumber = val(qgQuoteNumber) || '—';
        const capacity = parseFloat(val(qgSystemCapacity)) || 3;
        const installType = qgInstallationType ? qgInstallationType.options[qgInstallationType.selectedIndex].text : 'On-Grid';
        const totalPrice = parseFloat(val(qgTotalPrice)) || 0;
        const gstType = qgGstType ? qgGstType.value : 'intra';
        const gstRate = parseFloat(val(qgGstRate)) || 5;
        const subsidyEligible = qgSubsidyEligible ? qgSubsidyEligible.checked : true;
        const tariffRate = parseFloat(val(qgTariffRate)) || 7;
        const unitsPerKwp = parseFloat(val(qgUnitsPerKwp)) || 1440;
        const escalation = qgTariffEscalation ? (qgTariffEscalation.value === 'yes' ? 5 : 0) : 5;
        const advancePct = parseFloat(val(qgAdvancePercent)) || 80;
        const finalPct = parseFloat(val(qgFinalPercent)) || 20;

        // --- Formatted date ---
        const formattedDate = quoteDate ? formatDate(quoteDate) : '—';

        // --- GST Calculations (Inclusive Logic) ---
        // Input `totalPrice` is now the Grand Total (Inclusive of GST)
        const grandTotal = totalPrice;
        const gstDecimal = gstRate / 100;

        // Back-calculate taxable base price: Base = Total / (1 + Rate)
        const taxablePrice = grandTotal / (1 + gstDecimal);
        const gstAmount = grandTotal - taxablePrice;
        const halfRate = gstRate / 2;

        let gst1Label, gst2Label, gst1Amt, gst2Amt;
        if (gstType === 'inter') {
            gst1Label = `IGST (${gstRate}%)`;
            gst1Amt = gstAmount;
            gst2Label = null;
            gst2Amt = 0;
        } else {
            gst1Label = `CGST (${halfRate}%)`;
            gst1Amt = gstAmount / 2;
            gst2Label = `SGST (${halfRate}%)`;
            gst2Amt = gstAmount / 2;
        }

        // --- Subsidy ---
        let subsidyAmount = 0;
        if (subsidyEligible) {
            if (capacity <= 2) subsidyAmount = 60000;
            else if (capacity <= 3) subsidyAmount = 78000;
            else subsidyAmount = 78000;
        }
        const netCost = grandTotal - subsidyAmount;

        // --- Payment split ---
        const advanceAmt = grandTotal * (advancePct / 100);
        const finalAmt = grandTotal * (finalPct / 100);

        // ============================
        // PAGE 1: Cover & Customer Info
        // ============================
        setText('qpQuoteNumber', quoteNumber);
        setText('qpQuoteDate', formattedDate);
        setText('qpCustomerName', customerName);
        setText('qpCustomerPhone', customerPhone);
        setText('qpCustomerAddress', customerAddress);
        setText('qpCustomerGstin', customerGstin);
        setText('qpSystemCapacity', `${capacity} kWp`);
        setText('qpInstallationType', installType);

        // ============================
        // PAGE 2: Bill of Materials
        // ============================
        populateBomTable();

        // ============================
        // PAGE 3: Commercial Offer
        // ============================
        setText('qpOfferName', customerName);
        setText('qpOfferAddress', customerAddress);
        setText('qpOfferPhone', customerPhone);
        setText('qpOfferGstin', customerGstin);
        setText('qpOfferQuoteNo', quoteNumber);
        setText('qpOfferDate', formattedDate);

        // Show GSTIN only if provided
        const gstinEl = document.getElementById('qpOfferGstin');
        if (gstinEl) {
            if (customerGstin && customerGstin !== 'N/A' && customerGstin !== '—') {
                gstinEl.textContent = 'GSTIN: ' + customerGstin;
                gstinEl.style.display = '';
            } else {
                gstinEl.style.display = 'none';
            }
        }
        setText('qpPriceCapacity', `${capacity} kWp`);
        setText('qpPriceTaxable', formatCurrency(taxablePrice));
        setText('qpGstLabel1', gst1Label);
        setText('qpGstAmt1', formatCurrency(gst1Amt));

        const gstRow2 = document.getElementById('qpGstRow2');
        if (gst2Label) {
            setText('qpGstLabel2', gst2Label);
            setText('qpGstAmt2', formatCurrency(gst2Amt));
            if (gstRow2) gstRow2.style.display = '';
        } else {
            if (gstRow2) gstRow2.style.display = 'none';
        }

        setText('qpGrandTotal', `<strong>${formatCurrency(grandTotal)}</strong>`);
        setText('qpTableTotal', `<strong>${formatCurrency(grandTotal)}</strong>`);
        setText('qpAmountWords', numberToWords(Math.round(grandTotal)));
        setText('qpSubsidyAmount', formatCurrency(subsidyAmount));
        setText('qpNetCost', formatCurrency(netCost));
        setText('qpAdvPct', advancePct);
        setText('qpFinalPct', finalPct);
        setText('qpAdvanceAmt', formatCurrency(advanceAmt));
        setText('qpFinalAmt', formatCurrency(finalAmt));

        // Subsidy section visibility
        const subsidySection = document.getElementById('qpSubsidySection');
        if (subsidySection) subsidySection.style.display = subsidyEligible ? '' : 'none';

        // ============================
        // PAGE 4: Savings & ROI
        // ============================
        const annualUnits = capacity * unitsPerKwp;
        const annualSavingsY1 = annualUnits * tariffRate;
        const paybackYears = netCost > 0 ? (netCost / annualSavingsY1).toFixed(1) : '—';

        setText('qpRoiCapacity', `${capacity} kWp`);
        setText('qpAnnualUnits', `${annualUnits.toLocaleString('en-IN')} units`);
        setText('qpTariffRate', `₹${tariffRate}/unit`);
        setText('qpAnnualSavings', formatCurrency(annualSavingsY1));
        setText('qpPaybackPeriod', `${paybackYears} years`);

        populateSavingsTable(annualUnits, tariffRate, escalation);

        // --- Environmental Impact (25 years) ---
        const totalUnits25yr = annualUnits * 25;
        const co2Saved = (totalUnits25yr * 0.82) / 1000; // 0.82 kg CO2 per kWh, converted to tonnes
        const treesEquiv = Math.round(co2Saved * 45); // ~45 trees per tonne CO2
        const cleanEnergyMwh = (totalUnits25yr / 1000).toFixed(1);

        setText('qpCo2Saved', `${co2Saved.toFixed(1)} Tonnes`);
        setText('qpTreesEquiv', `${treesEquiv.toLocaleString('en-IN')}+ Trees`);
        setText('qpCleanEnergy', `${cleanEnergyMwh} MWh`);

        // --- Before vs After Solar ---
        const monthlyUnits = annualUnits / 12;
        const monthlyBillBefore = monthlyUnits * tariffRate;
        setText('qpBillBefore', `${formatCurrency(monthlyBillBefore)}/month (est.)`);
        setText('qpBillAfter', 'Approx. ₹0 – ₹200/month');
        setText('qpMonthlySavings', `${formatCurrency(monthlyBillBefore - 100)}/month (est.)`);

        // ============================
        // Show the preview
        // ============================
        if (quotePreview) {
            quotePreview.classList.add('visible');
            quotePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Populate BOM table from input table
     */
    function populateBomTable() {
        const bomBody = document.getElementById('qpBomTableBody');
        if (!bomBody) return;
        bomBody.innerHTML = '';

        const inputRows = document.querySelectorAll('#bomInputTableBody tr');
        let sno = 0;

        inputRows.forEach(row => {
            if (row.classList.contains('bom-section-header')) {
                // Section header row
                const tr = document.createElement('tr');
                tr.className = 'bom-section-header';
                tr.innerHTML = `<td colspan="5"><strong>Installation Accessories</strong></td>`;
                bomBody.appendChild(tr);
                return;
            }

            sno++;
            const item = row.querySelector('.bom-item')?.value || '';
            const qty = row.querySelector('.bom-qty')?.value || '';
            const unit = row.querySelector('.bom-unit')?.value || '';
            const make = row.querySelector('.bom-make')?.value || '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center;">${sno}</td>
                <td>${item}</td>
                <td style="text-align:center;">${qty}</td>
                <td style="text-align:center;">${unit}</td>
                <td>${make}</td>
            `;
            bomBody.appendChild(tr);
        });
    }

    /**
     * Populate 25-year savings projection table
     */
    function populateSavingsTable(annualUnits, baseTariff, escalationPct) {
        const tbody = document.getElementById('qpSavingsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const milestones = [1, 5, 10, 25];
        let cumulative = 0;
        let lastYear = 0;

        milestones.forEach(year => {
            // Calculate cumulative from lastYear+1 to year
            let tariff = baseTariff;
            for (let y = lastYear + 1; y <= year; y++) {
                tariff = baseTariff * Math.pow(1 + escalationPct / 100, y - 1);
                cumulative += annualUnits * tariff;
            }
            lastYear = year;

            const currentTariff = baseTariff * Math.pow(1 + escalationPct / 100, year - 1);
            const annualSaving = annualUnits * currentTariff;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Year ${year}</td>
                <td>${currentTariff.toFixed(2)}</td>
                <td>${formatCurrency(annualSaving)}</td>
                <td>${formatCurrency(cumulative)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Lifetime savings highlight
        setText('qpLifetimeSavings', formatCurrency(cumulative));
    }


    // ============================
    // UTILITY FUNCTIONS
    // ============================

    function val(el) {
        return el ? el.value.trim() : '';
    }

    function setText(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function formatCurrency(num) {
        return '₹' + Math.round(num).toLocaleString('en-IN');
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    /**
     * Convert number to Indian words
     */
    function numberToWords(num) {
        if (num === 0) return 'Zero Rupees Only';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
            'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function twoDigits(n) {
            if (n < 20) return ones[n];
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        }

        function threeDigits(n) {
            if (n >= 100) {
                return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + twoDigits(n % 100) : '');
            }
            return twoDigits(n);
        }

        // Indian numbering: Crore, Lakh, Thousand, Hundred
        let result = '';
        if (num >= 10000000) {
            result += threeDigits(Math.floor(num / 10000000)) + ' Crore ';
            num %= 10000000;
        }
        if (num >= 100000) {
            result += twoDigits(Math.floor(num / 100000)) + ' Lakh ';
            num %= 100000;
        }
        if (num >= 1000) {
            result += twoDigits(Math.floor(num / 1000)) + ' Thousand ';
            num %= 1000;
        }
        if (num > 0) {
            result += threeDigits(num);
        }

        return result.trim() + ' Rupees Only';
    }

    /**
     * Generate quotation number in format R2VQ[MMYY]-[Sequential]
     */
    function generateQuotationNumber() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        let seq = 1;

        try {
            const storageKey = `r2v_quote_seq_${month}${year}`;
            seq = parseInt(localStorage.getItem(storageKey) || '0') + 1;
            localStorage.setItem(storageKey, seq.toString());
        } catch (e) {
            seq = Math.floor(Math.random() * 1000) + 1;
        }

        return `R2VQ${month}${year}-${String(seq).padStart(4, '0')}`;
    }
});
