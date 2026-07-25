// Solar Savings Calculator - Report modal open/close/print

function openReportModal() {
    const modal = document.getElementById('reportModal');
    const reqGrid = document.getElementById('reqSummaryGrid');
    const reportFinancial = document.getElementById('reportFinancialTable');
    const reportMonthly = document.getElementById('reportMonthlyTable');
    const reportBreakeven = document.getElementById('reportBreakevenTable');

    const dateEl = document.getElementById('reportDate');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = 'Generated on ' + now.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    const inputs = {
        'System Capacity': document.getElementById('kwInstalled').value === 'manual'
            ? `${document.getElementById('manualKwInput').value} kW`
            : `${document.getElementById('kwInstalled').value} kW`,
        'Total Project Cost': formatCurrency(document.getElementById('totalCost').value),
        'Subsidy': formatCurrency(document.getElementById('subsidyAmount').value),
        'Down Payment': formatCurrency(document.getElementById('downPayment').value),
        'Loan Tenure': `${document.getElementById('loanTenure').value} Years`,
        'Interest Rate': `${document.getElementById('interestRate').value}%`,
        'Monthly Consumption': `${document.getElementById('avgUnitsConsumed').value} kWh`,
        'Grid Rate': `₹${document.getElementById('costPerUnit').value} / kWh`
    };

    let gridHTML = '';
    for (const [label, value] of Object.entries(inputs)) {
        gridHTML += `
            <div class="ssc-req-item">
                <span class="ssc-req-label">${label}</span>
                <span class="ssc-req-value">${value}</span>
            </div>
        `;
    }
    reqGrid.innerHTML = gridHTML;

    // Mirror the headline returns from the on-screen strip so the report and
    // the calculator can never disagree.
    const returnsCards = document.querySelectorAll('#capexReturnsSummary .ssc-summary-card-value');
    ['reportRoi', 'reportIrr', 'reportPayback'].forEach((id, index) => {
        const target = document.getElementById(id);
        if (target && returnsCards[index]) {
            target.textContent = returnsCards[index].textContent.trim();
        }
    });

    const resultsTableOriginal = document.getElementById('resultsTable');
    if (resultsTableOriginal) {
        reportFinancial.innerHTML = '';
        reportFinancial.appendChild(resultsTableOriginal.cloneNode(true));
    }

    const monthlyTableOriginal = document.querySelector('#monthlyCostsComparison table');
    if (monthlyTableOriginal) {
        reportMonthly.innerHTML = '';
        reportMonthly.appendChild(monthlyTableOriginal.cloneNode(true));
    }

    const breakevenTableOriginal = document.querySelector('#breakevenAnalysis table');
    if (breakevenTableOriginal) {
        reportBreakeven.innerHTML = '';
        reportBreakeven.appendChild(breakevenTableOriginal.cloneNode(true));

        const breakevenSummaryOriginal = document.querySelector('#breakevenAnalysis .ssc-summary-text');
        if (breakevenSummaryOriginal) {
            reportBreakeven.appendChild(breakevenSummaryOriginal.cloneNode(true));
        }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function printReport() {
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('reportModal');
    if (!modal) return;
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeReportModal();
        }
    });
});
