let currentSubjectId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Event delegation for clicking a subject
    document.getElementById('subjects-list').addEventListener('click', async (e) => {
        const subjectItem = e.target.closest('.subject-info');
        if (subjectItem) {
            const parent = subjectItem.closest('.subject-item');
            const id = parent.querySelector('.delete-btn').getAttribute('data-id');
            await openSubjectDetail(parseInt(id));
        }
    });

    document.getElementById('back-to-subjects').addEventListener('click', () => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-subjects').classList.add('active');
        currentSubjectId = null;
    });

    document.getElementById('add-topic-btn').addEventListener('click', addNewTopic);
});

window.openSubjectDetail = async function (subjectId) {
    currentSubjectId = subjectId;

    // Switch views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-subject-detail').classList.add('active');

    // Get subject
    const subject = await window.DB.get('subjects', subjectId);
    document.getElementById('detail-subject-name').textContent = subject.name;

    await renderTopics();
};

async function renderTopics() {
    const listContainer = document.getElementById('topics-list');
    const allTopics = await window.DB.getAll('topics');

    // Filter topics by subject
    const topics = allTopics.filter(t => t.subject_id === currentSubjectId);

    // Update subject stats UI
    document.getElementById('detail-subject-topics-count').textContent = topics.length;

    let totalAcc = 0;
    let accCount = 0;

    listContainer.innerHTML = '';

    if (topics.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No topics yet. Add one!</p>';
        document.getElementById('detail-subject-accuracy').textContent = '0%';
        return;
    }

    topics.forEach(topic => {
        if (topic.accuracy !== undefined && topic.questions_attempted > 0) {
            totalAcc += topic.accuracy;
            accCount++;
        }

        const isWeak = topic.accuracy !== undefined && topic.accuracy < 60 && topic.questions_attempted > 0;

        const item = document.createElement('div');
        item.className = 'subject-item ' + (isWeak ? 'weak-topic' : '');
        item.style = isWeak ? 'border-color: var(--danger); background: rgba(239, 68, 68, 0.05);' : '';
        item.innerHTML = `
            <div class="subject-info" style="cursor: default; width: 60%;">
                <h3>${topic.name}</h3>
                <div class="subject-meta d-flex flex-column gap-1">
                    <span>Accuracy: <strong style="color: ${isWeak ? 'var(--danger)' : 'var(--text-main)'}">${topic.accuracy !== undefined ? topic.accuracy.toFixed(1) + '%' : 'N/A'}</strong></span>
                    <span>Attempted: ${topic.questions_attempted || 0}</span>
                </div>
            </div>
            <div class="topic-actions flex-between" style="width: 40%; gap: 10px;">
                <button class="btn btn-primary btn-sm log-session-btn" style="flex:1;" data-id="${topic.id}">Log Study</button>
                <button class="btn-icon delete-topic-btn" data-id="${topic.id}" aria-label="Delete">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;

        // Delete Topic
        item.querySelector('.delete-topic-btn').addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            if (confirm(`Delete topic ${topic.name}?`)) {
                await window.DB.delete('topics', id);
                renderTopics();
            }
        });

        // Log Session
        item.querySelector('.log-session-btn').addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            if (window.openLogSession) {
                window.openLogSession(id);
            }
        });

        listContainer.appendChild(item);
    });

    const avgAcc = accCount > 0 ? (totalAcc / accCount).toFixed(1) : 0;
    document.getElementById('detail-subject-accuracy').textContent = `${avgAcc}%`;
}

async function addNewTopic() {
    if (!currentSubjectId) return;
    const name = prompt("Enter Topic Name (e.g., Simplification):");
    if (name && name.trim() !== '') {
        await window.DB.add('topics', {
            subject_id: currentSubjectId,
            name: name.trim(),
            questions_attempted: 0,
            correct_answers: 0,
            accuracy: 0,
            time_spent: 0,
            last_practiced: null,
            created_at: new Date().toISOString()
        });
        renderTopics();
    }
}
