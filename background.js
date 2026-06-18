importScripts('constants.js');

async function updateBadge() {
    const { apiKey } = await chrome.storage.sync.get('apiKey');
    if (!apiKey) {
        chrome.action.setBadgeText({ text: '' });
        return;
    }

    try {
        const [statsRes, meRes] = await Promise.all([
            fetch(`${API_BASE}/stats`, { headers: { 'OHATWIKEEPER-API-KEY': apiKey } }),
            fetch(`${API_BASE}/me`,    { headers: { 'OHATWIKEEPER-API-KEY': apiKey } })
        ]);
        if (!statsRes.ok || !meRes.ok) return;

        const stats = await statsRes.json();
        const me    = await meRes.json();

        const streak = stats.current_consecutive_streak ?? 0;
        const text  = streak >= 1 ? String(streak) : '';
        const color = streak >= 30 ? '#f59e0b' : streak >= 7 ? '#38bdf8' : '#22c55e';

        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color });

        chrome.storage.local.set({ cachedStats: stats, cachedMe: me, cacheTime: Date.now() });
    } catch {}
}

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') chrome.runtime.openOptionsPage();
    updateBadge();
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.apiKey) updateBadge();
});
