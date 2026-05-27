# 童軍政策助理 - 安裝指南

## 前置準備

### 已完成
- ✅ Supabase 專案建立
- ✅ 資料庫 Schema 設定
- ✅ Storage bucket 建立
- ✅ Next.js 專案建立

### 需要設定

#### 1. Groq API（免費、無限制）
1. 前往 https://console.groq.com/
2. 免費註冊/登入
3. 建立 API Key
4. 複製到 `.env.local` 的 `GROQ_API_KEY`

#### 2. Cohere API（免費 1000次/月）
1. 前往 https://dashboard.cohere.com/
2. 免費註冊/登入
3. 建立 API Key
4. 複製到 `.env.local` 的 `COHERE_API_KEY`

---

## 環境變數設定

在專案根目錄建立 `.env.local` 檔案：

```bash
# Supabase（已設定）
NEXT_PUBLIC_SUPABASE_URL=https://uegilkoftrqugcmgfnkn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Z2lsa29mdHJxdWdjbWlnZm4iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY1MjgwMTYyOCwiZXhwIjoxOTY4Mzc3NjI4fQ.placeholder
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder

# Groq（負責回答）
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Cohere（負責向量化）
COHERE_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

---

## 向量搜尋函數

在 Supabase SQL Editor 執行以下 SQL：

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  project_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  doc_title text,
  source_folder text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.chunk_text,
    dc.doc_title,
    dc.source_folder,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    (project_filter IS NULL OR dc.project = project_filter)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 本地測試

```bash
cd scout-policy-assistant
npm run dev
```

打開 http://localhost:3000

---

## 使用流程

### 1. 上傳政策文件
- 在「上傳文件」頁面上傳 PDF 到 Supabase Storage

### 2. 向量化內容
- 在「向量化」頁面貼上文件內容
- 選擇正確的分類（POR / 通告 / 表格 / 資助）
- 點擊「向量化」

### 3. 開始問答
- 在「問答」頁面輸入問題
- 系統會自動搜尋相關內容並回答

---

## 部署到 Vercel

1. 將程式碼推送到 GitHub
2. 在 Vercel 匯入專案
3. 設定環境變數
4. 部署

---

## 疑難解答

### Q: 申請 Groq/Cohere 的網站打不開？
A: 可能需要 VPN 連線

### Q: 向量化失敗？
A: 檢查 Cohere API Key 是否正確

### Q: 問答沒結果？
A: 確認已執行 match_documents SQL 函數