# CAD-IQ

AI-powered CAD design validation platform for automotive engineering workflows.

## Architecture

```text
+------+      +------------------+      +------------------+      +----------------------+
| User | ---> | React Frontend   | ---> | FastAPI Backend  | ---> | Gemini API           |
+------+      +------------------+      +------------------+      +----------------------+
                                              |        |
                                              |        +---------> trimesh (CAD Parser)
                                              |
                                              +------------------> ChromaDB (RAG)
```

## Features

- Drag-and-drop STL upload workflow (only formats with full analysis support)
- STL parsing with geometry metadata extraction using `trimesh`
- Rule retrieval with a local RAG pipeline backed by ChromaDB
- AI validation of uploaded designs against automotive design rules
- Interactive 3D STL viewer with orbit, zoom, and pan controls
- Context-aware engineering chat tied to the current validation result
- Compliance score gauge and structured violations table
- One-click PDF export for validation reports
- Bundled sample STL for end-to-end testing without supplying your own file
- Polished dark-theme UI with loading states, toasts, and responsive layout

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| 3D Viewer | Three.js, STLLoader, OrbitControls |
| Backend API | FastAPI, Uvicorn |
| CAD Parsing | trimesh |
| Retrieval / RAG | ChromaDB, sentence-transformers (`all-MiniLM-L6-v2`) |
| LLM Validation / Chat | Google Gemini 2.5 Flash (`google-generativeai`) |
| Reporting | jsPDF |
| Notifications | react-hot-toast |

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- A Google Gemini API key

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install Backend Dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Set Environment Variables

The current implementation uses `GEMINI_API_KEY`.

```bash
export GEMINI_API_KEY="your_api_key_here"
```

### Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on [http://localhost:5173](http://localhost:5173).

### Run Backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on [http://localhost:8000](http://localhost:8000).

## Deployment

### What runs where

| Component | Platform | Why |
| --- | --- | --- |
| React frontend | **Vercel** | Static Vite build, fast CDN |
| FastAPI backend | **Render** (or Railway / Fly.io) | Needs Python, ChromaDB, `sentence-transformers`, and `trimesh` — too heavy for Vercel serverless |

The frontend talks to the backend through `VITE_API_URL`. Only STL uploads are accepted; every result comes from live geometry extraction and Gemini validation.

### 1. Deploy the backend (Render)

1. Push this repo to GitHub.
2. Create a [Render](https://render.com) **Web Service** from the repo (or use the included `render.yaml` blueprint).
3. Set **Root Directory** to `backend`.
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `GEMINI_API_KEY` — your Google Gemini key
   - `ALLOWED_ORIGINS` — comma-separated origins, e.g. `https://your-app.vercel.app,http://localhost:5173`
   - `UPLOAD_DIR=/tmp/cadiq-uploads` (recommended on free/ephemeral disks)
   - `CHROMA_DB_PATH=/tmp/cadiq-chroma` (recommended on free/ephemeral disks)

The first request after a cold start may be slow while embeddings load. Use at least **512 MB RAM**; **1 GB+** is safer for `sentence-transformers`.

### 2. Deploy the frontend (Vercel)

1. Import the repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite** (build: `npm run build`, output: `dist`).
4. Add environment variable:
   - `VITE_API_URL` — your Render API URL, e.g. `https://cadiq-api.onrender.com` (no trailing slash)
5. Deploy.

`frontend/vercel.json` adds SPA fallback routing so client-side navigation works.

### Local production-like testing

```bash
# Terminal 1 — backend
cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend pointing at local API
cd frontend
echo 'VITE_API_URL=http://localhost:8000' > .env.local
npm run build && npm run preview
```

## How It Works

A user uploads an STL mesh from the React frontend. The FastAPI backend parses the file with trimesh, extracts geometry metadata, and retrieves the most relevant automotive design rules from a ChromaDB-backed knowledge base. That metadata and the retrieved rules are sent to Gemini 2.5 Flash, which produces a compliance score, summary, and structured violations. The validated result powers the 3D preview, dashboard, contextual engineering chat, and exported PDF report.

## Folder Structure

```text
cadiq/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatSidebar.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── ModelViewer.jsx
│   │   │   ├── ReportExport.jsx
│   │   │   ├── ScoreGauge.jsx
│   │   │   └── ViolationsTable.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── chroma_db/
│   ├── knowledge_base/
│   │   └── design_rules.txt
│   ├── routes/
│   │   ├── chat.py
│   │   ├── rules.py
│   │   ├── upload.py
│   │   └── validate.py
│   ├── services/
│   │   ├── cad_parser.py
│   │   ├── gemini_service.py
│   │   └── rag_engine.py
│   ├── uploads/
│   ├── main.py
│   └── requirements.txt
├── .gitignore
└── README.md
```
