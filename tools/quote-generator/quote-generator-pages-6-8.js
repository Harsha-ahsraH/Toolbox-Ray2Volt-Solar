window.QuoteGeneratorPageTemplates = window.QuoteGeneratorPageTemplates || [];
window.QuoteGeneratorPageTemplates.push(`                    <!-- ========== PAGE 6: Commercial Offer ========== -->
                    <div class="quote-page">
                        <div class="qp-header">
                            <div class="qp-title-section">
                                <h1>Commercial Offer</h1>
                                <p class="qp-subtitle">Pricing &amp; Payment Terms</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="qp-logo">
                        </div>

                        <!-- Address Grid (Cards) -->
                        <div class="qp-address-grid">
                            <div class="qp-addr-card qp-addr-from">
                                <div class="qp-addr-header">From</div>
                                <div class="qp-addr-body">
                                    <strong>Ray2Volt Solar Pvt Ltd</strong>
                                    <p>1-278, Pichatur Road, Srikalahasti<br>Andhra Pradesh, 517640</p>
                                    <p>+91 96 6606 8140</p>
                                    <p>ray2voltsolar@gmail.com</p>
                                    <div class="qp-addr-meta">
                                        <span>GSTIN: 37AAOCR4626E1Z6</span>
                                    </div>
                                </div>
                            </div>
                            <div class="qp-addr-card qp-addr-to">
                                <div class="qp-addr-header">Proposal For</div>
                                <div class="qp-addr-body">
                                    <strong id="qpOfferName">—</strong>
                                    <p id="qpOfferAddress">—</p>
                                    <p id="qpOfferPhone">—</p>
                                    <p id="qpOfferGstin" style="display:none;">—</p>
                                    <div class="qp-addr-meta">
                                        <span>Quote No: <strong id="qpOfferQuoteNo">—</strong></span><br>
                                        <span>Date: <span id="qpOfferDate">—</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pricing Table -->
                        <div class="qp-section">
                            <h3>System Pricing</h3>
                            <table class="qp-pricing-table">
                                <tr>
                                    <td>System Capacity</td>
                                    <td id="qpPriceCapacity">— kWp</td>
                                </tr>
                                <tr>
                                    <td>Actual Project Cost (Incl. GST)</td>
                                    <td id="qpActualProjectCost">&#8377;0</td>
                                </tr>
                                <tr class="qp-discount-row">
                                    <td>Less: Discount</td>
                                    <td id="qpDiscountAmount">&#8377;0</td>
                                </tr>
                                <tr>
                                    <td>Taxable Project Value</td>
                                    <td id="qpPriceTaxable">₹0</td>
                                </tr>
                                <tr id="qpGstRow1">
                                    <td id="qpGstLabel1">CGST (2.5%)</td>
                                    <td id="qpGstAmt1">₹0</td>
                                </tr>
                                <tr id="qpGstRow2">
                                    <td id="qpGstLabel2">SGST (2.5%)</td>
                                    <td id="qpGstAmt2">₹0</td>
                                </tr>
                                <tr class="qp-grand-total-row">
                                    <td><strong>Total Project Cost (Incl. GST)</strong></td>
                                    <td id="qpTableTotal"><strong>₹0</strong></td>
                                </tr>
                            </table>
                        </div>

                        <!-- Financial Highlight Strip -->
                        <div class="qp-financial-strip">
                            <div class="qp-fin-item qp-fin-total">
                                <span class="qp-fin-label">Total Project Cost</span>
                                <span class="qp-fin-value" id="qpGrandTotal">₹0</span>
                                <span class="qp-fin-sublabel">(Inclusive of GST)</span>
                            </div>
                            <div class="qp-fin-divider"></div>
                            <div class="qp-fin-item qp-fin-subsidy" id="qpSubsidySection">
                                <span class="qp-fin-label">Less: PM Surya Ghar Subsidy</span>
                                <span class="qp-fin-value" id="qpSubsidyAmount">₹0</span>
                                <span class="qp-fin-sublabel">(Estimated Direct Benefit)</span>
                            </div>
                            <div class="qp-fin-divider"></div>
                            <div class="qp-fin-item qp-fin-net">
                                <span class="qp-fin-label">Net Effective Cost</span>
                                <span class="qp-fin-value" id="qpNetCost">₹0</span>
                                <span class="qp-fin-sublabel">(To Consumer)</span>
                            </div>
                        </div>
                        <div class="qp-amount-words">
                            <strong>Amount in Words:</strong> <span id="qpAmountWords">—</span>
                        </div>

                        <!-- Payment Timeline -->
                        <div class="qp-section">
                            <h3>Payment Schedule</h3>
                            <div class="qp-payment-steps">
                                <div class="qp-step">
                                    <div class="qp-step-badge">1</div>
                                    <div class="qp-step-content">
                                        <strong>Advance Payment (<span id="qpAdvPct">80</span>%)</strong>
                                        <div class="qp-step-amount" id="qpAdvanceAmt">₹0</div>
                                        <span class="qp-step-desc">To confirm order &amp; begin procurement</span>
                                    </div>
                                </div>
                                <div class="qp-step">
                                    <div class="qp-step-badge">2</div>
                                    <div class="qp-step-content">
                                        <strong>Final Payment (<span id="qpFinalPct">20</span>%)</strong>
                                        <div class="qp-step-amount" id="qpFinalAmt">₹0</div>
                                        <span class="qp-step-desc">Before dispatch of materials to site</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Bank Details Card -->
                        <div class="qp-bank-card">
                            <div class="qp-bank-header">
                                <span>Bank Transfer Details</span>
                            </div>
                            <div class="qp-bank-body">
                                <div class="qp-bank-row">
                                    <span>Beneficiary Name</span>
                                    <strong>Ray2Volt Solar Private Limited</strong>
                                </div>
                                <div class="qp-bank-flex">
                                    <div>
                                        <span>Account Number</span>
                                        <strong class="qp-mono">50200112654604</strong>
                                    </div>
                                    <div>
                                        <span>IFSC Code</span>
                                        <strong class="qp-mono">HDFC0002436</strong>
                                    </div>
                                </div>
                                <div class="qp-bank-flex">
                                    <div>
                                        <span>Bank Name</span>
                                        <strong>HDFC Bank</strong>
                                    </div>
                                    <div>
                                        <span>Branch</span>
                                        <strong>Srikalahasti</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="qp-page-footer">
                            <span>Ray2Volt Solar Private Limited</span>
                            <span>Page 6 of 8</span>
                        </div>
                    </div>

                    <!-- ========== PAGE 7: Savings & ROI ========== -->
                    <div class="quote-page">
                        <div class="qp-header">
                            <div class="qp-title-section">
                                <h1>Savings &amp; ROI</h1>
                                <p class="qp-subtitle">Return on Investment Analysis</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="qp-logo">
                        </div>

                        <div class="qp-section">
                            <h3>System Generation Overview</h3>
                            <table class="qp-specs-table">
                                <tr>
                                    <th>System Capacity</th>
                                    <td id="qpRoiCapacity">— kWp</td>
                                </tr>
                                <tr>
                                    <th>Annual Generation</th>
                                    <td id="qpAnnualUnits">— units</td>
                                </tr>
                                <tr>
                                    <th>Current Tariff Rate</th>
                                    <td id="qpTariffRate">₹—/unit</td>
                                </tr>
                                <tr>
                                    <th>Annual Savings (Year 1)</th>
                                    <td id="qpAnnualSavings">₹—</td>
                                </tr>
                                <tr>
                                    <th>Estimated Payback Period</th>
                                    <td id="qpPaybackPeriod">— years</td>
                                </tr>
                            </table>
                        </div>

                        <div class="qp-section">
                            <h3>30-Year Savings Projection</h3>
                            <div class="table-responsive">
                                <table class="qp-savings-table">
                                    <thead>
                                        <tr>
                                            <th>Year</th>
                                            <th>Tariff (₹/unit)</th>
                                            <th>Annual Savings (₹)</th>
                                            <th>Cumulative Savings (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="qpSavingsTableBody">
                                        <!-- Populated by JS -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="qp-highlight-box">
                            <p class="qp-highlight-label">Lifetime Savings (30 Years)</p>
                            <p class="qp-highlight-value" id="qpLifetimeSavings">₹0</p>
                        </div>

                        <div class="qp-section">
                            <h3>Environmental Impact</h3>
                            <div class="qp-benefits-grid qp-impact-grid">
                                <div class="qp-benefit-item">
                                    <span class="qp-benefit-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round">
                                            <path
                                                d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                                        </svg>
                                    </span>
                                    <div>
                                        <strong id="qpTreesEquiv">—</strong>
                                        <p>Trees planted equivalent over 30 years</p>
                                    </div>
                                </div>
                                <div class="qp-benefit-item">
                                    <span class="qp-benefit-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                                        </svg>
                                    </span>
                                    <div>
                                        <strong id="qpCo2Saved">—</strong>
                                        <p>Tonnes of CO₂ emissions avoided</p>
                                    </div>
                                </div>
                                <div class="qp-benefit-item">
                                    <span class="qp-benefit-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    </span>
                                    <div>
                                        <strong id="qpCleanEnergy">—</strong>
                                        <p>MWh of clean energy generated</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="qp-section">
                            <h3>Monthly Bill Comparison</h3>
                            <div class="qp-comparison-container">
                                <!-- BEFORE Card -->
                                <div class="qp-comparison-card qp-card-before">
                                    <div class="qp-card-header">Current Scenario</div>
                                    <div class="qp-card-body">
                                        <p class="qp-card-label">Avg. Monthly Bill</p>
                                        <p class="qp-card-value qp-text-red" id="qpBillBefore">₹—</p>
                                        <div class="qp-bill-bar-container">
                                            <div class="qp-bill-bar qp-bar-red" style="width: 100%;"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- ARROW Icon -->
                                <div class="qp-comparison-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </div>

                                <!-- AFTER Card -->
                                <div class="qp-comparison-card qp-card-after">
                                    <div class="qp-card-header">With Ray2Volt Solar</div>
                                    <div class="qp-card-body">
                                        <p class="qp-card-label">New Monthly Bill</p>
                                        <p class="qp-card-value qp-text-green" id="qpBillAfter">₹0 - ₹200</p>
                                        <div class="qp-bill-bar-container">
                                            <div class="qp-bill-bar qp-bar-green" style="width: 5%;"></div>
                                        </div>
                                        <div class="qp-savings-badge">
                                            Save <span id="qpMonthlySavings">₹—</span> / month
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="qp-page-footer">
                            <span>Ray2Volt Solar Private Limited</span>
                            <span>Page 7 of 8</span>
                        </div>
                    </div>

                    <!-- ========== PAGE 8: Terms & Conditions ========== -->
                    <div class="quote-page qp-page-flex">
                        <div class="qp-header">
                            <div class="qp-title-section">
                                <h1>Terms &amp; Conditions</h1>
                                <p class="qp-subtitle">Scope, Responsibilities &amp; Agreements</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="qp-logo">
                        </div>

                        <!-- Main Content Wrapper -->
                        <div class="qp-page7-content">

                            <!-- Scope & Exclusions Grid -->
                            <div class="qp-terms-grid">
                                <div class="qp-terms-card qp-scope-card">
                                    <div class="qp-terms-header">Scope of Work</div>
                                    <div class="qp-terms-content">
                                        <ul class="qp-checklist">
                                            <li>Supply of all solar PV components as per BOM</li>
                                            <li>Complete installation &amp; commissioning</li>
                                            <li>AC/DC wiring, earthing &amp; lightning arrestor</li>
                                            <li>Net-Metering application &amp; DISCOM liaison</li>
                                            <li>System testing, handover &amp; user training</li>
                                            <li>1 Year free Annual Maintenance (AMC)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="qp-terms-card qp-exclusion-card">
                                    <div class="qp-terms-header">Exclusions</div>
                                    <div class="qp-terms-content">
                                        <ul class="qp-checklist">
                                            <li>Civil work, scaffolding or roof waterproofing</li>
                                            <li>Electrical panel upgrades / main breaker</li>
                                            <li>Govt. fees, permits or DISCOM charges</li>
                                            <li>Internet / WiFi for remote monitoring</li>
                                            <li>Storage batteries (unless in BOM)</li>
                                            <li>Structural modifications to the building</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Customer Responsibilities -->
                            <div class="qp-terms-card qp-responsibility-card">
                                <div class="qp-terms-header">Customer Responsibilities</div>
                                <div class="qp-terms-content">
                                    <div class="qp-resp-grid">
                                        <div class="qp-resp-item">
                                            <strong>Site Access</strong>
                                            <p>Provide unobstructed access to the roof/installation site during working
                                                hours.</p>
                                        </div>
                                        <div class="qp-resp-item">
                                            <strong>Electricity &amp; Water</strong>
                                            <p>Provide electricity and water supply at site during installation period.
                                            </p>
                                        </div>
                                        <div class="qp-resp-item">
                                            <strong>Approvals</strong>
                                            <p>Obtain necessary permissions from housing society or local authority, if
                                                applicable.</p>
                                        </div>
                                        <div class="qp-resp-item">
                                            <strong>Maintenance</strong>
                                            <p>Regular cleaning of solar panels to ensure optimal performance and
                                                warranty compliance.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- General Terms & Conditions -->
                            <div class="qp-terms-card qp-general-terms">
                                <div class="qp-terms-header">General Terms &amp; Conditions</div>
                                <div class="qp-terms-content">
                                    <ol class="qp-terms-ol">
                                        <li><strong>Validity:</strong> This quotation is valid for 15 days from the date
                                            of issue. Prices are subject to change post-validity due to market
                                            fluctuations.</li>
                                        <li><strong>Payment:</strong> 80% advance with Work Order confirmation; 20%
                                            balance before material dispatch to site.</li>
                                        <li><strong>Delivery:</strong> Material delivery within 10–15 working days from
                                            receipt of advance payment.</li>
                                        <li><strong>Installation:</strong> System installation within 5–7 working days
                                            from material delivery, subject to site readiness.</li>
                                        <li><strong>Warranty:</strong> All product warranties are directly from
                                            respective manufacturers. Ray2Volt will facilitate all claims.</li>
                                        <li><strong>Force Majeure:</strong> Ray2Volt shall not be liable for delays due
                                            to natural calamities, strikes, govt. orders, or supply disruptions.</li>
                                        <li><strong>Cancellation:</strong> Orders once confirmed cannot be cancelled.
                                            Advance amount is non-refundable after material procurement.</li>
                                        <li><strong>Jurisdiction:</strong> Any disputes shall be subject to the
                                            exclusive jurisdiction of courts in Srikalahasti, Andhra Pradesh.</li>
                                    </ol>
                                </div>
                            </div>

                            <!-- After-Sales Support -->
                            <div class="qp-explainer-box">
                                <strong>Our After-Sales Commitment</strong>
                                <p>Ray2Volt provides dedicated after-sales support including remote system monitoring,
                                    on-call troubleshooting, and annual performance checks for the duration of your
                                    workmanship warranty. Our service team is just a phone call away at
                                    <strong>+91 96 6606 8140</strong>.
                                </p>
                            </div>

                        </div>

                        <!-- Thank You Section (pushed to bottom via flex) -->
                        <div class="qp-page7-bottom">
                            <div class="qp-thankyou-section">
                                <h2 class="qp-thankyou-title">Thank You for Choosing Ray2Volt Solar</h2>
                                <p class="qp-thankyou-text">We are honoured to be your trusted partner in the journey
                                    towards clean, sustainable energy. Our team is committed to delivering a
                                    seamless installation experience and world-class after-sales support.</p>
                                <div class="qp-thankyou-contact">
                                    <span>+91 96 6606 8140</span>
                                    <span>ray2voltsolar@gmail.com</span>
                                    <span>www.ray2voltsolar.com</span>
                                </div>
                                <p class="qp-thankyou-tagline">Powering a Brighter, Greener Tomorrow.</p>
                            </div>

                            <div class="qp-disclaimer">
                                <p>This is a system-generated quotation from Ray2Volt Solar Private Limited.</p>
                            </div>
                        </div>

                        <div class="qp-page-footer">
                            <span>Ray2Volt Solar Private Limited</span>
                            <span>Page 8 of 8</span>
                        </div>
                    </div>`);
