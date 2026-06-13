# Skill：建立新頁面

適用情境：
- 新增 `app/[功能名]/page.tsx`
- 新增單一功能頁面
- 調整現有功能頁面結構

注意：
- 這份是頁面建立 SOP。
- 若和 `AGENTS.md` 衝突，以 `AGENTS.md` 為準。

## 每次建立新頁面必須做的事

### 1. 檔案結構
- 路徑固定：`app/[功能名]/page.tsx`
- 有互動才加 `"use client"`
- Server Component 不需要 `"use client"`
- 若頁面邏輯太長，拆出：
  - local component
  - `components/`
  - `types/`

### 2. TypeScript
- 所有 props 都要定義型別
- 所有 state 都要定義型別
- API 回傳資料要定義 response 型別
- 禁止用 `any`

### 3. 三種狀態一定要處理
- `isLoading` → 顯示 Skeleton 或 loading block
- `error` → 顯示紅色錯誤區塊
- `success` → 顯示實際內容

若有可能出現空資料，也應補：
- `empty` → 顯示空狀態說明

### 4. 設計規範
- 頁面背景：`bg-gray-950`
- 主容器：`max-w-6xl mx-auto px-6 py-12 pt-20`
- 標題區：`text-center mb-10`
- 小標：`text-sm font-bold uppercase tracking-[0.24em] text-orange-300`
- 主標：`text-4xl font-black sm:text-6xl`

卡片與區塊建議：
- 卡片：深色底 + 淺色邊框
- 圓角：`rounded-2xl` 或 `rounded-3xl`
- 間距保持一致，不要讓區塊貼太緊

### 5. RWD
- 手機優先
- 卡片列表優先使用：
  - `grid sm:grid-cols-2 lg:grid-cols-3`
- 送出前至少用瀏覽器 F12 手機模式確認：
  - 不爆版
  - 不橫向卷軸
  - 按鈕可點
  - 文字不重疊

### 6. 加進導覽列
- 若是主功能頁，更新 `app/layout.tsx` 的 Header
- 若是首頁卡牌型入口，也同步更新 `app/page.tsx`

## 建議實作順序
1. 先建 `page.tsx`
2. 補頁面標題區
3. 補表單 / 操作區
4. 補結果區
5. 補 `isLoading` / `error` / `success`
6. 補 RWD
7. 視需求補導覽入口

## 頁面表單規則
- 所有欄位要有清楚 label 或 placeholder
- submit 按鈕要有 loading / disabled 狀態
- 若有 API 呼叫，不要在 client 直接放 secret
- 一律改呼叫 `app/api/[功能名]/route.ts`

## 完成前檢查
- 沒有 `any`
- 沒有未使用 import
- client / server 邊界正確
- loading / error / success 已處理
- Header / 首頁入口已評估是否需要更新
- 執行：

```bash
npm run lint
```

若頁面有較重的型別或 API 變更，再補：

```bash
npm run build
```
