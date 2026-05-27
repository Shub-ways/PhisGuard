// A remote list of phishing domains for demonstration
const REMOTE_PHISHING_LIST_URL = "https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt";

// Fallback list
let phishingSites = [
  "example-phishing.com",
  "fakebank-login.com",
  "malicious-site.net"
];

let whitelist = [];
let apiKey = "";

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("PhishGuard Installed. Initializing...");
  loadSettings();
  updatePhishingList();
  chrome.alarms.create("updatePhishingList", { periodInMinutes: 720 });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updatePhishingList") updatePhishingList();
});

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get({ whitelist: [], safeBrowsingApiKey: "" }, (result) => {
    whitelist = result.whitelist;
    apiKey = result.safeBrowsingApiKey;
    updateDNRRules();
  });
}

// Fetch latest phishing domains
async function updatePhishingList() {
  try {
    const response = await fetch(REMOTE_PHISHING_LIST_URL);
    if (response.ok) {
      const text = await response.text();
      const domains = text.split('\n').filter(line => line.trim() !== '').slice(0, 1000);
      if (domains.length > 0) phishingSites = domains;
    }
  } catch (error) {
    console.error("Failed to fetch phishing list, using fallback.", error);
  }
  updateDNRRules();
}

// Update declarativeNetRequest rules
function updateDNRRules() {
  const removeRuleIds = Array.from({length: 2000}, (_, i) => i + 1);
  const addRules = [];
  
  // Priority 1: Block rules
  phishingSites.forEach((site, id) => {
    addRules.push({
      id: id + 1,
      priority: 1,
      action: { type: "block" },
      condition: { urlFilter: site, resourceTypes: ["main_frame", "sub_frame"] }
    });
  });

  // Priority 2: Whitelist allow rules (overrides block)
  whitelist.forEach((site, id) => {
    addRules.push({
      id: 1001 + id, // offset IDs
      priority: 2,
      action: { type: "allow" },
      condition: { urlFilter: site, resourceTypes: ["main_frame", "sub_frame"] }
    });
  });

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds,
    addRules: addRules
  });
}

// Heuristic check
function isSuspiciousURL(urlStr) {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    if (whitelist.includes(hostname)) return false;
    
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipRegex.test(hostname)) return true;
    if ((hostname.match(/-/g) || []).length > 3) return true;
    return false;
  } catch(e) { return false; }
}

// Google Safe Browsing API check
async function checkSafeBrowsingAPI(url) {
  if (!apiKey) return false;
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "phishguard", clientVersion: "1.2" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: url }]
        }
      })
    });
    const data = await res.json();
    return data && data.matches && data.matches.length > 0;
  } catch(e) { return false; }
}

// Monitor tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    try {
      const url = new URL(changeInfo.url);
      if (whitelist.includes(url.hostname)) return;

      // Check Google Safe Browsing
      const isApiBad = await checkSafeBrowsingAPI(changeInfo.url);
      
      if (isApiBad || phishingSites.includes(url.hostname)) {
        chrome.notifications.create({
          type: "basic", iconUrl: "icons/PhishGuard_Logo.png",
          title: "PhishGuard Alert!",
          message: `Blocked access to known threat: ${url.hostname}`,
          priority: 2, requireInteraction: true
        });
        return;
      }
      
      if (isSuspiciousURL(changeInfo.url)) {
        chrome.notifications.create({
          type: "basic", iconUrl: "icons/PhishGuard_Logo.png",
          title: "Suspicious Site Warning",
          message: `${url.hostname} looks suspicious. Proceed with caution.`,
          priority: 2, requireInteraction: true
        });
      }
    } catch (e) {}
  }
});

// Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStats") {
    sendResponse({ blockedCount: phishingSites.length });
  } else if (request.action === "settingsUpdated" || request.action === "whitelistUpdated") {
    loadSettings();
    sendResponse({ success: true });
  } else if (request.action === "checkUrl") {
    (async () => {
      try {
        const url = new URL(request.url);
        if (whitelist.includes(url.hostname)) {
          sendResponse({ isSuspicious: false });
          return;
        }
        
        const isApiBad = await checkSafeBrowsingAPI(request.url);
        const isSus = isApiBad || isSuspiciousURL(request.url) || phishingSites.includes(url.hostname);
        sendResponse({ isSuspicious: isSus });
      } catch (e) {
        sendResponse({ isSuspicious: false });
      }
    })();
    return true; // async response
  }
  return true;
});

// Load settings on boot
loadSettings();