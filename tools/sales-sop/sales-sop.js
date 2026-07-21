document.addEventListener('DOMContentLoaded', () => {
    const systemColumns = document.querySelectorAll('.sop-system-column');

    systemColumns.forEach((column) => {
        const cards = column.querySelectorAll('.sop-card');

        cards.forEach((card) => {
            card.addEventListener('toggle', () => {
                if (!card.open) return;

                cards.forEach((sibling) => {
                    if (sibling !== card) sibling.open = false;
                });
            });
        });
    });
});
