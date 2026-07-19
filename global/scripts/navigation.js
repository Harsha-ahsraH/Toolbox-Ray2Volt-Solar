/**
 * Shared Navigation Script for Ray2Volt Toolbox
 * Handles sidebar toggle for mobile and responsive behavior
 */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('overlay');

    if (!sidebar) return;

    sidebar.id = sidebar.id || 'sidebar';

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'sidebar-collapse-btn';
    collapseBtn.setAttribute('aria-controls', sidebar.id);

    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'material-symbols-rounded';
    collapseIcon.setAttribute('aria-hidden', 'true');
    collapseBtn.appendChild(collapseIcon);
    sidebar.insertBefore(collapseBtn, sidebar.firstChild);

    const navLinks = sidebar.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach((link) => {
        if (!link.title) link.title = link.textContent.trim();
    });

    function setSidebarCollapsed(collapsed) {
        sidebar.classList.toggle('collapsed', collapsed);
        collapseIcon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));
        collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }

    setSidebarCollapsed(false);
    collapseBtn.addEventListener('click', () => {
        setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
    });

    function openSidebar() {
        sidebar?.classList.add('open');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileNavToggle && sidebarCloseBtn && overlay) {
        mobileNavToggle.addEventListener('click', openSidebar);
        sidebarCloseBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when window resizes to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeSidebar();
        }
    });
});

