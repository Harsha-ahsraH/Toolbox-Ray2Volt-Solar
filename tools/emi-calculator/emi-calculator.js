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
            if (document.getElementById('printCalcMode')) document.getElementById('printCalcMode').textContent = 'Calculate EMI';
        } else if (calcMode === 'tenure') {
            fixedEmiGroup.style.display = 'block';
            calculatedResultRow.style.display = 'none';
            tenureResultRow.style.display = 'flex';
            tenureGroup?.classList.add('input-disabled');
            calcModeHelp.textContent = 'Fix your EMI to calculate required tenure';
            if (document.getElementById('printCalcMode')) document.getElementById('printCalcMode').textContent = 'Calculate Tenure';
        } else if (calcMode === 'rate') {
            fixedEmiGroup.style.display = 'block';
            calculatedResultRow.style.display = 'none';
            rateResultRow.style.display = 'flex';
            interestRateGroup?.classList.add('input-disabled');
            calcModeHelp.textContent = 'Fix your EMI to calculate required interest rate';
            if (document.getElementById('printCalcMode')) document.getElementById('printCalcMode').textContent = 'Calculate Interest Rate';
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

    // The gap between the two arcs is the card showing through, so it has to
    // be read from the theme rather than assumed to be white.
    function cardColour() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-card').trim() || '#FFFFFF';
    }

    function updateEMIChart(principal, interest) {
        if (!emiChartCtx) return;
        const data = { labels: ['Principal Amount', 'Total Interest'], datasets: [{ data: [principal, interest], backgroundColor: ['#1F4E79', '#D97706'], borderColor: cardColour(), borderWidth: 3 }] };
        if (emiChart) { emiChart.data = data; emiChart.update(); }
        else { emiChart = new Chart(emiChartCtx, { type: 'doughnut', data: data, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, cutout: '65%' } }); }
    }

    if (window.Ray2VoltTheme) {
        window.Ray2VoltTheme.onChange(() => {
            if (!emiChart) return;
            emiChart.data.datasets[0].borderColor = cardColour();
            emiChart.update();
        });
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
            reducingBalanceBtn.addEventListener('click', () => { 
                emiMethod = 'reducing'; 
                reducingBalanceBtn.classList.add('active'); 
                flatRateBtn.classList.remove('active'); 
                if (document.getElementById('printInterestMethod')) document.getElementById('printInterestMethod').textContent = 'Reducing Balance';
                performEMICalculation(); 
            });
            flatRateBtn.addEventListener('click', () => { 
                emiMethod = 'flat'; 
                flatRateBtn.classList.add('active'); 
                reducingBalanceBtn.classList.remove('active'); 
                if (document.getElementById('printInterestMethod')) document.getElementById('printInterestMethod').textContent = 'Flat Rate';
                performEMICalculation(); 
            });
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
        
        // --- REPORT & PDF EXPORT LOGIC ---
        let reportChartInstance = null;

        function renderEmiReport() {
            const reportContainer = document.getElementById('emiReportContainer');
            if (!reportContainer) return;

            const P = parseFloat(loanAmountInput.value) || 0;
            let annualRate = parseFloat(interestRateInput.value) || 0;
            let N = parseInt(loanTenureInput.value) || 0;
            const fixedEMI = parseFloat(fixedEMIInput?.value) || 0;

            let emi = 0;
            let totalPayment = 0;
            let totalInterest = 0;

            if (calcMode === 'emi') {
                const r = (annualRate / 100) / 12;
                if (emiMethod === 'reducing') {
                    emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
                    totalPayment = emi * N;
                    totalInterest = totalPayment - P;
                } else {
                    totalInterest = P * (annualRate / 100) * (N / 12);
                    totalPayment = P + totalInterest;
                    emi = totalPayment / N;
                }
            } else if (calcMode === 'tenure') {
                emi = fixedEMI;
                if (emiMethod === 'reducing') {
                    const r = (annualRate / 100) / 12;
                    N = Math.ceil(Math.log(emi / (emi - P * r)) / Math.log(1 + r));
                    totalPayment = emi * N;
                    totalInterest = totalPayment - P;
                } else {
                    const monthlyRate = (annualRate / 100) / 12;
                    N = Math.ceil(P / (emi - P * monthlyRate));
                    totalPayment = emi * N;
                    totalInterest = totalPayment - P;
                }
            } else if (calcMode === 'rate') {
                emi = fixedEMI;
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
                    totalPayment = emi * N;
                    totalInterest = totalPayment - P;
                }
            }

            if (isNaN(P) || P <= 0 || isNaN(emi) || emi <= 0 || !isFinite(emi)) {
                reportContainer.innerHTML = '<div class="emi-report-page"><p style="padding: 2rem; color: #555;">Please enter valid loan parameters to generate the report.</p></div>';
                return;
            }

            const years = Math.floor(N / 12);
            const remMonths = N % 12;
            const principalPct = totalPayment > 0 ? ((P / totalPayment) * 100).toFixed(1) : '0.0';
            const interestPct = totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(1) : '0.0';
            const costOfFinancePct = P > 0 ? ((totalInterest / P) * 100).toFixed(1) : '0.0';

            const currentDateStr = new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            // Calculate Annual Schedule
            const annualRows = [];
            let balance = P;
            const monthlyRate = (annualRate / 100) / 12;
            const totalYears = Math.ceil(N / 12);
            let cumPrincipal = 0;
            let cumInterest = 0;

            for (let y = 1; y <= totalYears; y++) {
                const startMonth = (y - 1) * 12 + 1;
                const endMonth = Math.min(y * 12, N);
                const begBal = balance;
                let yrPrincipal = 0;
                let yrInterest = 0;
                let yrEmi = 0;

                for (let m = startMonth; m <= endMonth; m++) {
                    let intPaid, prinPaid;
                    if (emiMethod === 'reducing') {
                        intPaid = balance * monthlyRate;
                        prinPaid = emi - intPaid;
                        balance -= prinPaid;
                        if (m === N || balance < 0) balance = 0;
                    } else {
                        intPaid = totalInterest / N;
                        prinPaid = P / N;
                        balance -= prinPaid;
                        if (m === N || balance < 0) balance = 0;
                    }
                    yrPrincipal += prinPaid;
                    yrInterest += intPaid;
                    yrEmi += (prinPaid + intPaid);
                }
                cumPrincipal += yrPrincipal;
                cumInterest += yrInterest;
                annualRows.push({
                    year: `Year ${y}`,
                    begBal: begBal,
                    principal: yrPrincipal,
                    interest: yrInterest,
                    totalEmi: yrEmi,
                    endBal: Math.max(0, balance)
                });
            }

            const includeMonthly = document.getElementById('includeMonthlyScheduleToggle')?.checked || false;

            // Calculate monthly schedule if requested
            let monthlyPagesHtml = '';
            let totalPages = 1;
            const rowsPerPage = 32;

            if (includeMonthly) {
                const totalMonthlyPages = Math.ceil(N / rowsPerPage);
                totalPages = 1 + totalMonthlyPages;

                let mBalance = P;
                let currentMonth = 1;

                for (let pIndex = 0; pIndex < totalMonthlyPages; pIndex++) {
                    const pageNum = pIndex + 2;
                    let pageRowsHtml = '';
                    const startM = currentMonth;
                    const endM = Math.min(startM + rowsPerPage - 1, N);

                    for (let m = startM; m <= endM; m++) {
                        let mInterest, mPrincipal;
                        if (emiMethod === 'reducing') {
                            mInterest = mBalance * monthlyRate;
                            mPrincipal = emi - mInterest;
                            mBalance -= mPrincipal;
                            if (m === N || mBalance < 0) mBalance = 0;
                        } else {
                            mInterest = totalInterest / N;
                            mPrincipal = P / N;
                            mBalance -= mPrincipal;
                            if (m === N || mBalance < 0) mBalance = 0;
                        }

                        pageRowsHtml += `<tr>
                            <td>Month ${m}</td>
                            <td>${formatToRupees(mPrincipal)}</td>
                            <td>${formatToRupees(mInterest)}</td>
                            <td>${formatToRupees(emi)}</td>
                            <td>${formatToRupees(mBalance)}</td>
                        </tr>`;
                    }
                    currentMonth = endM + 1;

                    monthlyPagesHtml += `
                    <div class="emi-report-page emi-report-monthly-page">
                        <div class="emi-report-header">
                            <div class="emi-report-title-section">
                                <span class="emi-report-kicker">RAY2VOLT SOLAR</span>
                                <h1>DETAILED AMORTIZATION SCHEDULE</h1>
                                <p class="emi-report-subtitle">Monthly Principal, Interest &amp; Outstanding Balance Breakdown</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="emi-report-logo">
                        </div>
                        <div class="emi-report-table-section">
                            <div class="emi-report-table-wrap">
                                <table class="emi-report-monthly-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Principal Paid</th>
                                            <th>Interest Paid</th>
                                            <th>EMI Amount</th>
                                            <th>Remaining Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pageRowsHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="emi-report-footer">
                            <span>Ray2Volt Solar Private Limited • Solar Financing Report • Confidential</span>
                            <span>Generated: ${currentDateStr}</span>
                            <span class="emi-report-footer-right">Page ${pageNum} of ${totalPages}</span>
                        </div>
                    </div>`;
                }
            }

            const annualRowsHtml = annualRows.map(r => `
                <tr>
                    <td>${r.year}</td>
                    <td>${formatToRupees(r.begBal)}</td>
                    <td>${formatToRupees(r.principal)}</td>
                    <td>${formatToRupees(r.interest)}</td>
                    <td>${formatToRupees(r.totalEmi)}</td>
                    <td>${formatToRupees(r.endBal)}</td>
                </tr>
            `).join('');

            let calcModeLabel = 'Monthly EMI Calculation';
            if (calcMode === 'tenure') calcModeLabel = 'Loan Tenure Calculation';
            if (calcMode === 'rate') calcModeLabel = 'Interest Rate Calculation';

            const page1Html = `
            <div class="emi-report-page" id="emiReportPage1">
                <!-- Header (matches Quote Generator .qp-header) -->
                <div class="emi-report-header">
                    <div class="emi-report-title-section">
                        <span class="emi-report-kicker">RAY2VOLT SOLAR</span>
                        <h1>SOLAR FINANCING &amp; EMI REPORT</h1>
                        <p class="emi-report-subtitle">Equated Monthly Installment &amp; Loan Amortization Analysis</p>
                    </div>
                    <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="emi-report-logo">
                </div>

                <!-- 4-Pillar KPI Highlight Band -->
                <div class="emi-report-kpis">
                    <div class="emi-report-kpi-item">
                        <span class="emi-report-kpi-label">MONTHLY EMI</span>
                        <span class="emi-report-kpi-value">${formatToRupees(emi)}</span>
                        <span class="emi-report-kpi-sub">${emiMethod === 'reducing' ? 'Reducing Balance' : 'Flat Rate'}</span>
                    </div>
                    <div class="emi-report-kpi-item">
                        <span class="emi-report-kpi-label">LOAN PRINCIPAL</span>
                        <span class="emi-report-kpi-value">${formatToRupees(P)}</span>
                        <span class="emi-report-kpi-sub">Annual Rate: ${annualRate.toFixed(2)}% p.a.</span>
                    </div>
                    <div class="emi-report-kpi-item">
                        <span class="emi-report-kpi-label">TOTAL INTEREST</span>
                        <span class="emi-report-kpi-value emi-val-amber">${formatToRupees(totalInterest)}</span>
                        <span class="emi-report-kpi-sub">${interestPct}% of total payment</span>
                    </div>
                    <div class="emi-report-kpi-item">
                        <span class="emi-report-kpi-label">TOTAL PAYABLE</span>
                        <span class="emi-report-kpi-value">${formatToRupees(totalPayment)}</span>
                        <span class="emi-report-kpi-sub">${N} months (${years > 0 ? years + 'y ' : ''}${remMonths > 0 ? remMonths + 'm' : ''})</span>
                    </div>
                </div>

                <!-- 2-Column Overview & Enhanced Graph -->
                <div class="emi-report-overview-grid">
                    <div class="emi-report-card">
                        <h4 class="emi-report-card-title">Loan Parameters &amp; Financing Overview</h4>
                        <table class="emi-report-param-table">
                            <tbody>
                                <tr>
                                    <td class="emi-report-param-label">Calculation Mode</td>
                                    <td class="emi-report-param-val">${calcModeLabel}</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Interest Method</td>
                                    <td class="emi-report-param-val">${emiMethod === 'reducing' ? 'Reducing Balance Method' : 'Flat Rate Method'}</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Loan Amount (Principal)</td>
                                    <td class="emi-report-param-val">${formatToRupees(P)}</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Annual Interest Rate</td>
                                    <td class="emi-report-param-val">${annualRate.toFixed(2)}% p.a.</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Loan Tenure</td>
                                    <td class="emi-report-param-val">${N} Months (${years}y ${remMonths > 0 ? remMonths + 'm' : ''})</td>
                                </tr>
                                <tr class="emi-row-highlight">
                                    <td class="emi-report-param-label">Equated Monthly Installment (EMI)</td>
                                    <td class="emi-report-param-val">${formatToRupees(emi)}</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Total Interest Outflow</td>
                                    <td class="emi-report-param-val" style="color: var(--qp-amber);">${formatToRupees(totalInterest)}</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Total Repayment Outlay (P + I)</td>
                                    <td class="emi-report-param-val">${formatToRupees(totalPayment)}</td>
                                </tr>
                                <tr>
                                    <td class="emi-report-param-label">Effective Cost of Financing</td>
                                    <td class="emi-report-param-val">${costOfFinancePct}% of Principal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="emi-report-card emi-report-graph-box">
                        <h4 class="emi-report-card-title" style="width: 100%;">Capital Structure &amp; Outlay Breakdown</h4>
                        <div class="emi-report-canvas-wrap">
                            <canvas id="emiReportChartCanvas" width="140" height="140"></canvas>
                            <div class="emi-report-chart-center">
                                <span class="emi-report-center-label">MONTHLY EMI</span>
                                <span class="emi-report-center-val">${formatToRupees(emi).replace('.00', '')}</span>
                            </div>
                        </div>
                        <div class="emi-report-legend">
                            <div class="emi-report-legend-row">
                                <span class="emi-legend-pill">
                                    <span class="emi-legend-dot emi-dot-navy"></span>
                                    Principal (${principalPct}%)
                                </span>
                                <span class="emi-legend-amount">${formatToRupees(P)}</span>
                            </div>
                            <div class="emi-report-legend-row">
                                <span class="emi-legend-pill">
                                    <span class="emi-legend-dot emi-dot-amber"></span>
                                    Total Interest (${interestPct}%)
                                </span>
                                <span class="emi-legend-amount" style="color: var(--qp-amber);">${formatToRupees(totalInterest)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Annual Amortization Table Section -->
                <div class="emi-report-card emi-report-table-section">
                    <h4 class="emi-report-card-title">Annual Amortization Schedule (Year-by-Year Summary)</h4>
                    <div class="emi-report-table-wrap">
                        <table class="emi-report-table">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Opening Balance</th>
                                    <th>Principal Paid</th>
                                    <th>Interest Paid</th>
                                    <th>Total Annual EMI</th>
                                    <th>Closing Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${annualRowsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td>Lifetime Total</td>
                                    <td>${formatToRupees(P)}</td>
                                    <td>${formatToRupees(cumPrincipal)}</td>
                                    <td>${formatToRupees(cumInterest)}</td>
                                    <td>${formatToRupees(cumPrincipal + cumInterest)}</td>
                                    <td>₹0.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Running Footer -->
                <div class="emi-report-footer">
                    <span>Ray2Volt Solar Private Limited • Solar Financing Report • Confidential</span>
                    <span>Generated: ${currentDateStr}</span>
                    <span class="emi-report-footer-right">Page 1 of ${totalPages}</span>
                </div>
            </div>`;

            reportContainer.innerHTML = page1Html + monthlyPagesHtml;

            // Render dedicated Report Chart
            const reportCanvas = document.getElementById('emiReportChartCanvas');
            if (reportCanvas) {
                if (reportChartInstance) {
                    reportChartInstance.destroy();
                    reportChartInstance = null;
                }
                const rCtx = reportCanvas.getContext('2d');
                reportChartInstance = new Chart(rCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Principal', 'Interest'],
                        datasets: [{
                            data: [P, totalInterest],
                            backgroundColor: ['#1F4E79', '#D97706'],
                            borderColor: '#FFFFFF',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: true,
                        animation: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        cutout: '62%'
                    }
                });
            }
        }

        // Modal event handlers
        const reportModal = document.getElementById('emiReportModalOverlay');
        const previewBtn = document.getElementById('previewEmiReportBtn');
        const closeBtn = document.getElementById('closeEmiModalBtn');
        const printFromModal = document.getElementById('printFromModalBtn');
        const monthlyToggle = document.getElementById('includeMonthlyScheduleToggle');

        function openReportModal() {
            renderEmiReport();
            if (reportModal) {
                reportModal.classList.add('active');
                reportModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeReportModal() {
            if (reportModal) {
                reportModal.classList.remove('active');
                reportModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        }

        if (previewBtn) previewBtn.addEventListener('click', openReportModal);
        if (closeBtn) closeBtn.addEventListener('click', closeReportModal);
        if (monthlyToggle) monthlyToggle.addEventListener('change', renderEmiReport);

        if (reportModal) {
            reportModal.addEventListener('click', (e) => {
                if (e.target === reportModal) closeReportModal();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && reportModal.classList.contains('active')) {
                    closeReportModal();
                }
            });
        }

        if (printFromModal) {
            printFromModal.addEventListener('click', () => {
                window.print();
            });
        }

        const printEmiBtn = document.getElementById('printEmiBtn');
        if (printEmiBtn) {
            printEmiBtn.addEventListener('click', () => {
                renderEmiReport();
                window.print();
            });
        }

    }
});
