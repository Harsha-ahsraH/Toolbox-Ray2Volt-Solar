/**
 * Request for Quotation Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const rfqVendorNameInput = document.getElementById('rfqVendorName');
    const rfqVendorAddressInput = document.getElementById('rfqVendorAddress');
    const rfqVendorPhoneInput = document.getElementById('rfqVendorPhone');
    const rfqVendorEmailInput = document.getElementById('rfqVendorEmail');
    const rfqVendorGstinInput = document.getElementById('rfqVendorGstin');
    
    const rfqHeadingInput = document.getElementById('rfqHeading');
    const rfqDateInput = document.getElementById('rfqDate');
    const rfqNumberInput = document.getElementById('rfqNumber');
    
    const rfqBodyInput = document.getElementById('rfqBody');
    
    const rfqGenerateBtn = document.getElementById('rfqGenerateBtn');
    const rfqPrintBtn = document.getElementById('rfqPrintBtn');
    const rfqPreview = document.getElementById('rfqPreview');

    // --- OUTPUT ELEMENTS ---
    const rfqDispHeading = document.getElementById('rfqDispHeading');
    const rfqDispNumber = document.getElementById('rfqDispNumber');
    
    const rfqDispVendorName = document.getElementById('rfqDispVendorName');
    const rfqDispVendorAddress = document.getElementById('rfqDispVendorAddress');
    const rfqDispVendorPhone = document.getElementById('rfqDispVendorPhone');
    const rfqDispVendorEmail = document.getElementById('rfqDispVendorEmail');
    const rfqDispVendorGstin = document.getElementById('rfqDispVendorGstin');
    const rfqDispDate = document.getElementById('rfqDispDate');
    
    const rfqDispBody = document.getElementById('rfqDispBody');

    // --- SET DEFAULT DATE ---
    if(rfqDateInput) {
        rfqDateInput.valueAsDate = new Date();
    }

    // --- GENERATE RFQ PREVIEW ---
    if (rfqGenerateBtn) {
        rfqGenerateBtn.addEventListener('click', () => {
            // 1. Gather Input Data
            const vendorName = rfqVendorNameInput?.value || 'N/A';
            const vendorAddress = rfqVendorAddressInput?.value || 'N/A';
            const vendorPhone = rfqVendorPhoneInput?.value || 'N/A';
            const vendorEmail = rfqVendorEmailInput?.value || 'N/A';
            const vendorGstin = rfqVendorGstinInput?.value || 'N/A';
            
            const heading = rfqHeadingInput?.value || 'REQUEST FOR QUOTATION';
            const dateVal = rfqDateInput?.value;
            const dateFormatted = dateVal
                ? new Date(dateVal).toLocaleDateString('en-GB').replace(/\//g, '-')
                : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

            // 2. Generate or use provided RFQ Number
            const rfqNumberInputVal = rfqNumberInput?.value?.trim();
            let rfqNo;
            if (rfqNumberInputVal) {
                rfqNo = rfqNumberInputVal;
            } else {
                const today = new Date();
                const year = today.getFullYear().toString().substr(-2);
                const month = ('0' + (today.getMonth() + 1)).slice(-2);
                const randomNum = Math.floor(100 + Math.random() * 900); // 3 digit random
                rfqNo = `R2VRFQ${month}${year}-${randomNum}`;
            }

            // 3. Process Markdown Body
            const markdownText = rfqBodyInput?.value || 'No content provided.';
            let parsedHtml = '';
            
            // Check if marked is loaded
            if (typeof marked !== 'undefined') {
                try {
                    parsedHtml = marked.parse(markdownText);
                } catch (e) {
                    console.error("Error parsing markdown:", e);
                    parsedHtml = `<p>${markdownText.replace(/\n/g, '<br>')}</p>`;
                }
            } else {
                console.warn("marked.js is not loaded. Falling back to basic text rendering.");
                parsedHtml = `<p>${markdownText.replace(/\n/g, '<br>')}</p>`;
            }

            // 4. Populate Document Fields
            if (rfqDispHeading) rfqDispHeading.textContent = heading;
            if (rfqDispNumber) rfqDispNumber.textContent = rfqNo;
            
            if (rfqDispVendorName) rfqDispVendorName.textContent = vendorName;
            if (rfqDispVendorAddress) rfqDispVendorAddress.textContent = vendorAddress;
            if (rfqDispVendorPhone) rfqDispVendorPhone.textContent = vendorPhone;
            if (rfqDispVendorEmail) rfqDispVendorEmail.textContent = vendorEmail;
            if (rfqDispVendorGstin) rfqDispVendorGstin.textContent = vendorGstin;
            if (rfqDispDate) rfqDispDate.textContent = dateFormatted;
            
            if (rfqDispBody) rfqDispBody.innerHTML = parsedHtml;

            // 5. Show Preview Container
            if (rfqPreview) {
                rfqPreview.classList.add('visible');
                rfqPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (rfqPrintBtn) {
        rfqPrintBtn.addEventListener('click', () => {
            if (!rfqPreview.classList.contains('visible')) {
                // Generate preview automatically if they haven't yet
                rfqGenerateBtn.click();
            }
            // Small delay to ensure rendering (especially if markdown text is heavy)
            setTimeout(() => {
                window.print();
            }, 100);
        });
    }
});
