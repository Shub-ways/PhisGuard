document.addEventListener('DOMContentLoaded', () => {
    const totalBlockedEl = document.getElementById('total-blocked');
    const heuristicToggle = document.getElementById('heuristic-toggle');
    const updateToggle = document.getElementById('update-toggle');

    // Fetch stats
    chrome.runtime.sendMessage({ action: "getStats" }, (response) => {
        if (response && response.blockedCount !== undefined) {
            totalBlockedEl.textContent = response.blockedCount;
        } else {
            totalBlockedEl.textContent = '0';
        }
    });

    // Handle toggles (In a real extension, we would save these to chrome.storage)
    heuristicToggle.addEventListener('change', (e) => {
        console.log("Heuristic Scanning set to: ", e.target.checked);
        // chrome.storage.local.set({ heuristicEnabled: e.target.checked });
    });

    updateToggle.addEventListener('change', (e) => {
        console.log("Auto-Update set to: ", e.target.checked);
        // chrome.storage.local.set({ autoUpdateEnabled: e.target.checked });
    });
});
