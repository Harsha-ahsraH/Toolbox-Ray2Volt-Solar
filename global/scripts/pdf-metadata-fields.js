/* Explicit allowlist: never copy whole forms (they may contain bank or private data). */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Ray2VoltPdfFields = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';
    const tools = {
        'invoice-generator': ['Invoice', 'invoicePreview'],
        'quotation': ['Quotation', 'quotationPreview'],
        'proforma-invoice': ['Proforma invoice', 'proformaInvoicePreview'],
        'purchase-order': ['Purchase order', 'purchaseOrderPreview'],
        'receipt-generator': ['Payment receipt', 'receiptPreview'],
        'payslip-generator': ['Payslip', 'payslipPreview'],
        'warranty-card': ['Warranty card', 'warrantyPreview'],
        'request-for-quotation': ['Request for quotation', 'rfqPreview'],
        'quote-generator': ['Solar proposal', 'quotePreview'],
        'comparison-sheet': ['Comparison sheet', 'comparisonSheet'],
        'margin-breakdown': ['Margin breakdown', 'marginBreakdown'],
        'emi-calculator': ['EMI report', 'emiReportContainer'],
        'solar-savings': ['Solar savings report', 'reportModal'],
        'letterheadify': ['Letterhead document', '']
    };
    const maps = {
        'invoice-generator': { DocumentNumber: '@invDispInvoiceNo', DocumentDate: '@invDispDate', InvoiceTotal: '@invDispGrandTotal', ItemCount: '#invItemsTableBody tr' },
        quotation: { DocumentNumber: '@quoDispInvoiceNo', DocumentDate: '@quoDispDate', QuotedAmount: '@quoDispGrandTotal', ItemCount: '#quoItemsTableBody tr' },
        'proforma-invoice': { DocumentNumber: '@piDispInvoiceNo', DocumentDate: '@piDispDate', ProformaTotal: '@piDispGrandTotal', ItemCount: '#piItemsTableBody tr' },
        'purchase-order': { DocumentNumber: '@poDispOrderNo', DocumentDate: '@poDispDate', OrderTotal: '@poDispGrandTotal', ItemCount: '#poItemsTableBody tr' },
        'receipt-generator': { DocumentNumber: '@receiptNumberDisplay', PaymentDate: '@dispDate', CurrentPayment: '@dispCurrPayment', PreviousPayments: '@dispPrevPayment', BalanceAtIssue: '@dispBalance' },
        'payslip-generator': { DocumentNumber: '@payslipNumberDisplay', EmployeeId: 'payslipEmployeeId', PayPeriod: 'payslipPayPeriod', PaymentDate: 'payslipDate' },
        'warranty-card': { ProjectId: 'warrantyProjectId', InstallationDate: 'warrantyInstallDate', ModuleModel: 'warrantyModuleBrand', InverterModel: 'warrantyInverterName', ModuleWarranty: 'warrantyModuleWarranty', InverterWarranty: 'warrantyInverterWarranty', PerformanceWarranty: 'warrantyPerformanceWarranty' },
        'request-for-quotation': { DocumentNumber: 'rfqNumber', DocumentDate: 'rfqDate', RfqHeading: 'rfqHeading' },
        'quote-generator': { DocumentNumber: '@qpQuoteNumber', DocumentDate: 'qgQuoteDate', CapacityKwp: 'qgSystemCapacity', InstallationType: 'qgInstallationType', QuotedAmount: '@qpStatTurnkeyPrice', SubsidyEligible: 'qgSubsidyEligible' },
        'comparison-sheet': { CapacityKwp: 'csCapacity', SystemType: 'csSystemType', BatteryKwh: 'csBattery' },
        'margin-breakdown': { ProjectId: 'mbProjectId', CapacityKwp: 'mbCapacity', ProjectType: 'mbProjectType', ConsultantId: 'mbConsultantId', ReportDate: 'mbDate' },
        'solar-savings': { CapacityKw: 'kwInstalled', Investment: 'totalCost', Subsidy: 'subsidyAmount', TariffPerKwh: 'costPerUnit', DailyGenerationKwhPerKw: 'unitsPerKwDay', TariffEscalationPercent: 'inflationRate' }
    };
    function collect(tool, document) {
        const values = {};
        for (const [key, selector] of Object.entries(maps[tool] || {})) {
            if (selector[0] === '#') { values[key] = document.querySelectorAll(selector).length; continue; }
            const element = document.getElementById(selector.replace(/^@/, ''));
            if (!element) continue;
            const value = selector[0] === '@' ? element.textContent.trim()
                : element.type === 'checkbox' ? element.checked : element.value;
            if (value !== '' && value != null && value !== '—') values[key] = value;
        }
        if (tool === 'quote-generator') values.ReportMode = 'short';
        if (tool === 'solar-savings') {
            // main's printable report is the ownership report, even if the RESCO tab is active.
            values.ReportMode = 'ownership';
            values.CalculationModelVersion = 'solar-returns-20260725';
            if (values.CapacityKw === 'manual') values.CapacityKw = document.getElementById('manualKwInput').value;
            values.EstimatedAnnualGenerationKwh = Number(values.CapacityKw) * Number(values.DailyGenerationKwhPerKw) * 365;
        }
        return values;
    }
    return { tools, collect };
});
