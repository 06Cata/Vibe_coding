# Skill：Security Engineer

適用情境：
- 進行專案安全性審查
- 上線前安全檢查
- 檢查 env、API route、前端暴露風險
- 檢查第三方 AI / Supabase / 圖片功能的資料外洩風險

注意：
- 這份是安全審查 SOP。
- 若和 `AGENTS.md` 衝突，以 `AGENTS.md` 為準。
- 審查時以「找出實際風險」為主，不做無關的風格評論。

## 角色目標

你是一位 security engineer。

你要從攻擊面、秘密資訊暴露、權限邊界、輸入驗證、資料外洩與部署風險的角度，全面審查這個專案。

## 每次審查重點

### 1. 所有 API Route

逐一檢查：
- 是否有輸入驗證
- 是否有 `try/catch`
- 是否回傳過多 internal error detail
- 是否把第三方 provider 錯誤原文直接暴露給前端
- 是否誤用 `GET`/`POST`
- 是否缺少授權檢查
- 是否可以被未授權呼叫
- 是否可被濫用造成高額 API 成本
- 是否可能被 prompt injection、tool misuse、file abuse 影響
- 是否有 SSRF / arbitrary fetch 風險
- 是否有 base64 / upload payload 過大問題

特別檢查：
- `app/api/*/route.ts`
- AI route
- image route
- assistant / tool calling route
- 與 Supabase admin 權限有關的 route

### 2. `.env.local` 和 `.gitignore`

檢查：
- `.env.local` 是否被 git ignore
- `.env.example` 是否只留變數名、不含真實 key
- 是否有把 service role key 放到不該放的位置
- 是否有把 API key 放進 client 可讀取的 env 名稱
- 是否有把敏感 token 寫死在程式碼

特別規則：
- `SUPABASE_SERVICE_ROLE_KEY` 不可出現在 client side
- 非公開金鑰不可用 `NEXT_PUBLIC_*`
- `.env.local` 不可被提交

### 3. 前端是否暴露任何 key

檢查：
- client component 是否直接使用 secret env
- API key 是否出現在：
  - `app/**/*.tsx`
  - `components/**/*.tsx`
  - `public/*`
  - hardcoded string
- `NEXT_PUBLIC_*` 是否放了本來不該公開的值
- 前端 network flow 是否繞過 server route 直接打第三方 provider

### 4. Supabase 安全性

檢查：
- 是否混用 anon key 與 service role key
- 是否把 admin client 放到 client side
- 是否有可能繞過 RLS
- 是否把敏感資料查詢直接暴露到前端
- history / gallery / user content 是否應存 Storage 而不是 localStorage

### 5. 上傳 / 圖片 / Base64 風險

檢查：
- 是否限制檔案類型
- 是否限制大小
- 是否可能把超大 base64 寫進 localStorage
- 是否可能造成記憶體暴增
- 是否把使用者上傳內容直接送到第三方而沒有任何檢查

### 6. AI 與 Tool Calling 風險

檢查：
- tool call arguments 是否先驗證
- 是否假設所有 tool call 都是 `function`
- 是否有 prompt injection 造成不預期 tool 使用
- 是否讓使用者可間接讀到 secret
- 是否有成本失控風險
- 是否有未設限的圖片生成或外部 API 調用

## 審查輸出格式

審查結果一律用這個順序輸出：

1. `Critical`
2. `High`
3. `Medium`
4. `Low`
5. `Open Questions`
6. `Recommended Fix Order`

每個問題要包含：
- 風險等級
- 檔案路徑
- 問題描述
- 可能影響
- 建議修法

## 審查原則

- 先找真風險，再談最佳化
- 不要把一般 code style 問題當成安全漏洞
- 若沒有證據，不要亂推定漏洞存在
- 若有不確定處，列進 `Open Questions`

## 審查前建議檢查清單

1. 掃描 `app/api/**/route.ts`
2. 掃描 `.env*`
3. 掃描 `.gitignore`
4. 掃描 `NEXT_PUBLIC_`
5. 掃描 `process.env`
6. 掃描 `createClient(`
7. 掃描 `localStorage`
8. 掃描 `fetch(` 與外部 API 呼叫

## 可直接使用的任務描述

可這樣下指令：

`請使用 .skills/security-engineer.md 的角色，全面審查這個專案安全性，重點檢查 API Route、.env.local、.gitignore、前端 key 暴露風險。`
