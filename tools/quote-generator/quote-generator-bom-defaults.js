/**
 * Quote Generator - Default Comprehensive BOM and repeater seeds
 * Ray2Volt Solar Toolbox
 *
 * The detailed default rows loaded into the Comprehensive Bill of Materials,
 * plus the standard payment-milestone and future-cost templates. Split out of
 * quote-generator-content.js because these are data tables rather than prose,
 * and they change on a different cadence from the maintained company copy.
 *
 * Quantities that scale with plant size are computed from the approved Project
 * Settings capacity so capacity reconciliation starts in agreement instead of
 * opening every new quotation in a mismatch error.
 */
(function (root, factory) {
    'use strict';
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorBomDefaults = api;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Detailed default BOM rows for a configuration and installation location.
     * Quantities that scale with plant size are computed from the approved DC
     * capacity so capacity reconciliation starts in agreement; everything else is
     * offered as a neutral lot or job for the estimator to refine.
     */
    function defaultBomRows(context) {
        const settings = context || {};
        const isHybrid = settings.systemConfiguration === 'Hybrid';
        const location = settings.installationLocation || 'rcc-rooftop';
        const dcCapacityKwp = Number(settings.dcCapacityKwp) > 0 ? Number(settings.dcCapacityKwp) : 100;
        const acCapacityKw = Number(settings.acCapacityKw) > 0
            ? Number(settings.acCapacityKw)
            : Math.round(dcCapacityKwp / 1.2);
        const batteryKwh = Number(settings.batteryEnergyKwh) > 0 ? Number(settings.batteryEnergyKwh) : 0;

        const moduleWp = 585;
        const moduleQty = Math.max(1, Math.round((dcCapacityKwp * 1000) / moduleWp));

        // Split the approved AC capacity into whole inverters of at most 100 kW,
        // then set the per-unit rating so the BOM total reconciles against
        // Project Settings from the moment defaults load. The estimator swaps in
        // the actual catalogue rating when the make and model are fixed.
        const inverterQty = Math.max(1, Math.ceil(acCapacityKw / 100));
        const inverterKw = Math.round((acCapacityKw / inverterQty) * 10) / 10;
        const batteryModuleKwh = 5.12;
        const batteryQty = batteryKwh > 0 ? Math.max(1, Math.round(batteryKwh / batteryModuleKwh)) : 1;

        const isGround = location === 'ground-mounted';
        const isCarport = location === 'carport';
        const isMetalSheet = location === 'metal-sheet-rooftop';

        const rows = {
            modules: [
                {
                    name: 'Solar PV Module',
                    specification: `Mono PERC / N-type bifacial, ${moduleWp} Wp class`,
                    make: 'Adani / Waaree / Vikram',
                    quantity: moduleQty,
                    unit: 'Nos',
                    warranty: '12 yr product / 30 yr performance',
                    remarks: 'Make and exact model confirmed at order against availability',
                    rating: moduleWp,
                    ratingUnit: 'Wp'
                }
            ],
            inverters: [
                {
                    name: isHybrid ? 'Hybrid Inverter' : 'Grid-Tie String Inverter',
                    specification: `${inverterKw} kW, three phase, multi-MPPT`,
                    make: isHybrid ? 'Deye' : 'Growatt / Sungrow / Polycab',
                    quantity: inverterQty,
                    unit: 'Nos',
                    warranty: isHybrid ? '10 Years' : '7 Years',
                    remarks: 'Anti-islanding and grid protection as per interconnection requirement',
                    rating: inverterKw,
                    ratingUnit: 'kW'
                }
            ],
            battery: isHybrid
                ? [
                    {
                        name: 'LiFePO4 Battery Module',
                        specification: `${batteryModuleKwh} kWh usable, integrated BMS`,
                        make: 'Deye',
                        quantity: batteryQty,
                        unit: 'Nos',
                        warranty: '10 Years',
                        remarks: 'Bank configuration confirmed against backup load schedule',
                        rating: batteryModuleKwh,
                        ratingUnit: 'kWh'
                    },
                    {
                        name: 'Battery Rack & Interconnection',
                        specification: 'Floor-standing rack with inter-module cabling and fusing',
                        make: 'Deye / Reputed',
                        quantity: 1,
                        unit: 'Set',
                        warranty: 'As per manufacturer',
                        remarks: 'Installed in ventilated indoor location'
                    }
                ]
                : [],
            mounting: [
                {
                    name: isGround || isCarport ? 'Fixed-Tilt Ground Structure' : 'Module Mounting Structure',
                    specification: isGround
                        ? 'Hot-dip galvanised MS structure, fixed tilt, designed for site wind zone'
                        : (isCarport
                            ? 'Hot-dip galvanised carport structure with defined vehicle clearance'
                            : (isMetalSheet
                                ? 'Aluminium / HDG rail system with profile-matched roof clamps'
                                : 'Hot-dip galvanised MS elevated structure for RCC roof')),
                    make: 'JSW / TATA / Reputed',
                    quantity: dcCapacityKwp,
                    unit: 'Lot',
                    warranty: '5 Years',
                    remarks: 'Structural design confirmed after detailed site survey'
                },
                {
                    name: 'Structure Fasteners & Accessories',
                    specification: 'Stainless steel fasteners, clamps, end and mid clamps',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                }
            ],
            'dc-cables': [
                {
                    name: 'DC Solar Cable',
                    specification: '4 / 6 sq mm, UV resistant, double insulated, 1500 V DC rated',
                    make: 'Polycab / Havells / Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: 'Length confirmed against approved array layout'
                },
                {
                    name: 'MC4 Connectors',
                    specification: 'IP67 rated, matched pair',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                },
                {
                    name: 'DC Cable Routing Accessories',
                    specification: 'Cable trays, conduits, ties and mechanical protection',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                }
            ],
            'ac-cables': [
                {
                    name: 'AC Power Cable',
                    specification: 'XLPE armoured aluminium / copper cable, sized for voltage drop limit',
                    make: 'Polycab / Havells / Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: 'Size and length confirmed against interconnection point distance'
                },
                {
                    name: 'Cable Termination Kit',
                    specification: 'Glands, lugs and terminations for AC cable ends',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                },
                {
                    name: 'Cable Tray & Support System',
                    specification: 'Galvanised perforated tray with supports for AC runs',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                }
            ],
            protection: [
                {
                    name: 'DC Distribution Box (DCDB)',
                    specification: 'String fuses, DC isolator and Type-2 DC surge protection',
                    make: 'Polycab / Reputed',
                    quantity: Math.max(1, inverterQty),
                    unit: 'Nos',
                    warranty: '1 Year',
                    remarks: 'Configuration matched to string count'
                },
                {
                    name: 'AC Distribution Box (ACDB)',
                    specification: 'MCCB, AC surge protection and isolation',
                    make: 'Polycab / Reputed',
                    quantity: Math.max(1, inverterQty),
                    unit: 'Nos',
                    warranty: '1 Year',
                    remarks: ''
                },
                {
                    name: 'Interconnection Protection',
                    specification: 'Breaker and protection at the interconnection point as required',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Set',
                    warranty: '1 Year',
                    remarks: 'Rating confirmed against existing panel during survey'
                }
            ],
            earthing: [
                {
                    name: 'Earthing Pit',
                    specification: 'Chemical / maintenance-free earth electrode with earth enhancing compound',
                    make: 'Reputed',
                    quantity: 6,
                    unit: 'Nos',
                    warranty: '—',
                    remarks: 'Count and type per earthing design and measured soil resistivity'
                },
                {
                    name: 'Earthing Strip & Conductor',
                    specification: 'GI strip / copper conductor for equipment and array earthing',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                },
                {
                    name: 'Lightning Arrester',
                    specification: 'Air terminal with down conductor and dedicated earth pit',
                    make: 'Reputed',
                    quantity: 2,
                    unit: 'Nos',
                    warranty: '—',
                    remarks: 'Coverage per array footprint'
                }
            ],
            monitoring: [
                {
                    name: 'Inverter Monitoring Module',
                    specification: 'Wi-Fi / LAN data logger with manufacturer cloud platform',
                    make: 'As per inverter make',
                    quantity: Math.max(1, inverterQty),
                    unit: 'Nos',
                    warranty: 'As per manufacturer',
                    remarks: 'Requires stable internet connectivity at site, provided by customer'
                },
                {
                    name: 'Communication Cabling',
                    specification: 'RS485 / Ethernet cabling between inverters and logger',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                }
            ],
            metering: [
                {
                    name: 'Solar Generation Meter',
                    specification: 'Class 1.0 energy meter for plant generation recording',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Nos',
                    warranty: '1 Year',
                    remarks: 'Where required by the distribution licensee'
                },
                {
                    name: 'Net-Meter Interface',
                    specification: 'Interface and wiring for the bi-directional meter',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Set',
                    warranty: '—',
                    remarks: 'Meter supplied by the distribution licensee unless stated otherwise'
                }
            ],
            safety: [
                {
                    name: 'Safety Signage Set',
                    specification: 'DC / AC hazard, isolation point and emergency contact signage',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Set',
                    warranty: '—',
                    remarks: ''
                },
                {
                    name: 'Fire Safety Equipment',
                    specification: 'CO2 / DCP extinguisher at inverter room location',
                    make: 'Reputed',
                    quantity: 2,
                    unit: 'Nos',
                    warranty: '—',
                    remarks: 'Where included in scope; refilling to customer account'
                },
                {
                    name: 'Array Labelling',
                    specification: 'String, cable and equipment identification labels',
                    make: 'Reputed',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                }
            ],
            civil: isGround || isCarport
                ? [
                    {
                        name: 'Foundation Works',
                        specification: 'RCC / driven pile foundations designed for site soil condition',
                        make: 'Ray2Volt Solar',
                        quantity: 1,
                        unit: 'Lot',
                        warranty: '—',
                        remarks: 'Design confirmed after soil observation during survey'
                    },
                    {
                        name: 'Site Levelling & Drainage',
                        specification: 'Local levelling and surface drainage within the array footprint',
                        make: 'Ray2Volt Solar',
                        quantity: 1,
                        unit: 'Lot',
                        warranty: '—',
                        remarks: 'Major earthwork excluded'
                    },
                    {
                        name: 'Cable Trenching',
                        specification: 'Excavation, sand bedding, protection and backfill for buried runs',
                        make: 'Ray2Volt Solar',
                        quantity: 1,
                        unit: 'Lot',
                        warranty: '—',
                        remarks: ''
                    }
                ]
                : [
                    {
                        name: 'Roof Interface & Grouting',
                        specification: 'Pedestal grouting, sealing and waterproof treatment at fixings',
                        make: 'Ray2Volt Solar',
                        quantity: 1,
                        unit: 'Lot',
                        warranty: '—',
                        remarks: 'Roof repair and re-waterproofing excluded'
                    },
                    {
                        name: 'Equipment Mounting Provisions',
                        specification: 'Mounting arrangements for inverters and distribution boards',
                        make: 'Ray2Volt Solar',
                        quantity: 1,
                        unit: 'Lot',
                        warranty: '—',
                        remarks: ''
                    }
                ],
            installation: [
                {
                    name: 'Mechanical & Electrical Installation',
                    specification: 'Structure erection, module mounting, cabling and terminations',
                    make: 'Ray2Volt Solar',
                    quantity: 1,
                    unit: 'Job',
                    warranty: '1 Year workmanship',
                    remarks: ''
                },
                {
                    name: 'Testing & Pre-Commissioning',
                    specification: 'Insulation, continuity, polarity, earth resistance and protection checks',
                    make: 'Ray2Volt Solar',
                    quantity: 1,
                    unit: 'Job',
                    warranty: '—',
                    remarks: 'Recorded on test formats and handed over'
                },
                {
                    name: 'Commissioning & Handover',
                    specification: 'Synchronisation, monitoring configuration and operator familiarisation',
                    make: 'Ray2Volt Solar',
                    quantity: 1,
                    unit: 'Job',
                    warranty: '—',
                    remarks: ''
                }
            ],
            transport: [
                {
                    name: 'Transportation & Handling',
                    specification: 'Delivery of supplied material to site and unloading',
                    make: 'Ray2Volt Solar',
                    quantity: 1,
                    unit: 'Lot',
                    warranty: '—',
                    remarks: ''
                },
                {
                    name: 'Liaison & Documentation',
                    specification: 'DISCOM application preparation, submission and follow-up',
                    make: 'Ray2Volt Solar',
                    quantity: 1,
                    unit: 'Job',
                    warranty: '—',
                    remarks: 'Statutory fees and deposits at actuals to customer account'
                },
                {
                    name: 'As-Built Documentation Set',
                    specification: 'Drawings, datasheets, test records and warranty certificates',
                    make: 'Ray2Volt Solar',
                    quantity: 1,
                    unit: 'Set',
                    warranty: '—',
                    remarks: ''
                }
            ]
        };

        return rows;
    }

    /** Standard payment milestone template for a C&I project. */
    function defaultMilestones() {
        return [
            { name: 'Advance with order confirmation', percent: 30, note: 'Against purchase order' },
            { name: 'On design approval and material despatch', percent: 40, note: 'Before delivery to site' },
            { name: 'On completion of installation', percent: 20, note: 'Before commissioning' },
            { name: 'On commissioning and handover', percent: 10, note: 'Against handover documentation' }
        ];
    }

    /** Standard future-cost provisions offered in the savings model. */
    function defaultFutureCosts(context) {
        const years = (context && Number(context.projectionYears)) || 30;

        return [
            { name: 'Operation & maintenance', amount: 0, escalationPercent: 5, startYear: 2, endYear: years },
            { name: 'Insurance', amount: 0, escalationPercent: 5, startYear: 1, endYear: years }
        ];
    }

    return {
        defaultBomRows,
        defaultMilestones,
        defaultFutureCosts
    };
}));
