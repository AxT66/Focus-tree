let focusTimer = null;
let focusTimeRemaining = 60 * 60; // 60 minutes in seconds
let isFocusRunning = false;

document.addEventListener('DOMContentLoaded', () => {

    // Navigation
    const btnNavFocus = document.getElementById('nav-focus-mode');
    if (btnNavFocus) {
        btnNavFocus.addEventListener('click', async () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
            document.getElementById('view-focus-mode').classList.add('active');
            document.getElementById('page-title').textContent = 'Focus Mode';

            // Populate Topics Select for when timer finishes
            await populateFocusTopics();
        });
    }

    // Timer Controls
    const startBtn = document.getElementById('focus-start-btn');
    const pauseBtn = document.getElementById('focus-pause-btn');
    const stopBtn = document.getElementById('focus-stop-btn');
    const display = document.getElementById('focus-timer-display');

    function updateDisplay() {
        if (!display) return;
        const minutes = Math.floor(focusTimeRemaining / 60);
        const seconds = focusTimeRemaining % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (isFocusRunning) return;
            isFocusRunning = true;

            startBtn.style.display = 'none';
            pauseBtn.style.display = 'block';

            focusTimer = setInterval(() => {
                focusTimeRemaining--;
                updateDisplay();

                if (focusTimeRemaining <= 0) {
                    clearInterval(focusTimer);
                    isFocusRunning = false;
                    handleFocusComplete();
                }
            }, 1000);
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            clearInterval(focusTimer);
            isFocusRunning = false;
            pauseBtn.style.display = 'none';
            startBtn.style.display = 'block';
            startBtn.textContent = 'Resume';
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to stop the focus block? Progress will not be saved.")) {
                resetFocusTimer();
            }
        });
    }

    // Log Session Form After Timer
    const focusLogForm = document.getElementById('focus-log-form');
    if (focusLogForm) {
        focusLogForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const topicId = parseInt(document.getElementById('focus-topic-select').value);
            const attempted = parseInt(document.getElementById('focus-attempted').value);
            const correct = parseInt(document.getElementById('focus-correct').value);
            const timeSpent = parseInt(document.getElementById('focus-time-spent').value);

            if (correct > attempted) {
                alert("Correct answers cannot exceed questions attempted.");
                return;
            }

            const date = new Date().toISOString().split('T')[0];

            await window.DB.add('study_sessions', {
                topic_id: topicId,
                date: date,
                attempted: attempted,
                correct: correct,
                time_spent: timeSpent,
                timestamp: Date.now()
            });

            // Update Topic Stats
            const topic = await window.DB.get('topics', topicId);
            const totalAttempted = (topic.questions_attempted || 0) + attempted;
            const totalCorrect = (topic.correct_answers || 0) + correct;
            const totalTime = (topic.time_spent || 0) + timeSpent;
            const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

            topic.questions_attempted = totalAttempted;
            topic.correct_answers = totalCorrect;
            topic.time_spent = totalTime;
            topic.accuracy = accuracy;
            topic.last_practiced = date;

            await window.DB.put('topics', topic);

            if (window.logDailyActivity) {
                await window.logDailyActivity(date);
            }

            resetFocusTimer();
            alert("Focus session logged successfully!");
        });
    }

    function resetFocusTimer() {
        clearInterval(focusTimer);
        isFocusRunning = false;
        focusTimeRemaining = 60 * 60;

        if (startBtn) {
            startBtn.style.display = 'block';
            startBtn.textContent = 'Start';
        }
        if (pauseBtn) pauseBtn.style.display = 'none';

        const formContainer = document.getElementById('focus-log-form-container');
        if (formContainer) formContainer.style.display = 'none';

        updateDisplay();
    }

    async function handleFocusComplete() {
        // Hide controls, show log form
        if (startBtn) startBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';

        const formContainer = document.getElementById('focus-log-form-container');
        if (formContainer) formContainer.style.display = 'block';
    }

    async function populateFocusTopics() {
        const select = document.getElementById('focus-topic-select');
        if (!select) return;

        try {
            const topics = await window.DB.getAll('topics');
            const subjects = await window.DB.getAll('subjects');

            const subMap = {};
            subjects.forEach(s => subMap[s.id] = s.name);

            select.innerHTML = '<option value="" disabled selected>-- Choose a Topic --</option>';

            topics.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.name} (${subMap[t.subject_id] || ''})`;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error("Error populating focus topics", e);
        }
    }

});
