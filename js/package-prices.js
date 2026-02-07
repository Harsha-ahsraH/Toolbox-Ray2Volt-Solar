/**
 * Package Prices Calculator Script for Ray2Volt Toolbox
 */
document.addEventListener('DOMContentLoaded', () => {
    // HELPER: Format to Rupees
    const formatToRupees = (num) => {
        if (typeof num !== 'number' || !isFinite(num)) { num = 0; }
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
    };

    // --- PRICING CALCULATOR LOGIC ---
    const solarCapacityInput = document.getElementById('solarCapacity');
    const residentialBtn = document.getElementById('residentialBtn');
    const commercialBtn = document.getElementById('commercialBtn');
    const singlePhaseBtn = document.getElementById('singlePhaseBtn');
    const threePhaseBtn = document.getElementById('threePhaseBtn');
    const customProfitMarginInput = document.getElementById('customProfitMargin');
    const gstRateInput = document.getElementById('pricingGstRate');

    // Output elements
    const panelRateTextEl = document.getElementById('panelRateText');
    const inverterRateTextEl = document.getElementById('inverterRateText');
    const solarPanelsPriceEl = document.getElementById('solarPanelsPrice');
    const inverterPriceEl = document.getElementById('inverterPrice');
    const structurePriceEl = document.getElementById('structurePrice');
    const bosPriceEl = document.getElementById('bosPrice');
    const installationPriceEl = document.getElementById('installationPrice');
    const civilWorkPriceEl = document.getElementById('civilWorkPrice');
    const netMeteringPriceEl = document.getElementById('netMeteringPrice');
    const wiringPriceEl = document.getElementById('wiringPrice');
    const transportationPriceEl = document.getElementById('transportationPrice');
    const subtotalPriceEl = document.getElementById('subtotalPrice');
    const profitMarginEl = document.getElementById('profitMargin');
    const profitMarginPercentTextEl = document.getElementById('profitMarginPercentText');
    const finalPriceEl = document.getElementById('finalPrice');
    const gstAmountEl = document.getElementById('pricingGstAmount');
    const finalPriceWithGstEl = document.getElementById('finalPriceWithGst');

    let customerType = 'residential';
    let inverterType = 'single';

    function calculatePricing() {
        if (!solarCapacityInput) return;
        const capacity = parseFloat(solarCapacityInput.value) || 0;

        if (capacity <= 0) {
            [solarPanelsPriceEl, inverterPriceEl, structurePriceEl, bosPriceEl, installationPriceEl, civilWorkPriceEl, netMeteringPriceEl, wiringPriceEl, transportationPriceEl, subtotalPriceEl, profitMarginEl, finalPriceEl, gstAmountEl, finalPriceWithGstEl]
                .forEach(el => { if (el) el.textContent = formatToRupees(0); });
            return;
        }

        const capacityWatts = capacity * 1000;

        // Solar Panels: Residential (DCR) = ₹27/W, Commercial (NDCR) = ₹18/W
        const solarRatePerWatt = customerType === 'residential' ? 27 : 18;
        const panelWattage = customerType === 'residential' ? 550 : 580;
        const solarPanelsPrice = solarRatePerWatt * capacityWatts;

        if (panelRateTextEl) {
            panelRateTextEl.textContent = customerType === 'residential'
                ? `(₹27/W × ${panelWattage}Wp panels)`
                : `(₹18/W × ${panelWattage}Wp panels)`;
        }

        // Inverter: 1-Phase = ₹6,000/kWp, 3-Phase = ₹2,500/kWp
        const inverterRatePerKwp = inverterType === 'single' ? 6000 : 2500;
        const inverterPrice = inverterRatePerKwp * capacity;

        if (inverterRateTextEl) {
            inverterRateTextEl.textContent = inverterType === 'single' ? '(₹6,000/kWp)' : '(₹2,500/kWp)';
        }

        const structurePrice = 4.5 * capacityWatts;
        const bosPrice = 2 * capacityWatts;
        const installationPrice = 4 * capacityWatts;
        const civilWorkPrice = 1.2 * capacityWatts;
        const netMeteringPrice = 6600;
        const wiringPrice = 5 * capacityWatts;
        const transportationPrice = 5000;

        const subtotal = solarPanelsPrice + inverterPrice + structurePrice + bosPrice + installationPrice + civilWorkPrice + netMeteringPrice + wiringPrice + transportationPrice;

        const profitMarginRate = parseFloat(customProfitMarginInput.value) || 20;
        const profitMargin = subtotal * (profitMarginRate / 100);
        const finalPrice = subtotal + profitMargin;

        const gstRate = parseFloat(gstRateInput.value) || 5;
        const gstAmount = finalPrice * (gstRate / 100);
        const finalPriceWithGst = finalPrice + gstAmount;

        // Update display
        if (solarPanelsPriceEl) solarPanelsPriceEl.textContent = formatToRupees(solarPanelsPrice);
        if (inverterPriceEl) inverterPriceEl.textContent = formatToRupees(inverterPrice);
        if (structurePriceEl) structurePriceEl.textContent = formatToRupees(structurePrice);
        if (bosPriceEl) bosPriceEl.textContent = formatToRupees(bosPrice);
        if (installationPriceEl) installationPriceEl.textContent = formatToRupees(installationPrice);
        if (civilWorkPriceEl) civilWorkPriceEl.textContent = formatToRupees(civilWorkPrice);
        if (netMeteringPriceEl) netMeteringPriceEl.textContent = formatToRupees(netMeteringPrice);
        if (wiringPriceEl) wiringPriceEl.textContent = formatToRupees(wiringPrice);
        if (transportationPriceEl) transportationPriceEl.textContent = formatToRupees(transportationPrice);
        if (subtotalPriceEl) subtotalPriceEl.textContent = formatToRupees(subtotal);
        if (profitMarginPercentTextEl) profitMarginPercentTextEl.textContent = `(${profitMarginRate}%)`;
        if (profitMarginEl) profitMarginEl.textContent = formatToRupees(profitMargin);
        if (finalPriceEl) finalPriceEl.textContent = formatToRupees(finalPrice);
        if (gstAmountEl) gstAmountEl.textContent = formatToRupees(gstAmount);
        if (finalPriceWithGstEl) finalPriceWithGstEl.textContent = formatToRupees(finalPriceWithGst);
    }

    if (solarCapacityInput) {
        residentialBtn.addEventListener('click', () => {
            customerType = 'residential';
            residentialBtn.classList.add('active');
            commercialBtn.classList.remove('active');
            calculatePricing();
        });

        commercialBtn.addEventListener('click', () => {
            customerType = 'commercial';
            commercialBtn.classList.add('active');
            residentialBtn.classList.remove('active');
            calculatePricing();
        });

        if (singlePhaseBtn && threePhaseBtn) {
            singlePhaseBtn.addEventListener('click', () => {
                inverterType = 'single';
                singlePhaseBtn.classList.add('active');
                threePhaseBtn.classList.remove('active');
                calculatePricing();
            });

            threePhaseBtn.addEventListener('click', () => {
                inverterType = 'three';
                threePhaseBtn.classList.add('active');
                singlePhaseBtn.classList.remove('active');
                calculatePricing();
            });
        }

        [solarCapacityInput, customProfitMarginInput, gstRateInput].forEach(input => {
            if (input) input.addEventListener('input', calculatePricing);
        });

        calculatePricing();
    }
});
