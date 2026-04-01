# CAD-IQ

Minimal full-stack starter with a React + Tailwind CSS frontend and a FastAPI backend.

## Project Structure

```text
cadiq/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## Install Commands

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run The App

### Start the backend on port 8000

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start the frontend on port 5173

```bash
cd frontend
npm run dev
```

## Expected Responses

- Frontend: open `http://localhost:5173` to see `CAD-IQ is live`
- Backend: open `http://localhost:8000/` to get `{"message":"Hello from CAD-IQ backend"}`
