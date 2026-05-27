document.addEventListener('DOMContentLoaded', () => {
    // ---- TABS LOGIC ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ---- DASHBOARD STATS & SETTINGS ----
    const totalBlockedEl = document.getElementById('total-blocked');
    chrome.runtime.sendMessage({ action: "getStats" }, (response) => {
        if (response && response.blockedCount !== undefined) {
            totalBlockedEl.textContent = response.blockedCount;
        } else {
            totalBlockedEl.textContent = '0';
        }
    });

    const apiKeyInput = document.getElementById('api-key');
    const saveKeyBtn = document.getElementById('save-api-key');
    const apiStatus = document.getElementById('api-status');

    chrome.storage.local.get(['safeBrowsingApiKey'], (result) => {
        if (result.safeBrowsingApiKey) apiKeyInput.value = result.safeBrowsingApiKey;
    });

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        chrome.storage.local.set({ safeBrowsingApiKey: key }, () => {
            apiStatus.style.display = 'inline';
            setTimeout(() => apiStatus.style.display = 'none', 2000);
            chrome.runtime.sendMessage({ action: "settingsUpdated" });
        });
    });

    // ---- WHITELIST LOGIC ----
    const whitelistUl = document.getElementById('whitelist-ul');
    const newDomainInput = document.getElementById('new-domain');
    const addDomainBtn = document.getElementById('add-domain');

    function renderWhitelist() {
        chrome.storage.local.get({ whitelist: [] }, (result) => {
            whitelistUl.innerHTML = '';
            result.whitelist.forEach(domain => {
                const li = document.createElement('li');
                li.className = 'whitelist-item';
                li.innerHTML = `<span>${domain}</span> <button class="btn btn-danger" style="margin:0; padding: 6px 12px;" data-domain="${domain}">Remove</button>`;
                whitelistUl.appendChild(li);
            });
            document.querySelectorAll('.btn-danger').forEach(btn => {
                btn.addEventListener('click', (e) => removeDomain(e.target.dataset.domain));
            });
        });
    }

    function addDomain(domain) {
        domain = domain.trim().toLowerCase();
        if (!domain) return;
        try { if (domain.startsWith('http')) domain = new URL(domain).hostname; } catch(e) {}

        chrome.storage.local.get({ whitelist: [] }, (result) => {
            const list = result.whitelist;
            if (!list.includes(domain)) {
                list.push(domain);
                chrome.storage.local.set({ whitelist: list }, () => {
                    renderWhitelist();
                    newDomainInput.value = '';
                    chrome.runtime.sendMessage({ action: "whitelistUpdated" });
                });
            }
        });
    }

    function removeDomain(domain) {
        chrome.storage.local.get({ whitelist: [] }, (result) => {
            const list = result.whitelist.filter(d => d !== domain);
            chrome.storage.local.set({ whitelist: list }, () => {
                renderWhitelist();
                chrome.runtime.sendMessage({ action: "whitelistUpdated" });
            });
        });
    }

    addDomainBtn.addEventListener('click', () => addDomain(newDomainInput.value));
    newDomainInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addDomain(newDomainInput.value); });
    renderWhitelist();

    // ---- QUIZ LOGIC ----
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const isCorrect = opt.dataset.correct === "true";
            const parent = opt.closest('.quiz-question');
            const feedback = parent.querySelector('.quiz-feedback');
            const nextBtn = parent.querySelector('.next-btn');

            parent.querySelectorAll('.quiz-option').forEach(o => o.style.pointerEvents = 'none');

            if (isCorrect) {
                opt.classList.add('correct');
                feedback.textContent = "Correct! ✅";
                feedback.style.color = "#10b981";
            } else {
                opt.classList.add('wrong');
                feedback.textContent = "Incorrect. ❌";
                feedback.style.color = "#ef4444";
                parent.querySelector('[data-correct="true"]').classList.add('correct');
            }
            feedback.style.display = 'block';
            if (nextBtn) nextBtn.style.display = 'inline-block';
            else document.getElementById('quiz-done').style.display = 'block';
        });
    });

    // Next Question Buttons
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nextNum = e.target.dataset.next;
            document.querySelectorAll('.quiz-question').forEach(q => q.classList.remove('active'));
            document.getElementById('q' + nextNum).classList.add('active');
        });
    });
});
