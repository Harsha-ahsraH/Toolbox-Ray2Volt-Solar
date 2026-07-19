window.QuoteGeneratorPageTemplates = window.QuoteGeneratorPageTemplates || [];
window.QuoteGeneratorPageTemplates.push(`                    <!-- ========== PAGE 3: How Your System Works ========== -->
                    <div class="quote-page">
                        <div class="qp-header">
                            <div class="qp-title-section">
                                <h1>How Your System Works</h1>
                                <p class="qp-subtitle">System Schematic &amp; Energy Flow</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="qp-logo">
                        </div>

                        <div class="qp-section">
                            <h3 id="qpSchematicTitle">On-Grid System Schematic</h3>
                            <figure class="qp-schematic-figure">
                                <img id="qpSchematicImg" src="assets/On-Grid Schematic Diagram.png"
                                    alt="Solar system schematic diagram" class="qp-schematic-img">
                                <figcaption class="qp-schematic-caption">
                                    Representative schematic — actual layout is finalized during site survey.
                                </figcaption>
                            </figure>
                        </div>

                        <div class="qp-section">
                            <h3>Energy Flow, Step by Step</h3>
                            <div class="qp-flow-grid" id="qpFlowSteps">
                                <!-- Populated by JS based on Installation Type -->
                            </div>
                        </div>

                        <div class="qp-explainer-box">
                            <strong>What is Net-Metering?</strong>
                            <p>Your DISCOM installs a bi-directional meter that records both the energy you draw from
                                the grid and the surplus solar energy you export to it. Your monthly bill is calculated
                                on <em>net</em> units (import minus export) — so every surplus unit your rooftop
                                generates directly offsets your consumption, even when you're not at home to use it.
                            </p>
                        </div>

                        <div class="qp-page-footer">
                            <span>Ray2Volt Solar Private Limited</span>
                            <span>Page 3 of 8</span>
                        </div>
                    </div>

                    <!-- ========== PAGE 4: Technology & Installation ========== -->
                    <div class="quote-page">
                        <div class="qp-header">
                            <div class="qp-title-section">
                                <h1>Technology &amp; Installation</h1>
                                <p class="qp-subtitle">Component Technology &amp; Project Execution</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="qp-logo">
                        </div>

                        <div class="qp-section">
                            <h3>Component Technology</h3>
                            <div class="qp-tech-grid">
                                <div class="qp-tech-card">
                                    <strong>Solar PV Modules</strong>
                                    <p>High-efficiency Mono PERC cells (540–550 Wp) with anti-reflective, self-cleaning
                                        glass. PID-resistant with a 30-year linear performance warranty.</p>
                                </div>
                                <div class="qp-tech-card">
                                    <strong id="qpTechInverterTitle">Grid-Tie Inverter</strong>
                                    <p id="qpTechInverterDesc">MPPT-tracked conversion of DC to grid-synchronized AC at
                                        over 97% efficiency, with built-in anti-islanding protection and app-based
                                        monitoring.</p>
                                </div>
                                <div class="qp-tech-card">
                                    <strong>Mounting Structure</strong>
                                    <p>Hot-dip galvanized (HDG/GI) steel structure engineered for high wind loads and
                                        coastal corrosion resistance, with a 10-year structural warranty.</p>
                                </div>
                                <div class="qp-tech-card">
                                    <strong>Protection &amp; Earthing</strong>
                                    <p>Lightning arrester, surge protection devices in both DCDB and ACDB, and
                                        dedicated earthing pits for the array, arrester, and system.</p>
                                </div>
                                <div class="qp-tech-card">
                                    <strong>Cables &amp; Connectors</strong>
                                    <p>UV-stabilized DC solar cables with genuine MC4 connectors and copper AC cabling,
                                        sized to keep transmission losses to a minimum.</p>
                                </div>
                                <div class="qp-tech-card">
                                    <strong id="qpTechCard6Title">Net-Meter &amp; Monitoring</strong>
                                    <p id="qpTechCard6Desc">Bi-directional DISCOM meter for net billing, plus Wi-Fi
                                        inverter monitoring so you can track generation live from your phone.</p>
                                </div>
                            </div>
                        </div>

                        <div class="qp-section">
                            <h3>Your Installation Journey</h3>
                            <div class="qp-journey-grid">
                                <div class="qp-journey-step">
                                    <span class="qp-journey-num">1</span>
                                    <div>
                                        <strong>Site Survey &amp; System Design</strong>
                                        <p>Roof assessment, shadow analysis, and a system design tailored to your
                                            consumption.</p>
                                    </div>
                                </div>
                                <div class="qp-journey-step">
                                    <span class="qp-journey-num">2</span>
                                    <div>
                                        <strong>Order Confirmation &amp; Procurement</strong>
                                        <p>Advance payment confirms the order; materials are procured from authorized
                                            distributors.</p>
                                    </div>
                                </div>
                                <div class="qp-journey-step">
                                    <span class="qp-journey-num">3</span>
                                    <div>
                                        <strong>Structure &amp; Module Installation</strong>
                                        <p>Mounting structure erection and panel installation by trained crews.</p>
                                    </div>
                                </div>
                                <div class="qp-journey-step">
                                    <span class="qp-journey-num">4</span>
                                    <div>
                                        <strong>Electrical &amp; Safety Works</strong>
                                        <p>DC/AC wiring, distribution boxes, earthing, and lightning protection.</p>
                                    </div>
                                </div>
                                <div class="qp-journey-step">
                                    <span class="qp-journey-num">5</span>
                                    <div>
                                        <strong>DISCOM Liaison &amp; Net-Metering</strong>
                                        <p>We handle the net-meter application and coordination with your DISCOM.</p>
                                    </div>
                                </div>
                                <div class="qp-journey-step">
                                    <span class="qp-journey-num">6</span>
                                    <div>
                                        <strong>Testing, Commissioning &amp; Handover</strong>
                                        <p>Full system testing, user training, and documentation handover.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="qp-explainer-box">
                            <strong>Project Timeline</strong>
                            <p>Complete execution within <strong>15–30 working days</strong> from advance payment —
                                covering procurement, delivery, installation, testing, and commissioning at your site.
                            </p>
                        </div>

                        <div class="qp-page-footer">
                            <span>Ray2Volt Solar Private Limited</span>
                            <span>Page 4 of 8</span>
                        </div>
                    </div>

                    <!-- ========== PAGE 5: Bill of Materials ========== -->
                    <div class="quote-page qp-page-bom">
                        <div class="qp-header">
                            <div class="qp-title-section">
                                <h1>Bill of Materials</h1>
                                <p class="qp-subtitle">Component Specifications</p>
                            </div>
                            <img src="../../global/assets/logo.png" alt="Ray2Volt Logo" class="qp-logo">
                        </div>

                        <div class="qp-section">
                            <div class="table-responsive">
                                <table class="qp-bom-table">
                                    <thead>
                                        <tr>
                                            <th style="width:40px;">SN</th>
                                            <th>Item Description</th>
                                            <th style="width:60px;">Qty</th>
                                            <th style="width:60px;">Unit</th>
                                            <th style="width:25%;">Make</th>
                                        </tr>
                                    </thead>
                                    <tbody id="qpBomTableBody">
                                        <!-- Populated by JS -->
                                    </tbody>
                                </table>
                            </div>
                            <p class="qp-table-note">The above components are of the highest quality from reputed
                                manufacturers. Actual brands may vary based on availability, with equivalent or
                                superior alternatives provided.</p>
                        </div>

                        <div class="qp-section">
                            <h3>Warranty Coverage</h3>
                            <table class="qp-specs-table">
                                <tr>
                                    <th>Solar PV Modules</th>
                                    <td>30 Years Performance Warranty (Manufacturer)</td>
                                </tr>
                                <tr>
                                    <th id="qpWarrantyInverterLabel">Inverter</th>
                                    <td id="qpWarrantyInverterValue">7 Years Standard Warranty (Manufacturer)</td>
                                </tr>
                                <tr>
                                    <th>Mounting Structure</th>
                                    <td>10 Years Warranty against Structural Defects</td>
                                </tr>
                                <tr>
                                    <th>Workmanship</th>
                                    <td>5 Years Comprehensive Installation Warranty (Ray2Volt)</td>
                                </tr>
                                <tr>
                                    <th>Annual Maintenance</th>
                                    <td>1 Year Free AMC included with every installation</td>
                                </tr>
                            </table>
                            <p class="qp-table-note">All warranties are subject to proper usage and maintenance as per
                                manufacturer guidelines. Detailed warranty certificates will be provided upon project
                                commissioning.</p>
                        </div>

                        <div class="qp-quality-assurance">
                            <div class="qp-quality-header">
                                <span>Quality &amp; Warranty Assurance</span>
                                <strong>Checked, documented and supported after installation.</strong>
                            </div>
                            <div class="qp-quality-grid">
                                <div class="qp-quality-item">
                                    <span class="qp-quality-mark">01</span>
                                    <div>
                                        <strong>Commissioning Checked</strong>
                                        <p>Protection, earthing, inverter startup and generation readings are verified.
                                        </p>
                                    </div>
                                </div>
                                <div class="qp-quality-item">
                                    <span class="qp-quality-mark">02</span>
                                    <div>
                                        <strong>Warranty Records</strong>
                                        <p>Module, inverter and structure warranties are recorded in final project
                                            files.</p>
                                    </div>
                                </div>
                                <div class="qp-quality-item">
                                    <span class="qp-quality-mark">03</span>
                                    <div>
                                        <strong>Service Promise</strong>
                                        <p>First-year AMC and workmanship support help maintain system performance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="qp-page-footer">
                            <span>Ray2Volt Solar Private Limited</span>
                            <span>Page 5 of 8</span>
                        </div>
                    </div>
`);
