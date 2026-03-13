const defaultSubjects = [
    { name: "Quantitative Aptitude" },
    { name: "Reasoning Ability" },
    { name: "English Language" },
    { name: "General Awareness" },
    { name: "Computer Knowledge" }
];

async function initSubjects() {
    await ensureDefaultSubjects();
    await renderSubjects();

    document.getElementById('add-subject-btn').addEventListener('click', addNewSubject);
}

async function ensureDefaultSubjects() {
    const subjects = await window.DB.getAll('subjects');
    if (subjects.length === 0) {
        for (const subj of defaultSubjects) {
            await window.DB.add('subjects', {
                name: subj.name,
                created_at: new Date().toISOString()
            });
        }
    }
}

async function renderSubjects() {
    const listContainer = document.getElementById('subjects-list');
    const subjects = await window.DB.getAll('subjects');

    listContainer.innerHTML = '';

    if (subjects.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No subjects found.</p>';
        return;
    }

    subjects.forEach(subject => {
        const item = document.createElement('div');
        item.className = 'subject-item';
        item.innerHTML = `
            <div class="subject-info">
                <h3>${subject.name}</h3>
                <div class="subject-meta">
                    <span>0 topics</span>
                    <span>0% avg accuracy</span>
                </div>
            </div>
            <div class="subject-actions">
                <button class="btn-icon delete-btn" data-id="${subject.id}" aria-label="Delete">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;

        item.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.closest('.delete-btn').getAttribute('data-id'));
            if (confirm(`Are you sure you want to delete ${subject.name}?`)) {
                await window.DB.delete('subjects', id);
                renderSubjects();
            }
        });

        listContainer.appendChild(item);
    });
}

async function addNewSubject() {
    const name = prompt("Enter Subject Name:");
    if (name && name.trim() !== '') {
        await window.DB.add('subjects', {
            name: name.trim(),
            created_at: new Date().toISOString()
        });
        renderSubjects();
    }
}

// Make init global
window.initSubjects = initSubjects;
