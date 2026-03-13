document.addEventListener('DOMContentLoaded', () => {

    // Navigation routing for Mock Tests
    const btnNavMock = document.getElementById('nav-mock-tests');
    if (btnNavMock) {
        btnNavMock.addEventListener('click', async () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
            document.getElementById('view-mock-tests').classList.add('active');
            document.getElementById('page-title').textContent = 'Mock Tests';
            await renderMockTests();
        });
    }

    const btnBackToDash = document.getElementById('back-to-dash-from-mocks');
    if (btnBackToDash) {
        btnBackToDash.addEventListener('click', () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-dashboard').classList.add('active');
            document.getElementById('page-title').textContent = 'Dashboard';
            // Also reactivate dashboard tab style
            document.querySelector('.nav-item[data-target="dashboard"]').classList.add('active');
        });
    }

    const btnAddMock = document.getElementById('add-mock-test-btn');
    if (btnAddMock) {
        btnAddMock.addEventListener('click', () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-log-mock').classList.add('active');
        });
    }

    const btnBackToMocks = document.getElementById('back-to-mocks');
    if (btnBackToMocks) {
        btnBackToMocks.addEventListener('click', async () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-mock-tests').classList.add('active');
        });
    }

    // Form Submit
    const formLogMock = document.getElementById('log-mock-form');
    if (formLogMock) {
        formLogMock.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('mock-name').value.trim();
            const score = parseFloat(document.getElementById('mock-score').value);
            const time = parseInt(document.getElementById('mock-time').value);

            const quant = parseFloat(document.getElementById('mock-quant').value) || 0;
            const reasoning = parseFloat(document.getElementById('mock-reasoning').value) || 0;
            const english = parseFloat(document.getElementById('mock-english').value) || 0;

            const date = new Date().toISOString().split('T')[0];

            await window.DB.add('mock_tests', {
                name,
                score,
                time,
                sections: {
                    quant,
                    reasoning,
                    english
                },
                date,
                timestamp: Date.now()
            });

            // Log daily activity just like a study session
            if (window.logDailyActivity) {
                await window.logDailyActivity(date);
            }

            e.target.reset();
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-mock-tests').classList.add('active');
            await renderMockTests();
        });
    }
});

async function renderMockTests() {
    const listContainer = document.getElementById('mock-tests-list');
    if (!listContainer) return;

    try {
        const mocks = await window.DB.getAll('mock_tests');

        listContainer.innerHTML = '';

        if (mocks.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No mock tests recorded yet.</p>';
            return;
        }

        // Sort by newest first
        mocks.sort((a, b) => b.timestamp - a.timestamp);

        // Calculate max score to draw relative bars
        const maxScore = Math.max(...mocks.map(m => m.score), 100);

        mocks.forEach(mock => {
            const item = document.createElement('div');
            item.className = 'glass-card mb-4';
            item.style.marginBottom = '1rem';

            const percent = Math.min((mock.score / maxScore) * 100, 100);

            item.innerHTML = `
                <div class="flex-between mb-2" style="margin-bottom: 8px;">
                    <h3 style="margin:0">${mock.name}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted)">${mock.date}</span>
                </div>
                <div class="flex-between mb-2" style="margin-bottom: 12px;">
                    <span style="font-size: 1.25rem; font-weight: bold; color: var(--primary)">${mock.score} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">pts</span></span>
                    <span style="font-size: 0.9rem; color: var(--text-muted)">${mock.time} mins</span>
                </div>
                
                <!-- Performance Bar -->
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
                    <div style="width: ${percent}%; height: 100%; background: var(--primary); border-radius: 3px;"></div>
                </div>

                <div style="font-size: 0.8rem; display: flex; gap: 10px; color: var(--text-muted);">
                    <span>QA: <strong style="color:var(--text-main)">${mock.sections?.quant || 0}</strong></span>
                    <span>RE: <strong style="color:var(--text-main)">${mock.sections?.reasoning || 0}</strong></span>
                    <span>EN: <strong style="color:var(--text-main)">${mock.sections?.english || 0}</strong></span>
                </div>
                
                <div class="mt-2" style="text-align: right;">
                     <button class="btn-icon delete-mock-btn" data-id="${mock.id}" style="color: var(--danger); background: none; border: none; cursor: pointer; padding: 4px;">
                        Delete
                    </button>
                </div>
            `;

            item.querySelector('.delete-mock-btn').addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('Delete this mock test record?')) {
                    await window.DB.delete('mock_tests', id);
                    renderMockTests();
                }
            });

            listContainer.appendChild(item);
        });

    } catch (e) {
        console.error("Error rendering mock tests:", e);
        listContainer.innerHTML = '<p class="empty-state text-danger">Failed to load mock tests.</p>';
    }
}
