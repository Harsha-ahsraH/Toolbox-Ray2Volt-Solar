/**
 * EMI Calculator Script for Ray2Volt Toolbox
 */
document.addEventListener('DOMContentLoaded', () => {
    // HELPER: Format to Rupees
    const formatToRupees = (num) => {
        if (typeof num !== 'number' || !isFinite(num)) { num = 0; }
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
    };

    // --- EMI CALCULATOR LOGIC ---
    const loanAmountInput = document.getElementById('loanAmount');
    const loanAmountSlider = document.getElementById('loanAmountSlider');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateSlider = document.getElementById('interestRateSlider');
    const loanTenureInput = document.getElementById('loanTenure');
    const loanTenureSlider = document.getElementById('loanTenureSlider');
    const fixedEMIInput = document.getElementById('fixedEMI');
    const fixedEmiGroup = document.getElementById('fixedEmiGroup');
    const calculatedResultLabel = document.getElementById('calculatedResultLabel');
    const calculatedResultValue = document.getElementById('calculatedResultValue');
    const calculatedResultRow = document.getElementById('calculatedResultRow');
    const tenureResultRow = document.getElementById('tenureResultRow');
    const rateResultRow = document.getElementById('rateResultRow');
    const calculatedTenureEl = document.getElementById('calculatedTenure');
    const calculatedRateEl = document.getElementById('calculatedRate');
    const totalInterestEl = document.getElementById('totalInterest');
    const totalPaymentEl = document.getElementById('totalPayment');
    const amortizationBody = document.getElementById('amortizationBody');
    const emiChartCtx = document.getElementById('emiChart')?.getContext('2d');
    const reducingBalanceBtn = document.getElementById('reducingBalanceBtn');
    const flatRateBtn = document.getElementById('flatRateBtn');
    const calcEmiBtn = document.getElementById('calcEmiBtn');
    const calcTenureBtn = document.getElementById('calcTenureBtn');
    const calcRateBtn = document.getElementById('calcRateBtn');
    const calcModeHelp = document.getElementById('calcModeHelp');
    const interestRateGroup = interestRateInput?.closest('.input-group');
    const tenureGroup = loanTenureInput?.closest('.input-group');

    let emiChart;
    let emiMethod = 'reducing';
    let calcMode = 'emi';

    // Display value elements
    const loanAmountDisplay = document.getElementById('loanAmountDisplay');
    const interestRateDisplay = document.getElementById('interestRateDisplay');
    const loanTenureDisplay = document.getElementById('loanTenureDisplay');

    function updateDisplayValues() {
        if (loanAmountDisplay) {
            loanAmountDisplay.textContent = formatToRupees(parseFloat(loanAmountInput.value) || 0).replace('.00', '');
        }
        if (interestRateDisplay) {
            interestRateDisplay.textContent = (parseFloat(interestRateInput.value) || 0) + '%';
        }
        if (loanTenureDisplay) {
            const months = parseInt(loanTenureInput.value) || 0;
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            if (years > 0 && remainingMonths > 0) {
                loanTenureDisplay.textContent = `${years}y ${remainingMonths}m`;
            } else if (years > 0) {
                loanTenureDisplay.textContent = `${years} years`;
            } else {
                loanTenureDisplay.textContent = `${months} months`;
            }
        }
    }

    function syncInputs(input, slider) { slider.value = input.value; updateDisplayValues(); performEMICalculation(); }
    function syncSliders(slider, input) { input.value = slider.value; updateDisplayValues(); performEMICalculation(); }

    function updateCalcModeUI() {
        if (!fixedEmiGroup) return;
        fixedEmiGroup.style.display = 'none';
        calculatedResultRow.style.display = 'flex';
        tenureResultRow.style.display = 'none';
        rateResultRow.style.display = 'none';
        interestRateGroup?.classList.remove('input-disabled');
        tenureGroup?.classList.remove('input-disabled');

        if (calcMode === 'emi') {
            calculatedResultLabel.textContent = 'Monthly EMI';
            calcModeHelp.textContent = 'Enter loan details to calculate EMI';
        } else if (calcMode === 'tenure') {
            fixedEmiGroup.style.display = 'block';
            calculatedResultRow.style.display = 'none';
            tenureResultRow.style.display = 'flex';
            tenureGroup?.classList.add('input-disabled');
            calcModeHelp.textContent = 'Fix your EMI to calculate required tenure';
        } else if (calcMode === 'rate') {
            fixedEmiGroup.style.display = 'block';
            calculatedResultRow.style.display = 'none';
            rateResultRow.style.display = 'flex';
            interestRateGroup?.classList.add('input-disabled');
            calcModeHelp.textContent = 'Fix your EMI to calculate required interest rate';
        }
        performEMICalculation();
    }

    function performEMICalculation() {
        if (!loanAmountInput) return;
        const P = parseFloat(loanAmountInput.value);
        let annualRate = parseFloat(interestRateInput.value);
        let N = parseInt(loanTenureInput.value);
        const fixedEMI = parseFloat(fixedEMIInput?.value) || 0;

        if (isNaN(P) || P <= 0) { resetEMIOutputs(); return; }

        let emi, totalPayment, totalInterest;

        if (calcMode === 'emi') {
            if (isNaN(annualRate) || isNaN(N) || annualRate <= 0 || N <= 0) { resetEMIOutputs(); return; }
            const r = (annualRate / 100) / 12;
            if (emiMethod === 'reducing') {
                emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
                if (!isFinite(emi)) { resetEMIOutputs(); return; }
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            } else {
                const tenureInYears = N / 12;
                totalInterest = P * (annualRate / 100) * tenureInYears;
                totalPayment = P + totalInterest;
                emi = totalPayment / N;
            }
            calculatedResultValue.textContent = formatToRupees(emi);
        } else if (calcMode === 'tenure') {
            if (isNaN(annualRate) || annualRate <= 0 || fixedEMI <= 0) { resetEMIOutputs(); calculatedTenureEl.textContent = 'Invalid inputs'; return; }
            emi = fixedEMI;
            if (emiMethod === 'reducing') {
                const r = (annualRate / 100) / 12;
                const minEMI = P * r;
                if (emi <= minEMI) { calculatedTenureEl.textContent = 'EMI too low'; totalInterestEl.textContent = '∞'; totalPaymentEl.textContent = '∞'; return; }
                N = Math.log(emi / (emi - P * r)) / Math.log(1 + r);
                N = Math.ceil(N);
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            } else {
                const monthlyInterestRate = (annualRate / 100) / 12;
                N = P / (emi - P * monthlyInterestRate);
                if (N <= 0 || !isFinite(N)) { calculatedTenureEl.textContent = 'EMI too low'; return; }
                N = Math.ceil(N);
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            }
            loanTenureInput.value = N;
            loanTenureSlider.value = Math.min(N, parseInt(loanTenureSlider.max));
            const years = Math.floor(N / 12), months = N % 12;
            let tenureText = '';
            if (years > 0) tenureText += `${years} year${years > 1 ? 's' : ''}`;
            if (months > 0) tenureText += ` ${months} month${months > 1 ? 's' : ''}`;
            if (!tenureText) tenureText = `${N} months`;
            calculatedTenureEl.textContent = `${N} months (${tenureText.trim()})`;
        } else if (calcMode === 'rate') {
            if (isNaN(N) || N <= 0 || fixedEMI <= 0) { resetEMIOutputs(); calculatedRateEl.textContent = 'Invalid inputs'; return; }
            emi = fixedEMI;
            if (emi * N < P) { calculatedRateEl.textContent = 'EMI too low for tenure'; totalInterestEl.textContent = 'N/A'; totalPaymentEl.textContent = 'N/A'; return; }
            if (emiMethod === 'reducing') {
                let r = 0.01;
                for (let iter = 0; iter < 100; iter++) {
                    const pow = Math.pow(1 + r, N);
                    const f = P * r * pow / (pow - 1) - emi;
                    const dfNum = P * pow * (pow - 1 - N * r);
                    const dfDen = (pow - 1) * (pow - 1);
                    const df = dfNum / dfDen;
                    if (Math.abs(df) < 1e-10) break;
                    const newR = r - f / df;
                    if (Math.abs(newR - r) < 1e-10) { r = newR; break; }
                    r = newR;
                    if (r <= 0) r = 0.001;
                    if (r > 0.5) r = 0.5;
                }
                annualRate = r * 12 * 100;
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            } else {
                annualRate = (emi * N - P) * 12 / (P * N) * 100;
                if (annualRate < 0) { calculatedRateEl.textContent = 'EMI higher than needed'; annualRate = 0; }
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            }
            interestRateInput.value = annualRate.toFixed(2);
            interestRateSlider.value = Math.min(annualRate, parseFloat(interestRateSlider.max));
            calculatedRateEl.textContent = `${annualRate.toFixed(2)}% per annum`;
        }

        totalInterestEl.textContent = formatToRupees(totalInterest);
        totalPaymentEl.textContent = formatToRupees(totalPayment);
        const r = (annualRate / 100) / 12;
        updateEMIChart(P, totalInterest);
        generateAmortizationSchedule(P, emi, r, N);
    }

    function resetEMIOutputs() {
        if (calculatedResultValue) calculatedResultValue.textContent = formatToRupees(0);
        if (totalInterestEl) totalInterestEl.textContent = formatToRupees(0);
        if (totalPaymentEl) totalPaymentEl.textContent = formatToRupees(0);
        if (amortizationBody) amortizationBody.innerHTML = '';
        if (emiChart) { emiChart.destroy(); emiChart = null; }
    }

    function updateEMIChart(principal, interest) {
        if (!emiChartCtx) return;
        const data = { labels: ['Principal Amount', 'Total Interest'], datasets: [{ data: [principal, interest], backgroundColor: ['#06B6D4', '#FBBF24'], borderColor: '#FFFFFF', borderWidth: 3 }] };
        if (emiChart) { emiChart.data = data; emiChart.update(); }
        else { emiChart = new Chart(emiChartCtx, { type: 'doughnut', data: data, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, cutout: '65%' } }); }
    }

    function generateAmortizationSchedule(principal, emi, monthlyRate, tenure) {
        if (!amortizationBody) return;
        amortizationBody.innerHTML = '';
        let balance = principal;
        const maxRows = 360;
        const displayTenure = Math.min(tenure, maxRows);

        if (emiMethod === 'reducing') {
            for (let i = 1; i <= displayTenure; i++) {
                const interestPaid = balance * monthlyRate;
                const principalPaid = emi - interestPaid;
                balance -= principalPaid;
                if (i === tenure || balance < 0) balance = 0;
                const row = `<tr><td>${i}</td><td>${formatToRupees(principalPaid)}</td><td>${formatToRupees(interestPaid)}</td><td>${formatToRupees(emi)}</td><td>${formatToRupees(balance)}</td></tr>`;
                amortizationBody.insertAdjacentHTML('beforeend', row);
            }
        } else {
            const totalInterest = emi * tenure - principal;
            const monthlyInterest = totalInterest / tenure;
            const monthlyPrincipal = principal / tenure;
            for (let i = 1; i <= displayTenure; i++) {
                balance -= monthlyPrincipal;
                if (i === tenure || balance < 0) balance = 0;
                const row = `<tr><td>${i}</td><td>${formatToRupees(monthlyPrincipal)}</td><td>${formatToRupees(monthlyInterest)}</td><td>${formatToRupees(emi)}</td><td>${formatToRupees(balance)}</td></tr>`;
                amortizationBody.insertAdjacentHTML('beforeend', row);
            }
        }
        if (tenure > maxRows) {
            const row = `<tr><td colspan="5" style="text-align:center; color: var(--secondary-color);">... showing first ${maxRows} of ${tenure} months ...</td></tr>`;
            amortizationBody.insertAdjacentHTML('beforeend', row);
        }
    }

    if (loanAmountInput) {
        loanAmountInput.addEventListener('input', () => syncInputs(loanAmountInput, loanAmountSlider));
        loanAmountSlider.addEventListener('input', () => syncSliders(loanAmountSlider, loanAmountInput));
        interestRateInput.addEventListener('input', () => syncInputs(interestRateInput, interestRateSlider));
        interestRateSlider.addEventListener('input', () => syncSliders(interestRateSlider, interestRateInput));
        loanTenureInput.addEventListener('input', () => syncInputs(loanTenureInput, loanTenureSlider));
        loanTenureSlider.addEventListener('input', () => syncSliders(loanTenureSlider, loanTenureInput));
        if (fixedEMIInput) fixedEMIInput.addEventListener('input', performEMICalculation);
        if (reducingBalanceBtn && flatRateBtn) {
            reducingBalanceBtn.addEventListener('click', () => { emiMethod = 'reducing'; reducingBalanceBtn.classList.add('active'); flatRateBtn.classList.remove('active'); performEMICalculation(); });
            flatRateBtn.addEventListener('click', () => { emiMethod = 'flat'; flatRateBtn.classList.add('active'); reducingBalanceBtn.classList.remove('active'); performEMICalculation(); });
        }
        if (calcEmiBtn && calcTenureBtn && calcRateBtn) {
            const setActiveCalcMode = (mode, activeBtn) => {
                calcMode = mode;
                [calcEmiBtn, calcTenureBtn, calcRateBtn].forEach(btn => btn.classList.remove('active'));
                activeBtn.classList.add('active');
                updateCalcModeUI();
            };
            calcEmiBtn.addEventListener('click', () => setActiveCalcMode('emi', calcEmiBtn));
            calcTenureBtn.addEventListener('click', () => setActiveCalcMode('tenure', calcTenureBtn));
            calcRateBtn.addEventListener('click', () => setActiveCalcMode('rate', calcRateBtn));
        }
        updateDisplayValues();
        performEMICalculation();
    }
});
