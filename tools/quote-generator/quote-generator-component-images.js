/** Component visuals and the explanations printed beside them. */
(function (root) {
    'use strict';

    root.QuoteGeneratorComponentImages = {
        mounting: {
            file: 'mounting.png',
            label: 'Module support structure',
            alt: 'Tilted module support frame showing rails, bracing, clamps and ballast feet.',
            description: 'Rails, clamps and braced supports secure the modules and transfer loads to the installation surface. The fixing method, spacing and structural arrangement follow the detailed site design.',
            width: 1536,
            height: 1024
        },
        battery: {
            file: 'battery.png',
            label: 'Battery energy storage',
            alt: 'Modular rack battery cabinet with a controller and six battery modules.',
            description: 'Rack modules store energy within a managed battery system. The controller monitors operating conditions, while the approved energy and power ratings determine the storage configuration.',
            width: 1536,
            height: 1024
        },
        dcdb: {
            file: 'dcdb.png',
            label: 'DC distribution & protection',
            alt: 'Open DC distribution enclosure with fuse holders, surge protection and an isolator.',
            description: 'DC protection equipment brings string circuits together and provides the specified isolation, fusing and surge protection. Device ratings are coordinated with array voltage and current.',
            width: 1536,
            height: 1024
        },
        connectors: {
            file: 'connectors.png',
            label: 'Solar cables & connectors',
            alt: 'Coiled photovoltaic cable with a pair of locking solar connectors.',
            description: 'PV cables and compatible connectors link modules into strings. Their ratings and routing suit the array voltage and current.',
            width: 1536,
            height: 1024
        },
        metering: {
            file: 'metering.png',
            label: 'Energy metering',
            alt: 'Three-phase digital electricity meter with a protected terminal compartment.',
            description: 'Meters record energy at agreed measurement points. The meter type and import/export arrangement follow the utility approval.',
            width: 1536,
            height: 1024
        },
        inverters: {
            file: 'inverters.png',
            label: 'Solar inverter',
            alt: 'Commercial solar inverter with cooling fins and cable connections.',
            description: 'The inverter converts DC electricity to AC and tracks the array operating point. Its protection and communications interfaces connect generation to the site supply and monitoring system.',
            width: 1536,
            height: 1024
        },
        acdb: {
            file: 'acdb.png',
            label: 'AC distribution & protection',
            alt: 'An open distribution board showing circuit breakers and wiring.',
            description: 'AC distribution equipment connects inverter output to the facility through the specified switching and protection devices. Enclosure and circuit ratings follow the approved electrical design.',
            width: 1536,
            height: 1024
        },
        modules: {
            file: 'modules.png',
            label: 'Solar modules',
            alt: 'Front and rear views of framed photovoltaic modules.',
            description: 'Solar cells convert sunlight into DC electricity. The frame protects the laminate, while the rear junction box and connectors link each module into the array strings.',
            width: 1536,
            height: 1024
        }
    };
}(typeof self !== 'undefined' ? self : this));
