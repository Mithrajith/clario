# Clario — Enterprise Knowledge Intelligence & RAG Platform

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](#)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](#)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791.svg)](#)
[![Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant%20Cloud%20%2F%20Cluster-dc2626.svg)](#)

**Clario** is a high-performance Enterprise Knowledge Intelligence and Retrieval-Augmented Generation (RAG) platform. It empowers enterprise teams to index, query, search, and verify mission-critical documents in real time with end-to-end citation provenance, claim-level hallucination verification, role-based access control, and asynchronous parallel processing.

---

## Key Highlights

- **Live Vector & Relational Storage**: Zero hardcoded/mock data. Powered directly by PostgreSQL (or Neon Serverless Postgres) and Qdrant Vector Cluster.
- **Parallel Asynchronous Pipeline**: Multi-task parallel pipeline with unique Process IDs (`PID-XXXXX`). Users can navigate across views, trigger batch document indexing, and converse simultaneously without blocking.
- **Markdown & Structured LLM Output**: Complete markdown rendering with syntax highlighting, bullet/heading hierarchy (`####`, `**`), math expressions, tables, and clickable citation cards.
- **Batch Document Processing**: One-click "Process All Documents" capability (`POST /api/v1/documents/process-all`) indexing all unindexed files across the pipeline.
- **Enterprise Security**:
  - Multi-stage Docker containerization with non-root runtime users (`clario:clario`, UID 1001).
  - Nginx 1.27 reverse-proxy with Gzip compression, asset caching, and security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`).
  - SQLAlchemy connection pool with `pool_pre_ping=True`, `pool_size=10`, `max_overflow=20`, and `pool_recycle=300` for cloud database resilience.
  - Global error boundaries and centralized FastAPI lifespan management.

---

## Architecture Overview

```
clario/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI lifespan & security middleware
│   │   ├── api/                 # Versioned REST APIs (Auth, Documents, Search, Query, Audit, Users)
│   │   ├── core/                # Config, database engine, security tokens
│   │   ├── models/              # SQLAlchemy ORM models (User, Document, Chunk, Conversation, Message, Audit)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   └── services/            # RAG pipeline, Qdrant vector store, Hybrid search, Claim verifier
│   ├── Dockerfile               # Multi-stage Python 3.11-slim non-root container
│   ├── pyproject.toml           # uv project definition
│   └── requirements.txt         # Pinned production requirements
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Production API client with JWT and reverse-proxy resolution
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication & RBAC state
│   │   │   └── PipelineContext.jsx  # Parallel background task manager with Process IDs
│   │   ├── components/          # React components (Chat, Documents, Search, Pipeline, ErrorBoundary)
│   │   └── pages/               # Enterprise routes (Chat, Knowledge, Analytics, Audit, Settings)
│   ├── Dockerfile               # Multi-stage Node 20 build -> Nginx Alpine runtime
│   ├── nginx.conf               # Production Nginx reverse proxy configuration
│   └── package.json             # Vite + React 19 configuration
├── docker-compose.yml           # Full-stack Docker orchestration
└── .env.example                 # Environment template
```

---

## Quick Start (Docker Compose — Recommended)

Deploy the entire production stack (Frontend, Backend, PostgreSQL, and Qdrant) with a single command:

```bash
# 1. Clone or navigate to the repository
cd clario

# 2. Copy and customize environment variables
cp .env.example .env

# 3. Build and launch all services in background
docker compose up --build -d

# 4. Check service status and health
docker compose ps
```

The application will be accessible at:
- **Web Application**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:8000` (or `http://localhost/api/v1/`)
- **API Documentation**: `http://localhost:8000/docs`
- **Qdrant Vector Dashboard**: `http://localhost:6333/dashboard`

---

## Local Development Workflow

### 1. Backend Setup (using `uv` or `venv`)

```bash
cd backend

# Option A: With uv (Fastest)
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option B: Standard Python venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run unit and integration tests
npm test

# Launch Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Production Cloud Configuration (Neon & Qdrant Cloud)

To connect Clario directly to managed cloud instances:

1. **Neon PostgreSQL**: Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
2. **Qdrant Cloud**: Set `QDRANT_URL` and `QDRANT_API_KEY`:
   ```env
   QDRANT_URL=https://<cluster-id>.us-west-2-0.aws.cloud.qdrant.io
   QDRANT_API_KEY=<your-qdrant-cloud-api-key>
   ```

Verify cloud connectivity at any time:
```bash
cd backend
uv run python ../verify_cloud_connections.py
```

---

## Security & Reliability Features

| Feature | Implementation Details |
| :--- | :--- |
| **Non-Root Execution** | Container runs under UID 1001 (`clario:clario`) preventing privilege escalation. |
| **Connection Pooling** | SQLAlchemy engine configured with pre-ping validation, automatic timeout recycling, and connection overflow protection. |
| **Reverse Proxy** | Nginx serves static assets with `Cache-Control: max-age=31536000, immutable`, gzips JSON/HTML/JS, and safely proxies API routes. |
| **Error Handling** | Global React `ErrorBoundary` and FastAPI sanitized 500 error handler prevent UI crashes and server stack trace leakage. |
| **Health Checks** | Container-level `HEALTHCHECK` instructions on both frontend and backend communicating with `GET /health`. |

---

## License

Enterprise proprietary software. All rights reserved.
