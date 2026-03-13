document.addEventListener('DOMContentLoaded', () => {

    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const stores = ['subjects', 'topics', 'study_sessions', 'daily_activity', 'mock_tests', 'battle_plans'];
                const backup = {};

                // Note: We are ignoring 'future_self' binary data for simple JSON backup
                // because audio blobs can make the JSON huge and complex to re-deserialize synchronously.

                for (let storeName of stores) {
                    backup[storeName] = await window.DB.getAll(storeName);
                }

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `BankingWarMode_Backup_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                alert('Backup Exported successfully.');
            } catch (e) {
                console.error("Export failed", e);
                alert("Export failed. Please check console.");
            }
        });
    }

    const importBtn = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file');

    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => {
            if (confirm("WARNING: Importing data will OVERWRITE your current data. Are you sure you want to proceed?")) {
                importFileInput.click();
            }
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    // Clear and restore each store
                    const stores = ['subjects', 'topics', 'study_sessions', 'daily_activity', 'mock_tests', 'battle_plans'];

                    for (let storeName of stores) {
                        if (data[storeName]) {
                            // Fetch all existing keys
                            const existing = await window.DB.getAll(storeName);
                            // Delete existing
                            for (let item of existing) {
                                const keyField = (storeName === 'daily_activity' || storeName === 'battle_plans') ? 'date' : 'id';
                                await window.DB.delete(storeName, item[keyField]);
                            }
                            // Insert imported
                            for (let item of data[storeName]) {
                                await window.DB.put(storeName, item);
                            }
                        }
                    }

                    alert('Backup Imported successfully! Reloading...');
                    window.location.reload();

                } catch (err) {
                    console.error("Import failed", err);
                    alert("Import failed. Make sure the JSON file is valid.");
                }
            };
            reader.readAsText(file);

            // Allow selecting the same file again if it failed
            e.target.value = '';
        });
    }
});
