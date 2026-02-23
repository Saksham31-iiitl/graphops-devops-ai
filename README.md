# 🚀 GraphOps – AI-Driven DevOps Orchestrator

GraphOps is an AI-powered DevOps incident analysis system that helps engineers quickly identify root causes and suggested fixes from large log dumps using Retrieval-Augmented Generation (RAG).

It is designed to reduce debugging time and simulate a real-world SaaS DevOps investigation tool.

---

## ✨ Features

- 🔍 AI-powered log analysis using sentence-transformer embeddings
- 📚 Retrieval-Augmented Generation (RAG) over historical runbooks
- 📊 Confidence scoring based on similarity metrics
- ⚡ Incident lifecycle management (P1–P4 severity)
- 🌍 Environment & region-aware analysis
- 🧠 Semantic similarity search via Chroma vector database
- 📜 Incident history with searchable API
- 🎨 Modern SaaS-style dashboard (React + TailwindCSS)

---

## 🏗️ Tech Stack

### Backend
- Python
- FastAPI
- ChromaDB (Vector Database)
- Sentence-Transformers (`all-MiniLM-L6-v2`)
- Uvicorn

### Frontend
- React (Vite)
- TailwindCSS
- Axios
- Lucide Icons

---

## 🧠 How It Works (Architecture Overview)

```
User submits:
  ├── Incident description
  ├── Logs
  ├── Severity
  ├── Environment
  └── Region

Backend:
  → Generate embeddings using Sentence-Transformers
  → Query ChromaDB for similar runbooks/logs
  → Compute confidence score
  → Return suggested remediation + references
```

---

## 📡 API Contract

### `POST /incident`

**Request:**

```json
{
  "incident": "Kubernetes pod OOMKilled in production",
  "logs": "java.lang.OutOfMemoryError: Java heap space",
  "severity": "P1",
  "environment": "production",
  "region": "us-east-1"
}
```

**Response:**

```json
{
  "id": "uuid",
  "suggested_fix": "...",
  "references": [...],
  "confidence_score": 82.4
}
```

---

### `GET /incidents`

Returns all incidents.

### `GET /incidents?q=oom`

Search incidents by title.

### `PATCH /incidents/{id}/status`

Update status:

```json
{ "status": "Resolved" }
```

---

## ⚙️ Local Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/graphops-devops-ai.git
cd graphops-devops-ai
```

### 🔧 Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn api:app --reload
```

Backend runs on: `http://localhost:8000`

### 🎨 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 📂 Project Structure

```
graphops-devops-ai/
├── backend/
│   ├── api.py
│   ├── models.py
│   ├── routes.py
│   ├── store.py
│   └── rag/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 📊 Confidence Score Logic

```
Confidence Score = Average similarity of top-5 retrieved references × 100
```

This gives an interpretable trust metric for AI output.

---

## 🎯 Use Case

When developers paste large log files and don't have time to manually scan errors, GraphOps:

- Identifies semantic patterns
- Matches against known runbooks
- Suggests remediation steps
- Provides confidence estimation

---

## 🚀 Future Improvements

- Persistent database (PostgreSQL)
- Real-time WebSocket updates
- Slack / PagerDuty integration
- Multi-tenant authentication
- Deployment on AWS / Railway

---

## 🏆 Why This Project Matters

GraphOps demonstrates:

- Real-world RAG implementation
- Full-stack SaaS architecture
- Vector database usage
- Semantic similarity scoring
- DevOps workflow simulation

> This is not a toy project — it simulates a production-grade debugging workflow.

---

## 👨‍💻 Author

**Saksham Tiwari**
M.Tech – IIIT Lucknow | GATE 2024 – 96th Percentile

- 🐙 GitHub: [Saksham31-iiitl](https://github.com/Saksham31-iiitl)
- 💼 LinkedIn: [saksham-tiwari](https://www.linkedin.com/in/saksham-tiwari-580228201/)
