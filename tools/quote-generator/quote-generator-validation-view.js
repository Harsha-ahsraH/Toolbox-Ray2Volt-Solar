/**
 * Quote Generator - Validation display
 * Ray2Volt Solar Toolbox
 *
 * Turns a validation result into what the user sees: the panel state badges,
 * the summary at the top of the Inputs workspace, and the inline message on
 * each field that has a problem.
 *
 * Messages are attached to their control with aria-describedby, and critical
 * ones set aria-invalid, so the error is available from the field itself and
 * not only from the summary. Severity is carried in text as well as colour.
 *
 * Split out of quote-generator-form.js to stay inside the repository's
 * per-file line budget.
 */
(function (root) {
    'use strict';

    const PANEL_LABELS = {
        sections: 'Proposal Sections',
        customer: 'Customer Details',
        project: 'Project Settings',
        narrative: 'Project Description & Scope',
        bom: 'Bill of Materials',
        commercial: 'Commercial Offer',
        savings: 'Savings Projections',
        contract: 'Terms, Inclusions & Exclusions',
        annexures: 'Annexures'
    };

    /** Which row inputs an issue about a whole repeater should flag. */
    const REPEATER_FIELDS = {
        milestones: ['percent', 'name'],
        discounts: ['amount', 'name'],
        priceBreakdown: ['amount', 'description'],
        futureCosts: ['amount', 'escalationPercent', 'startYear', 'endYear'],
        mixedLocations: ['capacityKwp'],
        monthlyRows: ['importedKwh', 'billAmount', 'maxDemandKva']
    };

    const STATE_LABELS = {
        complete: 'Complete',
        incomplete: 'Incomplete',
        error: 'Error'
    };

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Maps a validation issue onto the control it belongs to, so the message
     * can sit beside the field and be announced with it rather than only
     * appearing in the summary at the top of the form.
     */
    const FIELD_CONTROLS = {
        companyName: 'cqCompanyName',
        contactPerson: 'cqContactPerson',
        customerName: 'cqCustomerName',
        phone: 'cqPhone',
        email: 'cqEmail',
        billingAddress: 'cqBillingAddress',
        siteAddress: 'cqSiteAddress',
        quoteDate: 'cqQuoteDate',
        quoteNumber: 'cqQuoteNumber',
        dcCapacityKwp: 'cqDcCapacity',
        acCapacityKw: 'cqAcCapacity',
        batteryEnergyKwh: 'cqBatteryEnergy',
        batteryPowerKw: 'cqBatteryPower',
        validityDays: 'cqValidityDays',
        actualProjectCost: 'cqActualProjectCost',
        gstRate: 'cqGstRate',
        tariffRate: 'cqTariffRate',
        annualGenerationPerKwp: 'cqAnnualGeneration',
        tariffEscalationPercent: 'cqTariffEscalation',
        degradationPercent: 'cqDegradation',
        projectionYears: 'cqProjectionYears',
        selfConsumptionPercent: 'cqSelfConsumption',
        exportPercent: 'cqExportPercent'
    };

    function renderFieldMessages(validation) {
        // Clear last pass.
        Array.prototype.forEach.call(
            document.querySelectorAll('.qg-field-error[data-generated="true"]'),
            node => node.remove()
        );
        // Clear by the class every flagged control carries, not by aria-invalid:
        // a warning sets the class and the description without setting invalid,
        // and would otherwise keep its styling and point at a deleted message.
        Array.prototype.forEach.call(
            document.querySelectorAll('.has-error'),
            control => {
                control.removeAttribute('aria-invalid');
                control.removeAttribute('aria-describedby');
                control.classList.remove('has-error');
            }
        );

        const byField = {};
        const byPanelField = {};

        validation.issues.forEach(item => {
            if (FIELD_CONTROLS[item.field]) {
                if (!byField[item.field]) byField[item.field] = item;
            } else if (!byPanelField[item.field]) {
                byPanelField[item.field] = item;
            }
        });

        // Repeater rows are rendered from state and have no fixed control ID.
        // An issue names the repeater as a whole ("milestones") while its inputs
        // carry the leaf name they edit ("percent"), so the two are mapped here.
        Object.keys(byPanelField).forEach(field => {
            const leaves = REPEATER_FIELDS[field] || [field];
            const selector = leaves.map(leaf => `[data-field="${leaf}"]`).join(',');
            const inputs = document.querySelectorAll(selector);
            if (!inputs.length) return;

            const item = byPanelField[field];
            const container = inputs[0].closest('.qg-repeater, .qg-panel-body');
            const anchor = container
                ? container.querySelector('.qg-derived-line') || inputs[inputs.length - 1]
                : inputs[inputs.length - 1];
            const messageId = `qg-${field}-error`;

            if (!document.getElementById(messageId)) {
                const message = document.createElement('p');
                message.className = 'qg-field-error';
                message.id = messageId;
                message.dataset.generated = 'true';
                message.textContent = item.message;
                anchor.insertAdjacentElement('afterend', message);
            }

            Array.prototype.forEach.call(inputs, input => {
                input.setAttribute('aria-describedby', messageId);
                input.classList.add('has-error');
                if (item.severity === 'critical') input.setAttribute('aria-invalid', 'true');
            });
        });

        Object.keys(byField).forEach(field => {
            const control = document.getElementById(FIELD_CONTROLS[field]);
            if (!control) return;

            const item = byField[field];
            const messageId = `${control.id}-error`;
            const message = document.createElement('p');

            message.className = 'qg-field-error';
            message.id = messageId;
            message.dataset.generated = 'true';
            message.textContent = item.message;

            control.insertAdjacentElement('afterend', message);
            control.setAttribute('aria-describedby', messageId);
            control.classList.add('has-error');

            if (item.severity === 'critical') {
                control.setAttribute('aria-invalid', 'true');
            }
        });
    }

    function renderValidation(context) {
        Object.keys(context.validation.panels).forEach(panel => {
            const badge = document.querySelector(`.qg-panel[data-panel="${panel}"] .qg-panel-state`);
            if (!badge) return;

            const value = context.validation.panels[panel];
            badge.dataset.state = value;
            badge.textContent = STATE_LABELS[value];
        });

        const refs = context.refs;

    if (!refs.validationSummary || !refs.validationList) return;

        const issues = context.validation.issues;

        if (!issues.length) {
            refs.validationSummary.hidden = true;
            refs.validationList.innerHTML = '';
            renderFieldMessages(context.validation);
            return;
        }

        refs.validationSummary.hidden = false;
        refs.validationSummary.dataset.severity = context.validation.hasCriticalErrors ? 'critical' : 'warning';

        const title = refs.validationSummary.querySelector('.qg-validation-title');
        if (title) {
            title.textContent = context.validation.hasCriticalErrors
                ? `${context.validation.criticalIssues.length} issue${context.validation.criticalIssues.length === 1 ? '' : 's'} must be fixed before exporting`
                : `${issues.length} thing${issues.length === 1 ? '' : 's'} to check`;
        }

        renderFieldMessages(context.validation);

        refs.validationList.innerHTML = issues.map(item => `
            <li>
                <span class="qg-validation-badge" data-severity="${item.severity}">${
                    item.severity === 'critical' ? 'Error' : 'Check'}</span>
                <button type="button" class="qg-validation-link" data-goto-panel="${esc(item.panel)}">
                    ${esc(PANEL_LABELS[item.panel] || item.panel)}: ${esc(item.message)}
                </button>
            </li>`).join('');
    }

    root.QuoteGeneratorValidationView = {
        renderValidation,
        renderFieldMessages,
        PANEL_LABELS,
        FIELD_CONTROLS
    };
}(typeof self !== 'undefined' ? self : this));
