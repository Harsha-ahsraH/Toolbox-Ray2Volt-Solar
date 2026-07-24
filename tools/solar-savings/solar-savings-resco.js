// Solar Savings Calculator - RESCO engine
// Relies on formatCurrency, formatNumber, getColorClass from solar-savings.js

function calculateRESCO() {
    const errorDiv = document.getElementById('rescoErrorMessage');
    const rescoResults = document.getElementById('rescoResultsSection');
    const initialMessage = document.getElementById('initialMessage');
    errorDiv.innerText = '';
    errorDiv.style.display = 'none';
    rescoResults.style.display = 'none';
    initialMessage.style.display = 'none';

    // --- 1. Get and Validate Inputs ---
    const inputIds = [
        'rescoMonthlyUnits', 'rescoCurrentBill', 'rescoAdditionalCharges',
        'rescoDiscomTariff', 'rescoTariffEscalation',
        'rescoSystemCapacity', 'rescoUnitsPerKwDay', 'rescoR2VTariff',
        'rescoR2VEscalation', 'rescoPPATenure', 'rescoSecurityMonths',
        'rescoSystemCost', 'rescoOMCost', 'rescoOMEscalation',
        'rescoAMCCost', 'rescoAMCEscalation', 'rescoPanelDegradation',
        'rescoLoanAmount', 'rescoLoanTenure', 'rescoMoratorium', 'rescoLoanInterest'
    ];

    let inputs = {};
    let errors = [];

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('ssc-input-error');
    });

    const requiredPositive = [
        'rescoMonthlyUnits', 'rescoCurrentBill', 'rescoDiscomTariff',
        'rescoSystemCapacity', 'rescoUnitsPerKwDay', 'rescoR2VTariff',
        'rescoPPATenure', 'rescoSystemCost'
    ];

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = parseFloat(el.value);

        if (isNaN(val) && requiredPositive.includes(id)) {
            el.classList.add('ssc-input-error');
            const label = el.previousElementSibling ? el.previousElementSibling.innerText.replace(/[:\d.]/g, '').trim() : id;
            errors.push(`Enter a valid value for ${label}.`);
            inputs[id] = NaN;
        } else if (requiredPositive.includes(id) && val <= 0) {
            el.classList.add('ssc-input-error');
            const label = el.previousElementSibling ? el.previousElementSibling.innerText.replace(/[:\d.]/g, '').trim() : id;
            errors.push(`${label} must be greater than 0.`);
            inputs[id] = NaN;
        } else {
            inputs[id] = isNaN(val) ? 0 : val;
        }
    });

    if (errors.length > 0) {
        errorDiv.innerHTML = errors.join('<br>');
        errorDiv.style.display = 'block';
        rescoResults.style.display = 'none';
        initialMessage.style.display = 'block';
        return;
    }

    // --- 2. Core Calculations ---
    const monthlyUnits = inputs.rescoMonthlyUnits;
    const additionalCharges = inputs.rescoAdditionalCharges;
    const discomTariff = inputs.rescoDiscomTariff;
    const tariffEscalation = inputs.rescoTariffEscalation / 100;
    const systemCapacity = inputs.rescoSystemCapacity;
    const unitsPerKwDay = inputs.rescoUnitsPerKwDay;
    const r2vTariff = inputs.rescoR2VTariff;
    const r2vEscalation = inputs.rescoR2VEscalation / 100;
    const ppaTenure = Math.round(inputs.rescoPPATenure);
    const securityMonths = Math.round(inputs.rescoSecurityMonths);
    const systemCost = inputs.rescoSystemCost;
    const omCost = inputs.rescoOMCost;
    const omEscalation = inputs.rescoOMEscalation / 100;
    const amcCost = inputs.rescoAMCCost;
    const amcEscalation = inputs.rescoAMCEscalation / 100;
    const panelDegradation = inputs.rescoPanelDegradation / 100;

    const loanAmount = inputs.rescoLoanAmount || 0;
    const loanTenure = Math.round(inputs.rescoLoanTenure) || 0;
    const moratoriumMonths = Math.round(inputs.rescoMoratorium) || 0;
    const loanInterest = inputs.rescoLoanInterest / 100;

    const rescoLoanTypeElement = document.getElementById('rescoLoanType');
    const rescoLoanType = rescoLoanTypeElement ? rescoLoanTypeElement.value : 'reducing';

    const baseAnnualGeneration = systemCapacity * unitsPerKwDay * 365;
    const annualConsumption = monthlyUnits * 12;

    const monthlyProjectedRescoBill = (baseAnnualGeneration / 12) * r2vTariff;
    const securityDeposit = securityMonths * monthlyProjectedRescoBill;

    // --- Loan EMI Calculation ---
    let monthlyEMI = 0;
    let totalLoanMonths = 0;
    let loanPrincipalAfterMoratorium = loanAmount;

    if (loanAmount > 0 && loanTenure > 0) {
        const monthlyRate = loanInterest / 12;
        if (rescoLoanType === 'flat') {
            loanPrincipalAfterMoratorium = loanAmount;
            totalLoanMonths = (loanTenure * 12) - moratoriumMonths;
            if (totalLoanMonths > 0) {
                const totalInterest = loanAmount * loanInterest * loanTenure;
                const interestPaidDuringMoratorium = loanAmount * monthlyRate * moratoriumMonths;
                monthlyEMI = (loanAmount + totalInterest - interestPaidDuringMoratorium) / totalLoanMonths;
            } else {
                monthlyEMI = 0;
            }
            monthlyEMI = isNaN(monthlyEMI) ? 0 : Math.round(monthlyEMI * 100) / 100;
        } else {
            if (moratoriumMonths > 0 && monthlyRate > 0) {
                loanPrincipalAfterMoratorium = loanAmount * Math.pow(1 + monthlyRate, moratoriumMonths);
            }
            totalLoanMonths = (loanTenure * 12) - moratoriumMonths;
            if (totalLoanMonths > 0 && monthlyRate > 0) {
                const powerTerm = Math.pow(1 + monthlyRate, totalLoanMonths);
                monthlyEMI = loanPrincipalAfterMoratorium * monthlyRate * powerTerm / (powerTerm - 1);
            } else if (totalLoanMonths > 0) {
                monthlyEMI = loanPrincipalAfterMoratorium / totalLoanMonths;
            }
            monthlyEMI = isNaN(monthlyEMI) ? 0 : Math.round(monthlyEMI * 100) / 100;
        }
    }

    const monthlyInterestOnly = loanAmount * (loanInterest / 12);

    function getAnnualDebtService(year) {
        if (loanAmount <= 0 || loanTenure <= 0) return { debtService: 0, interestOnly: 0, emiPayment: 0, isActive: false };

        const yearStartMonth = (year - 1) * 12 + 1;
        const yearEndMonth = year * 12;
        const moratoriumEnd = moratoriumMonths;
        const loanEndMonth = loanTenure * 12;

        let interestOnlyPayment = 0;
        let emiPayment = 0;

        for (let m = yearStartMonth; m <= yearEndMonth; m++) {
            if (m > loanEndMonth) break;
            if (m <= moratoriumEnd) {
                interestOnlyPayment += monthlyInterestOnly;
            } else {
                emiPayment += monthlyEMI;
            }
        }

        return {
            debtService: interestOnlyPayment + emiPayment,
            interestOnly: interestOnlyPayment,
            emiPayment: emiPayment,
            isActive: yearStartMonth <= loanEndMonth
        };
    }

    // --- Year-by-year calculations ---
    let yearData = [];
    const equityInvestment = systemCost - loanAmount;
    let r2vCumulativeCashFlow = -equityInvestment + securityDeposit;
    let r2vBreakevenYear = -1;
    let totalR2VRevenue = 0;
    let totalR2VCosts = equityInvestment;
    let totalConsumerSavings = 0;
    let totalDebtService = 0;
    let minDSCR = Infinity;
    let avgDSCRSum = 0;
    let avgDSCRCount = 0;

    for (let year = 1; year <= ppaTenure; year++) {
        const degradationFactor = Math.pow(1 - panelDegradation, year - 1);
        const annualGeneration = baseAnnualGeneration * degradationFactor;

        const currentR2VTariff = r2vTariff * Math.pow(1 + r2vEscalation, year - 1);
        const r2vRevenue = annualGeneration * currentR2VTariff;

        const currentOMCost = omCost * Math.pow(1 + omEscalation, year - 1);
        const currentAMCCost = amcCost * Math.pow(1 + amcEscalation, year - 1);
        const r2vOperatingCosts = currentOMCost + currentAMCCost;

        const netOperatingIncome = r2vRevenue - r2vOperatingCosts;

        const debt = getAnnualDebtService(year);
        const debtService = debt.debtService;

        let dscr = 0;
        if (debtService > 0) {
            dscr = netOperatingIncome / debtService;
            if (dscr < minDSCR) minDSCR = dscr;
            avgDSCRSum += dscr;
            avgDSCRCount++;
        }

        const r2vNetCashFlow = netOperatingIncome - debtService;
        r2vCumulativeCashFlow += r2vNetCashFlow;

        totalR2VRevenue += r2vRevenue;
        totalR2VCosts += r2vOperatingCosts;
        totalDebtService += debtService;

        if (r2vCumulativeCashFlow >= 0 && r2vBreakevenYear === -1) {
            r2vBreakevenYear = year;
        }

        const currentDiscomTariff = discomTariff * Math.pow(1 + tariffEscalation, year - 1);
        const discomBillEnergy = annualConsumption * currentDiscomTariff;
        const annualAdditional = additionalCharges * 12;
        const discomTotalBill = discomBillEnergy + annualAdditional;

        const unitsFromSolar = Math.min(annualGeneration, annualConsumption);
        const unitsFromGrid = Math.max(0, annualConsumption - annualGeneration);
        const rescoBill = unitsFromSolar * currentR2VTariff;
        const gridCost = unitsFromGrid * currentDiscomTariff;
        const consumerTotalBill = rescoBill + gridCost + annualAdditional;
        const consumerSavings = discomTotalBill - consumerTotalBill;
        totalConsumerSavings += consumerSavings;

        yearData.push({
            year,
            annualGeneration,
            r2vRevenue,
            currentOMCost,
            currentAMCCost,
            r2vOperatingCosts,
            debtService,
            dscr,
            debtIsActive: debt.isActive,
            r2vNetCashFlow,
            r2vCumulativeCashFlow,
            discomTotalBill,
            rescoBill,
            gridCost,
            consumerTotalBill,
            consumerSavings,
        });
    }

    const totalR2VProfit = r2vCumulativeCashFlow;
    const avgDSCR = avgDSCRCount > 0 ? avgDSCRSum / avgDSCRCount : 0;
    if (minDSCR === Infinity) minDSCR = 0;

    // --- 3. Generate Output ---
    generateRESCOSummary(r2vBreakevenYear, totalR2VRevenue, totalR2VCosts, totalR2VProfit,
        totalConsumerSavings, securityDeposit, systemCost, ppaTenure,
        loanAmount, monthlyEMI, minDSCR, avgDSCR, totalDebtService);
    generateR2VBreakevenTable(yearData, equityInvestment, securityDeposit, r2vBreakevenYear, loanAmount);
    generateR2VCashFlowTable(yearData, equityInvestment, securityDeposit, loanAmount);
    generateConsumerSavingsTable(yearData);

    rescoResults.style.display = 'block';
    initialMessage.style.display = 'none';
}

// --- RESCO Summary Cards ---
function generateRESCOSummary(breakevenYear, totalRevenue, totalCosts, totalProfit,
    consumerSavings, securityDeposit, systemCost, ppaTenure,
    loanAmount, monthlyEMI, minDSCR, avgDSCR, totalDebtService) {
    const container = document.getElementById('rescoSummary');

    const breakevenText = breakevenYear > 0 ? `Year ${breakevenYear}` : `> ${ppaTenure} Years`;
    const breakevenColor = breakevenYear > 0 ? '#10b981' : '#ef4444';

    const roi = systemCost > 0 ? ((totalProfit / systemCost) * 100) : 0;

    const svgIcons = {
        breakeven: `<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
        revenue: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        profit: `<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        roi: `<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
        savings: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        deposit: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        dscr: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        emi: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        debt: `<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    };

    const cards = [
        { label: 'R2V Breakeven Year', value: breakevenText, color: breakevenColor, accent: '#10B981', iconBg: 'rgba(16, 185, 129, 0.12)', icon: svgIcons.breakeven },
        { label: 'R2V Total Revenue', value: formatCurrency(totalRevenue), color: '#10b981', accent: '#00B4D8', iconBg: 'rgba(0, 180, 216, 0.12)', icon: svgIcons.revenue },
        { label: 'R2V Net Profit', value: formatCurrency(totalProfit), color: totalProfit >= 0 ? '#10b981' : '#ef4444', accent: totalProfit >= 0 ? '#10B981' : '#EF4444', iconBg: totalProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', icon: svgIcons.profit },
        { label: 'Project ROI', value: formatNumber(roi, 1, '%'), color: roi >= 0 ? '#10b981' : '#ef4444', accent: roi >= 0 ? '#8B5CF6' : '#EF4444', iconBg: roi >= 0 ? 'rgba(139, 92, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)', icon: svgIcons.roi },
        { label: 'Consumer Total Savings', value: formatCurrency(consumerSavings), color: consumerSavings >= 0 ? '#10b981' : '#ef4444', accent: '#F59E0B', iconBg: 'rgba(245, 158, 11, 0.12)', icon: svgIcons.savings },
        { label: 'Security Deposit', value: formatCurrency(securityDeposit), color: 'var(--text-primary)', accent: '#6B7280', iconBg: 'rgba(107, 114, 128, 0.12)', icon: svgIcons.deposit },
    ];

    if (loanAmount > 0) {
        const dscrColor = minDSCR >= 1.2 ? '#10b981' : minDSCR >= 1.0 ? '#F59E0B' : '#ef4444';
        const dscrAccent = minDSCR >= 1.2 ? '#10B981' : minDSCR >= 1.0 ? '#F59E0B' : '#EF4444';
        const dscrIconBg = minDSCR >= 1.2 ? 'rgba(16, 185, 129, 0.12)' : minDSCR >= 1.0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';

        cards.push(
            { label: 'Min DSCR', value: formatNumber(minDSCR, 2, 'x'), color: dscrColor, accent: dscrAccent, iconBg: dscrIconBg, icon: svgIcons.dscr },
            { label: 'Monthly EMI', value: formatCurrency(monthlyEMI), color: 'var(--text-primary)', accent: '#3B82F6', iconBg: 'rgba(59, 130, 246, 0.12)', icon: svgIcons.emi },
            { label: 'Total Debt Service', value: formatCurrency(totalDebtService), color: 'var(--text-primary)', accent: '#6366F1', iconBg: 'rgba(99, 102, 241, 0.12)', icon: svgIcons.debt },
        );
    }

    let html = '';
    cards.forEach(card => {
        html += `
            <div class="ssc-summary-card" style="--card-accent: ${card.accent}; --card-icon-bg: ${card.iconBg}">
                <div class="ssc-summary-card-icon">${card.icon}</div>
                <div class="ssc-summary-card-label">${card.label}</div>
                <div class="ssc-summary-card-value" style="color: ${card.color}">${card.value}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// --- R2V Breakeven Table ---
function generateR2VBreakevenTable(yearData, equityInvestment, securityDeposit, breakevenYear, loanAmount) {
    const container = document.getElementById('rescoR2VBreakeven');
    const hasLoan = loanAmount > 0;

    let tableHTML = `<table class="ssc-table">
        <thead>
            <tr>
                <th>Year</th>
                <th style="text-align: right;">R2V Revenue</th>
                <th style="text-align: right;">Operating Costs</th>
                ${hasLoan ? '<th style="text-align: right;">Debt Service</th>' : ''}
                <th style="text-align: right;">Net Cash Flow</th>
                <th style="text-align: right;">Cumulative</th>
                ${hasLoan ? '<th style="text-align: right;">DSCR</th>' : ''}
            </tr>
        </thead>
        <tbody>`;

    const year0CashFlow = -equityInvestment + securityDeposit;
    tableHTML += `<tr>
        <td>0</td>
        <td>${formatCurrency(securityDeposit)}</td>
        <td>${formatCurrency(equityInvestment)}</td>
        ${hasLoan ? `<td>${formatCurrency(0)}</td>` : ''}
        <td><span class="${getColorClass(year0CashFlow)}">${formatCurrency(year0CashFlow)}</span></td>
        <td><span class="${getColorClass(year0CashFlow)}">${formatCurrency(year0CashFlow)}</span></td>
        ${hasLoan ? '<td>—</td>' : ''}
    </tr>`;

    yearData.forEach(d => {
        const rowClass = d.year === breakevenYear ? 'ssc-highlight-row' : '';
        const dscrText = d.debtIsActive && d.debtService > 0 ? formatNumber(d.dscr, 2, 'x') : '—';
        const dscrClass = d.dscr >= 1.2 ? 'ssc-text-profit' : d.dscr >= 1.0 ? '' : 'ssc-text-loss';
        tableHTML += `<tr class="${rowClass}">
            <td>${d.year}</td>
            <td>${formatCurrency(d.r2vRevenue)}</td>
            <td>${formatCurrency(d.r2vOperatingCosts)}</td>
            ${hasLoan ? `<td>${formatCurrency(d.debtService)}</td>` : ''}
            <td><span class="${getColorClass(d.r2vNetCashFlow)}">${formatCurrency(d.r2vNetCashFlow)}</span></td>
            <td><span class="${getColorClass(d.r2vCumulativeCashFlow)}">${formatCurrency(d.r2vCumulativeCashFlow)}</span></td>
            ${hasLoan ? `<td><span class="${dscrClass}">${dscrText}</span></td>` : ''}
        </tr>`;
    });

    tableHTML += `</tbody></table>`;

    let summary = '';
    if (breakevenYear > 0) {
        summary = `<p class="ssc-summary-text">Ray2Volt recoups equity investment in <strong>Year ${breakevenYear}</strong>.</p>`;
    } else {
        summary = `<p class="ssc-summary-text">Ray2Volt does not break even within the PPA tenure.</p>`;
    }

    container.innerHTML = tableHTML + summary;
}

// --- R2V Cash Flow Table ---
function generateR2VCashFlowTable(yearData, equityInvestment, securityDeposit, loanAmount) {
    const container = document.getElementById('rescoR2VCashFlow');
    const hasLoan = loanAmount > 0;

    let tableHTML = `<table class="ssc-table">
        <thead>
            <tr>
                <th>Year</th>
                <th style="text-align: right;">Generation (kWh)</th>
                <th style="text-align: right;">Revenue</th>
                <th style="text-align: right;">O&M</th>
                <th style="text-align: right;">AMC</th>
                ${hasLoan ? '<th style="text-align: right;">Debt Service</th>' : ''}
                <th style="text-align: right;">Net Cash Flow</th>
            </tr>
        </thead>
        <tbody>`;

    const year0Net = -equityInvestment + securityDeposit;
    tableHTML += `<tr>
        <td>0</td>
        <td>—</td>
        <td>${formatCurrency(securityDeposit)}</td>
        <td>—</td>
        <td>—</td>
        ${hasLoan ? '<td>—</td>' : ''}
        <td><span class="${getColorClass(year0Net)}">${formatCurrency(year0Net)}</span></td>
    </tr>`;

    yearData.forEach(d => {
        tableHTML += `<tr>
            <td>${d.year}</td>
            <td>${formatNumber(d.annualGeneration, 0, 'kWh')}</td>
            <td>${formatCurrency(d.r2vRevenue)}</td>
            <td>${formatCurrency(d.currentOMCost)}</td>
            <td>${formatCurrency(d.currentAMCCost)}</td>
            ${hasLoan ? `<td>${formatCurrency(d.debtService)}</td>` : ''}
            <td><span class="${getColorClass(d.r2vNetCashFlow)}">${formatCurrency(d.r2vNetCashFlow)}</span></td>
        </tr>`;
    });

    tableHTML += `</tbody></table>`;

    const totalRevenue = yearData.reduce((s, d) => s + d.r2vRevenue, 0);
    const totalOM = yearData.reduce((s, d) => s + d.currentOMCost, 0);
    const totalAMC = yearData.reduce((s, d) => s + d.currentAMCCost, 0);
    const totalDebt = yearData.reduce((s, d) => s + d.debtService, 0);
    const totalNetCF = yearData.reduce((s, d) => s + d.r2vNetCashFlow, 0);

    let summaryParts = [
        `Revenue: ${formatCurrency(totalRevenue)}`,
        `O&M: ${formatCurrency(totalOM)}`,
        `AMC: ${formatCurrency(totalAMC)}`,
    ];
    if (hasLoan) summaryParts.push(`Debt Service: ${formatCurrency(totalDebt)}`);
    summaryParts.push(`Net Cash Flow: ${formatCurrency(totalNetCF)}`);

    const totalsSummary = `<p class="ssc-summary-text">
        <strong>Totals over PPA:</strong> ${summaryParts.join(' | ')}
    </p>`;

    container.innerHTML = tableHTML + totalsSummary;
}

// --- Consumer Savings Table ---
function generateConsumerSavingsTable(yearData) {
    const container = document.getElementById('rescoConsumerSavings');

    let tableHTML = `<table class="ssc-table">
        <thead>
            <tr>
                <th>Year</th>
                <th style="text-align: right;">DISCOM Bill (w/o Solar)</th>
                <th style="text-align: right;">RESCO Bill</th>
                <th style="text-align: right;">Grid Bill (Remaining)</th>
                <th style="text-align: right;">Total with RESCO</th>
                <th style="text-align: right;">Annual Savings</th>
            </tr>
        </thead>
        <tbody>`;

    yearData.forEach(d => {
        tableHTML += `<tr>
            <td>${d.year}</td>
            <td>${formatCurrency(d.discomTotalBill)}</td>
            <td>${formatCurrency(d.rescoBill)}</td>
            <td>${formatCurrency(d.gridCost)}</td>
            <td>${formatCurrency(d.consumerTotalBill)}</td>
            <td><span class="${getColorClass(d.consumerSavings)}">${formatCurrency(d.consumerSavings)}</span></td>
        </tr>`;
    });

    tableHTML += `</tbody></table>`;

    const totalSavings = yearData.reduce((s, d) => s + d.consumerSavings, 0);
    const summary = `<p class="ssc-summary-text">
        <strong>Total Consumer Savings over PPA Tenure:</strong> <span class="${getColorClass(totalSavings)}">${formatCurrency(totalSavings)}</span>
    </p>`;

    container.innerHTML = tableHTML + summary;
}
