# 專案規則 AGENTS.md

## 目的
- 這份文件是本專案的上位規則。
- 所有 feature、page、API、資料庫與 UI 調整都先遵守這份文件。
- `.skills/*` 是任務型 SOP，不可違反這份規則。

## 優先順序
1. 使用者需求
2. `AGENTS.md`
3. `.skills/*`

## 技術棧
- 框架：Next.js App Router
- 語言：TypeScript（嚴格模式）
- 樣式：Tailwind CSS
- 資料庫：Supabase（PostgreSQL）
- 部署：Vercel

## 命名規則
- 元件：PascalCase（`WeatherCard`）
- 函數：camelCase（`fetchWeather`）
- 常數：UPPER_SNAKE_CASE（`DEFAULT_LOCATION`）
- 檔案：kebab-case

## 程式碼風格
- 禁止使用 `any`
- 所有 props、state、API response 都要有明確型別
- 錯誤處理要有 `try/catch`
- 不使用 class component，只用 function component
- `useState`、`useMemo`、`useCallback` 依實際需求使用
- 不要留下未使用的 import
- 禁止把 `console.log` 當正式輸出；除錯外優先 `console.error`

## 資料夾結構
- 頁面：`app/[feature]/page.tsx`
- API：`app/api/[feature]/route.ts`
- 元件：`components/[feature-name].tsx`
- 型別：`types/[feature-name].ts`
- 共用邏輯：`lib/*`

## Client / Server 規則
- 有互動的頁面或元件才加 `"use client"`
- 沒有互動的頁面優先維持 Server Component
- 不可在 client component 直接使用 secret env
- server-only 邏輯放 server route、server component 或 `lib` 的 server helper

## 環境變數規則
- `.env.local` 只放本機開發秘密資訊
- `.env.example` 只放變數名稱，不放真實值
- 所有金鑰一律透過 `process.env` 讀取
- Supabase 公開資訊只允許：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` 只能在 server side 使用
- OpenAI / Gemini / 其他第三方 API key 只能在 server route 使用

## API Route 規則
- API 路徑固定：`app/api/[feature]/route.ts`
- 一律回傳 JSON
- 成功格式優先：
  - `{ result: ... }`
  - `{ imageUrl: ... }`
  - `{ success: true }`
- 失敗格式一律：
  - `{ error: "..." }`
- 每個 API route 都要有：
  - 輸入驗證
  - `try/catch`
  - 正確的 status code
- 不要把第三方 API 原始錯誤整包直接回給終端使用者

## AI 功能規則
- AI 功能優先放在 `app/api/[feature]/route.ts`
- system prompt 要明確且可維護
- 模型名稱不要散落多處，盡量集中管理
- 回傳可結構化時，優先結構化
- 若有 tool calling：
  - 先做型別收斂
  - 明確處理非 `function` 類型 tool call
- 若有圖片生成或圖片分析：
  - 優先回傳 `imageUrl` 或可用結果
  - 不要把大型 base64 長期存到 `localStorage`

## Supabase 規則
- schema 變更前先確認資料表命名與用途
- 資料表命名一律 `snake_case`
- server 端查詢優先集中到 `lib/supabase/*`
- admin 權限操作必須在 server side 執行
- history / gallery / log 類型資料表優先考慮：
  - `id`
  - `created_at`
  - 主內容欄位
  - 必要 metadata
  - 必要時補 index
- 小型暫存資料可用 `localStorage`
- 大型資料、跨裝置資料、長期資料應改用 Supabase Database 或 Storage

## UI / 設計規則
- 背景基準：`bg-gray-950`
- 主色基準：`orange-500`
- 圓角基準：`rounded-2xl` 或 `rounded-3xl`
- 毛玻璃基準：`backdrop-blur` + `bg-white/10`
- 表單頁面至少處理：
  - loading
  - error
  - empty state
- 可重複操作的按鈕要有 disabled 狀態
- 生成式 AI 頁面要有明確中間狀態
- 對話介面預設：
  - 使用者訊息靠右
  - AI 訊息靠左

## 導覽與資訊架構
- 新頁面若屬於主功能，應評估是否加入：
  - `app/layout.tsx` Header
  - `app/page.tsx` 首頁卡牌入口
- 不要新增孤立頁面而沒有入口，除非明確是內部頁

## 提交前檢查
- 修改完成後優先執行：
  - `npm run lint`
- 若改動涉及型別、API、部署或 server/client 邊界，補做：
  - `npm run build`
- 部署到 Vercel 前確認：
  - 必要 env 已存在
  - 本機 lint 通過
  - API route 沒有依賴瀏覽器環境

## 專案技能
- 專案層級 SOP 放在 `.skills/`
- 新增頁面前先看：
  - `.skills/new-page.md`
- 新增 API 前先看：
  - `.skills/new-api.md`
- 新增完整功能前先看：
  - `.skills/new-feature.md`
- 需要資料庫互動時先看：
  - `.skills/supabase.md`
- 調整 UI 風格時先看：
  - `.skills/design-system.md`
- 要做安全審查時先看：
  - `.skills/security-engineer.md`
