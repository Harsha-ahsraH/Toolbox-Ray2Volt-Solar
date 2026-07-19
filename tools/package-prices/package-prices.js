// Scroll hint for table wrappers (768px breakpoint — horizontal scroll mode)
        document.querySelectorAll('.pkg-table-wrapper').forEach(wrapper => {
            function checkScroll() {
                const isScrollable = wrapper.scrollWidth > wrapper.clientWidth + 2;
                wrapper.classList.toggle('is-scrollable', isScrollable);
                const atEnd = wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 4;
                wrapper.classList.toggle('scrolled-end', atEnd);
            }
            wrapper.addEventListener('scroll', checkScroll, { passive: true });
            window.addEventListener('resize', checkScroll, { passive: true });
            checkScroll();
        });

        // Pricing Tables Interactivity
        const btnOngrid = document.getElementById('btn-ongrid');
        const btnHybrid = document.getElementById('btn-hybrid');
        const packageSelect = document.getElementById('packageSelect');
        const segHighlight = document.querySelector('.pkg-seg-highlight');

        let currentSystem = 'ongrid';

        const views = {
            'ongrid-residential': document.getElementById('view-ongrid-residential'),
            'ongrid-commercial': document.getElementById('view-ongrid-commercial'),
            'hybrid-residential': document.getElementById('view-hybrid-residential'),
            'hybrid-commercial': document.getElementById('view-hybrid-commercial')
        };

        function moveHighlight(btn) {
            if (!segHighlight || !btn) return;
            segHighlight.style.width = btn.offsetWidth + 'px';
            segHighlight.style.left = btn.offsetLeft + 'px';
        }

        function updateView() {
            const packageType = packageSelect.value;
            const activeViewId = `${currentSystem}-${packageType}`;

            for (const [key, element] of Object.entries(views)) {
                if (element) {
                    element.style.display = (key === activeViewId) ? 'block' : 'none';
                }
            }
        }

        function setSystem(system, btn) {
            currentSystem = system;
            document.querySelectorAll('.pkg-seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            moveHighlight(btn);
            updateView();
        }

        if (btnOngrid && btnHybrid && packageSelect) {
            btnOngrid.addEventListener('click', () => setSystem('ongrid', btnOngrid));
            btnHybrid.addEventListener('click', () => setSystem('hybrid', btnHybrid));
            packageSelect.addEventListener('change', updateView);

            // Initialize highlight position
            moveHighlight(btnOngrid);
            updateView();

            // Re-position highlight on resize
            window.addEventListener('resize', () => {
                const activeBtn = document.querySelector('.pkg-seg-btn.active');
                if (activeBtn) moveHighlight(activeBtn);
            });
        }
