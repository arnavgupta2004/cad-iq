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

Note: the current backend implementation uses Google Gemini, even though some earlier planning referred to Claude/Anthropic.

## Features

- Drag-and-drop CAD and image upload workflow
- STL parsing with geometry metadata extraction using `trimesh`
- Rule retrieval with a local RAG pipeline backed by ChromaDB
- AI validation of uploaded designs against automotive design rules
- Interactive 3D STL viewer with orbit, zoom, and pan controls
- Context-aware engineering chat tied to the current validation result
- Compliance score gauge and structured violations table
- One-click PDF export for validation reports
- Demo mode for fast hackathon judging without requiring a real upload
- Polished dark-theme UI with loading states, toasts, and responsive layout

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| 3D Viewer | Three.js, STLLoader, OrbitControls |
| Backend API | FastAPI, Uvicorn |
| CAD Parsing | trimesh |
| Retrieval / RAG | ChromaDB, sentence-transformers (`all-MiniLM-L6-v2`) |
| LLM Validation / Chat | Google Gemini (`google-generativeai`) |
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

If you specifically want to migrate the backend to Anthropic/Claude later, you would replace the current Gemini service and use `ANTHROPIC_API_KEY` instead.

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

## How It Works

A user uploads an STL, STEP, IGES, or image file from the React frontend. The FastAPI backend parses the file, extracts CAD metadata when possible, and retrieves the most relevant automotive design rules from a ChromaDB-backed knowledge base. That metadata and the retrieved rules are then sent to the Gemini validation service, which produces a compliance score, summary, and structured violations. The validated result powers the dashboard, the contextual engineering chat, and the exported PDF report.

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
│   │   ├── claude_service.py
│   │   └── rag_engine.py
│   ├── uploads/
│   ├── main.py
│   └── requirements.txt
├── .gitignore
└── README.md
```
