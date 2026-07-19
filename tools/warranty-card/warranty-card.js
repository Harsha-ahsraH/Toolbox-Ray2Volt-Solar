/**
 * Warranty Card Generator - Dedicated JavaScript
 * Ray2Volt Solar Toolbox
 * Generates 4-page A4 warranty certificates
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INPUT ELEMENTS ---
    const warrantyProjectId = document.getElementById('warrantyProjectId');
    const warrantyCustomerName = document.getElementById('warrantyCustomerName');
    const warrantyAddress = document.getElementById('warrantyAddress');
    const warrantyPhone = document.getElementById('warrantyPhone');
    const warrantyProjectSpecs = document.getElementById('warrantyProjectSpecs');
    const warrantyModuleBrand = document.getElementById('warrantyModuleBrand');
    const warrantyModuleWarranty = document.getElementById('warrantyModuleWarranty'); // Product Warranty
    const warrantyPerformanceWarranty = document.getElementById('warrantyPerformanceWarranty'); // Performance Warranty
    const warrantyModuleSerials = document.getElementById('warrantyModuleSerials');
    const warrantyInverterName = document.getElementById('warrantyInverterName');
    const warrantyInverterWarranty = document.getElementById('warrantyInverterWarranty');
    const warrantyInverterSerials = document.getElementById('warrantyInverterSerials');
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

    // --- HELPER: Generate Serial Number Grid ---
    function generateSerialGrid(serialText) {
        if (!serialText || !serialText.trim()) {
            return '<p style="color: #666; font-style: italic; grid-column: 1 / -1;">No serial numbers provided.</p>';
        }
        // Split by comm or newline, filter empty
        const serials = serialText.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);

        if (serials.length === 0) {
            return '<p style="color: #666; font-style: italic; grid-column: 1 / -1;">No serial numbers provided.</p>';
        }

        return serials.map(sn => `<div class="serial-number-item">${sn}</div>`).join('');
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
            const moduleProductWarranty = warrantyModuleWarranty?.value || '10';
            const modulePerformanceWarranty = warrantyPerformanceWarranty?.value || '30';
            const moduleSerials = warrantyModuleSerials?.value || '';

            const inverterName = warrantyInverterName?.value || 'Grid-Tie Inverter';
            const inverterWarranty = warrantyInverterWarranty?.value || '5';
            const inverterSerials = warrantyInverterSerials?.value || '';

            const dcrCertificate = warrantyDcrCertificate?.value || 'N/A';
            const installDate = warrantyInstallDate?.value;

            const formattedDate = formatDate(installDate);

            // Calculate warranty end dates
            // Performance warranty determines the "Valid Until" for modules usually, or product? 
            // Typically performance is the longer one. Let's use Performance for the main highlight.
            const moduleWarrantyEnd = calculateWarrantyEnd(installDate, parseInt(modulePerformanceWarranty) || 30);
            const inverterWarrantyEnd = calculateWarrantyEnd(installDate, parseInt(inverterWarranty) || 5);

            // Populate Page 1: Cover & Project Details
            document.getElementById('coverProjectId').textContent = projectId;
            document.getElementById('coverDate').textContent = formattedDate;
            document.getElementById('detailCustomerName').textContent = customerName;
            document.getElementById('detailAddress').textContent = address;
            document.getElementById('detailPhone').textContent = phone;
            document.getElementById('detailInstallDate').textContent = formattedDate;
            document.getElementById('detailProjectSpecs').textContent = projectSpecs;

            document.getElementById('detailModuleBrand').textContent = moduleBrand;
            document.getElementById('detailModuleWarranty').textContent = `${moduleProductWarranty} Yrs (Prd) / ${modulePerformanceWarranty} Yrs (Perf)`;
            document.getElementById('detailInverterName').textContent = inverterName;
            document.getElementById('detailInverterWarranty').textContent = inverterWarranty + ' Years';

            // Update Overview
            document.getElementById('overviewPerformanceYears').textContent = modulePerformanceWarranty;

            // Populate Page 2: Solar Module Warranty
            document.getElementById('modulePerformanceWarrantyPeriod').textContent = modulePerformanceWarranty + ' Years';
            document.getElementById('moduleWarrantyEnd').textContent = moduleWarrantyEnd;
            document.getElementById('moduleBrandName').textContent = moduleBrand;

            // Update dynamic years in text
            document.getElementById('moduleProductWarrantyYears').textContent = moduleProductWarranty;
            document.getElementById('moduleProductWarrantyYearsText').textContent = moduleProductWarranty;

            document.getElementById('modulePerformanceWarrantyYearsText').textContent = modulePerformanceWarranty;
            document.getElementById('modulePerformanceWarrantyYearsText2').textContent = modulePerformanceWarranty;
            document.getElementById('modulePerformanceWarrantyYearsText3').textContent = modulePerformanceWarranty;

            // Inject Module Serials
            document.getElementById('moduleSerialNumbersContainer').innerHTML = generateSerialGrid(moduleSerials);

            // Populate Page 3: Inverter Warranty
            document.getElementById('inverterWarrantyPeriod').textContent = inverterWarranty + ' Years';
            document.getElementById('inverterWarrantyEnd').textContent = inverterWarrantyEnd;
            document.getElementById('inverterBrandName').textContent = inverterName;

            // Inject Inverter Serials
            document.getElementById('inverterSerialNumbersContainer').innerHTML = generateSerialGrid(inverterSerials);

            // Populate Page 4: General Terms
            document.getElementById('dcrCertNumber').textContent = dcrCertificate;
            document.getElementById('warrantyIssueDate').textContent = formattedDate;

            // Update all page footers
            const pageNumbers = document.querySelectorAll('.warranty-page-number');
            pageNumbers.forEach((el, index) => {
                el.textContent = `Page ${index + 1} of 4`;
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
