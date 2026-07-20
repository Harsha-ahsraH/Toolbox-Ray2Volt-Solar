/**
 * Purchase Order Generator - page adapter for the shared financial document module.
 */

document.addEventListener('DOMContentLoaded', () => {
    const Docs = window.Ray2VoltFinancialDocuments;

    if (!Docs) {
        console.error('Ray2VoltFinancialDocuments module is required before purchase-order.js');
        return;
    }

    const byId = (id) => document.getElementById(id);
    const valueOr = (element, fallback) => element?.value || fallback;

    const poNameInput = byId('poName');
    const poAddressInput = byId('poAddress');
    const poPhoneInput = byId('poPhone');
    const poEmailInput = byId('poEmail');
    const poGstinInput = byId('poGstin');
    const poDateInput = byId('poDate');
    const poNumberInput = byId('poNumber');
    const poDeliveryAddressInput = byId('poDeliveryAddress');
    const poTermsInput = byId('poTerms');
    const poItemsContainer = byId('poItemsContainer');
    const poAddItemBtn = byId('poAddItemBtn');
    const poGenerateBtn = byId('poGenerateBtn');
    const poPrintBtn = byId('poPrintBtn');
    const poPreview = byId('purchaseOrderPreview');

    const poItemsTableBody = byId('poItemsTableBody');
    const lineItems = Docs.setupLineItems({
        container: poItemsContainer,
        addButton: poAddItemBtn,
        prefix: 'po',
        fieldClassPrefix: 'po-',
        removeFunctionName: 'removePoItem',
        minItemsMessage: 'You must have at least one item in the purchase order.',
        includeHsn: false
    });

    if (poGenerateBtn) {
        poGenerateBtn.addEventListener('click', () => {
            const poNumberInputVal = poNumberInput?.value?.trim();
            const poNo = poNumberInputVal || Docs.generateDocumentNumber('R2VPO');
            const deliveryAddress = poDeliveryAddressInput?.value?.trim() || '';
            const items = lineItems.collectItems();
            const totalGrandAmount = Docs.totalAmount(items);

            Docs.setText(byId('poDispName'), valueOr(poNameInput, 'N/A'));
            Docs.setText(byId('poDispAddress'), valueOr(poAddressInput, 'N/A'));
            Docs.setText(byId('poDispPhone'), valueOr(poPhoneInput, 'N/A'));
            Docs.setText(byId('poDispEmail'), valueOr(poEmailInput, 'NA'));
            Docs.setText(byId('poDispGst'), valueOr(poGstinInput, 'NA'));
            Docs.setText(byId('poDispOrderNo'), poNo);
            Docs.setText(byId('poNumberDisplay'), poNo);
            Docs.setText(byId('poDispDate'), Docs.formatDateInput(poDateInput?.value));

            const deliveryRow = byId('poDispDeliveryRow');
            const deliveryValue = byId('poDispDelivery');
            if (deliveryAddress && deliveryRow && deliveryValue) {
                deliveryValue.textContent = deliveryAddress;
                deliveryRow.style.display = 'block';
            } else if (deliveryRow) {
                deliveryRow.style.display = 'none';
            }

            if (poItemsTableBody) {
                poItemsTableBody.innerHTML = Docs.renderItemsTable(items);
            }

            Docs.setText(byId('poDispGrandTotal'), Docs.formatRupeeTotal(totalGrandAmount));
            Docs.setText(byId('poDispAmountWords'), Docs.numberToWords(totalGrandAmount));

            const poDispTerms = byId('poDispTerms');
            const termsText = poTermsInput?.value?.trim();
            if (poDispTerms) {
                poDispTerms.innerHTML = termsText
                    ? termsText
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => `<p>${Docs.escapeHtml(line)}</p>`)
                        .join('')
                    : '<p>Happy doing business with you!</p>';
            }

            Docs.showPreview(poPreview);
        });
    }

    if (poPrintBtn) {
        poPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const poDownloadBtn = byId('poDownloadBtn');
    if (poDownloadBtn) {
        poDownloadBtn.addEventListener('click', () => {
            if (!poPreview?.classList.contains('visible')) {
                poGenerateBtn?.click();
            }

            window.Ray2VoltPdfDownload?.downloadElement({
                element: poPreview,
                button: poDownloadBtn,
                filename: `Ray2Volt-Purchase-Order-${byId('poDispOrderNo')?.textContent || 'Draft'}`
            });
        });
    }
});
