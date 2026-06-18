
function fmt(n) {
    if (n == null) return '—';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000)  return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function isTweetUrl(url) {
    return /https?:\/\/(x|twitter)\.com\/.+\/status\/\d+/.test(url);
}

function apiHeaders(apiKey) {
    return { 'OHATWIKEEPER-API-KEY': apiKey, 'Content-Type': 'application/json' };
}

async function apiFetch(path, apiKey, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...apiHeaders(apiKey), ...(options.headers || {}) }
    });
    return { res, data: await res.json().catch(() => ({})) };
}

function openTab(url) {
    chrome.tabs.create({ url });
    window.close();
}

function renderMain(html) {
    document.getElementById('main-content').innerHTML = html;
}

function renderError(msg) {
    renderMain(`
        <div class="state-screen">
            <div class="state-icon">⚠️</div>
            <div class="state-title">エラー</div>
            <div class="state-desc">${esc(msg)}</div>
        </div>`);
}

// -------- STATS BAR --------
let headerUserListenerAdded = false;

function showStats(stats, me) {
    document.getElementById('stats-bar').style.display = 'flex';

    const streak = stats.current_consecutive_streak ?? 0;
    const sEl = document.getElementById('s-streak');
    sEl.textContent = streak + '日';
    sEl.className = 'stat-val' + (streak >= 30 ? ' gold' : streak >= 1 ? ' success' : '');

    document.getElementById('s-total').textContent = fmt(stats.total_records);
    document.getElementById('s-likes').textContent = fmt(stats.total_likes);

    // 今日の状況: APIから today_posted を取得
    const todayEl = document.getElementById('s-today');
    if (stats.today_posted != null) {
        todayEl.textContent = stats.today_posted ? '✅ 投稿済' : '❌ 未投稿';
        todayEl.className = 'stat-val' + (stats.today_posted ? ' success' : '');
        if (!stats.today_posted) todayEl.style.color = '#ef4444';
        else todayEl.style.color = '';
    }

    // ヘッダーユーザー
    const nameEl   = document.getElementById('header-name');
    const avatarEl = document.getElementById('header-avatar');

    const displayName = me.x_display_name || (me.x_username ? '@' + me.x_username : me.discord_username || '');
    nameEl.textContent = displayName;

    if (me.x_icon) {
        avatarEl.src = me.x_icon;
        avatarEl.style.display = 'block';
    }

    if (!headerUserListenerAdded && me.public_uuid) {
        document.getElementById('header-user').addEventListener('click', () => openTab(`${SITE}/${me.public_uuid}`));
        headerUserListenerAdded = true;
    }
}

// -------- TWEET PAGE --------
async function renderTweetPage(url, apiKey) {
    renderMain(`<div class="loading"><div class="spinner"></div>ツイートを確認中...</div>`);

    const { res, data } = await apiFetch(`/records?url=${encodeURIComponent(url)}`, apiKey);

    if (!res.ok) {
        renderError('API通信エラーが発生しました');
        return;
    }

    if (data.exists && data.record) {
        showRegistered(url, data.record, apiKey);
    } else {
        showUnregistered(url, apiKey);
    }
}

function showRegistered(url, record, apiKey) {
    const dt = record.date
        ? new Date(record.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';
    const histUrl = record.history_id ? `${SITE}/details/${record.history_id}` : '';

    renderMain(`
        <div class="main">
            <div class="tweet-card pop">
                <div class="tweet-header">
                    <span class="tweet-site-icon">𝕏</span>
                    <span class="tweet-url">${esc(url)}</span>
                    <span class="tweet-status-badge badge-registered">✓ 登録済み</span>
                </div>
                ${record.text ? `<div class="tweet-body">${esc(record.text)}</div>` : ''}
                <div class="tweet-meta">
                    ${dt ? `<span>🕐 ${esc(dt)}</span>` : ''}
                    ${record.likes != null ? `<span>💖 ${fmt(record.likes)}</span>` : ''}
                    ${record.views != null ? `<span>👁 ${fmt(record.views)}</span>` : ''}
                </div>
                ${histUrl ? `<div class="reg-detail"><a id="hist-link" href="#">📄 記録ページを開く</a></div>` : ''}
            </div>
            <div class="btn-group">
                <button class="btn btn-danger" id="unregister-btn">🗑️ この登録を解除する</button>
            </div>
        </div>`);

    if (histUrl) {
        document.getElementById('hist-link').addEventListener('click', (e) => {
            e.preventDefault();
            openTab(histUrl);
        });
    }

    document.getElementById('unregister-btn').addEventListener('click', async () => {
        const btn = document.getElementById('unregister-btn');
        btn.disabled = true;
        btn.textContent = '解除中...';

        const { res } = await apiFetch('/records', apiKey, {
            method: 'DELETE',
            body: JSON.stringify({ url })
        });

        if (res.ok) {
            showUnregistered(url, apiKey, true);
        } else {
            btn.disabled = false;
            btn.textContent = '解除に失敗しました';
        }
    });
}

function showUnregistered(url, apiKey, justUnregistered = false) {
    const msg = justUnregistered ? '登録を解除しました。' : 'このツイートは未登録です。';

    renderMain(`
        <div class="main">
            <div class="tweet-card pop">
                <div class="tweet-header">
                    <span class="tweet-site-icon">𝕏</span>
                    <span class="tweet-url">${esc(url)}</span>
                    <span class="tweet-status-badge badge-unregistered">未登録</span>
                </div>
            </div>
            <div class="info-row">ℹ️ ${esc(msg)}</div>
            <div class="btn-group">
                <button class="btn btn-primary" id="register-btn">☀️ おはツイを登録する</button>
            </div>
        </div>`);

    document.getElementById('register-btn').addEventListener('click', async () => {
        const btn = document.getElementById('register-btn');
        btn.disabled = true;
        btn.textContent = '登録中...';

        const { res, data } = await apiFetch('/records', apiKey, {
            method: 'POST',
            body: JSON.stringify({ url, source: 'extension' })
        });

        if (res.ok && data.success) {
            // 登録成功後に最新レコードを取得して表示
            const { data: checkData } = await apiFetch(`/records?url=${encodeURIComponent(url)}`, apiKey);
            if (checkData.exists && checkData.record) {
                showRegistered(url, checkData.record, apiKey);
            } else {
                showRegistered(url, { history_id: data.history_id }, apiKey);
            }
        } else {
            btn.disabled = false;
            btn.textContent = '❌ ' + (data.error || '登録に失敗しました');
        }
    });
}

// -------- NOT TWEET PAGE --------
function renderNotTweet() {
    renderMain(`
        <div class="not-tweet">
            <div class="state-screen" style="padding:14px 0">
                <div class="state-icon">𝕏</div>
                <div class="state-title">ツイートページを開いてください</div>
                <div class="state-desc">x.com または twitter.com の<br>投稿ページで使用できます。</div>
            </div>
        </div>`);
}

// -------- NO API KEY --------
function renderNoApiKey() {
    renderMain(`
        <div class="state-screen" style="padding:20px 14px">
            <div class="state-icon">🔑</div>
            <div class="state-title">APIキーが未設定です</div>
            <div class="state-desc">ダッシュボードでAPIキーを取得して<br>設定画面に登録してください。</div>
            <button class="btn btn-primary" id="open-settings-btn" style="margin-top:8px;max-width:200px">⚙️ 設定を開く</button>
        </div>`);
    document.getElementById('open-settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());
}

// -------- MAIN --------
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('nav-dashboard').addEventListener('click', () => openTab(`${SITE}/dashboard`));
    document.getElementById('nav-ranking').addEventListener('click',   () => openTab(`${SITE}/ranking`));
    document.getElementById('nav-today').addEventListener('click',     () => openTab(`${SITE}/ranking/today`));
    document.getElementById('nav-settings').addEventListener('click',  () => chrome.runtime.openOptionsPage());

    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (!apiKey) {
        renderNoApiKey();
        return;
    }

    // キャッシュから即時表示（5分以内）
    const cache = await chrome.storage.local.get(['cachedStats', 'cachedMe', 'cacheTime']);
    if (cache.cachedStats && cache.cachedMe && (Date.now() - (cache.cacheTime || 0)) < 300000) {
        showStats(cache.cachedStats, cache.cachedMe);
    }

    // バックグラウンドで最新データ取得
    Promise.all([
        apiFetch('/stats', apiKey),
        apiFetch('/me', apiKey)
    ]).then(([{ res: sr, data: stats }, { res: mr, data: me }]) => {
        if (sr.ok && mr.ok) {
            showStats(stats, me);
            chrome.storage.local.set({ cachedStats: stats, cachedMe: me, cacheTime: Date.now() });
        }
    }).catch(() => {});

    // 現在のタブを確認
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (!tab?.url || !isTweetUrl(tab.url)) {
            renderNotTweet();
            return;
        }
        const url = tab.url.replace(/[?#].*$/, '');
        await renderTweetPage(url, apiKey);
    });
});
