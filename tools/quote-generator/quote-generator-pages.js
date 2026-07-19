/** Inserts the split proposal-page templates before the generator initializes. */
(function insertQuoteGeneratorPages() {
    const placeholder = document.getElementById('quotePreviewAdditionalPages');
    const templates = window.QuoteGeneratorPageTemplates || [];

    if (!placeholder || templates.length === 0) {
        console.error('Quote generator proposal pages could not be loaded.');
        return;
    }

    placeholder.outerHTML = templates.join('');
    delete window.QuoteGeneratorPageTemplates;
}());
