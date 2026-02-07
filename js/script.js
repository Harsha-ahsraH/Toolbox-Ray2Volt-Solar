document.addEventListener('DOMContentLoaded', () => {
    // --- RESPONSIVE SIDEBAR NAVIGATION ---
    const sidebar = document.querySelector('.sidebar');
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-link, .tool-card');
    const contentSections = document.querySelectorAll('.content-section');

    // --- PASSWORD PROTECTION ---
    const ADMIN_PASSWORD = 'Admin@Ray2Volt';
    const PROTECTED_SECTIONS = ['receipt-generator-section', 'invoice-generator-section', 'payslip-generator-section'];
    const passwordModal = document.getElementById('passwordModalOverlay');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
    const passwordCancelBtn = document.getElementById('passwordCancelBtn');
    let pendingTargetId = null;

    // Check if section is unlocked (using sessionStorage for session-based access)
    const isSectionUnlocked = (sectionId) => {
        return sessionStorage.getItem(`unlocked_${sectionId}`) === 'true';
    };

    // Unlock a section
    const unlockSection = (sectionId) => {
        sessionStorage.setItem(`unlocked_${sectionId}`, 'true');
    };

    // Show password modal
    const showPasswordModal = (targetId) => {
        pendingTargetId = targetId;
        passwordModal.classList.add('active');
        passwordInput.value = '';
        passwordInput.classList.remove('error');
        passwordError.classList.remove('visible');
        passwordInput.focus();
        document.body.classList.add('no-scroll');
    };

    // Hide password modal
    const hidePasswordModal = () => {
        passwordModal.classList.remove('active');
        passwordInput.value = '';
        passwordInput.classList.remove('error');
        passwordError.classList.remove('visible');
        pendingTargetId = null;
        document.body.classList.remove('no-scroll');
    };

    // Handle password submission
    const handlePasswordSubmit = () => {
        const enteredPassword = passwordInput.value;
        if (enteredPassword === ADMIN_PASSWORD) {
            // Save the target before hiding modal (hidePasswordModal clears pendingTargetId)
            const targetId = pendingTargetId;
            // Unlock the section
            unlockSection(targetId);
            hidePasswordModal();
            // Navigate to the section
            navigateToSection(targetId);
        } else {
            // Show error
            passwordInput.classList.add('error');
            passwordError.classList.add('visible');
            passwordInput.value = '';
            passwordInput.focus();

            // Remove shake animation after it completes
            setTimeout(() => {
                passwordInput.classList.remove('error');
            }, 400);
        }
    };

    // Password modal event listeners
    if (passwordSubmitBtn) {
        passwordSubmitBtn.addEventListener('click', handlePasswordSubmit);
    }

    if (passwordCancelBtn) {
        passwordCancelBtn.addEventListener('click', hidePasswordModal);
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handlePasswordSubmit();
            } else if (e.key === 'Escape') {
                hidePasswordModal();
            }
        });
    }

    // Close modal when clicking outside
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                hidePasswordModal();
            }
        });
    }

    const openSidebar = () => {
        sidebar.classList.add('is-open');
        overlay.classList.add('is-active');
        document.body.classList.add('no-scroll');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('is-open');
        overlay.classList.remove('is-active');
        document.body.classList.remove('no-scroll');
    };

    if (mobileNavToggle && sidebar && sidebarCloseBtn && overlay) {
        mobileNavToggle.addEventListener('click', openSidebar);
        sidebarCloseBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
    }

    // --- SECTION NAVIGATION FUNCTION ---
    const navigateToSection = (targetId) => {
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

        // Close sidebar on link click in mobile view
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    };

    // --- SECTION SWITCHING LOGIC ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;

            // Check if this is a protected section
            if (PROTECTED_SECTIONS.includes(targetId)) {
                // Check if already unlocked
                if (!isSectionUnlocked(targetId)) {
                    // Show password modal
                    showPasswordModal(targetId);
                    return;
                }
            }

            // Navigate to section
            navigateToSection(targetId);
        });
    });


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
    let emiMethod = 'reducing'; // 'reducing' or 'flat'
    let calcMode = 'emi'; // 'emi', 'tenure', or 'rate'

    function syncInputs(input, slider) { slider.value = input.value; performEMICalculation(); }
    function syncSliders(slider, input) { input.value = slider.value; performEMICalculation(); }

    // Update UI based on calculation mode
    function updateCalcModeUI() {
        if (!fixedEmiGroup) return;

        // Reset all to normal state
        fixedEmiGroup.style.display = 'none';
        calculatedResultRow.style.display = 'flex';
        tenureResultRow.style.display = 'none';
        rateResultRow.style.display = 'none';
        interestRateGroup?.classList.remove('input-disabled');
        tenureGroup?.classList.remove('input-disabled');

        if (calcMode === 'emi') {
            // Calculate EMI mode (default)
            calculatedResultLabel.textContent = 'Monthly EMI';
            calcModeHelp.textContent = 'Enter loan details to calculate EMI';
        } else if (calcMode === 'tenure') {
            // Calculate Tenure mode
            fixedEmiGroup.style.display = 'block';
            calculatedResultRow.style.display = 'none';
            tenureResultRow.style.display = 'flex';
            tenureGroup?.classList.add('input-disabled');
            calcModeHelp.textContent = 'Fix your EMI to calculate required tenure';
        } else if (calcMode === 'rate') {
            // Calculate Interest Rate mode
            fixedEmiGroup.style.display = 'block';
            calculatedResultRow.style.display = 'none';
            rateResultRow.style.display = 'flex';
            interestRateGroup?.classList.add('input-disabled');
            calcModeHelp.textContent = 'Fix your EMI to calculate required interest rate';
        }

        performEMICalculation();
    }

    // Main calculation function supporting all modes
    function performEMICalculation() {
        if (!loanAmountInput) return;

        const P = parseFloat(loanAmountInput.value);
        let annualRate = parseFloat(interestRateInput.value);
        let N = parseInt(loanTenureInput.value);
        const fixedEMI = parseFloat(fixedEMIInput?.value) || 0;

        // Validate base inputs
        if (isNaN(P) || P <= 0) {
            resetEMIOutputs();
            return;
        }

        let emi, totalPayment, totalInterest;

        if (calcMode === 'emi') {
            // Standard EMI calculation
            if (isNaN(annualRate) || isNaN(N) || annualRate <= 0 || N <= 0) {
                resetEMIOutputs();
                return;
            }

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
            // Calculate Tenure from fixed EMI
            if (isNaN(annualRate) || annualRate <= 0 || fixedEMI <= 0) {
                resetEMIOutputs();
                calculatedTenureEl.textContent = 'Invalid inputs';
                return;
            }

            emi = fixedEMI;

            if (emiMethod === 'reducing') {
                const r = (annualRate / 100) / 12;

                // Check if EMI is sufficient to cover at least interest
                const minEMI = P * r;
                if (emi <= minEMI) {
                    calculatedTenureEl.textContent = 'EMI too low';
                    totalInterestEl.textContent = '∞';
                    totalPaymentEl.textContent = '∞';
                    return;
                }

                // Calculate tenure: N = log(EMI / (EMI - P*r)) / log(1+r)
                N = Math.log(emi / (emi - P * r)) / Math.log(1 + r);
                N = Math.ceil(N); // Round up to whole months

                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            } else {
                // Flat rate: N = P / (EMI - (P * rate/12))
                // Rearranged from: EMI = (P + P * rate * N/12) / N
                const monthlyInterestRate = (annualRate / 100) / 12;
                N = P / (emi - P * monthlyInterestRate);

                if (N <= 0 || !isFinite(N)) {
                    calculatedTenureEl.textContent = 'EMI too low';
                    return;
                }

                N = Math.ceil(N);
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            }

            // Update tenure input field to sync
            loanTenureInput.value = N;
            loanTenureSlider.value = Math.min(N, parseInt(loanTenureSlider.max));

            // Display tenure in years and months
            const years = Math.floor(N / 12);
            const months = N % 12;
            let tenureText = '';
            if (years > 0) tenureText += `${years} year${years > 1 ? 's' : ''}`;
            if (months > 0) tenureText += ` ${months} month${months > 1 ? 's' : ''}`;
            if (!tenureText) tenureText = `${N} months`;
            calculatedTenureEl.textContent = `${N} months (${tenureText.trim()})`;

        } else if (calcMode === 'rate') {
            // Calculate Interest Rate from fixed EMI using Newton-Raphson
            if (isNaN(N) || N <= 0 || fixedEMI <= 0) {
                resetEMIOutputs();
                calculatedRateEl.textContent = 'Invalid inputs';
                return;
            }

            emi = fixedEMI;

            // Check if EMI is enough to cover principal
            if (emi * N < P) {
                calculatedRateEl.textContent = 'EMI too low for tenure';
                totalInterestEl.textContent = 'N/A';
                totalPaymentEl.textContent = 'N/A';
                return;
            }

            if (emiMethod === 'reducing') {
                // Newton-Raphson to solve for r: EMI = P * r * (1+r)^N / ((1+r)^N - 1)
                let r = 0.01; // Initial guess (1% monthly = 12% annual)

                for (let iter = 0; iter < 100; iter++) {
                    const pow = Math.pow(1 + r, N);
                    const f = P * r * pow / (pow - 1) - emi;

                    // Derivative of EMI formula with respect to r
                    const dfNum = P * pow * (pow - 1 - N * r);
                    const dfDen = (pow - 1) * (pow - 1);
                    const df = dfNum / dfDen;

                    if (Math.abs(df) < 1e-10) break;

                    const newR = r - f / df;

                    if (Math.abs(newR - r) < 1e-10) {
                        r = newR;
                        break;
                    }
                    r = newR;

                    // Keep rate positive and reasonable
                    if (r <= 0) r = 0.001;
                    if (r > 0.5) r = 0.5; // Max 600% annual
                }

                annualRate = r * 12 * 100;
                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            } else {
                // Flat rate: EMI = (P + P * rate * N/12) / N
                // Solve for rate: rate = (EMI * N - P) * 12 / (P * N)
                annualRate = (emi * N - P) * 12 / (P * N) * 100;

                if (annualRate < 0) {
                    calculatedRateEl.textContent = 'EMI higher than needed';
                    annualRate = 0;
                }

                totalPayment = emi * N;
                totalInterest = totalPayment - P;
            }

            // Update rate input field to sync
            interestRateInput.value = annualRate.toFixed(2);
            interestRateSlider.value = Math.min(annualRate, parseFloat(interestRateSlider.max));

            calculatedRateEl.textContent = `${annualRate.toFixed(2)}% per annum`;
        }

        // Update common outputs
        totalInterestEl.textContent = formatToRupees(totalInterest);
        totalPaymentEl.textContent = formatToRupees(totalPayment);

        // Update chart and amortization
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
        const data = { labels: ['Principal Amount', 'Total Interest'], datasets: [{ data: [principal, interest], backgroundColor: ['#5c9ce5', '#f7d969'], borderColor: '#FFFFFF', borderWidth: 4 }] };
        if (emiChart) { emiChart.data = data; emiChart.update(); }
        else { emiChart = new Chart(emiChartCtx, { type: 'doughnut', data: data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { family: "'Nunito Sans', sans-serif", size: 14 } } } }, cutout: '60%' } }); }
    }

    function generateAmortizationSchedule(principal, emi, monthlyRate, tenure) {
        if (!amortizationBody) return;
        amortizationBody.innerHTML = '';
        let balance = principal;

        // Limit display for very long tenures
        const maxRows = 360;
        const displayTenure = Math.min(tenure, maxRows);

        if (emiMethod === 'reducing') {
            for (let i = 1; i <= displayTenure; i++) {
                const interestPaid = balance * monthlyRate;
                const principalPaid = emi - interestPaid;
                balance -= principalPaid;
                if (i === tenure || balance < 0) balance = 0;
                const row = `<tr>
                    <td>${i}</td>
                    <td>${formatToRupees(principalPaid)}</td>
                    <td>${formatToRupees(interestPaid)}</td>
                    <td>${formatToRupees(emi)}</td>
                    <td>${formatToRupees(balance)}</td>
                </tr>`;
                amortizationBody.insertAdjacentHTML('beforeend', row);
            }
        } else {
            const totalInterest = emi * tenure - principal;
            const monthlyInterest = totalInterest / tenure;
            const monthlyPrincipal = principal / tenure;

            for (let i = 1; i <= displayTenure; i++) {
                balance -= monthlyPrincipal;
                if (i === tenure || balance < 0) balance = 0;
                const row = `<tr>
                    <td>${i}</td>
                    <td>${formatToRupees(monthlyPrincipal)}</td>
                    <td>${formatToRupees(monthlyInterest)}</td>
                    <td>${formatToRupees(emi)}</td>
                    <td>${formatToRupees(balance)}</td>
                </tr>`;
                amortizationBody.insertAdjacentHTML('beforeend', row);
            }
        }

        if (tenure > maxRows) {
            const row = `<tr><td colspan="5" style="text-align:center; color: var(--secondary-color);">... showing first ${maxRows} of ${tenure} months ...</td></tr>`;
            amortizationBody.insertAdjacentHTML('beforeend', row);
        }
    }

    if (loanAmountInput) {
        // Input event listeners
        loanAmountInput.addEventListener('input', () => syncInputs(loanAmountInput, loanAmountSlider));
        loanAmountSlider.addEventListener('input', () => syncSliders(loanAmountSlider, loanAmountInput));
        interestRateInput.addEventListener('input', () => syncInputs(interestRateInput, interestRateSlider));
        interestRateSlider.addEventListener('input', () => syncSliders(interestRateSlider, interestRateInput));
        loanTenureInput.addEventListener('input', () => syncInputs(loanTenureInput, loanTenureSlider));
        loanTenureSlider.addEventListener('input', () => syncSliders(loanTenureSlider, loanTenureInput));

        // Fixed EMI input listener
        if (fixedEMIInput) {
            fixedEMIInput.addEventListener('input', performEMICalculation);
        }

        // EMI Method Toggle Event Listeners
        if (reducingBalanceBtn && flatRateBtn) {
            reducingBalanceBtn.addEventListener('click', () => {
                emiMethod = 'reducing';
                reducingBalanceBtn.classList.add('active');
                flatRateBtn.classList.remove('active');
                performEMICalculation();
            });
            flatRateBtn.addEventListener('click', () => {
                emiMethod = 'flat';
                flatRateBtn.classList.add('active');
                reducingBalanceBtn.classList.remove('active');
                performEMICalculation();
            });
        }

        // Calculation Mode Toggle Event Listeners
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

        // Initial calculation
        performEMICalculation();
    }


    // --- GST CALCULATOR LOGIC ---
    const gstAmountInput = document.getElementById('gstAmount'), gstRateInputGst = document.getElementById('gstRate'), quickRateBtns = document.querySelectorAll('.gst-rate-btn'), addGstBtn = document.getElementById('addGstBtn'), removeGstBtn = document.getElementById('removeGstBtn'), intraStateBtn = document.getElementById('intraStateBtn'), interStateBtn = document.getElementById('interStateBtn'), baseAmountOutput = document.getElementById('baseAmountOutput'), totalAmountOutput = document.getElementById('totalAmountOutput'), cgstAmountOutput = document.getElementById('cgstAmountOutput'), sgstAmountOutput = document.getElementById('sgstAmountOutput'), igstAmountOutput = document.getElementById('igstAmountOutput'), intraStateOutputDiv = document.getElementById('intraStateOutput'), interStateOutputDiv = document.getElementById('interStateOutput');
    let gstMethod = 'add', gstType = 'intra';

    function calculateAndDisplayGST() {
        if (!gstAmountInput) return;
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

    if (gstAmountInput) {
        const gstInputs = [gstAmountInput, gstRateInputGst];
        gstInputs.forEach(input => input.addEventListener('input', calculateAndDisplayGST));
        quickRateBtns.forEach(btn => btn.addEventListener('click', () => { gstRateInputGst.value = btn.dataset.rate; quickRateBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); calculateAndDisplayGST(); }));
        addGstBtn.addEventListener('click', () => { gstMethod = 'add'; addGstBtn.classList.add('active'); removeGstBtn.classList.remove('active'); calculateAndDisplayGST(); });
        removeGstBtn.addEventListener('click', () => { gstMethod = 'remove'; removeGstBtn.classList.add('active'); addGstBtn.classList.remove('active'); calculateAndDisplayGST(); });
        intraStateBtn.addEventListener('click', () => { gstType = 'intra'; intraStateBtn.classList.add('active'); interStateBtn.classList.remove('active'); calculateAndDisplayGST(); });
        interStateBtn.addEventListener('click', () => { gstType = 'inter'; interStateBtn.classList.add('active'); intraStateBtn.classList.remove('active'); calculateAndDisplayGST(); });
        calculateAndDisplayGST();
    }

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
    let inverterType = 'single'; // 'single' for 1-Phase, 'three' for 3-Phase

    function calculatePricing() {
        if (!solarCapacityInput) return; // Exit if elements not on page

        const capacity = parseFloat(solarCapacityInput.value) || 0; // System capacity in kWp

        if (capacity <= 0) {
            // Reset all prices to 0
            [solarPanelsPriceEl, inverterPriceEl, structurePriceEl, bosPriceEl, installationPriceEl, civilWorkPriceEl, netMeteringPriceEl, wiringPriceEl, transportationPriceEl, subtotalPriceEl, profitMarginEl, finalPriceEl, gstAmountEl, finalPriceWithGstEl]
                .forEach(el => { if (el) el.textContent = formatToRupees(0); });
            return;
        }

        // Convert kWp to Watts for calculations
        const capacityWatts = capacity * 1000;

        // Solar Panels: Residential (DCR) = ₹27/W with 550Wp panels, Commercial (NDCR) = ₹18/W with 580Wp panels
        const solarRatePerWatt = customerType === 'residential' ? 27 : 18;
        const panelWattage = customerType === 'residential' ? 550 : 580;
        const solarPanelsPrice = solarRatePerWatt * capacityWatts;

        // Update panel rate text based on customer type
        if (panelRateTextEl) {
            panelRateTextEl.textContent = customerType === 'residential'
                ? `(₹27/W × ${panelWattage}Wp panels)`
                : `(₹18/W × ${panelWattage}Wp panels)`;
        }

        // Inverter: 1-Phase = ₹6,000/kWp, 3-Phase = ₹2,500/kWp
        const inverterRatePerKwp = inverterType === 'single' ? 6000 : 2500;
        const inverterPrice = inverterRatePerKwp * capacity;

        // Update inverter rate text based on inverter type
        if (inverterRateTextEl) {
            inverterRateTextEl.textContent = inverterType === 'single'
                ? '(₹6,000/kWp)'
                : '(₹2,500/kWp)';
        }

        // Structure: ₹4.5/W
        const structurePrice = 4.5 * capacityWatts;

        // BOS (Balance of System): ₹2/W
        const bosPrice = 2 * capacityWatts;

        // Installation Charges: ₹4/W
        const installationPrice = 4 * capacityWatts;

        // Civil Work for Legs: ₹1.2/W
        const civilWorkPrice = 1.2 * capacityWatts;

        // Net Metering Assistance: ₹6,600 per system (≤10 kWp)
        const netMeteringPrice = 6600; // Fixed at ₹6,600

        // Wiring: ₹5/W
        const wiringPrice = 5 * capacityWatts;

        // Transportation: ₹5,000 per system
        const transportationPrice = 5000;

        // Subtotal
        const subtotal = solarPanelsPrice + inverterPrice + structurePrice + bosPrice + installationPrice + civilWorkPrice + netMeteringPrice + wiringPrice + transportationPrice;

        // Profit Margin: Default 20% of Subtotal
        const profitMarginRate = parseFloat(customProfitMarginInput.value) || 20;
        const profitMargin = subtotal * (profitMarginRate / 100);

        // Price (Excl. GST)
        const finalPrice = subtotal + profitMargin;

        // GST: Default 5%
        const gstRate = parseFloat(gstRateInput.value) || 5;
        const gstAmount = finalPrice * (gstRate / 100);

        // Final Price (Incl. GST)
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

        // Update profit margin display
        if (profitMarginPercentTextEl) profitMarginPercentTextEl.textContent = `(${profitMarginRate}%)`;
        if (profitMarginEl) profitMarginEl.textContent = formatToRupees(profitMargin);

        if (finalPriceEl) finalPriceEl.textContent = formatToRupees(finalPrice);
        if (gstAmountEl) gstAmountEl.textContent = formatToRupees(gstAmount);
        if (finalPriceWithGstEl) finalPriceWithGstEl.textContent = formatToRupees(finalPriceWithGst);
    }

    if (solarCapacityInput) {
        residentialBtn.addEventListener('click', () => { customerType = 'residential'; residentialBtn.classList.add('active'); commercialBtn.classList.remove('active'); calculatePricing(); });
        commercialBtn.addEventListener('click', () => { customerType = 'commercial'; commercialBtn.classList.add('active'); residentialBtn.classList.remove('active'); calculatePricing(); });
        if (singlePhaseBtn && threePhaseBtn) {
            singlePhaseBtn.addEventListener('click', () => { inverterType = 'single'; singlePhaseBtn.classList.add('active'); threePhaseBtn.classList.remove('active'); calculatePricing(); });
            threePhaseBtn.addEventListener('click', () => { inverterType = 'three'; threePhaseBtn.classList.add('active'); singlePhaseBtn.classList.remove('active'); calculatePricing(); });
        }
        [solarCapacityInput, customProfitMarginInput, gstRateInput].forEach(input => {
            if (input) input.addEventListener('input', calculatePricing);
        });
        calculatePricing();
    }
});
