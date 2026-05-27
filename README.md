# 🛡️ PhishGuard

**PhishGuard** is a next-generation, Manifest V3 Chrome Extension designed to protect users from sophisticated phishing attacks, zero-day threats, and deceptive URLs in real-time.

Built with modern browser security standards, PhishGuard utilizes a combination of local heuristics, Declarative Net Request (DNR) blocking, and live integration with the Google Safe Browsing API to intercept malicious sites before they can load.

---

## ✨ Key Features

- **🌐 Live Threat Intelligence**: Seamlessly integrates with the Google Safe Browsing API to detect and block access to known malware and phishing domains.
- **⚡ Pre-Click Protection (Hover Scanning)**: Actively monitors user interactions. Hovering over a suspicious link instantly triggers a warning tooltip, preventing users from clicking dangerous links.
- **🧠 Heuristic Engine**: Detects zero-day threats by analyzing URLs for suspicious patterns (e.g., raw IP addresses, typosquatting with excessive hyphens).
- **🔒 Context-Aware Content Scanning**: Automatically detects unsecured HTTP login pages and injects floating UI warnings if the user attempts to enter sensitive information.
- **⚡ High-Performance DNR Engine**: Utilizes Chrome's Manifest V3 `declarativeNetRequest` API to block network requests at the browser level without impacting page load speeds.
- **📊 Interactive Dashboard**: A sleek, glassmorphism-inspired settings interface allowing users to configure their API keys, manage a custom "Safe Whitelist", and view protection statistics.
- **🎓 Educational Module**: Features an interactive "Spot the Phish" quiz to train users on cybersecurity best practices.

---

## 🏗️ Architecture & Technologies

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Browser API**: Google Chrome Manifest V3 (`chrome.declarativeNetRequest`, `chrome.storage`, `chrome.alarms`, `chrome.scripting`).
- **Security**: Content Security Policy (CSP) compliant, asynchronous API calls, secure local storage.
- **UI/UX**: Custom CSS implementing modern Glassmorphism aesthetics with dynamic DOM injection.

---

## 🚀 Installation Guide

Want to test PhishGuard locally? Follow these steps:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `PhishGuard` directory you downloaded.
6. The extension is now installed! Click the PhishGuard icon in your toolbar to access the Settings Dashboard.

---

## ⚙️ Configuration (Optional)

To enable the highest level of protection, you can connect PhishGuard to the Google Safe Browsing database:
1. Obtain a free Safe Browsing API Key from the Google Cloud Console.
2. Open the PhishGuard Dashboard.
3. Paste your API key into the Security Settings section and click **Save**.

---

*Disclaimer: This is a portfolio project designed to demonstrate advanced Chrome Extension development, API integration, and cybersecurity concepts.*
