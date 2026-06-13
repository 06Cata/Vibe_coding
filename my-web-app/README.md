# My Web App

這是一個用 `Next.js App Router + TypeScript + Tailwind CSS + Supabase` 建的多功能 AI / 工具型專案。

目前主要功能包含：
- `stock`：台股資料與技術指標畫面
- `weather`：天氣頁
- `food`：附近吃什麼
- `qrcode`：QR Code 工具
- `compare`：OpenAI / Gemini 回覆比較
- `copywriter`：AI 文案產生器
- `image-gen`：AI 圖片生成
- `image-edit`：AI 圖片編輯建議
- `assistant`：可用 tools 的 AI 助理
- `n8n-advisor`：n8n 自動化顧問

## Tech Stack

- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- Database: Supabase
- Deployment: Vercel

## Local Development

先安裝依賴：

```bash
npm install
```

建立本機環境變數：

```bash
cp .env.example .env.local
```

再把實際金鑰填進 `.env.local`。

啟動開發環境：

```bash
npm run dev
```

預設會跑在：

- `http://localhost:3000`

若 3000 被占用，Next.js 會自動改用其他 port。

## 常用指令

```bash
npm run dev
npm run build
npm run lint
npm run sync:stock
```

## 專案結構

```text
app/                頁面與 API routes
lib/                共用邏輯與工具
scripts/            手動或排程腳本
.skills/            給 Codex / Claude 的專案 SOP
AGENTS.md           專案層級 AI 開發規則
.mcp.json           MCP servers 設定
```

## 如何啟用 MCP

本專案已經提供：

- [`.mcp.json`](./.mcp.json)
- [`AGENTS.md`](./AGENTS.md)
- [`.skills/`](./.skills)

用途如下：

- `.mcp.json`：讓支援 MCP 的 agent 可直接掛上外部能力
- `AGENTS.md`：定義這包專案的開發規範
- `.skills/*.md`：定義固定 SOP，例如新增頁面、API、Supabase 操作

### 這包專案目前配置的 MCP servers

1. `fetch`
   - 抓取網頁內容
2. `filesystem`
   - 讀取這包專案內的本地檔案
3. `git`
   - 查詢這包專案的 git repository 狀態與歷史

### 這台機器目前使用的實際指令

`.mcp.json` 已綁定到你機器上目前存在的執行檔：

- `fetch`: `/Users/catalinakuo/.langflow/uv/uvx mcp-server-fetch`
- `filesystem`: `/opt/homebrew/bin/npx -y @modelcontextprotocol/server-filesystem /Users/catalinakuo/Downloads/for_git/Vibe_coding/my-web-app`
- `git`: `/Users/catalinakuo/.langflow/uv/uvx mcp-server-git --repository /Users/catalinakuo/Downloads/for_git/Vibe_coding/my-web-app`

### 在 Codex / Claude 裡怎麼用

1. 用支援 MCP 的 client 開這個專案資料夾
2. 讓 client 讀取專案根目錄的 `.mcp.json`
3. 重啟 client 或 reload MCP servers
4. 確認 `fetch` / `filesystem` / `git` 都成功載入

如果 MCP client 沒有自動讀專案設定，就把 `.mcp.json` 內容手動貼到該 client 的 MCP 設定頁。

### 驗證 MCP 是否可用

可以用這些方式驗證：

- `filesystem`
  - 詢問 agent 讀取 `app/page.tsx`
- `git`
  - 詢問 agent 查最近一次 commit
- `fetch`
  - 詢問 agent 抓某個公開網頁標題

## AI 開發規則

請先看：

- [`AGENTS.md`](./AGENTS.md)

新增功能前，依需求再看：

- [`.skills/new-page.md`](./.skills/new-page.md)
- [`.skills/new-api.md`](./.skills/new-api.md)
- [`.skills/new-feature.md`](./.skills/new-feature.md)
- [`.skills/supabase.md`](./.skills/supabase.md)
- [`.skills/design-system.md`](./.skills/design-system.md)

## Deploy

部署平台是 Vercel。

部署前至少確認：

```bash
npm run lint
npm run build
```

並確認 Vercel 上已設定所有必要 env。
