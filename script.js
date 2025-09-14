document.addEventListener('DOMContentLoaded', () => {
    // --- SIDEBAR NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link, .tool-card');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;

            // Update content sections visibility
            contentSections.forEach(section => {
                section.classList.toggle('active', section.id === targetId);
            });

            // Update active state for nav links
            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.remove('active');
                if (nav.dataset.target === targetId) {
                    nav.classList.add('active');
                }
            });
        });
    });

    // HELPER: Format to Rupees
    const formatToRupees = (num) => {
        if (typeof num !== 'number' || !isFinite(num)) { num = 0; }
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
    };

    // --- EMI CALCULATOR LOGIC (from your reference) ---
    const loanAmountInput = document.getElementById('loanAmount');
    const loanAmountSlider = document.getElementById('loanAmountSlider');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateSlider = document.getElementById('interestRateSlider');
    const loanTenureInput = document.getElementById('loanTenure');
    const loanTenureSlider = document.getElementById('loanTenureSlider');
    const monthlyEMIEl = document.getElementById('monthlyEMI');
    const totalInterestEl = document.getElementById('totalInterest');
    const totalPaymentEl = document.getElementById('totalPayment');
    const amortizationBody = document.getElementById('amortizationBody');
    const emiChartCtx = document.getElementById('emiChart').getContext('2d');
    let emiChart;
    
    function syncInputs(input, slider) { slider.value = input.value; calculateAndDisplayEMI(); }
    function syncSliders(slider, input) { input.value = slider.value; calculateAndDisplayEMI(); }
    
    function calculateAndDisplayEMI() {
        const P = parseFloat(loanAmountInput.value), annualRate = parseFloat(interestRateInput.value), N = parseInt(loanTenureInput.value);
        if (isNaN(P) || isNaN(annualRate) || isNaN(N) || P <= 0 || annualRate <= 0 || N <= 0) {
            monthlyEMIEl.textContent = formatToRupees(0); totalInterestEl.textContent = formatToRupees(0); totalPaymentEl.textContent = formatToRupees(0);
            amortizationBody.innerHTML = ''; if (emiChart) { emiChart.destroy(); emiChart = null; } return;
        }
        const r = (annualRate / 100) / 12, emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
        if (!isFinite(emi)) { return; }
        const totalPayment = emi * N, totalInterest = totalPayment - P;
        monthlyEMIEl.textContent = formatToRupees(emi); totalInterestEl.textContent = formatToRupees(totalInterest); totalPaymentEl.textContent = formatToRupees(totalPayment);
        updateEMIChart(P, totalInterest); generateAmortizationSchedule(P, emi, r, N);
    }
    
    function updateEMIChart(principal, interest) {
        const data = { labels: ['Principal Amount', 'Total Interest'], datasets: [{ data: [principal, interest], backgroundColor: ['#5c9ce5', '#f7d969'], borderColor: '#FFFFFF', borderWidth: 4 }] };
        if (emiChart) { emiChart.data = data; emiChart.update(); } 
        else { emiChart = new Chart(emiChartCtx, { type: 'doughnut', data: data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { family: "'Nunito Sans', sans-serif", size: 14 } } } }, cutout: '60%' } }); }
    }
    
    function generateAmortizationSchedule(principal, emi, monthlyRate, tenure) {
        amortizationBody.innerHTML = ''; let balance = principal;
        for (let i = 1; i <= tenure; i++) {
            const interestPaid = balance * monthlyRate, principalPaid = emi - interestPaid; balance -= principalPaid;
            if (i === tenure || balance < 0) balance = 0;
            amortizationBody.innerHTML += `<tr><td>${i}</td><td>${formatToRupees(principalPaid)}</td><td>${formatToRupees(interestPaid)}</td><td>${formatToRupees(emi)}</td><td>${formatToRupees(balance)}</td></tr>`;
        }
    }
    
    loanAmountInput.addEventListener('input', () => syncInputs(loanAmountInput, loanAmountSlider)); loanAmountSlider.addEventListener('input', () => syncSliders(loanAmountSlider, loanAmountInput));
    interestRateInput.addEventListener('input', () => syncInputs(interestRateInput, interestRateSlider)); interestRateSlider.addEventListener('input', () => syncSliders(interestRateSlider, interestRateInput));
    loanTenureInput.addEventListener('input', () => syncInputs(loanTenureInput, loanTenureSlider)); loanTenureSlider.addEventListener('input', () => syncSliders(loanTenureSlider, loanTenureInput));
    
    if (loanAmountInput) calculateAndDisplayEMI();

    // --- GST CALCULATOR LOGIC ---
    const gstAmountInput = document.getElementById('gstAmount'), gstRateInputGst = document.getElementById('gstRate'), quickRateBtns = document.querySelectorAll('.gst-rate-btn'), addGstBtn = document.getElementById('addGstBtn'), removeGstBtn = document.getElementById('removeGstBtn'), intraStateBtn = document.getElementById('intraStateBtn'), interStateBtn = document.getElementById('interStateBtn'), baseAmountOutput = document.getElementById('baseAmountOutput'), totalAmountOutput = document.getElementById('totalAmountOutput'), cgstAmountOutput = document.getElementById('cgstAmountOutput'), sgstAmountOutput = document.getElementById('sgstAmountOutput'), igstAmountOutput = document.getElementById('igstAmountOutput'), intraStateOutputDiv = document.getElementById('intraStateOutput'), interStateOutputDiv = document.getElementById('interStateOutput');
    let gstMethod = 'add', gstType = 'intra';
    
    function calculateAndDisplayGST() {
        const amount = parseFloat(gstAmountInput.value) || 0, rate = parseFloat(gstRateInputGst.value) || 0;
        let baseAmount = 0, totalGst = 0, totalAmount = 0;
        if (amount > 0 && rate > 0) {
            if (gstMethod === 'add') { baseAmount = amount; totalGst = baseAmount * (rate / 100); totalAmount = baseAmount + totalGst; } 
            else { totalAmount = amount; baseAmount = totalAmount / (1 + (rate / 100)); totalGst = totalAmount - baseAmount; }
        }
        baseAmountOutput.textContent = formatToRupees(baseAmount); totalAmountOutput.textContent = formatToRupees(totalAmount);
        if (gstType === 'intra') {
            const halfGst = totalGst / 2;
            cgstAmountOutput.textContent = formatToRupees(halfGst); sgstAmountOutput.textContent = formatToRupees(halfGst);
            intraStateOutputDiv.style.display = 'block'; interStateOutputDiv.style.display = 'none';
        } else {
            igstAmountOutput.textContent = formatToRupees(totalGst);
            intraStateOutputDiv.style.display = 'none'; interStateOutputDiv.style.display = 'block';
        }
    }
    
    const gstInputs = [gstAmountInput, gstRateInputGst];
    gstInputs.forEach(input => input.addEventListener('input', calculateAndDisplayGST));
    
    quickRateBtns.forEach(btn => btn.addEventListener('click', () => { gstRateInputGst.value = btn.dataset.rate; quickRateBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); calculateAndDisplayGST(); }));
    addGstBtn.addEventListener('click', () => { gstMethod = 'add'; addGstBtn.classList.add('active'); removeGstBtn.classList.remove('active'); calculateAndDisplayGST(); });
    removeGstBtn.addEventListener('click', () => { gstMethod = 'remove'; removeGstBtn.classList.add('active'); addGstBtn.classList.remove('active'); calculateAndDisplayGST(); });
    intraStateBtn.addEventListener('click', () => { gstType = 'intra'; intraStateBtn.classList.add('active'); interStateBtn.classList.remove('active'); calculateAndDisplayGST(); });
    interStateBtn.addEventListener('click', () => { gstType = 'inter'; interStateBtn.classList.add('active'); intraStateBtn.classList.remove('active'); calculateAndDisplayGST(); });
    
    if(gstAmountInput) calculateAndDisplayGST();

    // --- PRICING CALCULATOR LOGIC ---
    const solarCapacityInput = document.getElementById('solarCapacity');
    const residentialBtn = document.getElementById('residentialBtn');
    const commercialBtn = document.getElementById('commercialBtn');
    const standardStructureBtn = document.getElementById('standardStructureBtn');
    const customStructureBtn = document.getElementById('customStructureBtn');
    const legsInputGroup = document.getElementById('legsInputGroup');
    const legsCountInput = document.getElementById('legsCount');
    const buildingFloorsInput = document.getElementById('buildingFloors');
    const customProfitMarginInput = document.getElementById('customProfitMargin');
    const gstRateInput = document.getElementById('pricingGstRate');
    
    
    // Output elements
    const panelCountEl = document.getElementById('panelCount');
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
    const finalPriceEl = document.getElementById('finalPrice');
    const gstAmountEl = document.getElementById('pricingGstAmount');
    const finalPriceWithGstEl = document.getElementById('finalPriceWithGst');
    
    let customerType = 'residential';
    let structureType = 'standard';
    
    function calculatePricing() {
        const capacity = parseFloat(solarCapacityInput.value) || 0;
        const legsCount = parseInt(legsCountInput.value) || 0;
        const floors = parseInt(buildingFloorsInput.value) || 2;
        
        if (capacity <= 0) {
            // Reset all prices to 0
            panelCountEl.textContent = '0';
            [solarPanelsPriceEl, inverterPriceEl, structurePriceEl, bosPriceEl, 
             civilWorkPriceEl, netMeteringPriceEl, wiringPriceEl, transportationPriceEl, subtotalPriceEl, profitMarginEl, finalPriceEl]
                .forEach(el => el.textContent = formatToRupees(0));
            if (gstAmountEl) gstAmountEl.textContent = formatToRupees(0);
            if (finalPriceWithGstEl) finalPriceWithGstEl.textContent = formatToRupees(0);
            return;
        }
        
        // 1. Solar capacity calculation
        // Calculate number of panels needed (each panel is 575W = 0.575kWp)
        const panelsPerKw = 1000 / 575; // 1.739 panels per kWp
        const numberOfPanels = Math.ceil(capacity * panelsPerKw); // Round up to get whole panels
        const solarRate = customerType === 'residential' ? 27 : 20;
        const solarPanelsPrice = solarRate * 575 * numberOfPanels; // Rate per 575W panel
        
        // 2. Inverter (8000 rs per kwp)
        const inverterPrice = 8000 * capacity;
        
        // 3. Structure calculation
        let structurePrice = 0;
        if (structureType === 'standard') {
            structurePrice = 18000;
        } else {
            structurePrice = 18000 + (legsCount * 1000); // 18000 + 1000 per leg
        }
        
        // 4. BOS price (8000 rs for standard and 5000 rs extra per floor beyond G+2)
        let bosPrice = 8000;
        if (floors > 2) {
            bosPrice += (floors - 2) * 5000;
        }
        
        // 5. Installation charges (fixed)
        const installationPrice = 10000;
        
        // 6. Civil work for legs (2000rs per kwp)
        const civilWorkPrice = 2000 * capacity;
        
        // 7. Net metering assistance (2200 rs per kwp)
        const netMeteringPrice = 2200 * capacity;
        
        // 8. Wiring (fixed cost)
        const wiringPrice = 10000;
        
        // 9. Transportation (fixed cost)
        const transportationPrice = 5000;
        
        // Calculate subtotal
        const subtotal = solarPanelsPrice + inverterPrice + structurePrice + bosPrice + 
                        installationPrice + civilWorkPrice + netMeteringPrice + wiringPrice + transportationPrice;
        
        // Calculate profit margin
        const profitMarginRate = parseFloat(customProfitMarginInput.value);
        const validProfitMarginRate = isNaN(profitMarginRate) ? 20 : profitMarginRate;
        const profitMargin = subtotal * (validProfitMarginRate / 100);
        const finalPrice = subtotal + profitMargin;
        
        // Calculate GST
        const gstRate = parseFloat(gstRateInput.value);
        const validGstRate = isNaN(gstRate) ? 5 : gstRate;
        const gstAmount = finalPrice * (validGstRate / 100);
        const finalPriceWithGst = finalPrice + gstAmount;
        
        
        // Update GST display
        gstAmountEl.textContent = formatToRupees(gstAmount);
        finalPriceWithGstEl.textContent = formatToRupees(finalPriceWithGst);
        
        
        // Update display
        panelCountEl.textContent = numberOfPanels;
        solarPanelsPriceEl.textContent = formatToRupees(solarPanelsPrice);
        inverterPriceEl.textContent = formatToRupees(inverterPrice);
        structurePriceEl.textContent = formatToRupees(structurePrice);
        bosPriceEl.textContent = formatToRupees(bosPrice);
        installationPriceEl.textContent = formatToRupees(installationPrice);
        civilWorkPriceEl.textContent = formatToRupees(civilWorkPrice);
        netMeteringPriceEl.textContent = formatToRupees(netMeteringPrice);
        wiringPriceEl.textContent = formatToRupees(wiringPrice);
        transportationPriceEl.textContent = formatToRupees(transportationPrice);
        subtotalPriceEl.textContent = formatToRupees(subtotal);
        
        // Update profit margin display with percentage
        profitMarginEl.previousElementSibling.textContent = `Profit Margin (${validProfitMarginRate}%)`;
        profitMarginEl.textContent = formatToRupees(profitMargin);
        
        finalPriceEl.textContent = formatToRupees(finalPrice);
        
    }
    
    // Event listeners for customer type
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
    
    // Event listeners for structure type
    standardStructureBtn.addEventListener('click', () => {
        structureType = 'standard';
        standardStructureBtn.classList.add('active');
        customStructureBtn.classList.remove('active');
        legsInputGroup.style.display = 'none';
        legsCountInput.value = 0;
        calculatePricing();
    });
    
    customStructureBtn.addEventListener('click', () => {
        structureType = 'custom';
        customStructureBtn.classList.add('active');
        standardStructureBtn.classList.remove('active');
        legsInputGroup.style.display = 'block';
        calculatePricing();
    });
    
    // Event listeners for input changes
    [solarCapacityInput, legsCountInput, buildingFloorsInput, customProfitMarginInput, gstRateInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculatePricing);
        }
    });
    
    // Initialize calculation
    if (solarCapacityInput) calculatePricing();
    
    // Test function to verify GST calculation
    window.testGST = function() {
        console.log('Testing GST calculation...');
        console.log('GST Rate Input:', gstRateInput);
        console.log('GST Rate Value:', gstRateInput ? gstRateInput.value : 'NOT FOUND');
        console.log('GST Amount Element:', gstAmountEl);
        console.log('Final Price with GST Element:', finalPriceWithGstEl);
        
        // Set a test GST rate
        if (gstRateInput) {
            gstRateInput.value = 18;
            calculatePricing();
            console.log('GST Amount after setting 18%:', gstAmountEl.textContent);
        }
    };
});