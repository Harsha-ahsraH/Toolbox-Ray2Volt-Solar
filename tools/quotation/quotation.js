/**
 * Quotation Generator - page adapter for the shared financial document module.
 */

document.addEventListener('DOMContentLoaded', () => {
    const Docs = window.Ray2VoltFinancialDocuments;

    if (!Docs) {
        console.error('Ray2VoltFinancialDocuments module is required before quotation.js');
        return;
    }

    const byId = (id) => document.getElementById(id);
    const valueOr = (element, fallback) => element?.value || fallback;

    const quoNameInput = byId('quoName');
    const quoAddressInput = byId('quoAddress');
    const quoPhoneInput = byId('quoPhone');
    const quoEmailInput = byId('quoEmail');
    const quoGstinInput = byId('quoGstin');
    const quoDateInput = byId('quoDate');
    const quoNumberInput = byId('quoNumber');
    const quoItemsContainer = byId('quoItemsContainer');
    const quoAddItemBtn = byId('quoAddItemBtn');
    const quoGenerateBtn = byId('quoGenerateBtn');
    const quoPrintBtn = byId('quoPrintBtn');
    const quoPreview = byId('quotationPreview');

    const quoItemsTableBody = byId('quoItemsTableBody');
    const lineItems = Docs.setupLineItems({
        container: quoItemsContainer,
        addButton: quoAddItemBtn,
        prefix: 'quo',
        fieldClassPrefix: 'quo-',
        removeFunctionName: 'removeQuoItem',
        minItemsMessage: 'You must have at least one item in the quotation.',
        includeHsn: true
    });

    if (quoGenerateBtn) {
        quoGenerateBtn.addEventListener('click', () => {
            const quoNumberInputVal = quoNumberInput?.value?.trim();
            const quoNo = quoNumberInputVal || Docs.generateDocumentNumber('R2VQUO');
            const items = lineItems.collectItems();
            const totalGrandAmount = Docs.totalAmount(items);

            Docs.setText(byId('quoDispName'), valueOr(quoNameInput, 'N/A'));
            Docs.setText(byId('quoDispAddress'), valueOr(quoAddressInput, 'N/A'));
            Docs.setText(byId('quoDispPhone'), valueOr(quoPhoneInput, 'N/A'));
            Docs.setText(byId('quoDispEmail'), valueOr(quoEmailInput, 'NA'));
            Docs.setText(byId('quoDispGst'), valueOr(quoGstinInput, 'NA'));
            Docs.setText(byId('quoDispInvoiceNo'), quoNo);
            Docs.setText(byId('quoNumberDisplay'), quoNo);
            Docs.setText(byId('quoDispDate'), Docs.formatDateInput(quoDateInput?.value));

            if (quoItemsTableBody) {
                quoItemsTableBody.innerHTML = Docs.renderItemsTable(items, { includeHsn: true });
            }

            Docs.setText(byId('quoDispGrandTotal'), Docs.formatRupeeTotal(totalGrandAmount));
            Docs.setText(byId('quoDispAmountWords'), Docs.numberToWords(totalGrandAmount));
            Docs.showPreview(quoPreview);
        });
    }

    if (quoPrintBtn) {
        quoPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

});
