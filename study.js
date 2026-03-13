let currentLogTopicId = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('back-to-topic').addEventListener('click', () => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-subject-detail').classList.add('active');
        currentLogTopicId = null;
    });

    document.getElementById('log-session-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const attempted = parseInt(document.getElementById('log-attempted').value);
        const correct = parseInt(document.getElementById('log-correct').value);
        const timeSpent = parseInt(document.getElementById('log-time').value);

        if (correct > attempted) {
            alert("Correct answers cannot exceed questions attempted.");
            return;
        }

        const date = new Date().toISOString().split('T')[0];

        // Save session
        await window.DB.add('study_sessions', {
            topic_id: currentLogTopicId,
            date: date,
            attempted: attempted,
            correct: correct,
            time_spent: timeSpent,
            timestamp: new Date().getTime()
        });

        // Update Topic Stats
        const topic = await window.DB.get('topics', currentLogTopicId);

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

        // Update Streak
        if (window.logDailyActivity) {
            await window.logDailyActivity(date);
        }

        // Reset form and go back
        e.target.reset();
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-subject-detail').classList.add('active');

        if (window.renderTopics) {
            await window.renderTopics();
        }
    });
});

window.openLogSession = async function (topicId) {
    currentLogTopicId = topicId;

    // Switch views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-log-session').classList.add('active');

    // Get subject and populate name
    const topic = await window.DB.get('topics', topicId);
    document.getElementById('log-session-topic-name').textContent = topic.name;
};
