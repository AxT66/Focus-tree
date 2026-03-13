document.addEventListener('DOMContentLoaded', () => {
    const navBtn = document.querySelector('.nav-item[data-target="analytics"]');
    if (navBtn) {
        navBtn.addEventListener('click', loadAnalytics);
    }
});

async function loadAnalytics() {
    try {
        await renderConsistencyHeatmap();
        await renderWeakTopics();
        await renderSubjectOverview();
    } catch (e) {
        console.error("Error loading analytics:", e);
    }
}

async function renderConsistencyHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    container.innerHTML = '';

    // Get last 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];

    const formatDate = (d) => {
        const offset = d.getTimezoneOffset();
        const padded = new Date(d.getTime() - (offset * 60 * 1000));
        return padded.toISOString().split('T')[0];
    };

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(formatDate(d));
    }

    const activities = await window.DB.getAll('daily_activity');
    const activeDates = new Set(activities.map(a => a.date));

    dates.forEach(dateStr => {
        const box = document.createElement('div');
        box.style.width = '14px';
        box.style.height = '14px';
        box.style.borderRadius = '3px';
        box.title = dateStr;

        if (activeDates.has(dateStr)) {
            // Studied
            box.style.background = 'var(--accent)';
            box.style.boxShadow = '0 0 4px rgba(16, 185, 129, 0.5)';
        } else {
            // Missed
            box.style.background = 'rgba(255, 255, 255, 0.05)';
        }

        container.appendChild(box);
    });
}

async function renderWeakTopics() {
    const container = document.getElementById('weak-topics-list');
    if (!container) return;

    container.innerHTML = '';

    const topics = await window.DB.getAll('topics');
    const subjects = await window.DB.getAll('subjects');
    const subMap = {};
    subjects.forEach(s => subMap[s.id] = s.name);

    const weakTopics = topics.filter(t => t.accuracy !== undefined && t.accuracy < 60 && t.questions_attempted > 0)
        .sort((a, b) => a.accuracy - b.accuracy);

    if (weakTopics.length === 0) {
        container.innerHTML = '<span style="color: var(--text-main);">None detected. Keep up the good work!</span>';
        return;
    }

    weakTopics.slice(0, 5).forEach(t => {
        const item = document.createElement('div');
        item.style.marginBottom = '8px';
        item.style.padding = '8px';
        item.style.background = 'rgba(239, 68, 68, 0.05)';
        item.style.borderLeft = '3px solid var(--danger)';
        item.style.borderRadius = '4px';
        item.innerHTML = `
            <div class="flex-between">
                <span>${t.name} <span style="font-size: 0.8rem; color: var(--text-muted);">(${subMap[t.subject_id] || ''})</span></span>
                <strong>${t.accuracy.toFixed(1)}%</strong>
            </div>
        `;
        container.appendChild(item);
    });
}

async function renderSubjectOverview() {
    const container = document.getElementById('subject-performance-list');
    if (!container) return;

    container.innerHTML = '';

    const topics = await window.DB.getAll('topics');
    const subjects = await window.DB.getAll('subjects');

    if (subjects.length === 0) {
        container.innerHTML = '<p class="empty-state">No subjects found.</p>';
        return;
    }

    subjects.forEach(sub => {
        const subTopics = topics.filter(t => t.subject_id === sub.id && t.questions_attempted > 0);

        let avgAcc = 0;
        if (subTopics.length > 0) {
            avgAcc = subTopics.reduce((sum, t) => sum + t.accuracy, 0) / subTopics.length;
        }

        const wrap = document.createElement('div');
        wrap.style.marginBottom = '12px';
        wrap.innerHTML = `
            <div class="flex-between" style="font-size: 0.9rem; margin-bottom: 4px;">
                <span>${sub.name}</span>
                <span>${avgAcc.toFixed(1)}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div style="width: ${avgAcc}%; height: 100%; background: ${avgAcc < 60 ? 'var(--danger)' : 'var(--primary)'}; border-radius: 3px;"></div>
            </div>
        `;
        container.appendChild(wrap);
    });
}
