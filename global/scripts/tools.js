/**
 * Toolbox registry — the one list of tools.
 *
 * The sidebar, the dashboard cards, the tool search and the access levels are
 * all read from here, so adding a tool is one entry in TOOLS plus its folder:
 *
 *   tools/<id>/<id>.html   loads this file, then auth.js with data-tool-id="<id>",
 *                          then navigation.js — see docs/design-system.md.
 *
 * Fields
 *   id           folder and file name under tools/, and the auth tool id
 *   label        sidebar and card title
 *   icon         Material Symbols Rounded ligature
 *   level        lowest access level that may open it (0 Everyone, 1 Sales,
 *                2 Admin, 3 Owner); auth.js treats a missing tool as Owner-only
 *   description  dashboard card text
 *   keywords     extra words the tool search matches besides the label
 *   href         only for a tool that lives on another site
 */
(function () {
    'use strict';

    const TOOLS = [
        {
            id: 'emi-calculator', label: 'EMI Calculator', icon: 'calculate', level: 0,
            description: 'Compute monthly loan EMIs and repayment schedules using reducing balance or flat interest rates.',
            keywords: 'loan emi finance installment interest monthly bank repayment amortization'
        },
        {
            id: 'gst-calculator', label: 'GST Calculator', icon: 'percent', level: 0,
            description: 'Calculate inclusive and exclusive GST values with automatic CGST, SGST, and IGST tax breakdowns.',
            keywords: 'tax gst percent cgst sgst igst inclusive exclusive'
        },
        {
            id: 'package-prices', label: 'Packages & Prices', icon: 'sell', level: 0,
            description: 'Review turnkey package pricing and PM Surya Ghar subsidies for on-grid and hybrid installations.',
            keywords: 'price pricing package cost rate kw capacity on-grid'
        },
        {
            id: 'sales-sop', label: 'Sales SOP', icon: 'fact_check', level: 0,
            description: 'Run residential and C&I sales calls on returns, net metering, technology, and project timelines.',
            keywords: 'sop sales process pitch script subsidy financing training faq'
        },
        {
            id: 'solar-savings', label: 'Solar Savings', icon: 'savings', level: 0,
            description: 'Model CAPEX and RESCO solar savings, loan payback schedules, and 25-year returns on investments.',
            keywords: 'savings roi irr payback breakeven capex resco returns bill units'
        },
        {
            id: 'quote-generator', label: 'Quote Generator', icon: 'request_quote', level: 1,
            description: 'Produce 8-page rooftop proposals or comprehensive commercial EPC quotations with complete specs.',
            keywords: 'quote quotation proposal offer bom pricing customer'
        },
        {
            id: 'quotation', label: '1-Page Quotation', icon: 'draft', level: 1,
            description: 'Create compact single-page quotations with customer details, scope of work, and project pricing.',
            keywords: 'quotation quote 1-page one page customer gst'
        },
        {
            id: 'proforma-invoice', label: 'Proforma Invoice', icon: 'article', level: 1,
            description: 'Prepare formal proforma invoices with itemized billing milestones, GST splits, and bank details.',
            keywords: 'proforma invoice advance estimate pi'
        },
        {
            id: 'receipt-generator', label: 'Payment Receipt', icon: 'receipt_long', level: 2,
            description: 'Issue official payment receipts capturing customer advance amounts, payment modes, and balances.',
            keywords: 'receipt payment paid advance acknowledgement money'
        },
        {
            id: 'invoice-generator', label: 'Tax Invoice', icon: 'description', level: 2,
            description: 'Generate compliant GST tax invoices with HSN codes, supply classifications, and full tax splits.',
            keywords: 'invoice generator bill billing tax gst supply'
        },
        {
            id: 'warranty-card', label: 'Warranty Card', icon: 'verified', level: 2,
            description: 'Produce comprehensive 4-page warranty certificates covering modules, inverters, and workmanship.',
            keywords: 'warranty certificate guarantee card cover'
        },
        {
            id: 'request-for-quotation', label: 'Request for Quotation', icon: 'format_quote', level: 2,
            description: 'Create structured procurement RFQs for equipment suppliers quickly formatted from Markdown text.',
            keywords: 'rfq request for quotation vendor enquiry supplier'
        },
        {
            id: 'purchase-order', label: 'Purchase Order', icon: 'shopping_cart', level: 2,
            description: 'Create official purchase orders for solar equipment procurement with vendor terms and schedules.',
            keywords: 'po purchase order vendor supplier procurement buy'
        },
        {
            id: 'payslip-generator', label: 'Payslip Generator', icon: 'badge', level: 3,
            description: 'Create monthly employee payslips with basic salaries, sales commissions, and payroll deductions.',
            keywords: 'payslip salary payroll employee wages commission staff'
        },
        {
            id: 'comparison-sheet', label: 'Comparison Sheet', icon: 'balance', level: 1,
            description: 'Compare three build standards for the same solar plant across component specs and pricing tiers.',
            keywords: 'comparison compare options build standard basic choice'
        },
        {
            id: 'margin-breakdown', label: 'Margin Breakdown', icon: 'pie_chart', level: 2,
            description: 'Break down total project pricing into custom add-ons, consultant margins, and sales commissions.',
            keywords: 'margin breakdown add-on addon consultant channel partner price split commission'
        },
        {
            id: 'letterheadify', label: 'Letterheadify', icon: 'picture_as_pdf', level: 1,
            description: 'Apply official Ray2Volt letterhead and corporate branding to every page of an uploaded PDF file.',
            keywords: 'letterhead pdf brand stationery header stamp'
        },
        {
            id: 'resource-library', label: 'Resource Library', icon: 'library_books', level: 1,
            description: 'Browse and download technical datasheets, warranty forms, price cards, and solar product guides.',
            keywords: 'resource library download template datasheet brochure document file drive'
        },
        {
            id: 'pricing-desk', label: 'Pricing Desk', icon: 'price_change', level: 2,
            href: 'https://pricing.ray2voltsolar.com/',
            description: 'Open the external portal to manage solar consultants, commission tiers, and package price cards.',
            keywords: 'pricing desk consultant consultants management package prices rates portal'
        }
    ];

    const DASHBOARD = {
        id: 'dashboard', label: 'Dashboard', icon: 'dashboard', level: 0,
        keywords: 'dashboard home overview all tools'
    };

    // The toolbox root, worked out from this script's own URL so a page at any
    // depth links correctly: "", or "../../" from tools/<id>/<id>.html.
    const script = document.currentScript;
    const root = script ? script.src.replace(/global\/scripts\/tools\.js.*$/, '') : '';

    function hrefFor(tool) {
        if (tool.href) return tool.href;
        if (tool.id === 'dashboard') return `${root}index.html`;
        return `${root}tools/${tool.id}/${tool.id}.html`;
    }

    function byId(id) {
        return TOOLS.find((tool) => tool.id === id) || null;
    }

    window.Ray2VoltTools = Object.freeze({ list: TOOLS, dashboard: DASHBOARD, root, hrefFor, byId });
})();
