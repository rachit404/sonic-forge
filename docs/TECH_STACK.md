# SonicForge — Technology Stack

> **Last Updated:** 2026-11-19

---

## Frontend

| Technology | Version | Purpose | Why chosen |
|---|---|---|---|
| React | 18.x | UI framework | Mature, large ecosystem, concurrent features |
| TypeScript | 5.x | Type safety | Catches errors early, improves refactoring |
| Vite | 5.x | Build tool | Fast HMR, excellent TS support, small bundles |
| Tailwind CSS | 3.x | Styling | Utility-first, easy dark theme, no CSS conflicts |
| Zustand | 4.x | State management | Lightweight, no boilerplate, good devtools |
| WaveSurfer.js | 7.x | Waveform visualization | Best-in-class browser waveform renderer |
| Tone.js | 15.x | Audio scheduling/playback | Accurate Web Audio API scheduling, BPM-aware |
| React DnD | 16.x | Drag-and-drop (timeline) | Flexible, well-maintained |
| React Router | 6.x | Client-side routing | Standard for React SPAs |
| Axios | 1.x | HTTP client | Typed interceptors, easy auth headers |

## Backend

| Technology | Version | Purpose | Why chosen |
|---|---|---|---|
| Python | 3.11+ | Runtime | Required for HF Transformers, pydub, mature audio libs |
| FastAPI | 0.110+ | REST API + SSE | Async, automatic OpenAPI docs, Pydantic validation |
| Uvicorn | 0.27+ | ASGI server | Production-ready, pairs perfectly with FastAPI |
| Pydantic | 2.x | Data validation/settings | Native FastAPI integration, strict types |
| SQLAlchemy | 2.x (async) | ORM | Async support, clean models, easy migrations |
| aiosqlite | latest | Async SQLite driver | Lightweight, no server needed |
| Alembic | latest | DB migrations | Standard SQLAlchemy migration tool |
| pydub | latest | Audio processing | Simple FFmpeg wrapper, all format support |
| FFmpeg | system | Audio decode/encode/mix | Industry standard, all formats, non-destructive ops |
| Celery | 5.x | Background job queue | Mature, reliable, good Redis integration |
| Redis | 7.x | Message broker + result store | Required by Celery; also used for SSE pub/sub |
| HF Transformers | 4.40+ | Load local AI models | Official library for MusicGen / MAGNeT |
| PyTorch | 2.2+ (CPU) | Model inference | Required by HF Transformers |
| uv | latest | Python package manager | Fast, reliable, lockfile support |

## Infrastructure

| Technology | Purpose |
|---|---|
| pnpm | Frontend package manager (workspace support) |
| Docker Compose | Production bundling (Step 9) |
| Git + GitHub | Version control |

## AI Models (V1)

| Model | HF ID | License | Parameters | Local RAM | Speed (CPU) |
|---|---|---|---|---|---|
| MusicGen Small | `facebook/musicgen-small` | MIT ✅ | ~300M | ~3 GB | 2–5 min / 10s |
| MAGNeT Small | `facebook/magnet-small` | MIT ✅ | ~300M | ~3 GB | 1–3 min / 10s |

## Rejected Alternatives

| Technology | Reason rejected |
|---|---|
| Next.js | Server-side rendering not needed; adds complexity for a local app |
| Redux | Too much boilerplate for this scale; Zustand is sufficient |
| PostgreSQL | Overkill for a local single-user app; SQLite is correct here |
| FastAPI + asyncio tasks only | Background AI tasks need a proper queue; Celery + Redis is more robust |
| Electron | Adds ~200MB to bundle; web app is sufficient for self-hosted local use |
| Vite PWA | Out of scope for V1 |
| Suno / Udio API | Paid; closed; incompatible with free-first philosophy |
