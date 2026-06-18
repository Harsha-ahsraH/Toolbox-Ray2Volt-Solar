/**
 * Proforma Invoice Generator - page adapter for the shared financial document module.
 */

document.addEventListener('DOMContentLoaded', () => {
    const Docs = window.Ray2VoltFinancialDocuments;

    if (!Docs) {
        console.error('Ray2VoltFinancialDocuments module is required before proforma-invoice.js');
        return;
    }

    const byId = (id) => document.getElementById(id);
    const valueOr = (element, fallback) => element?.value || fallback;

    const piNameInput = byId('piName');
    const piAddressInput = byId('piAddress');
    const piPhoneInput = byId('piPhone');
    const piEmailInput = byId('piEmail');
    const piGstinInput = byId('piGstin');
    const piDateInput = byId('piDate');
    const piNumberInput = byId('piNumber');
    const piItemsContainer = byId('piItemsContainer');
    const piAddItemBtn = byId('piAddItemBtn');
    const piGenerateBtn = byId('piGenerateBtn');
    const piPrintBtn = byId('piPrintBtn');
    const piPreview = byId('proformaInvoicePreview');

    const piItemsTableBody = byId('piItemsTableBody');
    const lineItems = Docs.setupLineItems({
        container: piItemsContainer,
        addButton: piAddItemBtn,
        prefix: 'pi',
        fieldClassPrefix: 'pi-',
        removeFunctionName: 'removePiItem',
        minItemsMessage: 'You must have at least one item in the proforma invoice.',
        includeHsn: true
    });

    if (piGenerateBtn) {
        piGenerateBtn.addEventListener('click', () => {
            const piNumberInputVal = piNumberInput?.value?.trim();
            const piNo = piNumberInputVal || Docs.generateDocumentNumber('R2VPI');
            const items = lineItems.collectItems();
            const totalGrandAmount = Docs.totalAmount(items);

            Docs.setText(byId('piDispName'), valueOr(piNameInput, 'N/A'));
            Docs.setText(byId('piDispAddress'), valueOr(piAddressInput, 'N/A'));
            Docs.setText(byId('piDispPhone'), valueOr(piPhoneInput, 'N/A'));
            Docs.setText(byId('piDispEmail'), valueOr(piEmailInput, 'NA'));
            Docs.setText(byId('piDispGst'), valueOr(piGstinInput, 'NA'));
            Docs.setText(byId('piDispInvoiceNo'), piNo);
            Docs.setText(byId('piNumberDisplay'), piNo);
            Docs.setText(byId('piDispDate'), Docs.formatDateInput(piDateInput?.value));

            if (piItemsTableBody) {
                piItemsTableBody.innerHTML = Docs.renderItemsTable(items, { includeHsn: true });
            }

            Docs.setText(byId('piDispGrandTotal'), Docs.formatRupeeTotal(totalGrandAmount));
            Docs.setText(byId('piDispAmountWords'), Docs.numberToWords(totalGrandAmount));
            Docs.showPreview(piPreview);
        });
    }

    if (piPrintBtn) {
        piPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
