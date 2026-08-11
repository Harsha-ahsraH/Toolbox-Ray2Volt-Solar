const assert = require('node:assert/strict');
const path = require('node:path');

const toolRoot = path.resolve(__dirname, '..', 'tools', 'quote-generator');
const config = require(path.join(toolRoot, 'quote-generator-config.js'));
const model = require(path.join(toolRoot, 'quote-generator-model.js'));
const calc = require(path.join(toolRoot, 'quote-generator-calc.js'));

function rowWithoutId(row) {
    const copy = Object.assign({}, row);
    delete copy.id;
    return copy;
}

// Every preset must produce at least 20 selected, non-annexure pages before
// the user adds attachments. Preset section selections also obey configuration
// rules and contain the common core sections.
for (const preset of config.PRESETS) {
    const state = model.createInitialState({
        mode: config.MODES.COMPREHENSIVE,
        preset: preset.id
    });
    const plan = calc.planPages(state);

    assert.ok(
        plan.length >= 20,
        `${preset.id} must plan at least 20 pages before annexures; got ${plan.length}`
    );
    assert.ok(
        plan.every(page => page.sectionId !== 'annexure-index' && page.sectionId !== 'annexures'),
        `${preset.id} must not count annexure pages before attachments exist`
    );
    assert.ok(
        state.selectedSectionIds.length >= 20,
        `${preset.id} must select at least 20 non-annexure sections`
    );
    for (const coreId of config.coreSectionIds()) {
        assert.ok(state.selectedSectionIds.includes(coreId), `${preset.id} must include ${coreId}`);
    }
}

assert.ok(
    !config.presetSectionIds('ci-on-grid-rooftop').includes('battery-technology'),
    'the on-grid rooftop preset must exclude battery technology'
);
assert.ok(
    !config.presetSectionIds('ci-ground-mounted').includes('battery-technology'),
    'the ground-mounted preset must exclude battery technology'
);
assert.ok(
    config.presetSectionIds('ci-hybrid').includes('battery-technology'),
    'the Hybrid preset must include battery technology'
);

// Selection input order must never affect output order.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    state.selectedSectionIds = [
        'terms-conditions',
        'cover',
        'bill-of-materials',
        'executive-summary'
    ];

    assert.deepEqual(
        model.selectedSections(state).map(section => section.id),
        ['cover', 'executive-summary', 'bill-of-materials', 'terms-conditions'],
        'selected sections must be returned in catalog order'
    );
    assert.deepEqual(
        [...new Set(calc.planPages(state).map(page => page.sectionId))],
        ['cover', 'executive-summary', 'bill-of-materials', 'terms-conditions'],
        'planned output must follow catalog order regardless of selection order'
    );
}

// Removing a section affects output only; its project-specific state survives
// removal and is still present when the section is selected again.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    model.setNarrativeField(state, 'objective', 'Retain this customer objective.');
    const storedNarrative = JSON.parse(JSON.stringify(state.projectNarrative));

    model.toggleSection(state, 'project-objectives', false);
    assert.ok(
        !calc.planPages(state).some(page => page.sectionId === 'project-objectives'),
        'an unselected section must be absent from planned output'
    );
    assert.deepEqual(
        state.projectNarrative,
        storedNarrative,
        'unselecting a section must preserve its entered content'
    );

    model.toggleSection(state, 'project-objectives', true);
    assert.ok(
        calc.planPages(state).some(page => page.sectionId === 'project-objectives'),
        'reselecting a section must restore it to planned output'
    );
    assert.deepEqual(
        state.projectNarrative,
        storedNarrative,
        'reselecting a section must restore the same entered content'
    );
}

// Company and Individual identity values coexist in serialized state. Changing
// which identity is visible/validated must not delete the hidden identity.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    Object.assign(state.customer, {
        customerType: 'company',
        companyName: 'Ray Industries Pvt Ltd',
        contactPerson: 'Anita Rao',
        customerName: 'Anita Rao (Individual)',
        phone: '9000000000',
        billingAddress: 'Visakhapatnam',
        sameAsBilling: true
    });

    state.customer.customerType = 'individual';
    const restored = model.deserialize(model.serialize(state));

    assert.equal(restored.ok, true, 'a state containing both customer identities must deserialize');
    assert.equal(restored.state.customer.customerName, 'Anita Rao (Individual)');
    assert.equal(restored.state.customer.companyName, 'Ray Industries Pvt Ltd');
    assert.equal(restored.state.customer.contactPerson, 'Anita Rao');

    restored.state.customer.customerType = 'company';
    assert.equal(restored.state.customer.companyName, 'Ray Industries Pvt Ltd');
    assert.equal(restored.state.customer.contactPerson, 'Anita Rao');
}

// BOM row operations use stable row IDs and reset to context-sensitive defaults.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    const category = model.getBomCategory(state, 'modules');
    const originalCount = category.rows.length;

    model.addBomRow(state, 'modules', {
        name: 'Customer-selected module',
        specification: '600 Wp',
        quantity: 10,
        rating: 600,
        ratingUnit: 'Wp'
    });
    assert.equal(category.rows.length, originalCount + 1, 'Add must append one BOM row');

    const added = category.rows.at(-1);
    model.duplicateBomRow(state, 'modules', added.id);
    const duplicate = category.rows.at(-1);
    assert.notEqual(duplicate.id, added.id, 'Duplicate must allocate a distinct stable ID');
    assert.deepEqual(
        rowWithoutId(duplicate),
        rowWithoutId(added),
        'Duplicate must preserve all editable row values'
    );

    model.removeBomRow(state, 'modules', added.id);
    assert.ok(!category.rows.some(row => row.id === added.id), 'Remove must target the requested row ID');
    assert.ok(category.rows.some(row => row.id === duplicate.id), 'Remove must not delete the duplicate');

    state.project.dcCapacityKwp = 250;
    model.resetBom(state);
    const resetRows = model.getBomCategory(state, 'modules').rows;
    assert.equal(resetRows.length, 1, 'Reset must discard added and duplicated module rows');
    assert.equal(resetRows[0].name, 'Solar PV Module', 'Reset must restore the maintained module default');
    assert.equal(resetRows[0].rating, 585, 'Reset must restore the maintained module rating');
    assert.equal(resetRows[0].quantity, 427, 'Reset must derive the default quantity from 250 kWp');
}

// Dirty narrative fields survive default refreshes, while untouched fields
// follow the active context. Restore operations explicitly clear dirty state.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    const initialProposedSolution = state.projectNarrative.proposedSolution;

    model.setNarrativeField(state, 'objective', 'Customer-authored objective');
    assert.equal(model.isDirty(state, 'projectNarrative.objective'), true);

    state.project.installationLocation = 'ground-mounted';
    model.applyNarrativeDefaults(state);
    assert.equal(
        state.projectNarrative.objective,
        'Customer-authored objective',
        'default refresh must not overwrite a dirty narrative field'
    );
    assert.notEqual(
        state.projectNarrative.proposedSolution,
        initialProposedSolution,
        'an untouched narrative field must refresh for the new context'
    );

    model.restoreNarrativeField(state, 'objective');
    assert.notEqual(state.projectNarrative.objective, 'Customer-authored objective');
    assert.equal(model.isDirty(state, 'projectNarrative.objective'), false);

    model.setNarrativeField(state, 'objective', 'Second edit');
    model.setNarrativeField(state, 'projectNotes', 'Edited notes');
    model.restoreAllNarrative(state);
    assert.equal(
        state.dirtyDefaultFields.filter(key => key.startsWith('projectNarrative.')).length,
        0,
        'Restore All Defaults must clear all narrative dirty markers'
    );
    assert.notEqual(state.projectNarrative.objective, 'Second edit');
    assert.notEqual(state.projectNarrative.projectNotes, 'Edited notes');
}

// Enabled clause output is filtered and then numbered consecutively.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    const terms = state.contract.terms;
    assert.ok(terms.length >= 4, 'standard terms must provide enough rows for renumbering coverage');

    terms[2].include = false;
    const enabled = model.enabledClauses(state, 'terms');

    assert.ok(!enabled.some(clause => clause.id === terms[2].id), 'disabled clause 3 must be absent');
    assert.deepEqual(
        enabled.map(clause => clause.number),
        enabled.map((clause, index) => index + 1),
        'enabled clauses must be renumbered without gaps'
    );
    assert.equal(enabled[2].id, terms[3].id, 'original clause 4 must render as clause 3');
}

// Serialization keeps selected/hidden state and repeatable IDs. Partial older
// drafts migrate to the complete v1 shape; future versions fail without throw.
{
    const state = model.createInitialState({ mode: config.MODES.COMPREHENSIVE });
    state.selectedSectionIds = ['cover', 'commercial-offer'];
    model.addDiscount(state, { name: 'Partner discount', amount: 2500 });

    const roundTrip = model.deserialize(model.serialize(state));
    assert.equal(roundTrip.ok, true);
    assert.equal(roundTrip.state.schemaVersion, config.SCHEMA_VERSION);
    assert.deepEqual(roundTrip.state.selectedSectionIds, ['cover', 'commercial-offer']);
    assert.ok(roundTrip.state.commercial.discounts.every(row => row.id), 'repeater IDs must survive serialization');

    const migrated = model.deserialize(JSON.stringify({
        mode: 'comprehensive',
        customer: { customerType: 'individual', customerName: 'Legacy Customer' },
        commercial: { actualProjectCost: 500000, discounts: [{ name: 'Legacy', amount: 1000 }] }
    }));
    assert.equal(migrated.ok, true, 'a draft without a schema version must migrate from version 0');
    assert.equal(migrated.version, 0);
    assert.equal(migrated.state.customer.customerName, 'Legacy Customer');
    assert.ok(migrated.state.project, 'migration must fill a missing project branch');
    assert.ok(migrated.state.commercial.discounts[0].id, 'migration must assign missing repeater IDs');

    assert.doesNotThrow(() => model.deserialize('{"schemaVersion":999}'));
    assert.deepEqual(
        model.deserialize('{"schemaVersion":999}'),
        { ok: false, reason: 'future-version', version: 999, state: null },
        'an unknown future schema must fail safely and offer a fresh draft path'
    );
    assert.deepEqual(
        model.deserialize('{broken json'),
        { ok: false, reason: 'corrupt', state: null },
        'corrupt storage must fail safely rather than throw during load'
    );
}

console.log('quote-generator comprehensive model tests passed');
