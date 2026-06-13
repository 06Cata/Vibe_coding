# New API SOP

適用情境：
- 新增 `app/api/[feature]/route.ts`
- 擴充 AI route
- 串接第三方 API

流程：
1. 路徑固定放在 `app/api/[功能]/route.ts`。
2. 只在 server route 讀取 secret：
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 每個 route 都要有：
   - 輸入驗證
   - `try/catch`
   - 正確 status code
4. 成功回傳格式優先使用：
   - `{ result: ... }`
   - `{ imageUrl: ... }`
   - `{ success: true }`
5. 失敗回傳格式：
   - `{ error: "..." }`
6. 不要把第三方 provider 的整包 internal stack 直接回給前端。
7. 若是 streaming：
   - 明確設定 response headers
   - 前端要能處理 partial chunks
8. 若是 tool calling：
   - 先判斷 tool call type
   - 再解析 arguments

常見檢查：
- route 是否誤放在 `app/[feature]/route.ts` 而非 `app/api/[feature]/route.ts`
- client component 是否直接打到第三方 API
- env 名稱是否和 `.env.example` 一致
