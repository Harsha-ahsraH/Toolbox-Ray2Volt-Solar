/**
 * Quote Generator - Derived values, validation and page planning
 * Ray2Volt Solar Toolbox
 *
 * The read-only half of the Comprehensive model. Given a state object it
 * answers three questions:
 *
 *   1. What do the numbers come to?  (capacity reconciliation, commercial
 *      totals, the year-by-year projection, payback, environmental impact)
 *   2. Is the quotation fit to export?  (panel states, warnings, and the
 *      critical errors that disable Print and Download but never the Preview)
 *   3. What pages will it produce?  (the page plan that the thumbnails, the
 *      table of contents, the "Page X of Y" footers, print and the downloaded
 *      PDF all read, so that all four always agree)
 *
 * Derived totals are computed here on demand and never written back into state
 * as a competing authoritative value. No DOM access anywhere in this file.
 */
(function (root, factory) {
    'use strict';
    const config = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-config.js')
        : root.QuoteGeneratorConfig;
    const content = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-content.js')
        : root.QuoteGeneratorContent;
    const model = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-model.js')
        : root.QuoteGeneratorModel;
    const pagination = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-pagination.js')
        : root.QuoteGeneratorPagination;

    const api = factory(config, content, model, pagination);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorCalc = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Content, Model, Pagination) {
    'use strict';

    // Selectors and numeric helpers borrowed from the state model, so the two
    // halves cannot drift apart on rounding or on what counts as "enabled".
    const num = Model.num;
    const str = Model.str;
    const trimmed = Model.trimmed;
    const round = Model.round;
    const findCategory = Model.getBomCategory;
    const enabledClauses = Model.enabledClauses;
    const selectedSections = Model.selectedSections;
    const includedAnnexures = Model.includedAnnexures;

    // ---------------------------------------------------------------------
    // Derived values
    // ---------------------------------------------------------------------

    function ratedRows(state, categoryId) {
        const category = findCategory(state, categoryId);
        if (!category) return [];

        return category.rows.filter(row => num(row.rating) > 0 && num(row.quantity) > 0);
    }

    /** Module DC total in kWp, from Wp rating x quantity. */
    function bomModuleKwp(state) {
        return ratedRows(state, 'modules').reduce((total, row) => {
            const rating = num(row.rating);
            const unit = trimmed(row.ratingUnit).toLowerCase();
            const kw = unit === 'kwp' || unit === 'kw' ? rating : rating / 1000;
            return total + (kw * num(row.quantity));
        }, 0);
    }

    /** Inverter AC total in kW. */
    function bomInverterKw(state) {
        return ratedRows(state, 'inverters').reduce((total, row) => {
            const rating = num(row.rating);
            const unit = trimmed(row.ratingUnit).toLowerCase();
            const kw = unit === 'w' ? rating / 1000 : rating;
            return total + (kw * num(row.quantity));
        }, 0);
    }

    function bomBatteryEnergyKwh(state) {
        return ratedRows(state, 'battery')
            .filter(row => trimmed(row.ratingUnit).toLowerCase() === 'kwh')
            .reduce((total, row) => total + (num(row.rating) * num(row.quantity)), 0);
    }

    function bomBatteryPowerKw(state) {
        return ratedRows(state, 'battery')
            .filter(row => trimmed(row.ratingUnit).toLowerCase() === 'kw')
            .reduce((total, row) => total + (num(row.rating) * num(row.quantity)), 0);
    }

    function mixedLocationTotalKwp(state) {
        return (state.project.mixedLocations || [])
            .reduce((total, row) => total + num(row.capacityKwp), 0);
    }

    function dcAcRatio(state) {
        const dc = num(state.project.dcCapacityKwp);
        const ac = num(state.project.acCapacityKw);
        return ac > 0 ? dc / ac : 0;
    }

    /** Difference beyond max(0.1 absolute, 0.5% of approved) counts as a mismatch. */
    function capacityTolerance(approved) {
        return Math.max(
            Config.CAPACITY_TOLERANCE.absolute,
            Math.abs(approved) * Config.CAPACITY_TOLERANCE.relative
        );
    }

    /**
     * Percentage totals must land within 0.01 percentage point of 100.
     *
     * The comparison is inclusive and carries an epsilon: a total of 99.99 is
     * exactly on the specified tolerance and must pass, but binary floating
     * point makes |99.99 - 100| evaluate to 0.010000000000005, which a bare
     * `<= 0.01` would reject.
     */
    function withinPercentTolerance(total) {
        return Math.abs(num(total) - 100) <= Config.PERCENT_TOLERANCE + 1e-9;
    }

    function reconcileCapacity(approved, derived) {
        const difference = derived - approved;
        const tolerance = capacityTolerance(approved);

        return {
            approved: round(approved, 3),
            derived: round(derived, 3),
            difference: round(difference, 3),
            tolerance: round(tolerance, 3),
            mismatch: Math.abs(difference) > tolerance
        };
    }

    function capacityReconciliation(state) {
        const isHybrid = state.project.systemConfiguration === 'Hybrid';

        const result = {
            modules: reconcileCapacity(num(state.project.dcCapacityKwp), bomModuleKwp(state)),
            inverters: reconcileCapacity(num(state.project.acCapacityKw), bomInverterKw(state)),
            batteryEnergy: reconcileCapacity(num(state.project.batteryEnergyKwh), bomBatteryEnergyKwh(state)),
            batteryPower: reconcileCapacity(num(state.project.batteryPowerKw), bomBatteryPowerKw(state)),
            hasRatedModules: ratedRows(state, 'modules').length > 0,
            hasRatedInverters: ratedRows(state, 'inverters').length > 0,
            hasRatedBattery: ratedRows(state, 'battery').length > 0,
            // Energy and power are reconciled separately, because a battery row
            // carries one rating: a kWh row says nothing about kW and vice versa.
            hasRatedBatteryEnergy: ratedRows(state, 'battery')
                .filter(row => trimmed(row.ratingUnit).toLowerCase() === 'kwh').length > 0,
            hasRatedBatteryPower: ratedRows(state, 'battery')
                .filter(row => trimmed(row.ratingUnit).toLowerCase() === 'kw').length > 0,
            appliesBattery: isHybrid
        };

        return result;
    }

    function commercialTotals(state) {
        const commercial = state.commercial;
        const actualProjectCost = Math.max(0, num(commercial.actualProjectCost));
        const breakdownTotal = (commercial.priceBreakdown || [])
            .reduce((total, row) => total + num(row.amount), 0);
        const discountTotal = (commercial.discounts || [])
            .reduce((total, row) => total + Math.max(0, num(row.amount)), 0);
        const finalPrice = Math.max(0, actualProjectCost - discountTotal);
        const gstRate = num(commercial.gstRate, Config.DEFAULTS.gstRate);
        const taxableValue = gstRate > -100 ? finalPrice / (1 + (gstRate / 100)) : finalPrice;
        const gstAmount = finalPrice - taxableValue;
        const milestonePercentTotal = (commercial.milestones || [])
            .reduce((total, row) => total + num(row.percent), 0);

        return {
            actualProjectCost,
            breakdownTotal: round(breakdownTotal, 2),
            hasBreakdown: (commercial.priceBreakdown || []).length > 0,
            breakdownMatches: Math.abs(breakdownTotal - actualProjectCost) <= 1,
            discountTotal: round(discountTotal, 2),
            finalPrice: round(finalPrice, 2),
            taxableValue: round(taxableValue, 2),
            gstAmount: round(gstAmount, 2),
            gstRate,
            isInterState: commercial.gstType === 'inter',
            milestonePercentTotal: round(milestonePercentTotal, 4),
            milestones: (commercial.milestones || []).map(row => ({
                id: row.id,
                name: row.name,
                percent: num(row.percent),
                note: row.note,
                amount: round(finalPrice * (num(row.percent) / 100), 2)
            }))
        };
    }

    function consumptionTotals(state) {
        const savings = state.savings;

        if (savings.consumptionMethod === 'detailed') {
            const rows = savings.monthlyRows || [];
            const annualKwh = rows.reduce((total, row) => total + num(row.importedKwh), 0);
            const annualBill = rows.reduce((total, row) => total + num(row.billAmount), 0);
            const demands = rows.map(row => num(row.maxDemandKva)).filter(value => value > 0);

            return {
                method: 'detailed',
                annualKwh: round(annualKwh, 0),
                monthlyKwh: round(annualKwh / 12, 0),
                annualBill: round(annualBill, 0),
                maxDemandKva: demands.length ? Math.max.apply(null, demands) : 0,
                averageTariff: annualKwh > 0 ? round(annualBill / annualKwh, 2) : num(savings.tariffRate)
            };
        }

        const monthlyKwh = num(savings.monthlyConsumptionKwh);

        return {
            method: 'simple',
            annualKwh: round(monthlyKwh * 12, 0),
            monthlyKwh: round(monthlyKwh, 0),
            annualBill: round(monthlyKwh * 12 * num(savings.tariffRate), 0),
            maxDemandKva: 0,
            averageTariff: num(savings.tariffRate)
        };
    }

    /**
     * Year-by-year energy and cash-flow projection. Generation degrades, the
     * tariff and the export credit escalate, and future costs are subtracted in
     * the years they apply.
     */
    function projection(state) {
        const savings = state.savings;
        const capacity = num(state.project.dcCapacityKwp);
        const years = Math.max(1, Math.round(num(savings.projectionYears, Config.DEFAULTS.projectionYears)));
        const yieldPerKwp = num(savings.annualGenerationPerKwp, Config.DEFAULTS.annualGenerationPerKwp);
        const escalation = num(savings.tariffEscalationPercent) / 100;
        const degradation = num(savings.degradationPercent) / 100;
        const selfShare = num(savings.selfConsumptionPercent) / 100;
        const exportShare = num(savings.exportPercent) / 100;

        // On Detailed C&I entry the tariff comes from the twelve months of bills
        // the customer supplied, not from the Simple-mode tariff field, which is
        // hidden in that mode and would otherwise silently drive the whole
        // projection — leaving the savings inconsistent with the consumption
        // page printed a few pages earlier. consumptionTotals falls back to the
        // entered tariff when there is nothing to derive from.
        const consumption = consumptionTotals(state);
        const baseTariff = num(consumption.averageTariff);
        const baseExportRate = num(savings.exportCreditRate);
        const year1Generation = capacity * yieldPerKwp;

        const rows = [];
        let cumulativeNet = 0;

        for (let year = 1; year <= years; year++) {
            const generation = year1Generation * Math.pow(1 - degradation, year - 1);
            const tariff = baseTariff * Math.pow(1 + escalation, year - 1);
            const exportRate = baseExportRate * Math.pow(1 + escalation, year - 1);
            const selfSavings = generation * selfShare * tariff;
            const exportCredit = generation * exportShare * exportRate;
            const grossSavings = selfSavings + exportCredit;
            const costs = futureCostForYear(state, year);
            const netSavings = grossSavings - costs;

            cumulativeNet += netSavings;

            rows.push({
                year,
                generationKwh: round(generation, 0),
                tariff: round(tariff, 2),
                exportRate: round(exportRate, 2),
                selfSavings: round(selfSavings, 0),
                exportCredit: round(exportCredit, 0),
                grossSavings: round(grossSavings, 0),
                costs: round(costs, 0),
                netSavings: round(netSavings, 0),
                cumulativeNet: round(cumulativeNet, 0)
            });
        }

        return {
            years,
            year1GenerationKwh: round(year1Generation, 0),
            specificYield: yieldPerKwp,
            rows,
            totalGenerationKwh: round(rows.reduce((total, row) => total + row.generationKwh, 0), 0),
            totalGrossSavings: round(rows.reduce((total, row) => total + row.grossSavings, 0), 0),
            totalCosts: round(rows.reduce((total, row) => total + row.costs, 0), 0),
            totalNetSavings: round(cumulativeNet, 0)
        };
    }

    function futureCostForYear(state, year) {
        return (state.savings.futureCosts || []).reduce((total, cost) => {
            const startYear = Math.max(1, Math.round(num(cost.startYear, 1)));
            const endYear = Math.max(startYear, Math.round(num(cost.endYear, startYear)));

            if (year < startYear || year > endYear) return total;

            const escalation = num(cost.escalationPercent) / 100;
            return total + (num(cost.amount) * Math.pow(1 + escalation, year - startYear));
        }, 0);
    }

    /** Simple payback in years against the net investment, or null if never. */
    function paybackYears(netInvestment, rows) {
        if (netInvestment <= 0) return 0;

        for (let index = 0; index < rows.length; index++) {
            if (rows[index].cumulativeNet >= netInvestment) {
                const previous = index === 0 ? 0 : rows[index - 1].cumulativeNet;
                const gap = rows[index].cumulativeNet - previous;
                const fraction = gap > 0 ? (netInvestment - previous) / gap : 0;
                return round(index + fraction, 1);
            }
        }

        return null;
    }

    function environmentalImpact(state, projectionResult) {
        const totalKwh = projectionResult.totalGenerationKwh;
        const co2Tonnes = (totalKwh * Content.ENVIRONMENTAL.gridEmissionFactorKgPerKwh) / 1000;

        return {
            totalKwh,
            co2Tonnes: round(co2Tonnes, 1),
            treesEquivalent: Math.round(co2Tonnes * Content.ENVIRONMENTAL.treesPerTonneCo2),
            cleanEnergyMwh: round(totalKwh / 1000, 1),
            note: Content.ENVIRONMENTAL.note
        };
    }

    function derived(state) {
        const commercial = commercialTotals(state);
        const projectionResult = projection(state);

        return {
            reconciliation: capacityReconciliation(state),
            dcAcRatio: round(dcAcRatio(state), 2),
            mixedLocationTotalKwp: round(mixedLocationTotalKwp(state), 3),
            commercial,
            consumption: consumptionTotals(state),
            projection: projectionResult,
            payback: paybackYears(commercial.finalPrice, projectionResult.rows),
            environmental: environmentalImpact(state, projectionResult)
        };
    }

    // ---------------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------------

    const PANELS = [
        'sections',
        'customer',
        'project',
        'narrative',
        'bom',
        'commercial',
        'savings',
        'contract',
        'annexures'
    ];

    /**
     * `kind` separates the two states specification section 8.1 asks for: a
     * required input that is simply absent leaves its panel Incomplete, while a
     * value that was entered and conflicts leaves it in Error. Both can still be
     * critical and block export.
     */
    function issue(severity, panel, field, message, kind) {
        return { severity, panel, field, message, kind: kind || 'invalid' };
    }

    /** A required input that has not been supplied yet. */
    function missing(panel, field, message) {
        return issue('critical', panel, field, message, 'missing');
    }

    /**
     * Full validation pass. `critical` issues block Print and Download but never
     * block the Preview, which renders placeholders instead.
     */
    function validate(state) {
        const issues = [];
        const isComprehensive = state.mode === Config.MODES.COMPREHENSIVE;
        const customer = state.customer;
        const project = state.project;
        const totals = commercialTotals(state);
        const reconciliation = capacityReconciliation(state);
        const isHybrid = project.systemConfiguration === 'Hybrid';

        // --- Customer -----------------------------------------------------
        if (customer.customerType === 'company') {
            if (!trimmed(customer.companyName)) {
                issues.push(missing('customer', 'companyName', 'Legal company name is required.'));
            }
            if (!trimmed(customer.contactPerson)) {
                issues.push(missing('customer', 'contactPerson', 'Contact person is required.'));
            }
        } else if (!trimmed(customer.customerName)) {
            issues.push(missing('customer', 'customerName', 'Customer name is required.'));
        }

        if (!trimmed(customer.phone)) {
            issues.push(missing('customer', 'phone', 'Phone number is required.'));
        }
        if (!trimmed(customer.billingAddress)) {
            issues.push(missing('customer', 'billingAddress', 'Registered/billing address is required.'));
        }
        if (!customer.sameAsBilling && !trimmed(customer.siteAddress)) {
            issues.push(missing('customer', 'siteAddress', 'Project/site address is required.'));
        }
        if (trimmed(customer.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed(customer.email))) {
            issues.push(issue('warning', 'customer', 'email', 'Email address does not look valid.'));
        }

        // --- Project ------------------------------------------------------
        if (!trimmed(project.quoteDate)) {
            issues.push(missing('project', 'quoteDate', 'Quote date is required.'));
        }
        if (!trimmed(project.quoteNumber)) {
            issues.push(missing('project', 'quoteNumber', 'Quotation number is required.'));
        }
        if (num(project.dcCapacityKwp) <= 0) {
            issues.push(missing('project', 'dcCapacityKwp', 'Solar DC capacity (kWp) is required.'));
        }
        if (isComprehensive && num(project.acCapacityKw) <= 0) {
            issues.push(missing('project', 'acCapacityKw', 'Inverter AC capacity (kW) is required in Comprehensive mode.'));
        }
        if (isComprehensive && isHybrid && num(project.batteryEnergyKwh) <= 0) {
            issues.push(missing('project', 'batteryEnergyKwh', 'Battery energy capacity (kWh) is required for a Hybrid proposal.'));
        }
        if (isComprehensive && isHybrid && num(project.batteryPowerKw) <= 0) {
            issues.push(missing('project', 'batteryPowerKw', 'Battery power rating (kW) is required for a Hybrid proposal.'));
        }
        if (num(project.validityDays) < 0) {
            issues.push(issue('critical', 'project', 'validityDays', 'Quotation validity cannot be negative.'));
        }

        if (project.installationLocation === 'mixed') {
            const allocated = mixedLocationTotalKwp(state);
            const approved = num(project.dcCapacityKwp);

            if (!(state.project.mixedLocations || []).length) {
                // Nothing allocated cannot reconcile against a real capacity, so
                // this blocks export rather than merely warning.
                issues.push(missing('project', 'mixedLocations',
                    'A mixed installation needs at least one installation area with its allocated capacity.'));
            } else if (approved > 0 && Math.abs(allocated - approved) > capacityTolerance(approved)) {
                issues.push(issue('critical', 'project', 'mixedLocations',
                    `Allocated capacity (${round(allocated, 2)} kWp) does not match project DC capacity (${round(approved, 2)} kWp).`));
            }

            (state.project.mixedLocations || []).forEach(row => {
                if (num(row.capacityKwp) < 0) {
                    issues.push(issue('critical', 'project', 'mixedLocations', 'Allocated capacity cannot be negative.'));
                }
            });
        }

        // --- BOM reconciliation -------------------------------------------
        if (isComprehensive) {
            if (num(project.dcCapacityKwp) > 0) {
                if (!reconciliation.hasRatedModules) {
                    issues.push(issue('warning', 'bom', 'modules', 'No rated module rows, so DC capacity cannot be reconciled.'));
                } else if (reconciliation.modules.mismatch) {
                    issues.push(issue('critical', 'bom', 'modules',
                        `BOM module total (${reconciliation.modules.derived} kWp) does not match approved DC capacity (${reconciliation.modules.approved} kWp).`));
                }
            }

            if (num(project.acCapacityKw) > 0) {
                if (!reconciliation.hasRatedInverters) {
                    issues.push(issue('warning', 'bom', 'inverters', 'No rated inverter rows, so AC capacity cannot be reconciled.'));
                } else if (reconciliation.inverters.mismatch) {
                    issues.push(issue('critical', 'bom', 'inverters',
                        `BOM inverter total (${reconciliation.inverters.derived} kW) does not match approved AC capacity (${reconciliation.inverters.approved} kW).`));
                }
            }

            if (isHybrid && num(project.batteryEnergyKwh) > 0) {
                if (!reconciliation.hasRatedBatteryEnergy) {
                    issues.push(issue('warning', 'bom', 'battery', 'No kWh-rated battery rows, so battery energy cannot be reconciled.'));
                } else if (reconciliation.batteryEnergy.mismatch) {
                    issues.push(issue('critical', 'bom', 'battery',
                        `BOM battery energy (${reconciliation.batteryEnergy.derived} kWh) does not match approved battery capacity (${reconciliation.batteryEnergy.approved} kWh).`));
                }
            }

            // Battery power is only reconciled when the estimator has actually
            // rated rows in kW. Most bills of materials itemise energy alone, so
            // silence — rather than a standing warning on every hybrid quote —
            // is the right answer when there is nothing to compare against.
            if (isHybrid && num(project.batteryPowerKw) > 0
                && reconciliation.hasRatedBatteryPower
                && reconciliation.batteryPower.mismatch) {
                issues.push(issue('critical', 'bom', 'battery',
                    `BOM battery power (${reconciliation.batteryPower.derived} kW) does not match approved battery power rating (${reconciliation.batteryPower.approved} kW).`));
            }
        }

        (state.bom.categories || []).forEach(category => {
            category.rows.forEach(row => {
                if (num(row.quantity) < 0) {
                    issues.push(issue('critical', 'bom', category.id, 'Quantity cannot be negative.'));
                }
                if (num(row.rating) < 0) {
                    issues.push(issue('critical', 'bom', category.id, 'Rating cannot be negative.'));
                }
            });
        });

        // --- Commercial ----------------------------------------------------
        if (totals.actualProjectCost <= 0) {
            issues.push(missing('commercial', 'actualProjectCost', 'Actual Project Cost (incl. GST) is required.'));
        }
        if (num(state.commercial.gstRate) < 0) {
            issues.push(issue('critical', 'commercial', 'gstRate', 'GST percentage cannot be negative.'));
        }
        if (totals.discountTotal > totals.actualProjectCost && totals.actualProjectCost > 0) {
            issues.push(issue('critical', 'commercial', 'discounts', 'Total discount cannot exceed the Actual Project Cost.'));
        }
        (state.commercial.discounts || []).forEach(row => {
            if (num(row.amount) < 0) {
                issues.push(issue('critical', 'commercial', 'discounts', 'Discount amount cannot be negative.'));
            }
        });
        if (totals.hasBreakdown && !totals.breakdownMatches) {
            issues.push(issue('warning', 'commercial', 'priceBreakdown',
                `Price breakdown total (${totals.breakdownTotal}) does not match Actual Project Cost (${totals.actualProjectCost}). The entered cost remains authoritative.`));
        }

        if (isComprehensive) {
            if (!(state.commercial.milestones || []).length) {
                issues.push(missing('commercial', 'milestones', 'At least one payment milestone is required.'));
            } else if (!withinPercentTolerance(totals.milestonePercentTotal)) {
                issues.push(issue('critical', 'commercial', 'milestones',
                    `Payment milestones total ${round(totals.milestonePercentTotal, 2)}%. They must total 100%.`));
            }

            (state.commercial.milestones || []).forEach(row => {
                if (num(row.percent) < 0) {
                    issues.push(issue('critical', 'commercial', 'milestones', 'Milestone percentage cannot be negative.'));
                }
            });
        }

        // --- Savings -------------------------------------------------------
        const utilizationTotal = num(state.savings.selfConsumptionPercent) + num(state.savings.exportPercent);

        if (isComprehensive && !withinPercentTolerance(utilizationTotal)) {
            issues.push(issue('critical', 'savings', 'selfConsumptionPercent',
                `Self-consumption and export split totals ${round(utilizationTotal, 2)}%. It must total 100%.`));
        }
        if (num(state.savings.projectionYears) <= 0 || Math.round(num(state.savings.projectionYears)) !== num(state.savings.projectionYears)) {
            issues.push(issue('critical', 'savings', 'projectionYears', 'Projection period must be a positive whole number of years.'));
        }
        if (num(state.savings.tariffEscalationPercent) < -100) {
            issues.push(issue('critical', 'savings', 'tariffEscalationPercent',
                'Tariff escalation below -100% would make future tariffs negative.'));
        }
        if (num(state.savings.tariffRate) < 0) {
            issues.push(issue('critical', 'savings', 'tariffRate', 'Electricity tariff cannot be negative.'));
        }
        if (num(state.savings.annualGenerationPerKwp) < 0) {
            issues.push(issue('critical', 'savings', 'annualGenerationPerKwp', 'Annual generation cannot be negative.'));
        }
        if (num(state.savings.degradationPercent) < 0 || num(state.savings.degradationPercent) > 100) {
            issues.push(issue('critical', 'savings', 'degradationPercent', 'Degradation must be between 0 and 100%.'));
        }
        if (num(state.savings.selfConsumptionPercent) < 0 || num(state.savings.exportPercent) < 0) {
            issues.push(issue('critical', 'savings', 'selfConsumptionPercent', 'Utilization percentages cannot be negative.'));
        }

        (state.savings.futureCosts || []).forEach(cost => {
            if (num(cost.amount) < 0) {
                issues.push(issue('critical', 'savings', 'futureCosts', 'Future cost amount cannot be negative.'));
            }
            if (num(cost.escalationPercent) < -100) {
                issues.push(issue('critical', 'savings', 'futureCosts',
                    'Cost escalation below -100% would make future costs negative.'));
            }
            if (num(cost.startYear) < 1 || num(cost.endYear) < 1) {
                issues.push(issue('critical', 'savings', 'futureCosts', 'Future cost years must be 1 or greater.'));
            }
            if (num(cost.endYear) < num(cost.startYear)) {
                issues.push(issue('critical', 'savings', 'futureCosts', 'Future cost end year cannot be before its start year.'));
            }
        });

        if (state.savings.consumptionMethod === 'detailed') {
            (state.savings.monthlyRows || []).forEach(row => {
                if (num(row.importedKwh) < 0 || num(row.billAmount) < 0 || num(row.maxDemandKva) < 0) {
                    issues.push(issue('critical', 'savings', 'monthlyRows', 'Monthly consumption values cannot be negative.'));
                }
            });
        }

        // --- Contract ------------------------------------------------------
        if (isComprehensive && !enabledClauses(state, 'terms').length) {
            issues.push(issue('warning', 'contract', 'terms', 'No terms and conditions are enabled.'));
        }

        // --- Sections ------------------------------------------------------
        if (isComprehensive && !selectedSections(state).length) {
            issues.push(issue('critical', 'sections', 'selectedSectionIds', 'Select at least one proposal section.'));
        }

        return summarize(state, issues);
    }

    /**
     * Rolls issues up into per-panel states. A panel with no issues but with a
     * missing required field is Incomplete; a panel with an invalid entered
     * value is Error.
     */
    function summarize(state, issues) {
        const isComprehensive = state.mode === Config.MODES.COMPREHENSIVE;
        const panels = {};

        PANELS.forEach(panel => { panels[panel] = 'complete'; });

        // Panels that do not exist in Short mode report as complete.
        issues.forEach(item => {
            if (item.severity === 'critical' && item.kind !== 'missing') {
                // An entered value that conflicts: Error, and it stays Error.
                panels[item.panel] = 'error';
            } else if (panels[item.panel] === 'complete') {
                // A required input not supplied yet, or a warning: Incomplete.
                panels[item.panel] = 'incomplete';
            }
        });

        const criticalIssues = issues.filter(item => item.severity === 'critical');

        return {
            issues,
            criticalIssues,
            warnings: issues.filter(item => item.severity === 'warning'),
            panels,
            hasCriticalErrors: criticalIssues.length > 0,
            canExport: criticalIssues.length === 0,
            isComprehensive
        };
    }

    return {
        // derived
        derived,
        capacityReconciliation,
        reconcileCapacity,
        capacityTolerance,
        withinPercentTolerance,
        commercialTotals,
        consumptionTotals,
        projection,
        futureCostForYear,
        paybackYears,
        environmentalImpact,
        mixedLocationTotalKwp,
        dcAcRatio,
        bomModuleKwp,
        bomInverterKw,
        bomBatteryEnergyKwh,
        bomBatteryPowerKw,

        // validation
        validate,
        PANELS,

        // pagination, re-exported from quote-generator-pagination.js so callers
        // and tests keep one entry point for the model's read-only half
        chunkRows: Pagination.chunkRows,
        chunkByHeight: Pagination.chunkByHeight,
        activeBomCategories: Pagination.activeBomCategories,
        bomLines: Pagination.bomLines,
        bomLineHeights: Pagination.bomLineHeights,
        clauseHeights: Pagination.clauseHeights,
        tocEntryHeights: Pagination.tocEntryHeights,
        milestoneRowHeights: Pagination.milestoneRowHeights,
        breakdownRowHeights: Pagination.breakdownRowHeights,
        annexureIndexHeights: Pagination.annexureIndexHeights,
        narrativeUnits: Pagination.narrativeUnits,
        narrativeUnitHeights: Pagination.narrativeUnitHeights,
        warrantyRows: Pagination.warrantyRows,
        warrantyRowHeights: Pagination.warrantyRowHeights,
        bomRowCount: Pagination.bomRowCount,
        sectionPageCount: Pagination.sectionPageCount,
        sectionChunks: Pagination.sectionChunks,
        planPages: Pagination.planPages,
        tableOfContents: Pagination.tableOfContents,
        estimatedPageCount: Pagination.estimatedPageCount
    };
}));
