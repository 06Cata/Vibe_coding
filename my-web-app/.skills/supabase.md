# Supabase SOP

適用情境：
- 新增資料表
- 頁面讀寫 Supabase
- 儲存歷史紀錄、gallery、generated content

規則：
1. 公開查詢只使用：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. admin 權限只在 server side 使用：
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 不要把 service role 暴露到 client component。

資料表建議：
- 命名一律 `snake_case`
- history / gallery 類型表優先有：
  - `id`
  - `created_at`
  - 主內容欄位
  - 必要 metadata

讀寫原則：
1. 共用 client 優先放在 `lib/supabase/client.ts`
2. 若是 server-only 行為，可再抽 server helper
3. 大圖不要長期存在 `localStorage`
4. 圖片優先考慮：
   - Supabase Storage
   - 資料表只存 URL / path / metadata

當需求是：
- 小型暫存：可先 `localStorage`
- 長期保存：改 Supabase Database / Storage
- 多裝置同步：一定上 Supabase

修改前先確認：
- RLS 是否影響查詢
- 前端是 client read 還是 route proxy
- Vercel env 是否同步
