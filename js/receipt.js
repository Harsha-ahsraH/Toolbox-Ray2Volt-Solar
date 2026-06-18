/**
 * Payment Receipt Generator - page adapter for the shared financial document module.
 */

document.addEventListener('DOMContentLoaded', () => {
    const Docs = window.Ray2VoltFinancialDocuments;

    if (!Docs) {
        console.error('Ray2VoltFinancialDocuments module is required before receipt.js');
        return;
    }

    const byId = (id) => document.getElementById(id);
    const valueOr = (element, fallback) => element?.value || fallback;

    const receiptNameInput = byId('receiptName');
    const receiptAddressInput = byId('receiptAddress');
    const receiptPhoneInput = byId('receiptPhone');
    const receiptEmailInput = byId('receiptEmail');
    const receiptGstinInput = byId('receiptGstin');
    const receiptDateInput = byId('receiptDate');
    const receiptNumberInput = byId('receiptNumber');
    const receiptPrevPaymentInput = byId('receiptPrevPayment');
    const receiptCurrentPaymentInput = byId('receiptCurrentPayment');
    const receiptItemsContainer = byId('receiptItemsContainer');
    const addReceiptItemBtn = byId('addReceiptItemBtn');
    const generateReceiptBtn = byId('generateReceiptBtn');
    const printReceiptBtn = byId('printReceiptBtn');
    const receiptPreview = byId('receiptPreview');

    const receiptItemsTableBody = byId('receiptItemsTableBody');
    const lineItems = Docs.setupLineItems({
        container: receiptItemsContainer,
        addButton: addReceiptItemBtn,
        prefix: 'rcpt',
        fieldClassPrefix: '',
        removeFunctionName: 'removeReceiptItem',
        minItemsMessage: 'You must have at least one item in the receipt.',
        includeHsn: false
    });

    if (generateReceiptBtn) {
        generateReceiptBtn.addEventListener('click', () => {
            const receiptNumberInputVal = receiptNumberInput?.value?.trim();
            const receiptNo = receiptNumberInputVal || Docs.generateDocumentNumber('R2VADV');
            const prevPayment = parseFloat(receiptPrevPaymentInput?.value) || 0;
            const currPayment = parseFloat(receiptCurrentPaymentInput?.value) || 0;
            const items = lineItems.collectItems();
            const totalGrandAmount = Docs.totalAmount(items);
            const balance = totalGrandAmount - (prevPayment + currPayment);

            Docs.setText(byId('dispName'), valueOr(receiptNameInput, 'N/A'));
            Docs.setText(byId('dispAddress'), valueOr(receiptAddressInput, 'N/A'));
            Docs.setText(byId('dispPhone'), valueOr(receiptPhoneInput, 'N/A'));
            Docs.setText(byId('dispEmail'), valueOr(receiptEmailInput, 'NA'));
            Docs.setText(byId('dispGst'), valueOr(receiptGstinInput, 'NA'));
            Docs.setText(byId('receiptNumberDisplay'), receiptNo);
            Docs.setText(byId('dispDate'), Docs.formatDateInput(receiptDateInput?.value));

            if (receiptItemsTableBody) {
                receiptItemsTableBody.innerHTML = Docs.renderItemsTable(items);
            }

            Docs.setText(byId('dispGrandTotal'), Docs.formatRupeeTotal(totalGrandAmount));
            Docs.setText(byId('dispAmountWords'), Docs.numberToWords(totalGrandAmount));
            Docs.setText(byId('dispPrevPayment'), Docs.formatRupees(prevPayment));
            Docs.setText(byId('dispCurrPayment'), Docs.formatRupees(currPayment));
            Docs.setText(byId('dispBalance'), Docs.formatRupees(balance));
            Docs.showPreview(receiptPreview);
        });
    }

    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
