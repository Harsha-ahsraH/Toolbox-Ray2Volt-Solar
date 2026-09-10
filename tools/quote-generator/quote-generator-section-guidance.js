/** Editorial context for complete, self-contained proposal sections. */
(function (root) {
    'use strict';

    const guidance = {
        'executive-summary': [
            ['Reading the Offer', 'The headline figures summarise the proposed investment. Read them alongside the equipment schedule, scope boundaries and payment milestones to understand both the plant being offered and the basis of the price.'],
            ['Evaluation Priorities', 'Review the capacity against available installation space and daytime demand. The technical and financial sections that follow explain the assumptions behind generation, energy use and projected savings.']
        ],
        'customer-project-profile': [
            ['Project Coordination', 'The customer and site details identify the recipient of the offer and the location used for project planning. The billing address and installation address may serve different purposes; both should be checked before the order documentation is prepared.'],
            ['Site Information', 'Available roof or ground drawings, electrical single-line diagrams, recent electricity bills and details of operating hours help the project team confirm the design basis. Any information still pending should be recorded during the detailed survey.'],
            ['Planning Interfaces', 'Access arrangements, working hours, material storage and the proposed electrical connection point are important inputs to execution planning. The responsibility for any enabling work is defined by the scope inclusions and exclusions.']
        ],
        'project-objectives': [
            ['From Objectives to Design', 'The stated objectives guide the choice of capacity, equipment and installation arrangement. The detailed design translates those priorities into an array layout, electrical connection and practical access for operation and maintenance.'],
            ['Review Against Site Conditions', 'Daytime consumption, usable area and the condition of existing infrastructure should be considered together. A change to these inputs can affect the proposed configuration and should be reflected in the technical and commercial schedules.']
        ],
        'about-ray2volt': [
            ['A Coordinated Project Record', 'The proposal brings the technical concept, equipment selection and commercial scope into one document. During project development, the relevant drawings, equipment records and agreed clarifications provide a common reference for the customer and delivery team.']
        ],
        'ci-solar-benefits': [
            ['Matching Generation to Operations', 'The strongest use of on-site solar is determined by when the facility consumes electricity. Shift patterns, weekly closures and seasonal production changes should therefore be reviewed alongside annual consumption when assessing the projected benefit.']
        ],
        'proposed-solution': [
            ['From Concept to Installation', 'The configuration shown here establishes the proposed equipment and energy path. Detailed engineering develops the module placement, string arrangement, cable routes and equipment locations using the measured site conditions.'],
            ['Interfaces With the Facility', 'The existing electrical connection, access routes and maintenance clearances influence how the plant can be integrated into the premises. Any shutdown required for connection should be coordinated with the facility team during execution planning.'],
            ['Scope Reference', 'The bill of materials identifies the offered components and quantities. The installation approach and scope sections explain how these components are brought together and where the customer and contractor responsibilities begin and end.']
        ],
        'installation-approach': [
            ['Layout and Access', 'The final arrangement should consider access to modules, inverters and isolation points as well as existing services. Routes for maintenance and cleaning need to remain practical after installation, rather than being treated as leftover space.'],
            ['Coordination Before Work', 'The site survey is the point to record surface condition, lifting access, material handling and the route to the electrical connection. These observations inform the installation drawings and any enabling works identified in the agreed scope.']
        ],
        'design-basis': [
            ['How to Read the Assumptions', 'Each assumption serves a different purpose. Capacity and yield establish the generation estimate; energy allocation and tariff establish its financial value. Degradation and future costs extend that estimate over the selected analysis period.'],
            ['Inputs to Confirm', 'Compare the tariff and consumption inputs with the available bills and operating pattern. Review the installation area and equipment ratings against the site survey and bill of materials before treating the proposal as a final engineering design.'],
            ['Changes During Design', 'A revised capacity, tariff or usage pattern can change several downstream results. The generation, savings and returns sections should be read from the same proposal revision so their figures remain comparable.']
        ],
        'battery-technology': [
            ['Power and Energy', 'Battery power describes the rate at which the system can supply a load, while stored energy describes the amount available over time. Both ratings are relevant when reviewing the intended backup circuits and their operating requirements.'],
            ['Backup Load Selection', 'The proposed storage should be considered against the equipment intended to remain operational during an outage. Starting loads and the pattern of use influence this review; the selected backup circuits are confirmed during detailed engineering.'],
            ['Operating Priorities', 'The usable energy at the start of an outage depends on the operating settings and state of charge. Review the intended balance between energy use and reserve availability with the selected battery and inverter specifications.']
        ],
        'mounting-structure': [
            ['Access After Installation', 'The mounting arrangement should leave practical routes for inspection, cleaning and access to existing site services. The detailed layout determines these clearances together with the module spacing and fixing positions.']
        ],
        'monitoring-scada': [
            ['Using the Performance Record', 'Generation trends help the operator compare the plant with its own recent performance. A lower reading should be interpreted alongside weather, grid availability and operating status before it is treated as an equipment issue.'],
            ['Connectivity and Access', 'The selected equipment determines which values are available locally or through an online portal. Connectivity arrangements, account access and the scope of any additional sensors should be checked against the offered monitoring specification.'],
            ['A Useful Support Record', 'When requesting support, retain the time of the event, the displayed alarm and the relevant generation record. These details help distinguish a communications interruption from a change in the plant output.']
        ],
        'generation-assessment': [
            ['Interpreting the Profile', 'The first-year estimate establishes the starting point, and the later-year figures show the effect of the assumed annual degradation. These are planning estimates over the selected analysis period; they should not be read as a fixed energy delivery schedule.'],
            ['Operational Influences', 'Module cleanliness, shading changes and periods when the system cannot operate affect the energy recorded at site. Comparing operating records over time helps explain differences between the assessment and the measured result.']
        ],
        'consumption-profile': [
            ['Annual Use and Daytime Demand', 'An annual consumption total describes the scale of the electricity requirement, but does not show when the energy is used. Daytime operating hours are particularly relevant because they determine how much solar generation can coincide with facility demand.'],
            ['Working Days and Seasonal Variation', 'Weekly closures, production peaks and seasonal shutdowns can change the balance between on-site consumption and surplus generation. A monthly average smooths these differences, so the operating calendar is a useful companion to the billing history.'],
            ['Information for the Next Review', 'A twelve-month set of electricity bills and, where available, interval demand readings give a more detailed basis for review. Note any planned equipment additions or changes in shift pattern that may make historical consumption less representative.'],
            ['Connection to the Savings Estimate', 'The energy utilization section applies the selected self-consumption and export assumptions. Those assumptions should be considered alongside this consumption profile when assessing how much of the generated energy will reduce purchased units.']
        ],
        'energy-utilization': [
            ['Coincidence Matters', 'The allocation shown here represents the selected planning assumptions. Actual on-site use depends on solar output and facility demand occurring at the same time; equal annual totals alone do not establish that match.'],
            ['Surplus Energy', 'The selected metering arrangement and export assumptions determine how surplus generation is valued in this proposal. Review those inputs together with working days and any periods of low demand at the facility.'],
            ['Reading the Financial Results', 'Self-consumed and exported units may have different values in the calculation. The savings projection combines those values over time, so a change in the assumed allocation can affect the financial result without changing total generation.']
        ],
        'returns-analysis': [
            ['Comparing Options', 'Compare proposals using the same analysis horizon, tariff assumptions and future cost basis. A lower initial price alone does not show the effect of equipment scope, maintenance provision or the assumed pattern of energy use.']
        ],
        'environmental-impact': [
            ['Energy as the Starting Point', 'The environmental estimate begins with the projected electricity generation over the selected analysis period. It therefore shares the generation model\'s assumptions, including the capacity, yield and annual degradation applied in this proposal.'],
            ['Meaning of the Emission Factor', 'The displayed factor converts each projected unit of electricity into an indicative avoided-emissions value. The result is a modelled comparison using that factor, rather than a measurement of emissions at the customer\'s premises.'],
            ['Using the Tree Comparison', 'The tree equivalent is included only to help communicate the scale of the calculated figure. It does not describe a planting programme, land requirement or an additional environmental benefit beyond the energy-based estimate.'],
            ['Tracking the Result', 'Once the plant is operating, measured generation provides the energy record for a fresh assessment. Keep the period, emission factor and calculation basis with any reported figure so later comparisons can be understood consistently.']
        ],
        'scope-inclusions': [
            ['Reading the Included Scope', 'Read these clauses alongside the bill of materials. The equipment schedule identifies the listed items and quantities, while this section describes the activities and services included in the offer. Neither should be reviewed in isolation.'],
            ['Clarifying Interfaces', 'The exclusions section identifies work outside the quoted scope. Where an activity crosses the boundary between the solar installation and existing site infrastructure, record the agreed responsibility in the project clarifications before execution.']
        ],
        'scope-exclusions': [
            ['Planning for Excluded Work', 'An exclusion may still be relevant to completing the project at the site. Review these items with the facility team so that any required work, approval or infrastructure can be identified and coordinated with the solar installation.'],
            ['Reference for Clarifications', 'Use the relevant clause and equipment item when discussing a scope question. This keeps technical requirements and the quoted price connected and makes the responsibility easier to confirm in the project record.']
        ],
        'execution-methodology': [
            ['Coordination Between Stages', 'Survey findings feed the design, and the reviewed specification guides procurement and installation. Keeping the current drawings and equipment details available to each team helps the work progress against the same project basis.']
        ],
        'project-schedule': [
            ['Dependencies Before Dates', 'The sequence identifies how the activities relate to one another. Material availability, drawing reviews, site readiness and access to the electrical connection can influence when a stage is ready to begin.'],
            ['Facility Coordination', 'Review any connection shutdown, restricted working hours and material delivery access with the facility team. These practical constraints should be considered when the project programme is prepared.'],
            ['Keeping the Programme Current', 'Track completed activities and outstanding dependencies together. If a key input changes, review the affected downstream activities so the programme continues to describe the current execution plan.']
        ],
        'quality-assurance': [
            ['Inspection Records', 'The checks in this section connect the supplied equipment with the installed system. Record the relevant identification, observation and test result so that any item requiring follow-up can be traced to its location or component.']
        ],
        'health-safety': [
            ['Coordination With Site Operations', 'Site procedures, access restrictions and ongoing operations should inform work planning. Identify the responsible site contacts and communicate changes in the work area before the affected activity begins.']
        ],
        'commercial-offer': [
            ['Price and Technical Scope', 'The offered price corresponds to the equipment and scope described in this proposal. Review the listed quantities, inclusions and exclusions alongside the commercial summary to understand what the amount covers.'],
            ['Related Commercial Sections', 'The payment milestones show how the offered amount is allocated to payment triggers. The terms and conditions set out the applicable commercial provisions, while the acceptance page identifies the proposal being accepted.']
        ],
        'payment-milestones': [
            ['Reading a Milestone', 'Each row connects a payment trigger with a percentage, amount and any entered due condition. Review the complete row when planning a payment; the percentage alone does not describe the event to which it relates.'],
            ['Calculation Basis', 'The milestone amounts use the final offered price shown in the commercial section. The total percentage provides a check on the allocation, and the displayed amounts allow the payment plan to be compared with the overall offer.'],
            ['Project Coordination', 'The timing of a payment trigger should be read alongside the execution sequence and the stated due condition. Where a trigger needs clarification, refer to its name and the proposal reference when confirming the intended arrangement.'],
            ['Payment Records', 'Keep the proposal reference and milestone description with the payment record. This helps the customer and project team match the transaction to the corresponding stage and reconcile the amounts already paid.'],
            ['Related Documents', 'Read this schedule with the commercial offer, applicable terms and acceptance page. Any project-specific clarification should identify the affected milestone so that the payment schedule remains clear to both parties.']
        ],
        'annexure-index': [
            ['Using the Attached Documents', 'The index lists the supporting files included with this issue of the proposal. Use the page reference to find the start of each attachment; a file with several pages continues in its original order before the next attachment begins.'],
            ['Equipment References', 'Where a manufacturer datasheet is attached, match its model and rating with the equipment schedule. A datasheet may describe a wider product family, so the offered selection remains identifiable through the make, specification and quantity in the bill of materials.'],
            ['Layouts and Drawings', 'Where a layout or electrical drawing is attached, review its title and revision before using it as a project reference. Drawings communicate equipment arrangement and connections; read any notes on dimensions, assumptions and design status with the drawing itself.'],
            ['Project Context', 'Site photographs and supporting project records provide context for the proposed installation. Refer to the relevant location, observation or document date when raising a clarification so the discussion can be connected to the correct part of the site.'],
            ['Cross-Checking the Offer', 'Review the attachments together with the technical sections, equipment schedule and scope boundaries. If a supporting document appears to describe a different configuration, identify the specific item or page for clarification before relying on it.'],
            ['Keeping References Together', 'Retain the proposal reference when sharing a question about an attachment. Including the attachment title, its own revision where shown, and the relevant page helps the project team review the same information.']
        ],
        'why-ray2volt': [
            ['A Clear Basis for the Next Step', 'Use this proposal to review the equipment, installation approach and investment together. Any questions about the site assumptions or scope can then be resolved against the relevant section before the project moves to detailed planning.']
        ]
    };

    const pages = root.QuoteGeneratorPages;
    Object.entries(guidance).forEach(([id, entries]) => {
        const render = pages.renderers[id];
        if (!render) return;
        pages.renderers[id] = context => {
            const descriptor = render(context);
            const page = context.page;
            if (page && page.partCount && page.part !== page.partCount - 1) return descriptor;
            // Detailed consumption already includes the monthly table and chart.
            const selected = id === 'consumption-profile' && context.derived.consumption.method === 'detailed'
                ? entries.slice(0, 1) : entries;
            descriptor.body += selected.map(([title, text]) =>
                `<section class="cq-reading-block"><h3 class="cq-subtitle">${pages.helpers.esc(title)}</h3>`
                + `<p class="cq-para">${pages.helpers.esc(text)}</p></section>`).join('');
            return descriptor;
        };
    });
}(typeof self !== 'undefined' ? self : this));
