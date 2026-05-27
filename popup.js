document.addEventListener('DOMContentLoaded', async () => {
    const statusText = document.getElementById('status-text');
    const statusUrl = document.getElementById('status-url');
    const statusCard = document.getElementById('status-card');
    const blockedCountEl = document.getElementById('blocked-count');

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
        try {
            const url = new URL(tab.url);
            statusUrl.textContent = url.hostname;
            
            // Just a basic check for the UI (real check happens in background)
            if (url.protocol === 'http:') {
                statusText.textContent = 'Not Secure (HTTP)';
                statusCard.className = 'status-card danger';
            } else {
                statusText.textContent = 'Site is Secure';
                statusCard.className = 'status-card safe';
            }
        } catch (e) {
            statusText.textContent = 'Unknown Status';
            statusUrl.textContent = 'Invalid URL';
        }
    }

    // Get stats from background script
    chrome.runtime.sendMessage({ action: "getStats" }, (response) => {
        if (response && response.blockedCount) {
            blockedCountEl.textContent = response.blockedCount;
        }
    });

    // Report button
    document.getElementById('report').addEventListener('click', () => {
        if (tab) {
            alert(`Thanks for reporting ${statusUrl.textContent}. We will analyze it shortly.`);
        }
    });

    // Settings button
    document.getElementById('settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});