let mediaRecorder;
let audioChunks = [];

document.addEventListener('DOMContentLoaded', () => {

    // Navigation
    const btnNavFuture = document.getElementById('nav-future-self');
    if (btnNavFuture) {
        btnNavFuture.addEventListener('click', async () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
            document.getElementById('view-future-self').classList.add('active');
            document.getElementById('page-title').textContent = 'Future Self';

            await loadFutureSelfAudio();
        });
    }

    // Recording Elements
    const btnStart = document.getElementById('btn-start-record');
    const btnStop = document.getElementById('btn-stop-record');
    const statusText = document.getElementById('recording-status');
    const playbackContainer = document.getElementById('audio-playback-container');
    const audioEl = document.getElementById('future-self-audio');
    const deleteBtn = document.getElementById('btn-delete-audio');

    if (btnStart) {
        btnStart.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);

                audioChunks = [];

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

                    // Save to DB
                    await saveAudioToDB(audioBlob);

                    // Stop tracks to release mic
                    stream.getTracks().forEach(track => track.stop());

                    await loadFutureSelfAudio();
                };

                mediaRecorder.start();

                btnStart.style.display = 'none';
                btnStop.style.display = 'flex';
                statusText.style.display = 'block';

            } catch (e) {
                console.error("Microphone access denied or failed", e);
                alert("Could not access microphone. Please check permissions.");
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            btnStart.style.display = 'flex';
            btnStop.style.display = 'none';
            statusText.style.display = 'none';
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm("Delete your motivation message?")) {
                await window.DB.delete('future_self', 1); // We only keep id 1
                audioEl.src = '';
                playbackContainer.style.display = 'none';
            }
        });
    }
});

async function saveAudioToDB(blob) {
    try {
        await window.DB.put('future_self', {
            id: 1, // Store single file
            audio: blob,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Error saving audio:", e);
    }
}

async function loadFutureSelfAudio() {
    try {
        const data = await window.DB.get('future_self', 1);
        const container = document.getElementById('audio-playback-container');
        const audioEl = document.getElementById('future-self-audio');

        if (data && data.audio) {
            const audioUrl = URL.createObjectURL(data.audio);
            audioEl.src = audioUrl;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
            audioEl.src = '';
        }
    } catch (e) {
        console.error("Error loading audio:", e);
    }
}

// Global auto-play check for broken streak
window.checkFutureSelfAutoplay = async function (missedDays) {
    // This is called from streak.js if missedDays >= 1
    const lastPlayed = localStorage.getItem('futureSelfPlayedDate');
    const todayStr = new Date().toISOString().split('T')[0];

    // Play once per day
    if (missedDays >= 1 && lastPlayed !== todayStr) {
        try {
            const data = await window.DB.get('future_self', 1);
            if (data && data.audio) {
                const audioUrl = URL.createObjectURL(data.audio);
                const audio = new Audio(audioUrl);

                // Show a nice modal or alert before/while playing
                alert(`STREAK BROKEN. Playing your Future Self message...`);

                audio.play()
                    .then(() => localStorage.setItem('futureSelfPlayedDate', todayStr))
                    .catch(err => console.log('Autoplay blocked by browser. User must interact first.', err));
            }
        } catch (e) {
            console.error("Error in autoplay:", e);
        }
    }
}
