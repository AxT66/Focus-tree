document.addEventListener('DOMContentLoaded', () => {
    // Initialize streak UI when the app loads
    setTimeout(updateStreakUI, 500); // Wait for DB to be ready just in case
});

window.logDailyActivity = async function (dateString) {
    try {
        const activity = await window.DB.get('daily_activity', dateString);
        if (!activity) {
            await window.DB.add('daily_activity', {
                date: dateString,
                studied: true,
                timestamp: new Date().getTime()
            });
        }
    } catch (e) {
        console.error("Error logging daily activity", e);
    }
    await updateStreakUI();
};

async function updateStreakUI() {
    try {
        const activities = await window.DB.getAll('daily_activity');

        // Convert to a Set of date strings (YYYY-MM-DD)
        const activeDates = new Set(activities.map(a => a.date));

        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        // Sort all active dates chronologically to calculate best streak
        const sortedDates = Array.from(activeDates).sort();

        if (sortedDates.length > 0) {
            tempStreak = 1;
            bestStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const prev = new Date(sortedDates[i - 1]);
                const curr = new Date(sortedDates[i]);
                const diffTime = Math.abs(curr - prev);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                    if (tempStreak > bestStreak) bestStreak = tempStreak;
                } else if (diffDays > 1) {
                    tempStreak = 1;
                }
            }
        }

        // Calculate Current Streak working backwards from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Helper to format date
        const formatDate = (d) => {
            const offset = d.getTimezoneOffset();
            const padded = new Date(d.getTime() - (offset * 60 * 1000));
            return padded.toISOString().split('T')[0];
        };

        const todayStr = formatDate(today);

        let checkDate = new Date(today);
        let checkDateStr = formatDate(checkDate);
        let missedDays = 0;

        // If today is not studied, look at yesterday
        if (!activeDates.has(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
            checkDateStr = formatDate(checkDate);
            missedDays = 1; // 1 missed day (today)

            if (!activeDates.has(checkDateStr)) {
                missedDays = 2; // Also missed yesterday
            }
        }

        // Count backwards as long as we find consecutive hits
        while (activeDates.has(checkDateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            checkDateStr = formatDate(checkDate);
        }

        // Update DOM
        const curEl = document.getElementById('current-streak');
        const bestEl = document.getElementById('best-streak');
        const cardEl = document.querySelector('.streak-card');

        if (curEl && bestEl) {
            curEl.textContent = currentStreak;
            bestEl.textContent = bestStreak;
        }

        // Handle Warnings
        if (cardEl) {
            cardEl.style.border = '1px solid var(--glass-border)'; // Reset
            if (missedDays === 1) {
                cardEl.style.borderColor = 'var(--warning)';
                cardEl.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.2)';
            } else if (missedDays >= 2) {
                cardEl.style.borderColor = 'var(--danger)';
                cardEl.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
            }
        }

    } catch (e) {
        console.error("Error updating streak UI", e);
    }
}

window.updateStreakUI = updateStreakUI;
