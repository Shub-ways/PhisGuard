// content.js
console.log("PhishGuard content script loaded.");

function analyzePage() {
  // Check 1: Are there password fields on a non-HTTPS page?
  const isSecure = window.location.protocol === 'https:';
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  
  if (!isSecure && passwordInputs.length > 0) {
    showWarningBanner("CRITICAL: This page asks for a password but is not secure (HTTP). Do not enter your password!");
    return;
  }
  
  // Check 2: Do forms submit to a different domain?
  const forms = document.querySelectorAll('form');
  let suspiciousForms = 0;
  
  forms.forEach(form => {
    if (form.action) {
      try {
        const actionUrl = new URL(form.action);
        if (actionUrl.hostname !== window.location.hostname && actionUrl.hostname !== "") {
          suspiciousForms++;
        }
      } catch (e) {
        // invalid URL
      }
    }
  });

  if (suspiciousForms > 0) {
    showWarningBanner("WARNING: This page contains forms that submit data to a different website. Proceed with caution.");
  }
}

function showWarningBanner(message) {
  // Check if banner already exists
  if (document.getElementById('phishguard-warning-banner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'phishguard-warning-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #ff3b30;
    color: white;
    text-align: center;
    padding: 15px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: bold;
    z-index: 2147483647; /* Max z-index */
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  `;
  
  const text = document.createElement('span');
  text.innerText = message;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Dismiss';
  closeBtn.style.cssText = `
    margin-left: 20px;
    padding: 5px 10px;
    background: white;
    color: #ff3b30;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  
  closeBtn.onclick = () => banner.remove();
  
  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
}

// Run analysis after a short delay to let dynamic content load
setTimeout(analyzePage, 1500);

// --- NEW FEATURE: Link Hover Scanning ---
let activeTooltip = null;

document.addEventListener('mouseover', (e) => {
  const anchor = e.target.closest('a');
  if (!anchor || !anchor.href) return;
  
  try {
    const url = new URL(anchor.href);
    // Don't check internal links or non-web links
    if (url.hostname === window.location.hostname || (url.protocol !== 'http:' && url.protocol !== 'https:')) return;

    // Ask background script if it's safe
    chrome.runtime.sendMessage({ action: "checkUrl", url: anchor.href }, (response) => {
      if (response && response.isSuspicious) {
        showHoverTooltip(e, `Suspicious Link: ${url.hostname}`);
      }
    });
  } catch (err) {
    // invalid url
  }
});

document.addEventListener('mouseout', (e) => {
  const anchor = e.target.closest('a');
  if (anchor) {
    removeHoverTooltip();
  }
});

function showHoverTooltip(e, message) {
  if (activeTooltip) removeHoverTooltip();
  
  activeTooltip = document.createElement('div');
  activeTooltip.innerText = "⚠️ " + message;
  activeTooltip.style.cssText = `
    position: absolute;
    top: ${e.pageY + 15}px;
    left: ${e.pageX + 15}px;
    background: #ef4444;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: system-ui, sans-serif;
    font-weight: bold;
    z-index: 2147483647;
    pointer-events: none;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(activeTooltip);
}

function removeHoverTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}
