document.addEventListener('DOMContentLoaded', () => {
    const accordions = document.querySelectorAll('.pkg-accordion');

    accordions.forEach((accordion) => {
        accordion.addEventListener('toggle', () => {
            if (!accordion.open) return;

            accordions.forEach((sibling) => {
                if (sibling !== accordion) sibling.open = false;
            });
        });
    });

    document.querySelectorAll('.pkg-table-wrapper').forEach((wrapper) => {
        const checkScroll = () => {
            wrapper.classList.toggle('is-scrollable', wrapper.scrollWidth > wrapper.clientWidth + 2);
            wrapper.classList.toggle(
                'scrolled-end',
                wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 4
            );
        };

        wrapper.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll, { passive: true });
        checkScroll();
    });
});
