// ============================================
// PAYSLIP GENERATOR - JavaScript Logic
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Set default date to today
    const payslipDateInput = document.getElementById('payslipDate');
    if (payslipDateInput) {
        payslipDateInput.valueAsDate = new Date();
    }

    // Generate Payslip Preview
    const generatePayslipBtn = document.getElementById('generatePayslipBtn');
    if (generatePayslipBtn) {
        generatePayslipBtn.addEventListener('click', generatePayslipPreview);
    }

    // Print/Save as PDF
    const printPayslipBtn = document.getElementById('printPayslipBtn');
    if (printPayslipBtn) {
        printPayslipBtn.addEventListener('click', function () {
            window.print();
        });
    }

    // Add Earning Button
    const addEarningBtn = document.getElementById('addEarningBtn');
    if (addEarningBtn) {
        addEarningBtn.addEventListener('click', addEarningItem);
    }

    // Add Deduction Button
    const addDeductionBtn = document.getElementById('addDeductionBtn');
    if (addDeductionBtn) {
        addDeductionBtn.addEventListener('click', addDeductionItem);
    }
});

// Counter for dynamic items
let earningCounter = 2;
let deductionCounter = 1;

// Add Earning Item
function addEarningItem() {
    const container = document.getElementById('earningsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'payslip-item-row earning-item';
    newItem.dataset.itemIndex = earningCounter;
    newItem.innerHTML = `
        <div class="item-row-header">
            <span class="item-number">Earning ${earningCounter + 1}</span>
            <button type="button" class="btn-remove-item" onclick="removePayslipItem(this)" title="Remove Item">&times;</button>
        </div>
        <div class="item-fields">
            <div class="input-group">
                <label>Description</label>
                <input type="text" class="input-field earning-desc" placeholder="e.g. Bonus, Allowance">
            </div>
            <div class="input-group">
                <label>Amount (₹)</label>
                <input type="number" class="input-field earning-amount" placeholder="0">
            </div>
        </div>
    `;
    container.appendChild(newItem);
    earningCounter++;
    renumberItems('earning');
}

// Add Deduction Item
function addDeductionItem() {
    const container = document.getElementById('deductionsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'payslip-item-row deduction-item';
    newItem.dataset.itemIndex = deductionCounter;
    newItem.innerHTML = `
        <div class="item-row-header">
            <span class="item-number">Deduction ${deductionCounter + 1}</span>
            <button type="button" class="btn-remove-item" onclick="removePayslipItem(this)" title="Remove Item">&times;</button>
        </div>
        <div class="item-fields">
            <div class="input-group">
                <label>Description</label>
                <input type="text" class="input-field deduction-desc" placeholder="e.g. TDS, PF">
            </div>
            <div class="input-group">
                <label>Amount (₹)</label>
                <input type="number" class="input-field deduction-amount" placeholder="0">
            </div>
        </div>
    `;
    container.appendChild(newItem);
    deductionCounter++;
    renumberItems('deduction');
}

// Remove Item
function removePayslipItem(button) {
    const itemRow = button.closest('.payslip-item-row');
    const isEarning = itemRow.classList.contains('earning-item');
    itemRow.remove();
    renumberItems(isEarning ? 'earning' : 'deduction');
}

// Renumber items after add/remove
function renumberItems(type) {
    const selector = type === 'earning' ? '.earning-item' : '.deduction-item';
    const items = document.querySelectorAll(selector);
    items.forEach((item, index) => {
        const label = type === 'earning' ? 'Earning' : 'Deduction';
        item.querySelector('.item-number').textContent = `${label} ${index + 1}`;
        item.dataset.itemIndex = index;
    });
}

// Generate Payslip Preview
function generatePayslipPreview() {
    // Get employee details
    const employeeName = document.getElementById('payslipEmployeeName').value || '-';
    const employeeId = document.getElementById('payslipEmployeeId').value || '-';
    const designation = document.getElementById('payslipDesignation').value || '-';
    const department = document.getElementById('payslipDepartment').value || '-';
    const joiningDate = document.getElementById('payslipJoiningDate').value || '-';
    const bankAccount = document.getElementById('payslipBankAccount').value || '-';
    const ifscCode = document.getElementById('payslipIfscCode').value || '-';
    const pan = document.getElementById('payslipPan').value || '-';

    // Get payslip settings
    const payslipDate = document.getElementById('payslipDate').value;
    const payslipNumber = document.getElementById('payslipNumber').value || 'R2VPAY...';
    const payPeriod = document.getElementById('payslipPayPeriod').value || '-';

    // Format date
    const formattedDate = payslipDate ? new Date(payslipDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) : '-';

    // Display employee info
    document.getElementById('dispEmployeeName').textContent = employeeName;
    document.getElementById('dispEmployeeId').textContent = employeeId;
    document.getElementById('dispDesignation').textContent = designation;
    document.getElementById('dispDepartment').textContent = department;
    document.getElementById('dispJoiningDate').textContent = joiningDate ? new Date(joiningDate).toLocaleDateString('en-IN') : '-';
    document.getElementById('dispPayPeriod').textContent = payPeriod;
    document.getElementById('dispPayDate').textContent = formattedDate;
    document.getElementById('payslipNumberDisplay').textContent = payslipNumber;

    // Collect earnings
    const earnings = [];

    // Basic Salary
    const basicSalary = parseFloat(document.getElementById('payslipBasicSalary').value) || 0;
    if (basicSalary > 0) {
        earnings.push({ description: 'Basic Salary', amount: basicSalary });
    }

    // Commission
    const commission = parseFloat(document.getElementById('payslipCommission').value) || 0;
    if (commission > 0) {
        earnings.push({ description: 'Commission', amount: commission });
    }

    // Other earnings
    document.querySelectorAll('.earning-item').forEach(item => {
        const desc = item.querySelector('.earning-desc').value;
        const amount = parseFloat(item.querySelector('.earning-amount').value) || 0;
        if (desc && amount > 0) {
            earnings.push({ description: desc, amount: amount });
        }
    });

    // Collect deductions
    const deductions = [];
    document.querySelectorAll('.deduction-item').forEach(item => {
        const desc = item.querySelector('.deduction-desc').value;
        const amount = parseFloat(item.querySelector('.deduction-amount').value) || 0;
        if (desc && amount > 0) {
            deductions.push({ description: desc, amount: amount });
        }
    });

    // Calculate totals
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netPay = totalEarnings - totalDeductions;

    // Populate earnings table
    const earningsTableBody = document.getElementById('payslipEarningsBody');
    earningsTableBody.innerHTML = '';
    earnings.forEach(e => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${e.description}</td><td>₹${formatNumber(e.amount)}</td>`;
        earningsTableBody.appendChild(row);
    });
    if (earnings.length === 0) {
        earningsTableBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No earnings</td></tr>';
    }
    document.getElementById('dispTotalEarnings').textContent = `₹${formatNumber(totalEarnings)}`;

    // Populate deductions table
    const deductionsTableBody = document.getElementById('payslipDeductionsBody');
    deductionsTableBody.innerHTML = '';
    deductions.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${d.description}</td><td>₹${formatNumber(d.amount)}</td>`;
        deductionsTableBody.appendChild(row);
    });
    if (deductions.length === 0) {
        deductionsTableBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No deductions</td></tr>';
    }
    document.getElementById('dispTotalDeductions').textContent = `₹${formatNumber(totalDeductions)}`;

    // Net Pay
    document.getElementById('dispNetPay').textContent = `₹${formatNumber(netPay)}`;
    document.getElementById('dispNetPayWords').textContent = numberToWords(netPay) + ' Only';

    // Bank details for employee
    document.getElementById('dispEmpBankAccount').textContent = bankAccount;
    document.getElementById('dispEmpIfsc').textContent = ifscCode;
    document.getElementById('dispEmpPan').textContent = pan;

    // Show preview
    document.getElementById('payslipPreview').classList.add('visible');
}

// Format number with commas (Indian format)
function formatNumber(num) {
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Convert number to words (Indian system)
function numberToWords(num) {
    if (num === 0) return 'Zero Rupees';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertHundreds(n) {
        let str = '';
        if (n >= 100) {
            str += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            str += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        }
        if (n > 0) {
            str += ones[n] + ' ';
        }
        return str;
    }

    let result = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num);

    if (crore > 0) result += convertHundreds(crore) + 'Crore ';
    if (lakh > 0) result += convertHundreds(lakh) + 'Lakh ';
    if (thousand > 0) result += convertHundreds(thousand) + 'Thousand ';
    if (hundred > 0) result += convertHundreds(hundred);

    return result.trim() + ' Rupees';
}
