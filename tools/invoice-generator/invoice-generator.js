/**
 * Invoice Generator - page adapter for the shared financial document module.
 */

document.addEventListener('DOMContentLoaded', () => {
    const Docs = window.Ray2VoltFinancialDocuments;

    if (!Docs) {
        console.error('Ray2VoltFinancialDocuments module is required before invoice.js');
        return;
    }

    const byId = (id) => document.getElementById(id);
    const valueOr = (element, fallback) => element?.value || fallback;

    const invoiceNameInput = byId('invoiceName');
    const invoiceAddressInput = byId('invoiceAddress');
    const invoicePhoneInput = byId('invoicePhone');
    const invoiceEmailInput = byId('invoiceEmail');
    const invoiceGstinInput = byId('invoiceGstin');
    const invoiceDateInput = byId('invoiceDate');
    const invoiceNumberInput = byId('invoiceNumber');
    const invoiceItemsContainer = byId('invoiceItemsContainer');
    const addInvoiceItemBtn = byId('addInvoiceItemBtn');
    const generateInvoiceBtn = byId('generateInvoiceBtn');
    const printInvoiceBtn = byId('printInvoiceBtn');
    const invoicePreview = byId('invoicePreview');

    const invItemsTableBody = byId('invItemsTableBody');
    const lineItems = Docs.setupLineItems({
        container: invoiceItemsContainer,
        addButton: addInvoiceItemBtn,
        prefix: 'inv',
        fieldClassPrefix: '',
        removeFunctionName: 'removeInvoiceItem',
        minItemsMessage: 'You must have at least one item in the invoice.',
        includeHsn: true
    });

    if (generateInvoiceBtn) {
        generateInvoiceBtn.addEventListener('click', () => {
            const invoiceNumberInputVal = invoiceNumberInput?.value?.trim();
            const invoiceNo = invoiceNumberInputVal || Docs.generateDocumentNumber('R2VINV');
            const items = lineItems.collectItems();
            const totalGrandAmount = Docs.totalAmount(items);

            Docs.setText(byId('invDispName'), valueOr(invoiceNameInput, 'N/A'));
            Docs.setText(byId('invDispAddress'), valueOr(invoiceAddressInput, 'N/A'));
            Docs.setText(byId('invDispPhone'), valueOr(invoicePhoneInput, 'N/A'));
            Docs.setText(byId('invDispEmail'), valueOr(invoiceEmailInput, 'NA'));
            Docs.setText(byId('invDispGst'), valueOr(invoiceGstinInput, 'NA'));
            Docs.setText(byId('invDispInvoiceNo'), invoiceNo);
            Docs.setText(byId('invoiceNumberDisplay'), invoiceNo);
            Docs.setText(byId('invDispDate'), Docs.formatDateInput(invoiceDateInput?.value));

            if (invItemsTableBody) {
                invItemsTableBody.innerHTML = Docs.renderItemsTable(items, { includeHsn: true });
            }

            Docs.setText(byId('invDispGrandTotal'), Docs.formatRupeeTotal(totalGrandAmount));
            Docs.setText(byId('invDispAmountWords'), Docs.numberToWords(totalGrandAmount));
            Docs.showPreview(invoicePreview);
        });
    }

    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
