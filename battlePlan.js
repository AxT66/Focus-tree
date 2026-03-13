document.addEventListener('DOMContentLoaded', () => {
    const battlePlanNavBtn = document.querySelector('[data-target="battle-plan"]');
    if (battlePlanNavBtn) {
        battlePlanNavBtn.addEventListener('click', loadBattlePlan);
    }
});

async function loadBattlePlan() {
    const container = document.getElementById('battle-plan-container');
    const dateStr = new Date().toISOString().split('T')[0];

    try {
        let plan = await window.DB.get('battle_plans', dateStr);

        if (!plan) {
            container.innerHTML = '<p class="empty-state">Analyzing your performance...</p>';
            plan = await generateBattlePlan(dateStr);
            if (plan) {
                await window.DB.add('battle_plans', plan);
            }
        }

        renderBattlePlan(plan);
    } catch (e) {
        console.error("Error loading battle plan:", e);
        container.innerHTML = '<p class="empty-state text-danger">Failed to load battle plan.</p>';
    }
}

async function generateBattlePlan(dateStr) {
    const topics = await window.DB.getAll('topics');
    const subjects = await window.DB.getAll('subjects');

    // Map subjects for quick lookup
    const subjectMap = {};
    subjects.forEach(s => subjectMap[s.id] = s.name);

    // If no topics exist, we can't generate a good plan
    if (topics.length === 0) {
        return {
            date: dateStr,
            tasks: [
                { id: Date.now() + 1, text: "Add your first Subject and Topic", completed: false, skipped: false }
            ]
        };
    }

    // Sort topics by accuracy ascending (weakest first)
    // Topics with 0 attempts act as 0% accuracy or needs practice
    const weakTopics = topics.sort((a, b) => {
        const accA = a.accuracy !== undefined ? a.accuracy : 0;
        const accB = b.accuracy !== undefined ? b.accuracy : 0;
        return accA - accB;
    });

    // Select top 3 weakest topics to practice
    const tasksToGenerate = Math.min(3, weakTopics.length);
    const newTasks = [];

    for (let i = 0; i < tasksToGenerate; i++) {
        const t = weakTopics[i];
        const subName = subjectMap[t.subject_id] || 'Unknown Subject';

        // Vary the task text slightly based on index
        const taskTypes = [
            `Complete 1 Practice Set of ${t.name}`,
            `Review concepts for ${t.name}`,
            `Solve 15 mixed questions from ${t.name}`
        ];

        newTasks.push({
            id: Date.now() + i,
            text: `${taskTypes[i % 3]} (${subName})`,
            topic_id: t.id,
            completed: false,
            skipped: false
        });
    }

    // Add a generic maintenance task
    newTasks.push({
        id: Date.now() + 99,
        text: "Take 1 Sectional Mock Test",
        completed: false,
        skipped: false
    });

    return {
        date: dateStr,
        tasks: newTasks
    };
}

function renderBattlePlan(plan) {
    const container = document.getElementById('battle-plan-container');

    if (!plan || !plan.tasks || plan.tasks.length === 0) {
        container.innerHTML = '<p class="empty-state">No tasks for today. Take a break!</p>';
        return;
    }

    container.innerHTML = '';
    const dateStr = plan.date;

    plan.tasks.forEach(task => {
        if (task.skipped) return; // Don't render skipped tasks

        const item = document.createElement('div');
        item.className = `glass-card mt-2 flex-between ${task.completed ? 'task-completed' : ''}`;
        item.style.transition = 'all 0.3s ease';

        if (task.completed) {
            item.style.opacity = '0.6';
            item.style.borderColor = 'var(--accent)';
        }

        item.innerHTML = `
            <div style="flex: 1; padding-right: 10px;">
                <p style="color: ${task.completed ? 'var(--accent)' : 'var(--text-main)'}; 
                          text-decoration: ${task.completed ? 'line-through' : 'none'};
                          font-weight: 500;">
                    ${task.text}
                </p>
            </div>
            <div class="task-actions d-flex gap-2" style="display: flex; gap: 8px;">
                ${!task.completed ? `<button class="btn btn-icon btn-complete" data-id="${task.id}" style="color: var(--accent); background: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 6px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>` : ''}
                ${!task.completed ? `<button class="btn btn-icon btn-skip" data-id="${task.id}" style="color: var(--text-muted); background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 6px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>` : ''}
            </div>
        `;

        if (!task.completed) {
            item.querySelector('.btn-complete').addEventListener('click', async () => {
                await updateTaskStatus(dateStr, task.id, 'complete');
            });
            item.querySelector('.btn-skip').addEventListener('click', async () => {
                await updateTaskStatus(dateStr, task.id, 'skip');
            });
        }

        container.appendChild(item);
    });

    if (plan.tasks.every(t => t.completed || t.skipped)) {
        const msg = document.createElement('div');
        msg.className = 'glass-card mt-4';
        msg.style.textAlign = 'center';
        msg.style.borderColor = 'var(--accent)';
        msg.innerHTML = '<h3 style="color: var(--accent)">All Done!</h3><p>You have conquered today\'s battle plan.</p>';
        container.appendChild(msg);
    }
}

async function updateTaskStatus(dateStr, taskId, action) {
    try {
        const plan = await window.DB.get('battle_plans', dateStr);
        if (plan) {
            const task = plan.tasks.find(t => t.id === taskId);
            if (task) {
                if (action === 'complete') task.completed = true;
                if (action === 'skip') task.skipped = true;
                await window.DB.put('battle_plans', plan);
                renderBattlePlan(plan);
            }
        }
    } catch (e) {
        console.error("Error updating task status:", e);
    }
}
