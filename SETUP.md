# 童軍政策助理 - 安裝指南

## 前置準備

### 1. 申請 API Key（需要 VPN）

| 服務 | 申請連結 | 額度 |
|------|----------|------|
| **Groq** | https://console.groq.com/ | 免費、無限制 |
| **Cohere** | https://dashboard.cohere.com/ | 免費 1000次/月 |

### 2. 在 Vercel 設定環境變數

```
NEXT_PUBLIC_SUPABASE_URL=https://uegilkoftrqugcmgfnkn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
```

### 3. 執行 SQL（在 Supabase SQL Editor）

```sql
-- 開啟 pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 建立主資料表
CREATE TABLE document_chunks (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project       TEXT NOT NULL,
  source_folder TEXT NOT NULL,
  source_file   TEXT NOT NULL,
  doc_title     TEXT NOT NULL,
  doc_date      DATE,
  chunk_text    TEXT NOT NULL,
  embedding     vector(768),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 建立索引
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON document_chunks (project);
CREATE INDEX ON document_chunks (source_folder);

-- 建立 Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('policy-docs', 'policy-docs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabus-docs', 'syllabus-docs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('uniform-docs', 'uniform-docs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('form-docs', 'form-docs', true);

-- 設定 Storage 權限
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('policy-docs', 'syllabus-docs', 'uniform-docs', 'form-docs'));

-- 向量搜尋函數
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  project_filter text DEFAULT NULL,
  folder_filter text DEFAULT NULL
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
    AND (folder_filter IS NULL OR dc.source_folder = folder_filter)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 📁 資料夾架構（共用資料庫）

所有專案共用同一個 Supabase 專案，透過 `source_folder` 區分不同來源。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Supabase 資料庫 (scout-assistants)                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    document_chunks（統一資料表）                      │   │
│   │                                                                      │   │
│   │   project='policy'     │  policy-assistant 用                        │   │
│   │   project='syllabus'   │  syllabus-assistant 用                      │   │
│   │   project='uniform'    │  uniform-assistant 用（制服）               │   │
│   │   project='form'       │  form-assistant 用（表格）                  │   │
│   │                                                                      │   │
│   │   搜尋時用 project + source_folder 過濾                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Supabase Storage（檔案備份）                       │   │
│   │                                                                      │   │
│   │   policy-docs/    ← Policy 專案的 PDF                                │   │
│   │   syllabus-docs/  ← Syllabus 專案的 PDF                              │   │
│   │   uniform-docs/   ← Uniform 專案的 PDF                               │   │
│   │   form-docs/      ← Form 專案的 PDF                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 📂 Policy（政策及指引）

**目標用戶**：領袖、成員  
**系統**：[scout-policy-assistant.vercel.app](https://scout-policy-assistant.vercel.app/)  
**Project 標記**：`policy`

```
policy-docs/                    ← Storage
│
├── POR/                        ← source_folder: 'POR'
│   ├── POR_C_20251114_.pdf
│   └── constitution.pdf
│
├── circulars/policy/           ← source_folder: 'circulars/policy'
│   ├── PC012026C_性罪行定罪紀錄查核.pdf
│   ├── PC062025C_保護童軍成員政策.pdf
│   └── ...
│
├── circulars/admin/            ← source_folder: 'circulars/admin'
│   ├── ACR012026C_總會通告年度檢視.pdf
│   ├── AC032026C_童軍旅財政管理指引.pdf
│   └── ...
│
├── circulars/activity/         ← source_folder: 'circulars/activity'
│   ├── P022-26_新修訂支部訓練綱要.pdf
│   └── ...
│
├── subsidy/                    ← source_folder: 'subsidy'
│   ├── 起動資助計劃.pdf
│   └── 活動資助.pdf
│
└── general/                    ← source_folder: 'general'
    └── 其他指引.pdf
```

---

### 📂 Syllabus（訓練綱要）

**目標用戶**：領袖、成員  
**系統**：scout-syllabus-assistant（待建立）  
**Project 標記**：`syllabus`

```
syllabus-docs/                  ← Storage
│
├── syllabus/                   ← source_folder: 'syllabus'
│   ├── 小童軍支部訓練綱要.pdf
│   ├── 幼童軍支部訓練綱要.pdf
│   ├── 童軍支部訓練綱要.pdf
│   ├── 深資童軍支部訓練綱要.pdf
│   └── 樂行童軍支部訓練綱要.pdf
│
├── leader-training/            ← source_folder: 'leader-training'
│   ├── 初級領袖訓練大綱.pdf
│   ├── 中級領袖訓練大綱.pdf
│   ├── 高級領袖訓練大綱.pdf
│   └── 领袖木章訓練大綱.pdf
│
├── badge/                      ← source_folder: 'badge'
│   ├── 專科徽章訓練教材.pdf
│   └── 進度獎章標準.pdf
│
└── subsidy/                    ← source_folder: 'subsidy'
    └── 訓練資助計劃.pdf
```

---

### 📂 Uniform（制服）

**目標用戶**：領袖、成員  
**系統**：scout-uniform-assistant（待建立）  
**Project 標記**：`uniform`

```
uniform-docs/                   ← Storage
│
├── handbook/                   ← source_folder: 'handbook'
│   ├── 儀容與制服手冊.pdf
│   └── 領巾佩戴指引.pdf
│
├── circulars/                  ← source_folder: 'circulars'
│   └── 制服更新通告.pdf
│
└── badge-guide/                ← source_folder: 'badge-guide'
    └── 徽章佩戴位置圖.pdf
```

---

### 📂 Form（表格）

**目標用戶**：領袖、成員  
**系統**：scout-form-assistant（待建立）  
**Project 標記**：`form`

```
form-docs/                      ← Storage
│
├── member/                     ← source_folder: 'member'
│   ├── 入會申請表.pdf
│   ├── 家長同意書.pdf
│   └── 個人資料更新表.pdf
│
├── activity/                   ← source_folder: 'activity'
│   ├── 活動申請表.pdf
│   ├── 旅行許可證.pdf
│   └── 活動計劃書.pdf
│
└── administrative/             ← source_folder: 'administrative'
    ├── 領袖委任申請表.pdf
    └── 旅務委員會組成表.pdf
```

---

## 📊 資料庫欄位說明

| 欄位 | 說明 | 範例 |
|------|------|------|
| `id` | 自動產生 | `uuid-xxx` |
| `project` | 專案標記 | `policy` / `syllabus` / `uniform` / `form` |
| `source_folder` | 資料夾路徑 | `POR` / `circulars/policy` / `syllabus` |
| `source_file` | 原始檔名 | `POR_C_20251114_.pdf` |
| `doc_title` | 文件標題 | `政策、組織及規條` |
| `doc_date` | 發布日期 | `2025-11-14` |
| `chunk_text` | 內容段落 | （實際文字） |
| `embedding` | 向量 | （768維度數組） |
| `created_at` | 建立時間 | `2026-05-28` |

---

## 🔍 搜尋範例

### Policy 專案搜尋
```javascript
supabaseAdmin.rpc('match_documents', {
  query_embedding: userQuestionVector,
  project_filter: 'policy',
  match_threshold: 0.7,
  match_count: 5
})
```

### Syllabus 專案搜尋
```javascript
supabaseAdmin.rpc('match_documents', {
  query_embedding: userQuestionVector,
  project_filter: 'syllabus',
  match_threshold: 0.7,
  match_count: 5
})
```

### 限定資料夾搜尋（制服問題）
```javascript
supabaseAdmin.rpc('match_documents', {
  query_embedding: userQuestionVector,
  project_filter: 'policy',
  folder_filter: 'uniform',
  match_threshold: 0.7,
  match_count: 5
})
```

---

## 📱 未來專案擴展

| 專案名稱 | 網址 | 用途 |
|----------|------|------|
| scout-policy-assistant | 已建立 | 政策及指引問答 |
| scout-syllabus-assistant | 待建立 | 訓練綱要問答 |
| scout-uniform-assistant | 待建立 | 制服相關問答 |
| scout-form-assistant | 待建立 | 表格相關問答 |

---

## ⚠️ 注意事項

1. **所有專案共用同一個資料庫**，透過 `project` 欄位區分
2. **Storage 也分開管理**，每個專案有自己的 bucket
3. **更新文件時**，會新增記錄而非覆蓋舊記錄（方便追蹤歷史）
4. **向量化消耗 Cohere 額度**，建議批量上傳而非單段落處理