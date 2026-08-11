/**
 * Quote Generator - Maintained Comprehensive content
 * Ray2Volt Solar Toolbox
 *
 * Every piece of standard Ray2Volt copy, clause library, narrative default and
 * default BOM row for the Comprehensive Proposal lives here so it can be revised
 * in one place. Sales does not edit this copy inside an individual quotation.
 *
 * Content rules (spec section 10): state only what Ray2Volt can stand behind.
 * No certifications, client counts, installed capacity, years in business,
 * awards or performance records appear anywhere in this file. Unknown
 * site-specific facts are written as "subject to detailed site verification"
 * rather than given a fabricated value.
 */
(function (root, factory) {
    'use strict';
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorContent = api;
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const COMPANY = {
        legalName: 'Ray2Volt Solar Private Limited',
        cin: 'U35104AP2025PTC118526',
        address: '1-278, Pichatur Road, Srikalahasti, 517640, Andhra Pradesh',
        confidentiality: 'This proposal and its contents are confidential and are issued solely for '
            + 'the evaluation of the recipient named above. It may not be reproduced or disclosed to '
            + 'any third party without the written consent of Ray2Volt Solar Private Limited.'
    };

    /** About Ray2Volt - carries forward the wording already used on the Short Proposal. */
    const ABOUT = {
        lead: 'Ray2Volt Solar Private Limited is a solar energy solutions provider delivering '
            + 'grid-connected and hybrid solar power systems for commercial, industrial and '
            + 'residential customers.',
        paragraphs: [
            'We deliver projects on a turnkey EPC basis. A single team carries a project from site '
            + 'survey and system design through supply, installation, testing, commissioning and '
            + 'the associated DISCOM approvals, so the customer holds one point of accountability '
            + 'for the whole scope.',
            'Our engineering approach is to size and specify each plant against the site it will '
            + 'actually occupy — the available shadow-free area, the roof or ground condition, the '
            + 'existing electrical infrastructure and the customer\'s load pattern — rather than '
            + 'against a standard package.',
            'We specify components from established manufacturers, retain the manufacturer '
            + 'warranties in the customer\'s name, and hand over the complete documentation set at '
            + 'commissioning so the plant can be operated and maintained independently of us.'
        ],
        capabilities: [
            { title: 'Design & Engineering', text: 'Site assessment, array layout, electrical design, structural approach and single-line diagrams.' },
            { title: 'Procurement', text: 'Specification and supply of modules, inverters, structures and balance-of-system material.' },
            { title: 'Installation', text: 'Civil, structural, mechanical and electrical installation with in-house and supervised teams.' },
            { title: 'Approvals', text: 'Preparation and follow-up of DISCOM net-metering and interconnection applications.' },
            { title: 'Commissioning', text: 'Pre-commissioning checks, testing, synchronisation and performance demonstration.' },
            { title: 'After-Sales', text: 'Warranty coordination, monitoring support and maintenance under agreed terms.' }
        ]
    };

    /** Why C&I solar - generic value proposition, no customer-specific promises. */
    const CI_BENEFITS = {
        lead: 'For a commercial or industrial consumer, a rooftop or ground-mounted solar plant '
            + 'substitutes self-generated energy for grid energy during daylight hours. The value of '
            + 'that substitution depends on the tariff, the load profile and the metering '
            + 'arrangement, all of which are stated explicitly in the analysis sections of this '
            + 'proposal.',
        benefits: [
            {
                title: 'Reduced Energy Cost',
                text: 'Self-consumed solar energy displaces grid units billed at the commercial or '
                    + 'industrial tariff, which is typically the highest-value use of generation.'
            },
            {
                title: 'Protection From Tariff Escalation',
                text: 'The cost of the plant is fixed at the outset, so the share of consumption it '
                    + 'serves is insulated from future tariff revisions.'
            },
            {
                title: 'Long Asset Life',
                text: 'PV modules carry long performance warranties and degrade slowly and '
                    + 'predictably, which supports a long analysis horizon.'
            },
            {
                title: 'Low Operating Requirement',
                text: 'A fixed-tilt plant has no rotating parts. Routine operation is limited to '
                    + 'cleaning, inspection and monitoring.'
            },
            {
                title: 'Reduced Emissions Intensity',
                text: 'Displacing grid energy reduces the emissions associated with the site\'s '
                    + 'electricity consumption, on the grid emission factor disclosed in this document.'
            },
            {
                title: 'Use of Existing Space',
                text: 'Roof, shed or unused open land is converted into a generating asset without '
                    + 'additional land acquisition.'
            }
        ]
    };

    const EXECUTION_METHODOLOGY = {
        lead: 'The project is executed in defined stages. Each stage has an identified output and '
            + 'is signed off before the next begins.',
        stages: [
            {
                title: 'Detailed Site Survey',
                text: 'Measurement of the available area, shadow assessment, structural observation, '
                    + 'review of the existing electrical system and confirmation of the '
                    + 'interconnection point.'
            },
            {
                title: 'Design & Engineering',
                text: 'Array layout, string configuration, cable sizing, protection coordination, '
                    + 'earthing design and single-line diagram, issued for customer review.'
            },
            {
                title: 'Approvals & Documentation',
                text: 'Preparation and submission of the DISCOM net-metering or interconnection '
                    + 'application and supporting documents, and follow-up until sanction.'
            },
            {
                title: 'Procurement & Inspection',
                text: 'Placement of orders against the approved specification, verification of '
                    + 'delivered material against datasheets, and recording of serial numbers.'
            },
            {
                title: 'Civil & Structural Works',
                text: 'Foundations or roof interfaces, structure fabrication and erection, and '
                    + 'alignment to the approved layout.'
            },
            {
                title: 'Mechanical & Electrical Installation',
                text: 'Module mounting, DC and AC cabling, distribution boxes, inverter mounting, '
                    + 'earthing and lightning protection.'
            },
            {
                title: 'Testing & Pre-Commissioning',
                text: 'Continuity, insulation resistance, polarity, earth resistance and protection '
                    + 'function checks, recorded on test formats.'
            },
            {
                title: 'Commissioning & Handover',
                text: 'Synchronisation, performance observation, monitoring configuration, operator '
                    + 'familiarisation and handover of the documentation set.'
            }
        ]
    };

    const PROJECT_SCHEDULE = {
        lead: 'The sequence below is the standard execution sequence for a C&I plant. Durations '
            + 'depend on material lead times, site readiness and DISCOM processing, and are '
            + 'confirmed against the site after the detailed survey.',
        note: 'Activities marked as dependent on external agencies are outside Ray2Volt\'s direct '
            + 'control and are tracked but not guaranteed as to date.',
        milestones: [
            { activity: 'Order confirmation and kick-off', dependency: 'Ray2Volt / Customer' },
            { activity: 'Detailed site survey and measurement', dependency: 'Ray2Volt' },
            { activity: 'Design, drawings and customer approval', dependency: 'Ray2Volt / Customer' },
            { activity: 'DISCOM application submission and sanction', dependency: 'External agency' },
            { activity: 'Material procurement and delivery to site', dependency: 'Ray2Volt / Suppliers' },
            { activity: 'Civil and structural works', dependency: 'Ray2Volt' },
            { activity: 'Module mounting and electrical installation', dependency: 'Ray2Volt' },
            { activity: 'Testing and pre-commissioning checks', dependency: 'Ray2Volt' },
            { activity: 'Net-meter installation and inspection', dependency: 'External agency' },
            { activity: 'Commissioning, handover and documentation', dependency: 'Ray2Volt' }
        ]
    };

    const QUALITY_ASSURANCE = {
        lead: 'Quality control is applied at material receipt, during installation and at '
            + 'commissioning. Results are recorded so the plant can be audited after handover.',
        checks: [
            {
                title: 'Incoming Material',
                items: [
                    'Delivered make and model verified against the approved bill of materials',
                    'Physical inspection for transit damage before acceptance',
                    'Module and inverter serial numbers recorded for warranty registration',
                    'Cable, structure and protection ratings checked against the design'
                ]
            },
            {
                title: 'During Installation',
                items: [
                    'Structure alignment, tilt and orientation checked against the approved layout',
                    'Torque and fastening checks on structural connections',
                    'DC string polarity and open-circuit voltage verified before energisation',
                    'Cable routing, support, bending radius and labelling inspected'
                ]
            },
            {
                title: 'Testing & Commissioning',
                items: [
                    'Insulation resistance and continuity tests on DC and AC circuits',
                    'Earth resistance measurement at the earth pits',
                    'Protection device operation and isolation checks',
                    'Inverter parameter configuration and synchronisation verified',
                    'Generation observed against expected output for the prevailing conditions'
                ]
            },
            {
                title: 'Documentation',
                items: [
                    'As-built single-line diagram and array layout',
                    'Equipment datasheets and warranty certificates',
                    'Completed test and commissioning records',
                    'Monitoring access details and operating instructions'
                ]
            }
        ]
    };

    const HEALTH_SAFETY = {
        lead: 'Work at the site is carried out under a defined safety approach covering working at '
            + 'height, electrical work and material handling.',
        practices: [
            {
                title: 'Site Preparation',
                items: [
                    'Safety briefing before work begins and on change of activity',
                    'Demarcation of the work area and control of access',
                    'Verification of roof or ground access routes and load paths'
                ]
            },
            {
                title: 'Working at Height',
                items: [
                    'Personal protective equipment including helmets, harnesses and safety footwear',
                    'Anchorage points and fall arrest for roof and structure work',
                    'Controlled lifting and lowering of material; no free throwing'
                ]
            },
            {
                title: 'Electrical Safety',
                items: [
                    'Isolation and lock-out before work on live systems',
                    'Insulated tools and rated personal protective equipment for electrical work',
                    'DC circuits kept covered or terminated until commissioning',
                    'Verification of de-energisation before any termination work'
                ]
            },
            {
                title: 'Site Responsibilities',
                items: [
                    'The customer provides safe access to the work area and the interconnection point',
                    'Existing site safety rules are followed by the installation team',
                    'Incidents and near-misses are reported to the customer\'s site contact',
                    'The work area is cleared of waste material at the end of the works'
                ]
            }
        ]
    };

    const WARRANTY_SUPPORT = {
        lead: 'Equipment carries the manufacturer warranty applicable to the supplied make and '
            + 'model. Warranty documentation is registered in the customer\'s name and handed over '
            + 'at commissioning.',
        workmanship: 'Ray2Volt warrants its installation workmanship against defective execution '
            + 'for the period stated in the terms and conditions of this proposal.',
        support: [
            'Warranty claims with manufacturers are coordinated by Ray2Volt on the customer\'s behalf.',
            'Monitoring access is configured at commissioning so plant output can be reviewed remotely.',
            'Preventive maintenance, module cleaning and periodic inspection can be provided under a '
            + 'separate maintenance agreement; the scope offered in this proposal is stated in the '
            + 'inclusions and exclusions sections.',
            'Response to a reported fault is provided on the terms agreed in the contract; attendance '
            + 'outside the warranty scope is chargeable.'
        ],
        exclusionsNote: 'Manufacturer warranties exclude damage from causes outside normal operation, '
            + 'including physical damage, unauthorised modification, and events outside reasonable '
            + 'control. The manufacturer\'s own warranty document governs in all cases.'
    };

    const WHY_RAY2VOLT = {
        lead: 'What the customer gets by placing the work with Ray2Volt.',
        differentiators: [
            {
                title: 'Single Point of Responsibility',
                text: 'Design, supply, installation, approvals and commissioning are delivered under '
                    + 'one contract, so responsibility for the working plant is not split across vendors.'
            },
            {
                title: 'Site-Specific Engineering',
                text: 'The plant is designed against the surveyed site rather than a standard package, '
                    + 'and the assumptions behind the design are written down in this proposal.'
            },
            {
                title: 'Transparent Commercials',
                text: 'The offered price, the taxes within it and the payment triggers are stated in '
                    + 'full, with the scope inclusions and exclusions listed explicitly.'
            },
            {
                title: 'Documented Handover',
                text: 'As-built drawings, test records, datasheets and warranty certificates are handed '
                    + 'over so the plant can be maintained by anyone competent to do so.'
            },
            {
                title: 'Traceable Assumptions',
                text: 'Generation, savings and returns are derived from the inputs disclosed in the '
                    + 'design basis, so the customer can test the numbers against their own view.'
            }
        ],
        nextSteps: [
            'Review this proposal and confirm the intended capacity and scope.',
            'Raise any commercial or technical clarification for written response.',
            'Confirm acceptance of the offer and the payment terms.',
            'Ray2Volt schedules the detailed site survey and issues the design for approval.'
        ]
    };

    /** Standard technology overviews. Project-specific equipment is merged in at render. */
    const TECHNOLOGY = {
        modules: {
            lead: 'The plant uses crystalline silicon photovoltaic modules from an established '
                + 'manufacturer, selected for the specified capacity and the available installation area.',
            points: [
                { title: 'Construction', text: 'Tempered front glass, encapsulated cell laminate and a framed assembly rated for outdoor operation.' },
                { title: 'Performance Warranty', text: 'Modules carry a manufacturer performance warranty over a long horizon in addition to a product warranty against manufacturing defect.' },
                { title: 'Degradation', text: 'Output reduces gradually and predictably over the module life; the rate assumed in this analysis is stated in the design basis.' },
                { title: 'Certification', text: 'Supplied modules conform to the standards declared by the manufacturer for the model offered.' },
                { title: 'Handling', text: 'Modules are transported, stored and mounted per the manufacturer\'s handling instructions; serial numbers are recorded for warranty registration.' }
            ]
        },
        inverters: {
            lead: 'The inverter converts array DC output into AC synchronised with the site supply, '
                + 'and provides the protection functions required for grid interconnection.',
            points: [
                { title: 'MPPT Tracking', text: 'Multiple maximum power point trackers allow strings on different orientations to operate independently.' },
                { title: 'Grid Protection', text: 'Anti-islanding, over/under voltage and over/under frequency protection operate to the applicable interconnection requirement.' },
                { title: 'Monitoring', text: 'Generation, string-level status and fault codes are available locally and through the manufacturer monitoring platform.' },
                { title: 'Sizing', text: 'Inverter AC capacity is selected against the array DC capacity; the resulting DC/AC ratio is stated in the proposed solution.' },
                { title: 'Installation', text: 'Inverters are mounted in a ventilated, shaded and accessible location with clearances per the manufacturer requirement.' }
            ]
        },
        battery: {
            lead: 'The hybrid configuration includes a battery energy storage system that stores '
                + 'surplus generation and supports the connected loads when required.',
            points: [
                { title: 'Battery Management', text: 'An integrated battery management system monitors cell voltage, current and temperature and protects against out-of-range operation.' },
                { title: 'Usable Energy', text: 'Usable energy is lower than nameplate energy because of the configured depth of discharge; the rated figures supplied are stated in the bill of materials.' },
                { title: 'Charge Sources', text: 'The battery charges from surplus solar generation and, where configured, from the grid according to the operating mode set at commissioning.' },
                { title: 'Backup Operation', text: 'Loads intended to run on backup must be identified before installation so the backup circuit can be separated.' },
                { title: 'Siting', text: 'The battery is installed in a ventilated, dry location within the temperature range specified by the manufacturer.' }
            ]
        },
        monitoring: {
            lead: 'The plant is supplied with monitoring so generation and plant health can be '
                + 'reviewed without attending site.',
            capabilities: [
                'Live and historical generation data at plant level',
                'String or MPPT level status where the supplied inverter provides it',
                'Fault and alarm codes with time stamps',
                'Access from browser and mobile application provided by the equipment manufacturer',
                'Export of generation data for the customer\'s own energy reporting'
            ],
            note: 'Monitoring depends on a stable internet connection at site. Where the customer '
                + 'requires integration with an existing SCADA or energy management system, the '
                + 'interface and protocol are confirmed during detailed engineering.'
        }
    };

    const SYSTEM_ARCHITECTURE = {
        'On-Grid': {
            lead: 'The plant operates in parallel with the DISCOM supply. Generation serves the site '
                + 'load first; any surplus is exported through the bi-directional meter under the '
                + 'metering arrangement stated in this proposal.',
            steps: [
                { title: 'Generation', text: 'The module array converts irradiance into DC power.' },
                { title: 'DC Protection', text: 'String cabling is collected in the DCDB with fuses, isolation and surge protection.' },
                { title: 'Conversion', text: 'The grid-tied inverter converts DC into AC synchronised with the site supply.' },
                { title: 'AC Protection', text: 'The ACDB provides isolation, protection and a defined connection point.' },
                { title: 'Interconnection', text: 'AC output is connected at the agreed point in the site distribution system.' },
                { title: 'Metering', text: 'Import and export are recorded by the bi-directional meter for settlement.' }
            ]
        },
        Hybrid: {
            lead: 'The hybrid plant operates alongside the DISCOM supply and a battery. Generation '
                + 'serves the site load first, then charges the battery; the battery supports the '
                + 'designated backup circuit when the grid is unavailable.',
            steps: [
                { title: 'Generation', text: 'The module array converts irradiance into DC power.' },
                { title: 'DC Protection', text: 'String cabling is collected in the DCDB with fuses, isolation and surge protection.' },
                { title: 'Hybrid Conversion', text: 'The hybrid inverter routes power between the array, the battery, the load and the grid.' },
                { title: 'Storage', text: 'Surplus generation charges the battery within the limits set by the battery management system.' },
                { title: 'Normal Supply', text: 'Site loads run from solar, battery and grid according to the configured priority.' },
                { title: 'Backup Supply', text: 'On loss of grid, the designated backup circuit continues to run from battery and available solar.' }
            ]
        }
    };

    /** Installation approach copy keyed by Installation Location. */
    const INSTALLATION_APPROACH = {
        'rcc-rooftop': {
            title: 'RCC Rooftop Installation',
            lead: 'The array is installed on the reinforced concrete roof using a ballasted or '
                + 'chemically anchored structure selected after structural observation of the roof.',
            points: [
                'Roof condition, waterproofing and available shadow-free area are confirmed during the detailed survey.',
                'The structure is designed to distribute load onto the roof without concentrated point loading beyond what the roof can carry.',
                'Penetrations, where unavoidable, are sealed and treated; a non-penetrating approach is preferred where the roof permits.',
                'Walkways and access to existing roof services are maintained.',
                'Structure height is set to allow cleaning and inspection beneath the array.'
            ]
        },
        'metal-sheet-rooftop': {
            title: 'Metal-Sheet Rooftop Installation',
            lead: 'The array is mounted on the existing metal roof using clamps or rail systems '
                + 'matched to the sheet profile and purlin spacing.',
            points: [
                'Sheet profile, thickness, purlin spacing and fastening condition are confirmed during the detailed survey.',
                'Mounting is made onto structural members rather than sheet alone wherever the roof design allows.',
                'Fixings are sealed to preserve the weather-tightness of the roof.',
                'Array layout maintains clearance from ridges, valleys, gutters and roof services.',
                'Existing roof condition is recorded before work begins.'
            ]
        },
        'ground-mounted': {
            title: 'Ground-Mounted Installation',
            lead: 'The array is installed on a fixed-tilt ground structure on foundations designed '
                + 'for the site soil condition.',
            points: [
                'Ground levelling, drainage and soil condition are assessed before foundation design is finalised.',
                'Foundations are cast or driven according to the approach confirmed after the site survey.',
                'Row spacing is set to limit inter-row shading at the design condition.',
                'Cable routing between rows uses buried or trayed runs with mechanical protection.',
                'Site boundary, access road and security arrangements are the customer\'s scope unless stated otherwise.'
            ]
        },
        carport: {
            title: 'Carport Installation',
            lead: 'The array forms the roof of a purpose-built parking structure designed for the '
                + 'clearances and spans required at the site.',
            points: [
                'Column positions, spans and vehicle clearances are confirmed against the parking layout.',
                'Foundations are designed for the structure loading and the site soil condition.',
                'Drainage from the array surface is directed away from the parking area.',
                'Cable runs are concealed within the structure where practical.',
                'Structural design and approvals for the carport are confirmed during detailed engineering.'
            ]
        },
        mixed: {
            title: 'Mixed Installation',
            lead: 'The plant is distributed across more than one installation type. Each area is '
                + 'engineered for its own condition and the allocated capacities are listed in the '
                + 'proposed solution.',
            points: [
                'Each installation area is surveyed and designed against its own structural and access condition.',
                'String configuration keeps arrays on different orientations on separate MPPT inputs where required.',
                'Cable routing between areas is designed to limit voltage drop within the design limit.',
                'A single interconnection point is used unless the site electrical layout requires otherwise.',
                'Allocated capacities across areas are reconciled against the total plant capacity.'
            ]
        }
    };

    const ENVIRONMENTAL = {
        gridEmissionFactorKgPerKwh: 0.82,
        treesPerTonneCo2: 45,
        note: 'Emission avoidance is calculated from the projected generation using a grid emission '
            + 'factor of 0.82 kg CO2 per kWh. The tree equivalence is an illustrative conversion at '
            + '45 trees per tonne of CO2 and is not a measured sequestration figure. Both are '
            + 'presented as indicative only.'
    };

    /** Standard clause libraries. Sales edits these per quotation in the clause editors. */
    const CLAUSES = {
        terms: [
            'This quotation is valid for the number of days stated on the cover of this proposal from the date of issue.',
            'Prices are inclusive of GST at the rate shown in the commercial offer. Any statutory change in taxes or duties after the date of this offer will be charged at actuals.',
            'Payment is due against the milestones stated in this proposal. Material is despatched and work is scheduled only against cleared payment for the corresponding milestone.',
            'The offered price is based on the capacity, specification and site conditions stated in this proposal. A change in capacity, specification, site condition or scope will be re-quoted before execution.',
            'Supply of equipment is subject to availability at the time of order confirmation. Where an offered make or model is unavailable, an equivalent or superior alternative will be offered for the customer\'s written approval.',
            'Equipment warranties are those of the respective manufacturers and are passed through to the customer. Ray2Volt coordinates warranty claims but does not extend the manufacturer\'s warranty period.',
            'Ray2Volt warrants installation workmanship against defective execution for one year from the date of commissioning.',
            'Project timelines are indicative and are confirmed after the detailed site survey. Delays caused by DISCOM processing, statutory approvals, site unavailability or customer-side dependencies are excluded from the committed schedule.',
            'The customer provides safe access to the site and the work area, together with unobstructed working space for the duration of the works.',
            'The customer provides power and water at site free of cost for construction, installation, testing and cleaning.',
            'Storage space at site for material is provided by the customer. Material delivered to site is at the customer\'s risk once accepted at site.',
            'Any civil work, structural strengthening, roof repair or electrical modification found necessary during the detailed survey and not listed in the inclusions is chargeable additionally.',
            'Statutory fees, DISCOM charges, meter charges, deposits and liaison charges payable to any authority are at actuals and to the customer\'s account unless expressly included.',
            'Generation, savings and return figures in this proposal are projections based on the assumptions disclosed in the design basis. They are estimates, not guaranteed outcomes, and actual results vary with irradiance, temperature, tariff, load pattern and grid availability.',
            'Ray2Volt is not liable for loss of generation or consequential loss arising from grid unavailability, tariff or policy change, force majeure, or any cause outside its reasonable control.',
            'Title to the supplied equipment passes to the customer only on receipt of full payment.',
            'Any dispute arising out of this offer is subject to the jurisdiction of the courts at Srikalahasti, Andhra Pradesh.'
        ],
        inclusions: [
            'Detailed site survey, shadow assessment and system design for the quoted capacity.',
            'Supply of solar PV modules, inverters and balance-of-system material as listed in the bill of materials.',
            'Supply and installation of the module mounting structure as specified.',
            'DC and AC cabling, connectors, distribution boxes and protection devices within the plant boundary as listed.',
            'Earthing and lightning protection as listed in the bill of materials.',
            'Mechanical and electrical installation, testing and commissioning of the plant.',
            'Configuration of inverter monitoring and demonstration of the monitoring platform to the customer.',
            'Preparation and submission of the DISCOM net-metering or interconnection application and follow-up until sanction.',
            'Transportation of supplied material to site and unloading at the agreed location.',
            'As-built drawings, equipment datasheets, test records and warranty documentation at handover.',
            'Site clean-up and removal of installation waste on completion of the works.'
        ],
        exclusions: [
            'Statutory fees, DISCOM charges, net-meter cost, security deposits and liaison charges payable to any authority, unless expressly included in the commercial offer.',
            'Any upgrade, modification or repair of the existing electrical installation, including transformer, panel, cabling or protection upgrades.',
            'Structural strengthening, roof repair, waterproofing or roof replacement work found necessary during the detailed survey.',
            'Civil works beyond those listed in the bill of materials, including boundary walls, fencing, access roads, drainage and site levelling.',
            'Provision of power and water at site during construction, installation, testing and cleaning.',
            'Storage, security and watch-and-ward of material at site.',
            'Any crane, hoist or specialised lifting arrangement not listed in the bill of materials.',
            'Diesel generator synchronisation, load management or automation equipment unless expressly listed.',
            'Periodic module cleaning, preventive maintenance and operation of the plant after handover, unless covered by a separate maintenance agreement.',
            'Replacement of consumables and of any component damaged by causes outside normal operation.',
            'Any work, material or service not expressly listed in the scope inclusions or the bill of materials.'
        ]
    };

    /**
     * Editable narrative defaults for Project Description & Scope. These are
     * loaded once, tracked as defaults, and never overwrite an edited field.
     * Deliberately factual and free of invented site facts.
     */
    /**
     * Where the plant sits, written as a prepositional phrase. Reading the
     * Installation Location label straight into the sentence produces
     * "installed on ground-mounted", so each location carries its own wording.
     */
    const LOCATION_PHRASES = {
        'rcc-rooftop': 'on the reinforced concrete roof of the building',
        'metal-sheet-rooftop': 'on the existing metal-sheet roof',
        'ground-mounted': 'on open ground within the site boundary',
        carport: 'on a purpose-built carport structure',
        mixed: 'across more than one installation area at the site'
    };

    function narrativeDefaults(context) {
        const settings = context || {};
        const configuration = settings.systemConfiguration === 'Hybrid' ? 'Hybrid' : 'On-Grid';
        const isHybrid = configuration === 'Hybrid';
        const locationPhrase = LOCATION_PHRASES[settings.installationLocation]
            || 'at the identified installation area';

        // Before a capacity is entered the sentence has to read correctly
        // without one, rather than splicing a placeholder into the grammar.
        const capacityValue = Number(settings.dcCapacityKwp);
        const article = /^[aeiou]/i.test(configuration) ? 'an' : 'a';
        const plantPhrase = capacityValue > 0
            ? `a ${capacityValue} kWp ${configuration.toLowerCase()} solar photovoltaic plant`
            : `${article} ${configuration.toLowerCase()} solar photovoltaic plant, sized to the `
                + 'capacity stated elsewhere in this proposal,';

        return {
            objective: 'The customer intends to reduce the cost of grid electricity at the site by '
                + 'generating a part of the site\'s consumption from an on-site solar photovoltaic '
                + 'plant, and to hold the cost of that share of consumption steady against future '
                + 'tariff revisions. The capacity proposed in this document is sized against the '
                + 'consumption and site information available at the time of offer and is subject to '
                + 'detailed site verification.',
            existingSystem: 'The site is supplied from the distribution licensee at the existing '
                + 'service connection. Details of the connected load, contract demand, supply voltage, '
                + 'existing transformer and panel arrangement, and the intended interconnection point '
                + 'are to be confirmed during the detailed site survey. The proposed plant is designed '
                + 'to operate in parallel with the existing supply without interrupting normal site '
                + 'operation.',
            proposedSolution: `Ray2Volt proposes ${plantPhrase} installed ${locationPhrase}. `
                + 'The plant comprises the module array, mounting structure, '
                + (isHybrid ? 'hybrid inverter and battery energy storage, ' : 'grid-tied inverters, ')
                + 'DC and AC distribution and protection, earthing and lightning protection, '
                + 'monitoring, and the associated cabling and civil work as listed in the bill of '
                + 'materials. Generation serves the site load first'
                + (isHybrid
                    ? ', surplus energy charges the battery, and the designated backup circuit is '
                        + 'supported when the grid is unavailable.'
                    : ', and surplus energy is exported under the metering arrangement stated in this '
                        + 'proposal.'),
            siteConditions: 'The shadow-free area available for the array, the structural condition '
                + 'of the installation surface, access for material handling, and the route from the '
                + 'array to the interconnection point are to be confirmed during the detailed site '
                + 'survey. Any constraint identified during that survey that affects the capacity, '
                + 'layout or scope of this offer will be communicated in writing before execution.',
            specialRequirements: 'No special customer requirements have been recorded at the time of '
                + 'this offer. Any specific requirement relating to working hours, site access, '
                + 'shutdown windows, safety induction, documentation or interfacing with existing '
                + 'systems should be advised so it can be incorporated into the execution plan.',
            projectNotes: 'This proposal is issued for the customer\'s evaluation. Capacities, '
                + 'quantities and commercial figures stated here are those of the offer as made and '
                + 'are subject to the terms and conditions included in this document.'
        };
    }

    return {
        COMPANY,
        ABOUT,
        CI_BENEFITS,
        EXECUTION_METHODOLOGY,
        PROJECT_SCHEDULE,
        QUALITY_ASSURANCE,
        HEALTH_SAFETY,
        WARRANTY_SUPPORT,
        WHY_RAY2VOLT,
        TECHNOLOGY,
        SYSTEM_ARCHITECTURE,
        INSTALLATION_APPROACH,
        ENVIRONMENTAL,
        CLAUSES,
        narrativeDefaults
    };
}));
