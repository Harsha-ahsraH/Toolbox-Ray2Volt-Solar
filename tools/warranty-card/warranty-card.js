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
    const warrantyContactPhone = document.getElementById('warrantyContactPhone');
    const warrantyContactEmail = document.getElementById('warrantyContactEmail');
    const warrantyContactAddress = document.getElementById('warrantyContactAddress');

    /** Printed on the certificate when a contact field is left blank. */
    const CONTACT_DEFAULTS = {
        phone: '+91 96 6606 8140',
        email: 'ray2voltsolar@gmail.com',
        address: '1-278, Pichatur Road, Srikalahasti, 517640, Andhra Pradesh'
    };

    const generateWarrantyBtn = document.getElementById('generateWarrantyBtn');
    const printWarrantyBtn = document.getElementById('printWarrantyBtn');
    const warrantyPreview = document.getElementById('warrantyPreview');

    window.addEventListener('resize', updatePreviewScale);
    window.addEventListener('orientationchange', updatePreviewScale);

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

    /**
     * How many chips the serial grid holds before it has to step down a
     * density tier, and the hard ceiling past which the remainder is
     * summarised instead of silently clipped by the fixed A4 page.
     * Both measured against the live page, not guessed.
     */
    const SERIALS_COMFORTABLE = 24;
    const SERIALS_MAX = 44;

    function parseSerials(serialText) {
        return String(serialText || '')
            .split(/[\n,]+/)
            .map(value => value.trim())
            .filter(value => value.length > 0);
    }

    // --- HELPER: Fill a Serial Number Grid ---
    function renderSerialGrid(container, serialText) {
        if (!container) return;

        const serials = parseSerials(serialText);
        container.classList.toggle('is-dense', serials.length > SERIALS_COMFORTABLE);

        if (serials.length === 0) {
            container.innerHTML = '<p class="serial-empty">No serial numbers provided.</p>';
            return;
        }

        const shown = serials.slice(0, SERIALS_MAX);
        const hidden = serials.length - shown.length;

        container.innerHTML = shown.map(sn => `<div class="serial-number-item">${sn}</div>`).join('')
            + (hidden > 0
                ? `<p class="serial-overflow-note">+ ${hidden} further serial number${hidden === 1 ? '' : 's'} recorded in the project file.</p>`
                : '');
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

            const contactPhone = warrantyContactPhone?.value.trim() || CONTACT_DEFAULTS.phone;
            const contactEmail = warrantyContactEmail?.value.trim() || CONTACT_DEFAULTS.email;
            const contactAddress = warrantyContactAddress?.value.trim() || CONTACT_DEFAULTS.address;

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
            renderSerialGrid(document.getElementById('moduleSerialNumbersContainer'), moduleSerials);

            // Populate Page 3: Inverter Warranty
            document.getElementById('inverterWarrantyPeriod').textContent = inverterWarranty + ' Years';
            document.getElementById('inverterWarrantyEnd').textContent = inverterWarrantyEnd;
            document.getElementById('inverterBrandName').textContent = inverterName;

            // Inject Inverter Serials
            renderSerialGrid(document.getElementById('inverterSerialNumbersContainer'), inverterSerials);

            // Populate Page 4: General Terms
            document.getElementById('dcrCertNumber').textContent = dcrCertificate;
            document.getElementById('warrantyIssueDate').textContent = formattedDate;

            // Contact details print on page 4 and, in short form, on the cover.
            document.getElementById('contactPhone').textContent = contactPhone;
            document.getElementById('contactEmail').textContent = contactEmail;
            document.getElementById('contactAddress').textContent = contactAddress;
            document.getElementById('coverFooterAddress').textContent = contactAddress;
            document.getElementById('coverFooterPhone').textContent = contactPhone;
            document.getElementById('coverFooterEmail').textContent = contactEmail;

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
                updatePreviewScale();
                warrantyPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- PRINT / SAVE AS PDF ---
    if (printWarrantyBtn) {
        printWarrantyBtn.addEventListener('click', () => {
            updatePreviewScale();
            window.print();
        });
    }

    // --- DIRECT PDF DOWNLOAD ---
    const downloadWarrantyBtn = document.getElementById('downloadWarrantyBtn');
    if (downloadWarrantyBtn) {
        downloadWarrantyBtn.addEventListener('click', () => {
            if (warrantyPreview && !warrantyPreview.classList.contains('visible')) {
                generateWarrantyBtn?.click();
            }

            const projectId = warrantyProjectId?.value?.trim();
            window.Ray2VoltPdfDownload?.downloadPages({
                pages: warrantyPreview?.querySelectorAll('.warranty-page'),
                button: downloadWarrantyBtn,
                filename: `Ray2Volt-Warranty-Card-${projectId || 'Draft'}`,
                beforeCapture: () => warrantyPreview?.style.setProperty('--warranty-preview-scale', '1'),
                afterCapture: () => updatePreviewScale()
            });
        });
    }

    function updatePreviewScale() {
        if (!warrantyPreview) return;

        const a4WidthPx = 210 / 25.4 * 96;
        const smallScreen = window.matchMedia('(max-width: 768px)').matches;

        if (!smallScreen) {
            warrantyPreview.style.setProperty('--warranty-preview-scale', '1');
            return;
        }

        const parentWidth = warrantyPreview.parentElement
            ? warrantyPreview.parentElement.clientWidth
            : window.innerWidth;
        const availableWidth = Math.max(280, Math.min(parentWidth, window.innerWidth) - 16);
        const scale = Math.min(1, Math.max(0.35, availableWidth / a4WidthPx));
        warrantyPreview.style.setProperty('--warranty-preview-scale', scale.toFixed(4));
    }
});
