/**
 * GST Calculator Script for Ray2Volt Toolbox
 */
document.addEventListener('DOMContentLoaded', () => {
    // HELPER: Format to Rupees
    const formatToRupees = (num) => {
        if (typeof num !== 'number' || !isFinite(num)) { num = 0; }
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
    };

    // --- GST CALCULATOR LOGIC ---
    const gstAmountInput = document.getElementById('gstAmount');
    const gstRateInputGst = document.getElementById('gstRate');
    const quickRateBtns = document.querySelectorAll('.gst-rate-btn');
    const addGstBtn = document.getElementById('addGstBtn');
    const removeGstBtn = document.getElementById('removeGstBtn');
    const intraStateBtn = document.getElementById('intraStateBtn');
    const interStateBtn = document.getElementById('interStateBtn');
    const baseAmountOutput = document.getElementById('baseAmountOutput');
    const totalAmountOutput = document.getElementById('totalAmountOutput');
    const cgstAmountOutput = document.getElementById('cgstAmountOutput');
    const sgstAmountOutput = document.getElementById('sgstAmountOutput');
    const igstAmountOutput = document.getElementById('igstAmountOutput');
    const intraStateOutputDiv = document.getElementById('intraStateOutput');
    const intraStateOutputDiv2 = document.getElementById('intraStateOutput2');
    const interStateOutputDiv = document.getElementById('interStateOutput');

    let gstMethod = 'add';
    let gstType = 'intra';

    function calculateAndDisplayGST() {
        if (!gstAmountInput) return;
        const amount = parseFloat(gstAmountInput.value) || 0;
        const rate = parseFloat(gstRateInputGst.value) || 0;
        let baseAmount = 0, totalGst = 0, totalAmount = 0;

        if (amount > 0 && rate > 0) {
            if (gstMethod === 'add') {
                baseAmount = amount;
                totalGst = baseAmount * (rate / 100);
                totalAmount = baseAmount + totalGst;
            } else {
                totalAmount = amount;
                baseAmount = totalAmount / (1 + (rate / 100));
                totalGst = totalAmount - baseAmount;
            }
        }

        baseAmountOutput.textContent = formatToRupees(baseAmount);
        totalAmountOutput.textContent = formatToRupees(totalAmount);

        if (gstType === 'intra') {
            const halfGst = totalGst / 2;
            cgstAmountOutput.textContent = formatToRupees(halfGst);
            sgstAmountOutput.textContent = formatToRupees(halfGst);
            intraStateOutputDiv.style.display = '';
            if (intraStateOutputDiv2) intraStateOutputDiv2.style.display = '';
            interStateOutputDiv.style.display = 'none';
        } else {
            igstAmountOutput.textContent = formatToRupees(totalGst);
            intraStateOutputDiv.style.display = 'none';
            if (intraStateOutputDiv2) intraStateOutputDiv2.style.display = 'none';
            interStateOutputDiv.style.display = '';
        }
    }

    if (gstAmountInput) {
        const gstInputs = [gstAmountInput, gstRateInputGst];
        gstInputs.forEach(input => input.addEventListener('input', calculateAndDisplayGST));

        quickRateBtns.forEach(btn => btn.addEventListener('click', () => {
            gstRateInputGst.value = btn.dataset.rate;
            quickRateBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calculateAndDisplayGST();
        }));

        addGstBtn.addEventListener('click', () => {
            gstMethod = 'add';
            addGstBtn.classList.add('active');
            removeGstBtn.classList.remove('active');
            calculateAndDisplayGST();
        });

        removeGstBtn.addEventListener('click', () => {
            gstMethod = 'remove';
            removeGstBtn.classList.add('active');
            addGstBtn.classList.remove('active');
            calculateAndDisplayGST();
        });

        intraStateBtn.addEventListener('click', () => {
            gstType = 'intra';
            intraStateBtn.classList.add('active');
            interStateBtn.classList.remove('active');
            calculateAndDisplayGST();
        });

        interStateBtn.addEventListener('click', () => {
            gstType = 'inter';
            interStateBtn.classList.add('active');
            intraStateBtn.classList.remove('active');
            calculateAndDisplayGST();
        });

        calculateAndDisplayGST();
    }
});
