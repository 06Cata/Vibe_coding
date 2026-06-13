# New Feature SOP

適用情境：
- 新增一個完整功能
- 同時包含頁面、API、資料儲存、UI 狀態
- 例如：文案產生器、圖片生成器、AI 助理

## 目標

讓新功能在這個專案裡落地時，結構一致、可維護、可部署。

## 開發順序

1. 先定義功能邊界
2. 決定資料流
3. 建頁面
4. 建 API
5. 接資料儲存
6. 補 loading / error / empty state
7. 本機驗證
8. lint / build

## 1. 定義功能邊界

先回答：
- 這功能的路徑是什麼？
- 是單頁功能，還是會拆出多個子區塊？
- 是否需要資料庫？
- 是否需要第三方 API？
- 是否需要歷史紀錄、gallery、對話紀錄？

命名建議：
- 頁面：`app/[feature]/page.tsx`
- API：`app/api/[feature]/route.ts`

## 2. 決定資料流

優先用這個判斷：

- 只有畫面暫存：`useState`
- 單機歷史紀錄：`localStorage`
- 多裝置同步 / 長期保存：Supabase
- 需要 secret：一定走 server route

不要：
- 在 client 直接打第三方 secret API
- 把大圖片 base64 長期塞進 `localStorage`

## 3. 建頁面

先看：
- `.skills/new-page.md`
- `.skills/design-system.md`

頁面至少要有：
- 標題區
- 表單 / 操作區
- 結果區
- loading 狀態
- error 狀態
- empty 狀態

## 4. 建 API

先看：
- `.skills/new-api.md`

API 必備：
- 輸入驗證
- `try/catch`
- 統一 JSON 回傳
- 不暴露 secret

## 5. 接資料儲存

若要用 Supabase，先看：
- `.skills/supabase.md`

常見做法：
- history 表
- gallery 表
- logs 表

欄位至少考慮：
- `id`
- `created_at`
- `type`
- `content`
- `metadata`

## 6. UI 收尾

確認：
- 按鈕有 disabled 狀態
- AI 生成中有中間提示
- 錯誤訊息是人看得懂的
- 手機版不會爆版

## 7. 驗證

本機至少做：

```bash
npm run lint
npm run build
```

若功能有 API，可再補：
- `curl` 測試
- 頁面手動操作測試

## 8. 完成定義

一個 feature 算完成，至少要滿足：
- 路由可進
- 主要流程可跑
- 錯誤可處理
- 沒有型別錯誤
- lint 通過
