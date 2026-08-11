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

    const api = factory(config, content, model);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorCalc = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Content, Model) {
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
        const baseTariff = num(savings.tariffRate);
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

    function issue(severity, panel, field, message) {
        return { severity, panel, field, message };
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
                issues.push(issue('critical', 'customer', 'companyName', 'Legal company name is required.'));
            }
            if (!trimmed(customer.contactPerson)) {
                issues.push(issue('critical', 'customer', 'contactPerson', 'Contact person is required.'));
            }
        } else if (!trimmed(customer.customerName)) {
            issues.push(issue('critical', 'customer', 'customerName', 'Customer name is required.'));
        }

        if (!trimmed(customer.phone)) {
            issues.push(issue('critical', 'customer', 'phone', 'Phone number is required.'));
        }
        if (!trimmed(customer.billingAddress)) {
            issues.push(issue('critical', 'customer', 'billingAddress', 'Registered/billing address is required.'));
        }
        if (!customer.sameAsBilling && !trimmed(customer.siteAddress)) {
            issues.push(issue('critical', 'customer', 'siteAddress', 'Project/site address is required.'));
        }
        if (trimmed(customer.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed(customer.email))) {
            issues.push(issue('warning', 'customer', 'email', 'Email address does not look valid.'));
        }

        // --- Project ------------------------------------------------------
        if (!trimmed(project.quoteDate)) {
            issues.push(issue('critical', 'project', 'quoteDate', 'Quote date is required.'));
        }
        if (!trimmed(project.quoteNumber)) {
            issues.push(issue('critical', 'project', 'quoteNumber', 'Quotation number is required.'));
        }
        if (num(project.dcCapacityKwp) <= 0) {
            issues.push(issue('critical', 'project', 'dcCapacityKwp', 'Solar DC capacity (kWp) is required.'));
        }
        if (isComprehensive && num(project.acCapacityKw) <= 0) {
            issues.push(issue('critical', 'project', 'acCapacityKw', 'Inverter AC capacity (kW) is required in Comprehensive mode.'));
        }
        if (isComprehensive && isHybrid && num(project.batteryEnergyKwh) <= 0) {
            issues.push(issue('critical', 'project', 'batteryEnergyKwh', 'Battery energy capacity (kWh) is required for a Hybrid proposal.'));
        }
        if (isComprehensive && isHybrid && num(project.batteryPowerKw) <= 0) {
            issues.push(issue('critical', 'project', 'batteryPowerKw', 'Battery power rating (kW) is required for a Hybrid proposal.'));
        }
        if (num(project.validityDays) < 0) {
            issues.push(issue('critical', 'project', 'validityDays', 'Quotation validity cannot be negative.'));
        }

        if (project.installationLocation === 'mixed') {
            const allocated = mixedLocationTotalKwp(state);
            const approved = num(project.dcCapacityKwp);

            if (!(state.project.mixedLocations || []).length) {
                issues.push(issue('warning', 'project', 'mixedLocations', 'Add at least one installation area for a mixed installation.'));
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
                if (!reconciliation.hasRatedBattery) {
                    issues.push(issue('warning', 'bom', 'battery', 'No rated battery rows, so battery capacity cannot be reconciled.'));
                } else if (reconciliation.batteryEnergy.mismatch) {
                    issues.push(issue('critical', 'bom', 'battery',
                        `BOM battery energy (${reconciliation.batteryEnergy.derived} kWh) does not match approved battery capacity (${reconciliation.batteryEnergy.approved} kWh).`));
                }
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
            issues.push(issue('critical', 'commercial', 'actualProjectCost', 'Actual Project Cost (incl. GST) is required.'));
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
                issues.push(issue('critical', 'commercial', 'milestones', 'At least one payment milestone is required.'));
            } else if (Math.abs(totals.milestonePercentTotal - 100) > Config.PERCENT_TOLERANCE) {
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

        if (isComprehensive && Math.abs(utilizationTotal - 100) > Config.PERCENT_TOLERANCE) {
            issues.push(issue('critical', 'savings', 'selfConsumptionPercent',
                `Self-consumption and export split totals ${round(utilizationTotal, 2)}%. It must total 100%.`));
        }
        if (num(state.savings.projectionYears) <= 0 || Math.round(num(state.savings.projectionYears)) !== num(state.savings.projectionYears)) {
            issues.push(issue('critical', 'savings', 'projectionYears', 'Projection period must be a positive whole number of years.'));
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
            if (item.severity === 'critical') {
                panels[item.panel] = 'error';
            } else if (panels[item.panel] === 'complete') {
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

    // ---------------------------------------------------------------------
    // Page planning
    // ---------------------------------------------------------------------

    /**
     * Splits `totalRows` across pages, allowing the first page a smaller budget
     * because it also carries the section heading. Always returns at least one
     * chunk so an empty table still gets its page.
     */
    function chunkRows(totalRows, firstPageRows, continuationRows) {
        const chunks = [];
        const total = Math.max(0, Math.round(totalRows));

        if (total <= firstPageRows) {
            return [{ start: 0, end: total }];
        }

        chunks.push({ start: 0, end: firstPageRows });
        let cursor = firstPageRows;

        while (cursor < total) {
            const end = Math.min(total, cursor + continuationRows);
            chunks.push({ start: cursor, end });
            cursor = end;
        }

        return chunks;
    }

    /** Non-empty BOM categories, with their rows, in catalog order. */
    function activeBomCategories(state) {
        return Config.BOM_CATEGORIES
            .filter(category => !category.configurations
                || category.configurations.indexOf(state.project.systemConfiguration) !== -1)
            .map(category => {
                const stored = findCategory(state, category.id);
                const rows = stored
                    ? stored.rows.filter(row => trimmed(row.name) || trimmed(row.specification))
                    : [];
                return { id: category.id, label: category.label, rows };
            })
            .filter(category => category.rows.length > 0);
    }

    /**
     * Splits items across pages by their estimated height rather than by a flat
     * row count. An item taller than a whole page still gets its own chunk
     * instead of looping forever.
     */
    function chunkByHeight(heights, firstBudget, budget) {
        if (!heights.length) return [{ start: 0, end: 0 }];

        const chunks = [];
        let start = 0;
        let used = 0;
        let limit = firstBudget;

        for (let index = 0; index < heights.length; index++) {
            const height = heights[index];

            if (used > 0 && used + height > limit) {
                chunks.push({ start, end: index });
                start = index;
                used = 0;
                limit = budget;
            }

            used += height;
        }

        chunks.push({ start, end: heights.length });
        return chunks;
    }

    /** How many wrapped lines a cell of `text` takes in a column of that width. */
    function wrappedLines(text, charsPerLine) {
        const length = trimmed(text).length;
        return Math.max(1, Math.ceil(length / charsPerLine));
    }

    /**
     * The printed BOM as one flat list: a heading line per non-empty category,
     * then one line per row. The renderer draws exactly this list, so the page
     * plan's chunks and the drawn rows cannot drift apart.
     */
    function bomLines(state) {
        const lines = [];

        activeBomCategories(state).forEach(category => {
            lines.push({ kind: 'category', label: category.label });
            category.rows.forEach(row => lines.push({ kind: 'row', row }));
        });

        return lines;
    }

    /** Total printed lines for the BOM: one heading line per category plus rows. */
    function bomRowCount(state) {
        return bomLines(state).length;
    }

    function bomLineHeights(state) {
        const metrics = Config.PAGINATION.bom;

        return bomLines(state).map(line => {
            if (line.kind === 'category') return metrics.categoryRowPx;

            const row = line.row;
            const lines = Math.max(
                wrappedLines(row.name, metrics.charsPerLine.name),
                wrappedLines(row.specification, metrics.charsPerLine.specification),
                wrappedLines(row.make, metrics.charsPerLine.make),
                wrappedLines(row.warranty, metrics.charsPerLine.warranty)
            );

            return metrics.rowBasePx + (lines * metrics.rowLinePx);
        });
    }

    function clauseHeights(state, listName) {
        const metrics = Config.PAGINATION.clause;

        return enabledClauses(state, listName).map(clause =>
            metrics.rowBasePx + (wrappedLines(clause.text, metrics.charsPerLine) * metrics.rowLinePx));
    }

    /**
     * Table-of-contents entries, derived without reference to the page plan.
     * The entry list depends only on which sections and annexures are present,
     * so the contents section can be paginated in the same pass that lays out
     * everything else rather than needing a second pass over the plan.
     */
    function tocEntryHeights(state) {
        const metrics = Config.PAGINATION.contents;
        const entries = [];

        selectedSections(state).forEach(section => {
            if (section.id !== 'contents') entries.push(section.group);
        });

        const annexures = includedAnnexures(state);
        if (annexures.length) {
            entries.push('Annexures');
            annexures.forEach(() => entries.push('Annexures'));
        }

        let previousGroup = null;

        return entries.map(group => {
            const height = metrics.itemPx + (group === previousGroup ? 0 : metrics.groupPx);
            previousGroup = group;
            return height;
        });
    }

    /**
     * The warranty schedule: every distinct item/make/warranty combination in
     * the bill of materials. Distinct rather than one line per BOM row, because
     * a schedule listing the same warranty forty times tells the customer
     * nothing and would run to pages of repetition.
     */
    function warrantyRows(state) {
        const seen = {};
        const rows = [];

        (state.bom.categories || []).forEach(category => {
            category.rows.forEach(row => {
                const warranty = trimmed(row.warranty);
                const name = trimmed(row.name);

                if (!name || !warranty || warranty === '—') return;

                const key = `${name} ${trimmed(row.make)} ${warranty}`;
                if (seen[key]) return;

                seen[key] = true;
                rows.push({ name, make: trimmed(row.make), warranty });
            });
        });

        return rows;
    }

    function warrantyRowHeights(state) {
        const metrics = Config.PAGINATION.warranty;

        return warrantyRows(state).map(row => {
            const lines = Math.max(
                wrappedLines(row.name, metrics.charsPerLine.name),
                wrappedLines(row.make, metrics.charsPerLine.make),
                wrappedLines(row.warranty, metrics.charsPerLine.warranty)
            );

            return metrics.rowBasePx + (lines * metrics.rowLinePx);
        });
    }

    function sectionChunks(state, sectionId) {
        const pagination = Config.PAGINATION;

        if (sectionId === 'warranty-support') {
            return chunkByHeight(warrantyRowHeights(state),
                pagination.warranty.budgetPx, pagination.warranty.budgetPx);
        }
        if (sectionId === 'bill-of-materials') {
            const budget = pagination.bom.budgetPx - pagination.bom.theadPx;
            return chunkByHeight(bomLineHeights(state), budget, budget);
        }
        if (sectionId === 'terms-conditions' || sectionId === 'scope-inclusions'
            || sectionId === 'scope-exclusions') {
            const listName = sectionId === 'terms-conditions'
                ? 'terms'
                : (sectionId === 'scope-inclusions' ? 'inclusions' : 'exclusions');
            return chunkByHeight(clauseHeights(state, listName),
                pagination.clause.firstBudgetPx, pagination.clause.budgetPx);
        }
        if (sectionId === 'contents') {
            return chunkByHeight(tocEntryHeights(state),
                pagination.contents.firstBudgetPx, pagination.contents.budgetPx);
        }
        if (sectionId === 'savings-projection') {
            return chunkRows(projection(state).years,
                pagination.savings.firstPageRows, pagination.savings.continuationRows);
        }

        return [{ start: 0, end: 0 }];
    }

    function sectionPageCount(state, sectionId) {
        const section = Config.getSection(sectionId);
        return section && section.paginates ? sectionChunks(state, sectionId).length : 1;
    }

    /**
     * The ordered list of pages the Comprehensive Proposal will produce.
     * Everything downstream — thumbnails, the table of contents, "Page X of Y",
     * print and the downloaded PDF — reads this one plan, so all four agree.
     */
    function planPages(state) {
        const pages = [];
        const sections = selectedSections(state);
        const annexures = includedAnnexures(state);

        sections.forEach(section => {
            const chunks = sectionChunks(state, section.id);
            const count = section.paginates ? chunks.length : 1;

            for (let part = 0; part < count; part++) {
                pages.push({
                    sectionId: section.id,
                    title: section.title,
                    group: section.group,
                    part,
                    partCount: count,
                    chunk: chunks[part] || { start: 0, end: 0 },
                    isContinuation: part > 0,
                    annexureId: null
                });
            }
        });

        if (annexures.length) {
            pages.push({
                sectionId: 'annexure-index',
                title: 'Annexure Index',
                group: 'Annexures',
                part: 0,
                partCount: 1,
                chunk: { start: 0, end: 0 },
                isContinuation: false,
                annexureId: null
            });

            annexures.forEach((annexure, index) => {
                const pageCount = Math.max(1, Math.round(num(annexure.pageCount, 1)));

                for (let part = 0; part < pageCount; part++) {
                    pages.push({
                        sectionId: 'annexures',
                        title: annexure.title
                            ? `Annexure ${index + 1}: ${annexure.title}`
                            : `Annexure ${index + 1}`,
                        group: 'Annexures',
                        part,
                        partCount: pageCount,
                        chunk: { start: part, end: part + 1 },
                        isContinuation: part > 0,
                        annexureId: annexure.id
                    });
                }
            });
        }

        return pages.map((page, index) => Object.assign(page, {
            pageNumber: index + 1,
            totalPages: pages.length
        }));
    }

    /** Table of contents entries: one line per section, at its first page. */
    function tableOfContents(pagePlan) {
        const entries = [];
        let lastKey = null;

        pagePlan.forEach(page => {
            const key = page.annexureId || page.sectionId;

            if (key !== lastKey) {
                entries.push({
                    sectionId: page.sectionId,
                    title: page.title,
                    group: page.group,
                    pageNumber: page.pageNumber
                });
                lastKey = key;
            }
        });

        return entries;
    }

    /** Pages a selection would produce, for the section picker's live estimate. */
    function estimatedPageCount(state) {
        return planPages(state).length;
    }

    return {
        // derived
        derived,
        capacityReconciliation,
        reconcileCapacity,
        capacityTolerance,
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

        // pagination
        chunkRows,
        chunkByHeight,
        activeBomCategories,
        bomLines,
        bomLineHeights,
        clauseHeights,
        tocEntryHeights,
        warrantyRows,
        warrantyRowHeights,
        bomRowCount,
        sectionPageCount,
        sectionChunks,
        planPages,
        tableOfContents,
        estimatedPageCount
    };
}));
