/**
 * Resource Library — search, filter and render the catalogue.
 *
 * Everything on screen comes from resource-library-catalogue.js. This file adds
 * no resources of its own and holds no state beyond the current search text and
 * category, so the catalogue file stays the single place anyone has to edit.
 */
(function () {
    'use strict';

    const catalogue = window.Ray2VoltResourceCatalogue;

    const searchInput = document.getElementById('rlSearch');
    const clearBtn = document.getElementById('rlClearSearch');
    const filterBar = document.getElementById('rlFilters');
    const grid = document.getElementById('rlGrid');
    const countLabel = document.getElementById('rlCount');
    const emptyState = document.getElementById('rlEmpty');
    const problemPanel = document.getElementById('rlProblems');

    const ALL = 'All';

    let activeCategory = ALL;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** Everything a search could reasonably match on, lowercased once. */
    function haystack(resource) {
        return [resource.title, resource.description, resource.category, resource.format]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    function matches(resource, query) {
        if (activeCategory !== ALL && resource.category !== activeCategory) return false;
        if (!query) return true;

        // Every word must appear somewhere, so "waaree datasheet" narrows rather
        // than widens.
        const text = haystack(resource);
        return query.split(/\s+/).filter(Boolean).every(word => text.includes(word));
    }

    /**
     * The two badges on a card. `place` is the one that matters: it tells the
     * reader whether they are about to hand out a file that is published to the
     * whole internet, or one that sits behind Drive's permissions.
     */
    function badges(resource) {
        // The tooltips carry the warning so every card does not have to shout it.
        const place = resource.place === 'link'
            ? '<span class="rl-badge rl-badge-link" title="Stored in Drive. Whoever owns that folder'
                + ' controls who can open it.">Drive link</span>'
            : '<span class="rl-badge rl-badge-toolbox" title="Committed to this repository, which is public.'
                + ' Anyone with the address can download it.">In toolbox</span>';

        const format = resource.format
            ? `<span class="rl-badge rl-badge-format">${escapeHtml(resource.format)}</span>`
            : '';

        return place + format;
    }

    /**
     * Actions. A file in the toolbox gets both Open and Download, because a
     * price sheet is usually read and a template is usually saved, and guessing
     * wrong costs the reader a round trip.
     */
    function actions(resource) {
        const href = escapeHtml(catalogue.target(resource));

        if (resource.place === 'link') {
            return `<a class="rl-btn rl-btn-primary" href="${href}" target="_blank" rel="noopener noreferrer">Open in Drive</a>`;
        }

        return `
            <a class="rl-btn rl-btn-primary" href="${href}" target="_blank" rel="noopener">Open</a>
            <a class="rl-btn rl-btn-secondary" href="${href}" download>Download</a>`;
    }

    function card(resource) {
        const updated = resource.updated
            ? `<span class="rl-updated">Updated ${escapeHtml(resource.updated)}</span>`
            : '';

        return `
        <article class="rl-card" data-id="${escapeHtml(catalogue.slug(resource.title))}">
            <div class="rl-card-head">
                <h3>${escapeHtml(resource.title)}</h3>
                <div class="rl-badges">${badges(resource)}</div>
            </div>
            <p class="rl-card-desc">${escapeHtml(resource.description || '')}</p>
            <div class="rl-card-foot">
                <div class="rl-card-meta">
                    <span class="rl-category">${escapeHtml(resource.category)}</span>
                    ${updated}
                </div>
                <div class="rl-card-actions">${actions(resource)}</div>
            </div>
        </article>`;
    }

    function renderFilters() {
        const categories = [ALL].concat(catalogue.usedCategories());

        filterBar.innerHTML = categories.map(category => {
            const active = category === activeCategory ? ' rl-filter-active' : '';
            const count = category === ALL
                ? catalogue.RESOURCES.length
                : catalogue.RESOURCES.filter(resource => resource.category === category).length;

            return `<button type="button" class="rl-filter${active}" data-category="${escapeHtml(category)}">`
                + `${escapeHtml(category)} <span class="rl-filter-count">${count}</span></button>`;
        }).join('');

        filterBar.querySelectorAll('.rl-filter').forEach(button => {
            button.addEventListener('click', () => {
                activeCategory = button.dataset.category;
                renderFilters();
                render();
            });
        });
    }

    function render() {
        const query = searchInput.value.trim().toLowerCase();
        const visible = catalogue.RESOURCES.filter(resource => matches(resource, query));

        grid.innerHTML = visible.map(card).join('');

        const total = catalogue.RESOURCES.length;
        countLabel.textContent = visible.length === total
            ? `${total} ${total === 1 ? 'resource' : 'resources'}`
            : `${visible.length} of ${total} resources`;

        clearBtn.hidden = !query;

        if (visible.length) {
            emptyState.hidden = true;
            return;
        }

        emptyState.hidden = false;
        emptyState.innerHTML = total === 0
            ? `<p>The catalogue is empty.</p>
               <p class="rl-empty-hint">Add resources in
               <code>tools/resource-library/resource-library-catalogue.js</code>.</p>`
            : `<p>Nothing matches that search.</p>
               <p class="rl-empty-hint">Try fewer words, or pick a different category.</p>`;
    }

    /**
     * A malformed catalogue shows itself rather than rendering a blank card.
     * Whoever added the bad entry is the person looking at this page.
     */
    function renderProblems() {
        const found = catalogue.problems();

        if (!found.length) {
            problemPanel.hidden = true;
            return;
        }

        problemPanel.hidden = false;
        problemPanel.innerHTML = '<p class="rl-problems-title">This catalogue has problems:</p><ul>'
            + found.map(problem => `<li>${escapeHtml(problem)}</li>`).join('')
            + '</ul>';
    }

    searchInput.addEventListener('input', render);

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        render();
    });

    // Escape clears the search rather than the whole filter, which is what a
    // reader hunting through a long list expects.
    searchInput.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        searchInput.value = '';
        render();
    });

    renderProblems();
    renderFilters();
    render();
})();
