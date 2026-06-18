<div align="center">

<img src="images/banner.png" width="480" alt="おはツイKeeper Extension banner">

# ☀️ おはツイKeeper — Chrome Extension

**X (旧Twitter) の「おはツイ」をワンクリックで記録する拡張機能**

[![Version](https://img.shields.io/badge/version-2.0-38bdf8?style=flat-square)](#)
[![Manifest](https://img.shields.io/badge/manifest-v3-22c55e?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-Proprietary-94a3b8?style=flat-square)](#)
[![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Brave-f59e0b?style=flat-square)](#)

[公式サイト](https://ohatwikeeper.com) ・
[ダッシュボード](https://ohatwikeeper.com/dashboard) ・
[API ドキュメント](https://ohatwikeeper.com/api-docs) ・
[使い方](https://ohatwikeeper.com/howtouse) ・
[Discord](https://discord.ohatwikeeper.com)

</div>

---

## 📌 これは何？

X のタイムライン上から離れずに、**「おはツイ」をワンクリックで [おはツイKeeper](https://ohatwikeeper.com) に登録**できる Chrome 拡張機能です。

登録済みかどうかの判定、連続投稿日数（ストリーク）、総いいね数などの統計を、ツイートを開いたまま **ポップアップ1枚で確認**できます。ダッシュボードを別タブで開く必要はありません。

<table>
<tr>
<td width="50%" valign="top">

### ✅ できること

- 📝 表示中のツイートをワンクリック登録
- 🔍 登録済み / 未登録を自動判定して表示
- ❌ 登録解除もポップアップから即時実行
- 🔥 連続投稿日数・総投稿数・総いいねをリアルタイム表示
- 👤 X プロフィール（アイコン・ユーザー名）と連携表示
- ⚡ API v2 ベースの軽量実装（依存ライブラリ無し）

</td>
<td width="50%" valign="top">

### 🚫 やらないこと

- ❌ パスワードや X の認証情報を扱わない
- ❌ バックグラウンドでの常時トラッキング
- ❌ サードパーティへのデータ送信
- ❌ `ohatwikeeper.com` 以外へのネットワーク通信
- ❌ 不要な権限の要求（`storage` + `activeTab` のみ）

</td>
</tr>
</table>

---

## 🖼️ UI プレビュー

拡張機能は**ダークテーマ統一**。配色はサイト本体の世界観（ブルーアクセント `#38bdf8` ＋ ゴールド `#f59e0b`）を継承しています。

#### 🪟 ポップアップ（メイン操作画面・360px固定幅）

- **ヘッダー**: ☀️ ロゴ + 連携中の X アバター/ユーザー名
- **統計バー**: 🔥 連続日数 / 📅 総投稿数 / 💖 総いいね / ⭐ 今日の状況（4カラム）
- **ツイートカード**: URL・本文プレビュー・日時・投稿者 + `登録済み` / `未登録` バッジ
- **アクションボタン**: 登録 or ❌ 登録解除
- **ナビバー**: 📊ダッシュボード / 🏆ランキング / ⭐今日 / ⚙️設定 への直行リンク

#### ⚙️ 設定ページ（サイドバー型レイアウト・フルページ）

- **サイドバー**: 🔑APIキー設定 / 👤統計 / 🔗クイックリンク / ℹ️About の4タブ
- **APIキー設定**: パスワード形式入力欄 + 👁 表示切替 + 💾保存 / ✅検証ボタン
- **取得方法ガイド**: ダッシュボード→APIセクション→貼り付け、の3ステップ案内

### 🎨 デザイントークン

拡張機能全体で統一されたカラーパレット（CSS変数として `popup.html` / `options.html` に直接定義）。

| トークン | 値 | 用途 |
|---|---|---|
| 🟦 `--accent` | `#38bdf8` | プライマリボタン・リンク・登録済みでない状態 |
| 🟩 `--success` | `#22c55e` | 登録済みバッジ・成功メッセージ |
| 🟧 `--gold` | `#f59e0b` | いいね数・ハイライト統計 |
| 🟥 `--danger` | `#ef4444` | 登録解除・エラーメッセージ |
| ⬛ `--bg` / `--bg-med` / `--bg-light` | `#101418` / `#1a2026` / `#2c343c` | 背景3階層（カード分離用） |
| ⬜ `--text` / `--muted` | `#e2e8f0` / `#94a3b8` | 本文 / 補足テキスト |

---

## 📂 ファイル構成

```
2.0/
├── manifest.json      # Manifest V3 定義（権限・エントリポイント）
├── constants.js        # API_BASE / SITE 定数（全スクリプト共通）
├── background.js       # Service Worker（バッジ更新・定期同期）
├── popup.html / .js    # メインUI（ツイート登録・統計表示）
├── options.html / .js  # 設定ページ（APIキー管理・クイックリンク）
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

<details>
<summary>📄 各ファイルの役割（クリックで展開）</summary>

| ファイル | 役割 |
|---|---|
| `manifest.json` | MV3 設定。`permissions: ["storage", "activeTab"]`、`host_permissions: ["https://ohatwikeeper.com/*"]` のみ。最小権限構成 |
| `constants.js` | `API_BASE = 'https://ohatwikeeper.com/api/v2/user'` を一元管理。エンドポイント変更時はここだけ修正 |
| `background.js` | `chrome.storage.sync` の `apiKey` を監視し、`/stats` `/me` を取得してアイコンバッジ（連続日数など）を更新 |
| `popup.js` | 現在タブのツイートURLを判定 → `/records?url=...` で登録状況を取得 → 登録/解除 UI を切り替え |
| `options.js` | APIキーの保存・検証（`/me` への疎通確認）・プロフィールカード表示・クイックリンク一覧 |

</details>

---

## 📦 File information

配布用 zip（`ohatwikeeper_v2.0.zip`）のハッシュ値。ダウンロード後の改竄・破損チェックに利用してください。

```
ohatwikeeper_v2.0.zip

Size   : 14713 bytes
SHA256 : 6a296acccd1b86eca07ae6794b55ecda62e4867135b8d1b51cf02b533b28f8cd
```

<details>
<summary>🔍 自分でハッシュを検証する方法</summary>

**Linux / macOS:**
```bash
sha256sum ohatwikeeper_v2.0.zip
```

**Windows (PowerShell):**
```powershell
Get-FileHash .\ohatwikeeper_v2.0.zip -Algorithm SHA256
```

出力された値が上記 `SHA256` と一致すればファイルは無改竄です。

</details>

---

## 🔐 セキュリティモデル

> 「クライアントは信用しない」設計。拡張機能はあくまで **APIキーの運び役**で、認可ロジックは全てサーバー側（`api/v2/index.php`）に存在します。

```
┌─────────────┐  HTTP Header: OHATWIKEEPER-API-KEY   ┌──────────────────┐
│  Extension   │ ───────────────────────────────────▶ │  ohatwikeeper.com │
│ (このリポジトリ) │ ◀─────────────────────────────────── │  API v2 (PHP)     │
└─────────────┘        JSON Response                  └──────────────────┘
      │                                                        │
      │ chrome.storage.sync                                    │ ・APIキー → users テーブル照合
      │  └─ apiKey のみ保存                                      │ ・100 req/min レートリミット
      │                                                         │ ・CORS Allow-Origin 制御
```

| 観点 | 内容 |
|---|---|
| 🔑 認証情報 | `chrome.storage.sync` に **APIキーのみ**保存（X のパスワード等は一切扱わない） |
| 🌐 通信先 | `https://ohatwikeeper.com` 固定。`host_permissions` でも他ドメインへのアクセス不可 |
| 🛡️ 権限 | `storage`, `activeTab` の2つのみ。タブ全体の監視権限（`tabs`）は要求しない |
| ⏱️ レート制限 | サーバー側で APIキーごとに **100 req/分**まで（ソース改変では回避不可） |
| 🔒 ハードコードされた秘密情報 | なし（`apiKey` は実行時にユーザー入力 → storage 経由で都度参照） |

---

## 🚀 インストール（開発者向け / 未パッケージ版）

1. このフォルダ（`2.0/`）をダウンロードまたは clone
2. Chrome で `chrome://extensions` を開く
3. 右上の **デベロッパーモード** を ON
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、この `2.0/` フォルダを選択
5. ツールバーの ☀️ アイコン → 設定ページで [ダッシュボード](https://ohatwikeeper.com/dashboard) 発行の **APIキー** を貼り付けて保存

```text
chrome://extensions → デベロッパーモード ON → 「パッケージ化されていない拡張機能を読み込む」
```

---

## 🛠️ 開発メモ

- **依存ライブラリなし** — Vanilla JS / インラインCSSのみ。バンドラー不要、ファイルを直接編集してリロードするだけ
- API エンドポイント一覧は [API ドキュメント](https://ohatwikeeper.com/api-docs) を参照
- バージョンアップ時は `manifest.json` の `"version"` と、このフォルダ名（`1.0` → `2.0` のような構成）を揃える運用

---

<div align="center">

made for **おはツイKeeper** ☀️ ・ [公式X](https://twitter.ohatwikeeper.com) ・ [稼働状況](https://status.ohatwikeeper.com)

</div>
