/**
 * Shared Navigation Script for Ray2Volt Toolbox
 * Handles sidebar toggle for mobile and responsive behavior
 */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('overlay');

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

    if (mobileNavToggle && sidebar && sidebarCloseBtn && overlay) {
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
