/**
 * Comparison Sheet — form wiring, specification table, preview and output.
 *
 * Two rules drive most of what follows.
 *
 * A cell the team edits by hand is never recalculated again, even when the
 * capacity it was derived from changes. That is a deliberate choice: the team
 * wins over the template. Edited cells are marked so the freeze is visible,
 * and `Reset to template` is the way back.
 *
 * Two A4 pages is a hard limit. The preview measures its own rendered height
 * and refuses to print when either page overflows, rather than shrinking type
 * or spilling a stray row onto a third page.
 */
(function () {
    'use strict';

    const model = window.Ray2VoltComparisonModel;
    const content = window.Ray2VoltComparisonContent;
    const render = window.Ray2VoltComparisonRender;
    const copy = window.Ray2VoltComparisonCopy;

    const A4_WIDTH_PX = 210 / 25.4 * 96;
    const PX_PER_MM = 96 / 25.4;

    const capacityInput = document.getElementById('csCapacity');
    const systemTypeInput = document.getElementById('csSystemType');
    const batteryGroup = document.getElementById('csBatteryGroup');
    const batteryInput = document.getElementById('csBattery');
    const priceModeInputs = Array.from(document.querySelectorAll('input[name="csPriceMode"]'));
    const priceInputs = [0, 1, 2].map(index => document.getElementById(`csPrice${index + 1}`));
    const priceEchoes = [0, 1, 2].map(index => document.getElementById(`csPriceEcho${index + 1}`));
    const priceUnitLabels = Array.from(document.querySelectorAll('.cs-price-unit'));

    const specTableBody = document.getElementById('csSpecTableBody');
    const specRowCount = document.getElementById('csSpecRowCount');
    const resetRowsBtn = document.getElementById('csResetRowsBtn');

    const validationPanel = document.getElementById('csValidation');
    const previewBtn = document.getElementById('csPreviewBtn');
    const printBtn = document.getElementById('csPrintBtn');

    const sheet = document.getElementById('comparisonSheet');
    const pageOne = document.getElementById('csPageOne');
    const pageTwo = document.getElementById('csPageTwo');

    /** Working copy of the specification rows for this project. */
    let rows = [];

    /** Set once the preview has been rendered at least once. */
    let previewed = false;

    function priceMode() {
        const checked = priceModeInputs.find(input => input.checked);
        return checked ? checked.value : 'rate';
    }

    function currentInputs() {
        return {
            capacityKwp: parseFloat(capacityInput.value) || 0,
            systemType: systemTypeInput.value,
            batteryKwh: parseFloat(batteryInput.value) || 0,
            priceMode: priceMode(),
            prices: priceInputs.map(input => parseFloat(input.value) || 0)
        };
    }

    // --- Specification rows -------------------------------------------------

    function buildRows(systemType, previous) {
        const edits = new Map();
        (previous || []).forEach(row => {
            if (row.edited.some(Boolean)) edits.set(row.id, row);
        });

        return content.rowsFor(systemType).map(template => {
            const kept = edits.get(template.id);

            return {
                id: template.id,
                label: kept ? kept.label : template.label,
                derived: template.derived || null,
                tone: template.tone.slice(),
                values: kept ? kept.values.slice() : template.values.slice(),
                edited: kept ? kept.edited.slice() : [false, false, false],
                labelEdited: kept ? kept.labelEdited : false
            };
        });
    }

    /** The derived values as they stand for the current inputs. */
    function derivedValues(kind, result) {
        if (kind === 'earthing') return result.earthing.slice();
        if (kind === 'bifacial') return result.bifacialText.slice();
        if (kind === 'amc') return result.options.map(option => copy.amcCell(option));
        if (kind === 'battery') return [0, 1, 2].map(index => copy.batteryCell(result, index));

        return ['', '', ''];
    }

    /**
     * Refill derived cells. A cell the team has edited is left exactly as they
     * left it — the freeze is permanent by design.
     */
    function applyDerived(result) {
        rows.forEach(row => {
            if (!row.derived) return;

            derivedValues(row.derived, result).forEach((value, index) => {
                if (!row.edited[index]) row.values[index] = value;
            });
        });
    }

    function cellInput(value, frozen, onInput) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.spellcheck = false;
        if (frozen) input.classList.add('cs-cell-edited');
        input.addEventListener('input', () => {
            input.classList.add('cs-cell-edited');
            onInput(input.value);
        });

        return input;
    }

    function renderSpecTable() {
        specTableBody.innerHTML = '';

        rows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            if (row.derived) tr.classList.add('cs-row-derived');

            const labelCell = document.createElement('td');
            labelCell.className = 'cs-cell-label';
            labelCell.appendChild(cellInput(row.label, row.labelEdited, text => {
                row.label = text;
                row.labelEdited = true;
            }));
            tr.appendChild(labelCell);

            // The form stays plain: the red/green flags belong to the printed
            // sheet, not to the editing surface.
            row.values.forEach((value, index) => {
                const cell = document.createElement('td');
                cell.appendChild(cellInput(value, row.edited[index], text => {
                    row.values[index] = text;
                    row.edited[index] = true;
                }));
                tr.appendChild(cell);
            });

            const actionCell = document.createElement('td');
            actionCell.className = 'cs-cell-action';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'cs-row-remove';
            remove.setAttribute('aria-label', `Remove the ${row.label || 'unnamed'} row`);
            remove.textContent = '×';
            remove.addEventListener('click', () => {
                rows.splice(rowIndex, 1);
                renderSpecTable();
            });
            actionCell.appendChild(remove);
            tr.appendChild(actionCell);

            specTableBody.appendChild(tr);
        });

        specRowCount.textContent = `${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`;
    }

    // --- Price echoes -------------------------------------------------------

    /** The figure the team did not type, shown live beneath the one they did. */
    function updatePriceEchoes() {
        const inputs = currentInputs();
        const isRate = inputs.priceMode === 'rate';

        priceUnitLabels.forEach(label => {
            label.textContent = isRate ? '₹ / Wp' : '₹ total';
        });

        priceInputs.forEach((input, index) => {
            const typed = parseFloat(input.value);
            const echo = priceEchoes[index];

            if (!Number.isFinite(typed) || typed <= 0 || inputs.capacityKwp <= 0) {
                echo.textContent = '';
                return;
            }

            echo.textContent = isRate
                ? `= ${copy.rupees(model.totalFromRate(typed, inputs.capacityKwp))} total`
                : `= ${copy.money(model.rateFromTotal(typed, inputs.capacityKwp))} / Wp`;
        });
    }

    // --- Validation ---------------------------------------------------------

    function collectProblems(result) {
        const inputs = currentInputs();
        const blocking = [];
        const warnings = [];

        if (inputs.capacityKwp <= 0) blocking.push('Enter the plant capacity in kWp.');
        if (inputs.systemType === 'hybrid' && inputs.batteryKwh <= 0) {
            blocking.push('Enter the battery capacity in kWh for a hybrid plant.');
        }

        inputs.prices.forEach((price, index) => {
            if (price <= 0) blocking.push(`Enter a price for Option ${index + 1}.`);
        });

        if (!blocking.length && result && !result.ascending) {
            warnings.push('Option prices do not increase from 1 to 3. The sheet will still print, but check the figures.');
        }

        return { blocking, warnings };
    }

    /**
     * Rendered height of each page against the A4 canvas. Measured with the
     * preview at full scale, because the mobile zoom would otherwise report a
     * page that fits when it does not.
     */
    function measureOverflow() {
        const restore = sheet.style.getPropertyValue('--cs-preview-scale');
        sheet.style.setProperty('--cs-preview-scale', '1');

        const overflows = [pageOne, pageTwo].map((page, index) => {
            const excess = page.scrollHeight - page.clientHeight;
            return excess > 1 ? { page: index + 1, mm: Math.ceil(excess / PX_PER_MM) } : null;
        }).filter(Boolean);

        if (restore) {
            sheet.style.setProperty('--cs-preview-scale', restore);
        } else {
            sheet.style.removeProperty('--cs-preview-scale');
        }

        return overflows;
    }

    function showMessages(blocking, warnings) {
        if (!blocking.length && !warnings.length) {
            validationPanel.hidden = true;
            validationPanel.innerHTML = '';
            return;
        }

        const block = blocking.length
            ? `<ul class="cs-validation-blocking">${blocking.map(item => `<li>${item}</li>`).join('')}</ul>`
            : '';
        const warn = warnings.length
            ? `<ul class="cs-validation-warning">${warnings.map(item => `<li>${item}</li>`).join('')}</ul>`
            : '';

        validationPanel.hidden = false;
        validationPanel.innerHTML = block + warn;
    }

    function overflowMessages(overflows) {
        return overflows.map(entry =>
            `Page ${entry.page} is ${entry.mm}mm over one A4 page. Shorten the longest specification cells, or remove a row.`
        );
    }

    // --- Preview ------------------------------------------------------------

    function updatePreviewScale() {
        if (!sheet) return;

        if (!window.matchMedia('(max-width: 768px)').matches) {
            sheet.style.setProperty('--cs-preview-scale', '1');
            return;
        }

        const parentWidth = sheet.parentElement ? sheet.parentElement.clientWidth : window.innerWidth;
        const available = Math.max(280, Math.min(parentWidth, window.innerWidth) - 16);
        const scale = Math.min(1, Math.max(0.35, available / A4_WIDTH_PX));

        sheet.style.setProperty('--cs-preview-scale', scale.toFixed(4));
    }

    /**
     * Render the sheet. Returns true when it is fit to print — inputs complete
     * and both pages inside their A4 canvas.
     */
    function generatePreview() {
        const inputs = currentInputs();
        const { blocking, warnings } = collectProblems(null);

        if (blocking.length) {
            sheet.classList.remove('visible');
            previewed = false;
            showMessages(blocking, warnings);
            return false;
        }

        const result = model.compute(inputs);
        applyDerived(result);
        renderSpecTable();

        render.renderPageOne(pageOne, result, rows);
        render.renderPageTwo(pageTwo, result);

        sheet.classList.add('visible');
        previewed = true;
        updatePreviewScale();

        const order = collectProblems(result);
        const overflows = measureOverflow();
        showMessages(overflowMessages(overflows), order.warnings);

        return overflows.length === 0;
    }

    function ensurePreview() {
        if (previewed) {
            const overflows = measureOverflow();
            const order = collectProblems(model.compute(currentInputs()));
            showMessages(overflowMessages(overflows), order.warnings);
            return overflows.length === 0;
        }

        return generatePreview();
    }

    // --- Events -------------------------------------------------------------

    /**
     * Fill the derived cells from the current inputs and redraw. The single
     * path to the table, so a derived row is never left blank on screen.
     */
    function refreshDerivedOnly() {
        if (currentInputs().capacityKwp > 0) {
            applyDerived(model.compute(currentInputs()));
        }

        renderSpecTable();
    }

    function onSystemTypeChange() {
        const isHybrid = systemTypeInput.value === 'hybrid';
        batteryGroup.hidden = !isHybrid;

        rows = buildRows(systemTypeInput.value, rows);
        refreshDerivedOnly();
    }

    capacityInput.addEventListener('input', () => {
        updatePriceEchoes();
        refreshDerivedOnly();
    });

    batteryInput.addEventListener('input', refreshDerivedOnly);
    systemTypeInput.addEventListener('change', onSystemTypeChange);

    priceInputs.forEach(input => input.addEventListener('input', updatePriceEchoes));
    priceModeInputs.forEach(input => input.addEventListener('change', updatePriceEchoes));

    resetRowsBtn.addEventListener('click', () => {
        rows = content.rowsFor(systemTypeInput.value).map(template => ({
            id: template.id,
            label: template.label,
            derived: template.derived || null,
            tone: template.tone.slice(),
            values: template.values.slice(),
            edited: [false, false, false],
            labelEdited: false
        }));

        refreshDerivedOnly();
    });

    previewBtn.addEventListener('click', generatePreview);

    printBtn.addEventListener('click', () => {
        if (!ensurePreview()) return;

        sheet.style.setProperty('--cs-preview-scale', '1');
        window.print();
        updatePreviewScale();
    });

    window.addEventListener('resize', updatePreviewScale);
    window.addEventListener('orientationchange', updatePreviewScale);

    // --- Start --------------------------------------------------------------

    rows = buildRows(systemTypeInput.value, null);
    batteryGroup.hidden = systemTypeInput.value !== 'hybrid';
    refreshDerivedOnly();
    updatePriceEchoes();
})();
