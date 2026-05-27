// A remote list of phishing domains for demonstration
const REMOTE_PHISHING_LIST_URL = "https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt";

// We'll fallback to these if fetch fails
let phishingSites = [
  "example-phishing.com",
  "fakebank-login.com",
  "malicious-site.net"
];

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("PhishGuard Installed. Initializing...");
  updatePhishingList();
  
  // Set an alarm to fetch updates every 12 hours
  chrome.alarms.create("updatePhishingList", { periodInMinutes: 720 });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updatePhishingList") {
    updatePhishingList();
  }
});

// Fetch latest phishing domains
async function updatePhishingList() {
  try {
    const response = await fetch(REMOTE_PHISHING_LIST_URL);
    if (response.ok) {
      const text = await response.text();
      // Parse domains (take the first 1000 to keep it manageable for DNR)
      const domains = text.split('\n').filter(line => line.trim() !== '').slice(0, 1000);
      if (domains.length > 0) {
        phishingSites = domains;
      }
    }
  } catch (error) {
    console.error("Failed to fetch phishing list, using fallback.", error);
  }
  
  updateDNRRules();
}

// Update declarativeNetRequest rules
function updateDNRRules() {
  // Clear old rules (assuming max 2000 for our block)
  const removeRuleIds = Array.from({length: 2000}, (_, i) => i + 1);
  
  const addRules = phishingSites.map((site, id) => ({
    id: id + 1,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: site, resourceTypes: ["main_frame", "sub_frame"] }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds,
    addRules: addRules
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error updating rules: ", chrome.runtime.lastError);
    } else {
      console.log(`Updated DNR rules. Blocking ${addRules.length} sites.`);
    }
  });
}

// Heuristic check: is the URL suspicious?
function isSuspiciousURL(urlStr) {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    
    // Check 1: IP address instead of domain
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipRegex.test(hostname)) return true;
    
    // Check 2: Excessive hyphens
    if ((hostname.match(/-/g) || []).length > 3) return true;
    
    return false;
  } catch(e) {
    return false;
  }
}

// Monitor tab updates for heuristics & notifications
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    try {
      const url = new URL(changeInfo.url);
      
      // If it's in our blocklist, DNR will block it, but we can still notify
      if (phishingSites.includes(url.hostname)) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "PhishGuard Alert!",
          message: `Blocked access to known phishing site: ${url.hostname}`
        });
        return;
      }
      
      // If not blocked, but looks suspicious via heuristics
      if (isSuspiciousURL(changeInfo.url)) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Suspicious Site Warning",
          message: `${url.hostname} looks suspicious. Proceed with caution.`
        });
      }
    } catch (e) {
      // invalid url
    }
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStats") {
    sendResponse({ blockedCount: phishingSites.length });
  }
  return true;
});