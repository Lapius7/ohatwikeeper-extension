function fmt(n) {
    if (n == null || n === 0) return '0';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000)  return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

function showMsg(el, text, type = 'info') {
    el.innerHTML = `<div class="msg msg-${type}">${text}</div>`;
}

async function fetchProfile(apiKey) {
    const [meRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/me`,    { headers: { 'OHATWIKEEPER-API-KEY': apiKey } }),
        fetch(`${API_BASE}/stats`, { headers: { 'OHATWIKEEPER-API-KEY': apiKey } })
    ]);
    if (!meRes.ok) return null;
    return {
        me:    await meRes.json(),
        stats: statsRes.ok ? await statsRes.json() : null
    };
}

function renderProfile(me, stats) {
    const container = document.getElementById('profile-content');
    const name = me.x_username ? `@${me.x_username}` : (me.discord_username || 'ユーザー');
    const uuid = me.public_uuid || '';

    const streakVal = stats?.current_consecutive_streak ?? 0;
    const streakClass = streakVal >= 30 ? 'gold' : streakVal >= 7 ? '' : 'green';

    container.innerHTML = `
        <div class="card">
            <div class="card-title"><span class="icon">👤</span>アカウント</div>
            <div class="profile-card">
                <div>
                    <div class="profile-name">${name}</div>
                    ${uuid ? `<a href="https://ohatwikeeper.com/${uuid}" target="_blank" class="profile-handle">ohatwikeeper.com/${uuid}</a>` : ''}
                    <div class="profile-badge">✅ 認証済み</div>
                </div>
            </div>
            ${uuid ? `<button class="btn btn-secondary btn-sm" id="open-profile-btn">📄 マイページを開く</button>` : ''}
        </div>

        ${stats ? `
        <div class="card">
            <div class="card-title"><span class="icon">📊</span>統計サマリー</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="val ${streakClass}">${streakVal}日</div>
                    <div class="lbl">🔥 連続投稿</div>
                </div>
                <div class="stat-card">
                    <div class="val">${stats.total_records ?? 0}</div>
                    <div class="lbl">📅 総投稿数</div>
                </div>
                <div class="stat-card">
                    <div class="val">${stats.max_streak ?? 0}日</div>
                    <div class="lbl">🏆 最長連続</div>
                </div>
                <div class="stat-card">
                    <div class="val">${fmt(stats.total_likes)}</div>
                    <div class="lbl">💖 総いいね</div>
                </div>
                <div class="stat-card">
                    <div class="val">${fmt(stats.total_views)}</div>
                    <div class="lbl">👁 総インプ</div>
                </div>
                <div class="stat-card">
                    <div class="val">${stats.coverage_rate ?? 0}%</div>
                    <div class="lbl">📈 投稿率</div>
                </div>
            </div>
            ${stats.first_post_date ? `<p style="font-size:11px;color:var(--muted);margin-top:10px">🚩 初おはツイ: ${stats.first_post_date}</p>` : ''}
        </div>` : ''}
    `;

    if (uuid) {
        document.getElementById('open-profile-btn')?.addEventListener('click', () => {
            chrome.tabs.create({ url: `https://ohatwikeeper.com/${uuid}` });
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const apiInput  = document.getElementById('api-key-input');
    const toggleBtn = document.getElementById('toggle-key');
    const saveBtn   = document.getElementById('save-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const apiMsg    = document.getElementById('api-msg');

    // ---- Nav ----
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.page).classList.add('active');

            if (item.dataset.page === 'page-profile') loadProfile();
        });
    });

    // ---- Links ----
    document.querySelectorAll('.link-item[data-url]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: el.dataset.url });
        });
    });

    document.getElementById('open-dashboard-btn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://ohatwikeeper.com/dashboard' });
    });

    // ---- Toggle password ----
    toggleBtn.addEventListener('click', () => {
        apiInput.type = apiInput.type === 'password' ? 'text' : 'password';
        toggleBtn.textContent = apiInput.type === 'password' ? '👁' : '🙈';
    });

    // ---- Load saved key ----
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get('key');

    if (keyFromUrl) {
        apiInput.value = keyFromUrl;
        await chrome.storage.sync.set({ apiKey: keyFromUrl });
        showMsg(apiMsg, 'APIキーをURLから自動設定しました。', 'success');
        history.replaceState(null, '', window.location.pathname);
        loadProfile();
    } else {
        const { apiKey } = await chrome.storage.sync.get('apiKey');
        if (apiKey) apiInput.value = apiKey;
    }

    // ---- Save ----
    saveBtn.addEventListener('click', async () => {
        const key = apiInput.value.trim();
        if (!key) { showMsg(apiMsg, 'APIキーを入力してください。', 'error'); return; }
        await chrome.storage.sync.set({ apiKey: key });
        showMsg(apiMsg, '✅ 保存しました。', 'success');
    });

    // ---- Verify ----
    verifyBtn.addEventListener('click', async () => {
        const key = apiInput.value.trim();
        if (!key) { showMsg(apiMsg, 'APIキーを入力してください。', 'error'); return; }

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner"></span> 検証中...';
        showMsg(apiMsg, '接続確認中...', 'info');

        const profile = await fetchProfile(key).catch(() => null);

        verifyBtn.disabled = false;
        verifyBtn.textContent = '✅ 検証する';

        if (profile) {
            const name = profile.me.x_username ? `@${profile.me.x_username}` : (profile.me.discord_username || 'ユーザー');
            showMsg(apiMsg, `✅ 認証成功: ${name}`, 'success');
            await chrome.storage.sync.set({ apiKey: key });
        } else {
            showMsg(apiMsg, '❌ 認証に失敗しました。APIキーを確認してください。', 'error');
        }
    });

    // ---- Load profile ----
    async function loadProfile() {
        const { apiKey } = await chrome.storage.sync.get('apiKey');
        if (!apiKey) return;

        const container = document.getElementById('profile-content');
        container.innerHTML = '<div class="card" style="text-align:center;padding:24px"><span class="spinner" style="border-color:var(--border);border-top-color:var(--accent);width:24px;height:24px"></span></div>';

        const profile = await fetchProfile(apiKey).catch(() => null);
        if (profile) {
            renderProfile(profile.me, profile.stats);
        } else {
            container.innerHTML = '<div class="card"><div class="msg msg-error">プロフィールの取得に失敗しました。APIキーを確認してください。</div></div>';
        }
    }
});
