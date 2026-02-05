/**
 * Warranty Card Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Generates 5-page A4 warranty certificates
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const warrantyProjectId = document.getElementById('warrantyProjectId');
    const warrantyCustomerName = document.getElementById('warrantyCustomerName');
    const warrantyAddress = document.getElementById('warrantyAddress');
    const warrantyPhone = document.getElementById('warrantyPhone');
    const warrantyProjectSpecs = document.getElementById('warrantyProjectSpecs');
    const warrantyModuleBrand = document.getElementById('warrantyModuleBrand');
    const warrantyModuleWarranty = document.getElementById('warrantyModuleWarranty');
    const warrantyInverterName = document.getElementById('warrantyInverterName');
    const warrantyInverterWarranty = document.getElementById('warrantyInverterWarranty');
    const warrantyDcrCertificate = document.getElementById('warrantyDcrCertificate');
    const warrantyInstallDate = document.getElementById('warrantyInstallDate');

    const generateWarrantyBtn = document.getElementById('generateWarrantyBtn');
    const printWarrantyBtn = document.getElementById('printWarrantyBtn');
    const warrantyPreview = document.getElementById('warrantyPreview');

    // --- HELPER: Format Date ---
    function formatDate(dateStr) {
        if (!dateStr) {
            return new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    // --- HELPER: Calculate Warranty End Date ---
    function calculateWarrantyEnd(startDate, years) {
        const date = new Date(startDate || new Date());
        date.setFullYear(date.getFullYear() + years);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    // --- GENERATE WARRANTY CARD ---
    if (generateWarrantyBtn) {
        generateWarrantyBtn.addEventListener('click', () => {
            // Gather input data
            const projectId = warrantyProjectId?.value || 'R2V-XXXX-XXXX';
            const customerName = warrantyCustomerName?.value || 'Valued Customer';
            const address = warrantyAddress?.value || 'N/A';
            const phone = warrantyPhone?.value || 'N/A';
            const projectSpecs = warrantyProjectSpecs?.value || 'Solar Power Plant';
            const moduleBrand = warrantyModuleBrand?.value || 'Premium Solar Module';
            const moduleWarranty = warrantyModuleWarranty?.value || '25';
            const inverterName = warrantyInverterName?.value || 'Grid-Tie Inverter';
            const inverterWarranty = warrantyInverterWarranty?.value || '5';
            const dcrCertificate = warrantyDcrCertificate?.value || 'N/A';
            const installDate = warrantyInstallDate?.value;

            const formattedDate = formatDate(installDate);
            const currentYear = new Date().getFullYear();

            // Calculate warranty end dates
            const moduleWarrantyEnd = calculateWarrantyEnd(installDate, parseInt(moduleWarranty) || 25);
            const inverterWarrantyEnd = calculateWarrantyEnd(installDate, parseInt(inverterWarranty) || 5);

            // Populate Page 1: Cover Page
            document.getElementById('coverProjectId').textContent = projectId;
            document.getElementById('coverCustomerName').textContent = customerName;
            document.getElementById('coverDate').textContent = formattedDate;

            // Populate Page 2: Project Details
            document.getElementById('detailProjectId').textContent = projectId;
            document.getElementById('detailCustomerName').textContent = customerName;
            document.getElementById('detailAddress').textContent = address;
            document.getElementById('detailPhone').textContent = phone;
            document.getElementById('detailInstallDate').textContent = formattedDate;
            document.getElementById('detailProjectSpecs').textContent = projectSpecs;
            document.getElementById('detailModuleBrand').textContent = moduleBrand;
            document.getElementById('detailModuleWarranty').textContent = moduleWarranty + ' Years';
            document.getElementById('detailInverterName').textContent = inverterName;
            document.getElementById('detailInverterWarranty').textContent = inverterWarranty + ' Years';

            // Populate Page 3: Solar Module Warranty
            document.getElementById('moduleWarrantyPeriod').textContent = moduleWarranty + ' Years';
            document.getElementById('moduleWarrantyEnd').textContent = moduleWarrantyEnd;
            document.getElementById('moduleBrandName').textContent = moduleBrand;

            // Populate Page 4: Inverter Warranty
            document.getElementById('inverterWarrantyPeriod').textContent = inverterWarranty + ' Years';
            document.getElementById('inverterWarrantyEnd').textContent = inverterWarrantyEnd;
            document.getElementById('inverterBrandName').textContent = inverterName;

            // Populate Page 5: General Terms
            document.getElementById('dcrCertNumber').textContent = dcrCertificate;
            document.getElementById('warrantyIssueDate').textContent = formattedDate;

            // Update all page footers
            const pageNumbers = document.querySelectorAll('.warranty-page-number');
            pageNumbers.forEach((el, index) => {
                el.textContent = `Page ${index + 1} of 5`;
            });

            const projectIdFooters = document.querySelectorAll('.warranty-footer-project-id');
            projectIdFooters.forEach(el => {
                el.textContent = `Project: ${projectId}`;
            });

            // Show preview
            if (warrantyPreview) {
                warrantyPreview.classList.add('visible');
                warrantyPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (printWarrantyBtn) {
        printWarrantyBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
