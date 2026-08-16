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
// Start from 3 because 1 (Basic Salary) and 2 (Commission) are fixed
let earningCounter = 2;
let deductionCounter = 0;

// Add Earning Item
function addEarningItem() {
    const container = document.getElementById('earningsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'ps-item-row earning-item';

    // Calculate index for display (Offset by 2 for fixed items)
    const displayIndex = earningCounter + 1;
    newItem.dataset.itemIndex = earningCounter;

    newItem.innerHTML = `
        <div class="ps-item-header">
            <span class="ps-item-number">Earning ${displayIndex}</span>
            <button type="button" class="ps-btn-remove" onclick="removePayslipItem(this)" title="Remove Item">&times;</button>
        </div>
        <div class="ps-item-fields">
            <div class="ps-input-group">
                <label>Description</label>
                <input type="text" class="ps-input-field earning-desc" placeholder="e.g. Bonus, Allowance">
            </div>
            <div class="ps-input-group">
                <label>Amount (₹)</label>
                <input type="number" class="ps-input-field earning-amount" placeholder="0">
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
    newItem.className = 'ps-item-row deduction-item';

    const displayIndex = deductionCounter + 1;
    newItem.dataset.itemIndex = deductionCounter;

    newItem.innerHTML = `
        <div class="ps-item-header">
            <span class="ps-item-number">Deduction ${displayIndex}</span>
            <button type="button" class="ps-btn-remove" onclick="removePayslipItem(this)" title="Remove Item">&times;</button>
        </div>
        <div class="ps-item-fields">
            <div class="ps-input-group">
                <label>Description</label>
                <input type="text" class="ps-input-field deduction-desc" placeholder="e.g. TDS, PF">
            </div>
            <div class="ps-input-group">
                <label>Amount (₹)</label>
                <input type="number" class="ps-input-field deduction-amount" placeholder="0">
            </div>
        </div>
    `;
    container.appendChild(newItem);
    deductionCounter++;
    renumberItems('deduction');
}

// Remove Item
function removePayslipItem(button) {
    const itemRow = button.closest('.ps-item-row');
    const isEarning = itemRow.classList.contains('earning-item');
    itemRow.remove();
    renumberItems(isEarning ? 'earning' : 'deduction');
}

// Renumber items after add/remove
function renumberItems(type) {
    const selector = type === 'earning' ? '.earning-item' : '.deduction-item';
    const items = document.querySelectorAll(selector);

    // Offset: Earnings start after 2 fixed items. Deductions start from 1.
    const offset = type === 'earning' ? 2 : 0;

    items.forEach((item, index) => {
        const label = type === 'earning' ? 'Earning' : 'Deduction';
        const displayNum = index + 1 + offset;
        item.querySelector('.ps-item-number').textContent = `${label} ${displayNum}`;
        item.dataset.itemIndex = index + offset;
    });

    if (type === 'earning') {
        earningCounter = items.length + 2;
    } else {
        deductionCounter = items.length;
    }
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
    const payslipNumber = document.getElementById('payslipNumber').value || 'R2VPAY' + Math.floor(1000 + Math.random() * 9000);
    const payPeriod = document.getElementById('payslipPayPeriod').value || '-';

    // Format date
    const formattedDate = payslipDate ? new Date(payslipDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) : '-';

    // Display employee info
    setTextContent('dispEmployeeName', employeeName);
    setTextContent('dispEmployeeId', employeeId);
    setTextContent('dispDesignation', designation);
    setTextContent('dispDepartment', department);
    setTextContent('dispJoiningDate', joiningDate ? new Date(joiningDate).toLocaleDateString('en-IN') : '-');
    setTextContent('dispPayPeriod', payPeriod);
    setTextContent('dispPayDate', formattedDate);
    setTextContent('payslipNumberDisplay', payslipNumber);

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
    setTextContent('dispTotalEarnings', `₹${formatNumber(totalEarnings)}`);

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
    setTextContent('dispTotalDeductions', `₹${formatNumber(totalDeductions)}`);

    // Net Pay
    setTextContent('dispNetPay', `₹${formatNumber(netPay)}`);
    setTextContent('dispNetPayWords', numberToWords(netPay) + ' Only');

    // Bank details for employee
    setTextContent('dispEmpBankAccount', bankAccount);
    setTextContent('dispEmpIfsc', ifscCode);
    setTextContent('dispEmpPan', pan);

    // Show preview
    const preview = document.getElementById('payslipPreview');
    if (preview) {
        preview.classList.add('visible');
        preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Helper: Set text content safely
function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Format number with commas (Indian format)
function formatNumber(num) {
    if (typeof num !== 'number' || !isFinite(num)) num = 0;
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Convert number to words (Indian system)
function numberToWords(num) {
    if (num === 0) return 'Zero Rupees';
    if (num < 0) return 'Negative ' + numberToWords(Math.abs(num));

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
