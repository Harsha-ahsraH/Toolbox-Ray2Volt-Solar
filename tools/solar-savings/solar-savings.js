// Solar Savings Calculator - CAPEX engine, formatting helpers, and mode switching

function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    const numValue = Number(value);
    const options = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };
    let formatted = new Intl.NumberFormat('en-IN', options).format(numValue);
    return formatted.replace('₹', '₹ ');
}

function formatNumber(value, decimalPlaces = 2, unit = '') {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    const numValue = Number(value);
    const options = { minimumFractionDigits: 0, maximumFractionDigits: decimalPlaces };
    if (unit.toLowerCase().includes('year') && Number.isInteger(numValue)) {
        options.maximumFractionDigits = 0;
    } else if (!Number.isInteger(numValue) && decimalPlaces > 0) {
        const actualDecimals = (numValue.toString().split('.')[1] || '').length;
        options.minimumFractionDigits = Math.min(1, decimalPlaces, actualDecimals);
        options.maximumFractionDigits = Math.min(decimalPlaces, actualDecimals);
    } else if (Number.isInteger(numValue) && decimalPlaces === 0) {
        options.maximumFractionDigits = 0;
    }
    let formatted = numValue.toLocaleString('en-IN', options);
    return unit ? `${formatted} ${unit}` : formatted;
}

function getColorClass(value) {
    if (isNaN(value) || value === null || value === undefined) return '';
    return value >= 0 ? 'ssc-text-profit' : 'ssc-text-loss';
}

// --- Main Calculation Function (CAPEX) ---
function calculateSavings() {
    const errorDiv = document.getElementById('errorMessage');
    const resultsSection = document.getElementById('resultsSection');
    const initialMessage = document.getElementById('initialMessage');
    errorDiv.innerText = '';
    errorDiv.style.display = 'none';
    resultsSection.style.display = 'none';
    initialMessage.style.display = 'none';

    // --- 1. Get and Validate Inputs ---
    let inputs = {};
    let errors = [];
    const inputIds = [
        'subsidyAmount', 'downPayment', 'loanTenure',
        'interestRate', 'kwInstalled', 'unitsPerKwDay', 'avgUnitsConsumed',
        'costPerUnit', 'additionalCharges', 'inflationRate', 'netMeteringRate', 'totalCost', 'manualKwInput'
    ];

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('ssc-input-error');
    });

    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;
        const value = (id === 'loanTenure' || id === 'kwInstalled' || id === 'manualKwInput')
            ? parseInt(element.value, 10)
            : parseFloat(element.value);

        if ((id === 'totalCost' || id === 'manualKwInput') && (element.value === '' || element.value === null)) {
            inputs[id] = NaN;
        } else if (id === 'kwInstalled' && element.value === 'manual') {
            inputs[id] = 'manual';
            document.getElementById('manualKwInputGroup').style.display = 'block';
        } else if (id === 'kwInstalled' && element.value !== 'manual') {
            document.getElementById('manualKwInputGroup').style.display = 'none';
            inputs['manualKwInput'] = NaN;
            if (document.getElementById('manualKwInput')) document.getElementById('manualKwInput').value = '';
            if (isNaN(value) || value <= 0) {
                element.classList.add('ssc-input-error');
                errors.push(`Select a valid kW Installed Capacity.`);
                inputs[id] = NaN;
            } else {
                inputs[id] = value;
            }
        } else if (isNaN(value) || (value < 0 && !['interestRate', 'subsidyAmount', 'downPayment', 'inflationRate', 'netMeteringRate'].includes(id))) {
            element.classList.add('ssc-input-error');
            let fieldName = element.previousElementSibling.innerText.replace(/[:\d.]/g, '').trim();
            if (id === 'manualKwInput' && (isNaN(value) || value <= 0)) {
                errors.push('Enter a valid Manual System Capacity (kW) > 0.');
            } else if (id === 'kwInstalled' && (isNaN(value) || value <= 0)) {
                errors.push(`Enter a valid value for ${fieldName}.`);
            }
            inputs[id] = NaN;
        } else {
            inputs[id] = value;
        }
    });

    const kwCostMap = {
        2: 170000,
        3: 218000,
        4: 270000,
        5: 325000,
        6: 380000,
        8: 480000,
        10: 580000
    };

    const totalCostInput = document.getElementById('totalCost');
    let userProvidedTotalCost = parseFloat(totalCostInput.value);

    let actualKwInstalled = NaN;
    const kwSelectedOption = document.getElementById('kwInstalled').value;

    if (kwSelectedOption === 'manual') {
        document.getElementById('manualKwInputGroup').style.display = 'block';
        actualKwInstalled = parseFloat(document.getElementById('manualKwInput').value);
        if (isNaN(actualKwInstalled) || actualKwInstalled <= 0) {
            errors.push("Enter a valid Manual System Capacity (kW) > 0.");
            const manKwEl = document.getElementById('manualKwInput');
            if (manKwEl) manKwEl.classList.add('ssc-input-error');
        }
        inputs.kwInstalled = actualKwInstalled;
        if (!isNaN(userProvidedTotalCost) && userProvidedTotalCost > 0) {
            inputs.totalCost = userProvidedTotalCost;
        } else {
            inputs.totalCost = NaN;
            totalCostInput.placeholder = "Enter project cost manually";
        }
        totalCostInput.dataset.previousKw = 'manual';
    } else if (kwSelectedOption && kwSelectedOption !== "") {
        document.getElementById('manualKwInputGroup').style.display = 'none';
        document.getElementById('manualKwInput').value = '';
        actualKwInstalled = parseInt(kwSelectedOption, 10);
        inputs.kwInstalled = actualKwInstalled;

        if (kwCostMap.hasOwnProperty(actualKwInstalled)) {
            if (isNaN(userProvidedTotalCost) || userProvidedTotalCost <= 0 ||
                totalCostInput.dataset.previousKw !== actualKwInstalled.toString()) {
                totalCostInput.value = kwCostMap[actualKwInstalled];
                inputs.totalCost = kwCostMap[actualKwInstalled];
                userProvidedTotalCost = inputs.totalCost;
            } else {
                inputs.totalCost = userProvidedTotalCost;
            }
        } else {
            inputs.totalCost = isNaN(userProvidedTotalCost) ? NaN : userProvidedTotalCost;
        }
        totalCostInput.dataset.previousKw = actualKwInstalled.toString();
    } else {
        document.getElementById('manualKwInputGroup').style.display = 'none';
        inputs.kwInstalled = NaN;
        if (!errors.some(e => e.includes("kW Installed Capacity"))) {
            errors.push("Select a kW Installed Capacity.");
        }
        if (!isNaN(userProvidedTotalCost)) {
            inputs.totalCost = userProvidedTotalCost;
        } else {
            inputs.totalCost = NaN;
        }
        totalCostInput.dataset.previousKw = '';
    }

    inputs.kwInstalled = actualKwInstalled;

    if (isNaN(inputs.totalCost) || inputs.totalCost <= 0) {
        const tcElement = document.getElementById('totalCost');
        if (tcElement) tcElement.classList.add('ssc-input-error');
        if (!errors.some(e => e.includes("Total Project Cost") || e.includes("kW Installed Capacity"))) {
            errors.push("Enter a valid Total Project Cost or select a kW capacity to auto-fill.");
        }
    }

    if (!isNaN(inputs.subsidyAmount) && !isNaN(inputs.totalCost) && inputs.subsidyAmount > inputs.totalCost) { errors.push("Subsidy cannot exceed Total Cost."); }
    const tempNetCost = inputs.totalCost - inputs.subsidyAmount;
    if (!isNaN(inputs.downPayment) && !isNaN(tempNetCost) && inputs.downPayment > tempNetCost) { errors.push("Down Payment cannot exceed Net Cost."); }
    if (!isNaN(inputs.loanTenure) && inputs.loanTenure <= 0 && (tempNetCost - inputs.downPayment) > 0) { errors.push("Loan Tenure must be > 0 if loan needed."); }

    if (errors.length > 0) {
        errorDiv.innerHTML = errors.join('<br>');
        errorDiv.style.display = 'block';
        resultsSection.style.display = 'none';
        initialMessage.style.display = 'block';
        const resultsTbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
        if (resultsTbody) resultsTbody.innerHTML = '';
        document.getElementById('monthlyCostsComparison').innerHTML = '';
        document.getElementById('breakevenAnalysis').innerHTML = '';
        return;
    }

    // --- 2. Core Calculations (Financial & Annual Energy Balance) ---
    const netProjectCost = Math.max(0, inputs.totalCost - inputs.subsidyAmount);
    const loanAmount = Math.max(0, netProjectCost - inputs.downPayment);
    const additionalCharges = isNaN(inputs.additionalCharges) ? 0 : inputs.additionalCharges;

    let monthlyEMI = 0;
    let totalLoanPaid = 0;
    let actualLoanTenure = inputs.loanTenure;
    const numberOfMonths = actualLoanTenure * 12;

    const loanTypeElement = document.getElementById('loanType');
    const loanType = loanTypeElement ? loanTypeElement.value : 'reducing';

    if (loanAmount > 0 && numberOfMonths > 0) {
        const annualInterestRate = inputs.interestRate;
        if (annualInterestRate > 0) {
            if (loanType === 'flat') {
                const totalInterest = loanAmount * (annualInterestRate / 100) * actualLoanTenure;
                monthlyEMI = (loanAmount + totalInterest) / numberOfMonths;
            } else {
                const monthlyInterestRate = annualInterestRate / 12 / 100;
                const powerTerm = Math.pow(1 + monthlyInterestRate, numberOfMonths);
                const emiNumerator = loanAmount * monthlyInterestRate * powerTerm;
                const emiDenominator = powerTerm - 1;
                monthlyEMI = (emiDenominator > 0) ? (emiNumerator / emiDenominator) : (loanAmount / numberOfMonths);
            }
        } else {
            monthlyEMI = loanAmount / numberOfMonths;
        }
        monthlyEMI = isNaN(monthlyEMI) ? 0 : Math.round(monthlyEMI * 100) / 100;

        if (inputs.subsidyAmount > 0) {
            const reducedPrincipal = loanAmount - inputs.subsidyAmount;
            if (reducedPrincipal > 0) {
                if (loanType === 'flat') {
                    const totalInterest = loanAmount * (annualInterestRate / 100) * actualLoanTenure;
                    const originalTotalAmount = loanAmount + totalInterest;
                    const newTotalAmount = originalTotalAmount - inputs.subsidyAmount;
                    let n = newTotalAmount / monthlyEMI;
                    actualLoanTenure = Math.ceil(n / 12);
                    totalLoanPaid = monthlyEMI * Math.ceil(n);
                } else {
                    const monthlyInterestRate = annualInterestRate / 12 / 100;
                    let n = 0;
                    let left = 0;
                    let right = numberOfMonths;
                    const tolerance = 0.01;

                    while (right - left > tolerance) {
                        n = (left + right) / 2;
                        const powerTerm = Math.pow(1 + monthlyInterestRate, n);
                        const calculatedEMI = reducedPrincipal * monthlyInterestRate * powerTerm / (powerTerm - 1);

                        if (Math.abs(calculatedEMI - monthlyEMI) < tolerance) {
                            break;
                        } else if (calculatedEMI > monthlyEMI) {
                            right = n;
                        } else {
                            left = n;
                        }
                    }

                    actualLoanTenure = Math.ceil(n / 12);
                    totalLoanPaid = monthlyEMI * Math.ceil(n);
                }
            } else {
                actualLoanTenure = 0;
                totalLoanPaid = 0;
            }
        } else {
            totalLoanPaid = monthlyEMI * numberOfMonths;
        }
        totalLoanPaid = Math.round(totalLoanPaid * 100) / 100;
    }

    const annualSolarGeneration = inputs.kwInstalled * inputs.unitsPerKwDay * 365;
    const annualUnitsConsumed = inputs.avgUnitsConsumed * 12;
    const annualUnitsImported_Y1 = Math.max(0, annualUnitsConsumed - annualSolarGeneration);
    const annualUnitsExported_Y1 = Math.max(0, annualSolarGeneration - annualUnitsConsumed);
    const annualBillBeforeSolar_Y1 = (annualUnitsConsumed * inputs.costPerUnit) + (additionalCharges * 12);
    const annualCostOfImported_Y1 = annualUnitsImported_Y1 * inputs.costPerUnit;
    const annualCreditForExported_Y1 = annualUnitsExported_Y1 * inputs.netMeteringRate;
    const annualBillAfterSolar_Y1 = (annualCostOfImported_Y1 - annualCreditForExported_Y1) + (additionalCharges * 12);
    const annualSavings_Y1 = annualBillBeforeSolar_Y1 - annualBillAfterSolar_Y1;
    const avgMonthlyBillBefore_Y1 = annualBillBeforeSolar_Y1 / 12;
    const avgMonthlyBillAfter_Y1 = annualBillAfterSolar_Y1 / 12;
    const avgMonthlySavings_Y1 = annualSavings_Y1 / 12;

    let simplePaybackYears = Infinity;
    if (netProjectCost <= 0) { simplePaybackYears = 0; }
    else if (annualSavings_Y1 > 0) { simplePaybackYears = netProjectCost / annualSavings_Y1; }

    const totalOutlay = inputs.downPayment + totalLoanPaid;

    // --- 3. Populate Results ---
    const resultsTbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    resultsTbody.innerHTML = '';

    const addRow = (label, value, valueRaw = null, applyColorClass = false) => {
        const row = resultsTbody.insertRow();
        const labelCell = row.insertCell(0);
        const valueCell = row.insertCell(1);

        labelCell.className = 'ssc-metric-col';
        labelCell.innerText = label;

        if (applyColorClass && valueRaw !== null) {
            const colorClass = getColorClass(valueRaw);
            valueCell.innerHTML = `<span class="${colorClass}">${value}</span>`;
        } else {
            valueCell.innerText = value;
        }
    };

    addRow('Total Project Cost', formatCurrency(inputs.totalCost));
    addRow('Subsidy Amount', formatCurrency(inputs.subsidyAmount));
    addRow('Net Project Cost (After Subsidy)', formatCurrency(netProjectCost));
    addRow('Down Payment', formatCurrency(inputs.downPayment));
    addRow('Loan Amount Required', formatCurrency(loanAmount));
    addRow('Monthly Loan EMI', formatCurrency(monthlyEMI));
    if (inputs.subsidyAmount > 0) {
        addRow('Actual Loan Tenure (After Subsidy Repayment)', formatNumber(actualLoanTenure, 0, 'Years'));
    }
    addRow('Total Amount Paid for Loan', formatCurrency(totalLoanPaid));
    addRow('Total Outlay (Down Payment + Loan Paid)', formatCurrency(totalOutlay));
    addRow('Estimated Annual Solar Generation', formatNumber(annualSolarGeneration, 0, 'kWh / Year'));
    addRow('Avg. Monthly Bill (Before Solar - Y1)', formatCurrency(avgMonthlyBillBefore_Y1));
    addRow('Avg. Monthly Bill (After Solar - Y1, Annualized)',
        formatCurrency(avgMonthlyBillAfter_Y1) + (avgMonthlyBillAfter_Y1 < 0 ? ' (Avg. Credit)' : ''),
        avgMonthlyBillAfter_Y1,
        avgMonthlyBillAfter_Y1 < 0
    );
    addRow('Avg. Monthly Savings (Y1, Annualized)',
        formatCurrency(avgMonthlySavings_Y1),
        avgMonthlySavings_Y1,
        avgMonthlySavings_Y1 > 0
    );
    addRow('Additional Charges (Monthly)', formatCurrency(additionalCharges));

    let simplePaybackText = "N/A";
    if (simplePaybackYears === 0) simplePaybackText = "Immediate";
    else if (simplePaybackYears !== Infinity && simplePaybackYears > 0) simplePaybackText = formatNumber(simplePaybackYears, 1, 'Years');
    else if (annualSavings_Y1 <= 0 && netProjectCost > 0) simplePaybackText = "N/A (No Savings)";
    addRow('Simple Payback Period (Y1 Savings)', simplePaybackText);

    // --- 4. Generate Detail Tables ---
    generateMonthlyComparisonTable(avgMonthlyBillBefore_Y1, avgMonthlyBillAfter_Y1, monthlyEMI, avgMonthlySavings_Y1);
    const financedBreakevenYearText = generateBreakevenTable(
        netProjectCost, monthlyEMI, inputs.loanTenure,
        annualUnitsConsumed, annualSolarGeneration,
        inputs.costPerUnit, inputs.netMeteringRate, inputs.inflationRate,
        additionalCharges
    );

    addRow('Financed Breakeven Year (Incl. Inflation)', financedBreakevenYearText);

    resultsSection.style.display = 'block';
    initialMessage.style.display = 'none';
}

// --- Helper: Generate Monthly Comparison Table (Year 1 Average Snapshot) ---
function generateMonthlyComparisonTable(avgBillBefore_Y1, avgBillAfter_Y1, emi, avgSavings_Y1) {
    const container = document.getElementById('monthlyCostsComparison');
    const additionalCharges = parseFloat(document.getElementById('additionalCharges').value) || 0;
    const avgBillAfterPositive = Math.max(0, avgBillAfter_Y1);
    const totalAvgMonthlyOutlay = avgBillAfterPositive + emi;
    const netAvgMonthlyImpact = avgSavings_Y1 - emi;
    const netImpactColorClass = getColorClass(netAvgMonthlyImpact);

    let tableHTML = `<table class="ssc-table">
        <thead>
            <tr>
                <th class="ssc-metric-col">Avg. Monthly Item (Year 1)</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr><td class="ssc-metric-col">Electricity Bill (Before Solar)</td><td>${formatCurrency(avgBillBefore_Y1)}</td></tr>
            <tr><td class="ssc-metric-col">Additional Charges</td><td>${formatCurrency(additionalCharges)}</td></tr>
            <tr><td class="ssc-metric-col">Est. Bill (After Solar, Annualized)</td><td><span class="${getColorClass(avgBillAfter_Y1 < 0 ? 1 : -1)}">${formatCurrency(avgBillAfter_Y1)} ${avgBillAfter_Y1 < 0 ? '(Avg. Credit)' : ''}</span></td></tr>
            <tr><td class="ssc-metric-col">Loan EMI (if applicable)</td><td>${formatCurrency(emi)}</td></tr>
            <tr><td class="ssc-metric-col"><strong>Total Avg. Monthly Outlay</strong></td><td><strong>${formatCurrency(totalAvgMonthlyOutlay)}</strong></td></tr>
            <tr><td class="ssc-metric-col"><strong>Net Avg. Monthly Impact</strong></td><td><strong><span class="${netImpactColorClass}">${formatCurrency(netAvgMonthlyImpact)} ${netAvgMonthlyImpact >= 0 ? '(Net Benefit)' : '(Net Cost)'}</span></strong></td></tr>
        </tbody>
     </table>`;
    container.innerHTML = tableHTML;
}

// --- Helper: Generate Breakeven Table (Uses Annual Figures & Inflation) ---
function generateBreakevenTable(
    netInitialCost, monthlyEMI, loanTenure,
    annualUnitsConsumed, annualSolarGeneration,
    initialCostPerUnit, initialNetMeteringRate, inflationRate,
    initialMonthlyAdditionalCharges
) {
    const container = document.getElementById('breakevenAnalysis');
    const annualEMI = monthlyEMI * 12;
    const maxYears = 25;
    let cumulativeNetCashFlow = -netInitialCost;
    const inflationFactor = 1 + (inflationRate / 100);
    const annualUnitsImported = Math.max(0, annualUnitsConsumed - annualSolarGeneration);
    const annualUnitsExported = Math.max(0, annualSolarGeneration - annualUnitsConsumed);

    let tableHTML = `<table class="ssc-table">
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th style="text-align: right;">Annual Savings (Inflated)</th>
                                <th style="text-align: right;">Annual Loan Payment</th>
                                <th style="text-align: right;">Net Annual Cash Flow</th>
                                <th style="text-align: right;">Cumulative Net Cash Flow</th>
                            </tr>
                        </thead>
                        <tbody>`;

    let breakevenYearNum = -1;
    if (netInitialCost <= 0) breakevenYearNum = 0;

    tableHTML += `<tr class="${(breakevenYearNum === 0) ? 'ssc-highlight-row' : ''}">
                        <td>0</td>
                        <td>${formatCurrency(0)}</td>
                        <td>${formatCurrency(0)}</td>
                        <td><span class="${getColorClass(-netInitialCost)}">${formatCurrency(-netInitialCost)}</span></td>
                        <td><span class="${getColorClass(cumulativeNetCashFlow)}">${formatCurrency(cumulativeNetCashFlow)}</span></td>
                      </tr>`;

    const initialAnnualSavings = (annualUnitsConsumed * initialCostPerUnit) - ((annualUnitsImported * initialCostPerUnit) - (annualUnitsExported * initialNetMeteringRate));

    for (let year = 1; year <= maxYears; year++) {
        const currentCostPerUnit = initialCostPerUnit * Math.pow(inflationFactor, year - 1);
        const currentNetMeteringRate = initialNetMeteringRate * Math.pow(inflationFactor, year - 1);
        const currentAnnualAdditionalCharges = initialMonthlyAdditionalCharges * 12 * Math.pow(inflationFactor, year - 1);

        const annualBillBefore_inflated = (annualUnitsConsumed * currentCostPerUnit) + currentAnnualAdditionalCharges;
        const annualCostOfImported_inflated = annualUnitsImported * currentCostPerUnit;
        const annualCreditForExported_inflated = annualUnitsExported * currentNetMeteringRate;
        const annualBillAfter_inflated = (annualCostOfImported_inflated - annualCreditForExported_inflated) + currentAnnualAdditionalCharges;
        const currentAnnualSavings = annualBillBefore_inflated - annualBillAfter_inflated;
        const currentAnnualEMI = (year <= loanTenure && annualEMI > 0) ? annualEMI : 0;
        const netAnnualCashFlow = currentAnnualSavings - currentAnnualEMI;
        cumulativeNetCashFlow += netAnnualCashFlow;

        let rowClass = '';
        if (cumulativeNetCashFlow >= 0 && breakevenYearNum === -1) {
            breakevenYearNum = year;
            rowClass = 'ssc-highlight-row';
        }

        tableHTML += `<tr class="${rowClass}">
                        <td>${year}</td>
                        <td><span class="${getColorClass(currentAnnualSavings)}">${formatCurrency(currentAnnualSavings)}</span></td>
                        <td>${formatCurrency(currentAnnualEMI)}</td>
                        <td><span class="${getColorClass(netAnnualCashFlow)}">${formatCurrency(netAnnualCashFlow)}</span></td>
                        <td><span class="${getColorClass(cumulativeNetCashFlow)}">${formatCurrency(cumulativeNetCashFlow)}</span></td>
                      </tr>`;
    }

    tableHTML += `</tbody></table>`;

    let summary = '';
    let returnValue = '';
    if (breakevenYearNum === 0) {
        summary = "Immediate Breakeven (Net Project Cost ≤ 0).";
        returnValue = "Immediate";
    } else if (breakevenYearNum > 0) {
        summary = `Financed Breakeven Occurs in Year ${breakevenYearNum}.`;
        returnValue = formatNumber(breakevenYearNum, 0, 'Years');
    } else if (initialAnnualSavings <= 0 && netInitialCost > 0 && inflationRate <= 0) {
        summary = "Breakeven unlikely with no initial savings & no inflation.";
        returnValue = "N/A (No Savings)";
    } else {
        summary = `Breakeven point not reached within ${maxYears} years.`;
        returnValue = `> ${maxYears} Years`;
    }

    container.innerHTML = tableHTML + `<p class="ssc-summary-text">${summary}</p>`;
    return returnValue;
}

// --- Reset Form ---
function resetForm() {
    ['subsidyAmount', 'downPayment', 'loanTenure', 'interestRate', 'kwInstalled', 'unitsPerKwDay', 'avgUnitsConsumed', 'costPerUnit', 'additionalCharges', 'inflationRate', 'netMeteringRate', 'manualKwInput']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.classList.remove('ssc-input-error');
            }
        });
    const totalEl = document.getElementById('totalCost');
    if (totalEl) {
        totalEl.value = '';
        totalEl.classList.remove('ssc-input-error');
        totalEl.placeholder = "Enter project cost";
    }
    document.getElementById('manualKwInputGroup').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('initialMessage').style.display = 'block';
}

// --- Calculator Mode Switcher ---
let currentMode = 'capex';

function switchCalculatorMode(mode) {
    currentMode = mode;
    const solarForm = document.getElementById('solarForm');
    const rescoForm = document.getElementById('rescoForm');
    const resultsSection = document.getElementById('resultsSection');
    const rescoResultsSection = document.getElementById('rescoResultsSection');
    const initialMessage = document.getElementById('initialMessage');
    const capexBtn = document.getElementById('capexModeBtn');
    const rescoBtn = document.getElementById('rescoModeBtn');

    if (mode === 'capex') {
        solarForm.style.display = '';
        rescoForm.style.display = 'none';
        rescoResultsSection.style.display = 'none';
        capexBtn.classList.add('active');
        rescoBtn.classList.remove('active');
        if (resultsSection.innerHTML.trim() && document.querySelector('#resultsTable tbody tr')) {
            resultsSection.style.display = 'block';
            initialMessage.style.display = 'none';
        } else {
            resultsSection.style.display = 'none';
            initialMessage.style.display = 'block';
        }
    } else {
        solarForm.style.display = 'none';
        rescoForm.style.display = '';
        resultsSection.style.display = 'none';
        rescoBtn.classList.add('active');
        capexBtn.classList.remove('active');
        if (rescoResultsSection.innerHTML.trim() && document.querySelector('#rescoSummary .ssc-summary-card')) {
            rescoResultsSection.style.display = 'block';
            initialMessage.style.display = 'none';
        } else {
            rescoResultsSection.style.display = 'none';
            initialMessage.style.display = 'block';
        }
    }
}

// --- Initial defaults & Reset wiring ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('kwInstalled').value = '3';
    document.getElementById('subsidyAmount').value = 78000;
    document.getElementById('downPayment').value = 32000;
    document.getElementById('loanTenure').value = 10;
    document.getElementById('interestRate').value = 6;
    document.getElementById('unitsPerKwDay').value = 4.2;
    document.getElementById('avgUnitsConsumed').value = 400;
    document.getElementById('costPerUnit').value = 8;
    document.getElementById('inflationRate').value = 4.0;
    document.getElementById('netMeteringRate').value = 2.95;

    // Trigger dependent logic (auto-fill totalCost, show/hide manual kW group)
    // only after every default value above is in place.
    document.getElementById('kwInstalled').dispatchEvent(new Event('change'));

    document.getElementById('initialMessage').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
});
