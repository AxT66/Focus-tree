document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        'dashboard': 'Dashboard',
        'subjects': 'Subjects',
        'battle-plan': 'Battle Plan',
        'analytics': 'Analytics',
        'settings': 'Settings'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');

            // Update Navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update View
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`view-${target}`).classList.add('active');

            // Update Title
            pageTitle.textContent = titles[target];
        });
    });

    // Initialize logic
    initApp();
});

async function initApp() {
    try {
        await window.DB.getAll('subjects'); // Test DB initialization
        console.log("Database initialized successfully.");

        // Trigger subject module initialisation if it exists
        if (typeof initSubjects === 'function') {
            initSubjects();
        }
    } catch (error) {
        console.error("Initialization Failed:", error);
    }
}
