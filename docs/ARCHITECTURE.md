# SonicForge — Architecture

> **Last Updated:** 2026-11-19  
> **Status:** Step 2 — Finalized

---

## System Overview

SonicForge is a monorepo containing a React/TypeScript frontend and a Python FastAPI backend. The two communicate over HTTP REST and Server-Sent Events (SSE).

```
┌─────────────────────────────────────────────────────────────┐
│                        SonicForge                           │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             Frontend  (apps/web)                       │ │
│  │  React 18 · TypeScript 5 · Vite · Tailwind CSS        │ │
│  │  Zustand (state) · WaveSurfer.js · Tone.js · DnD      │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             │  HTTP REST + SSE               │
│  ┌──────────────────────────▼─────────────────────────────┐ │
│  │             Backend API  (apps/api)                    │ │
│  │  Python 3.11 · FastAPI · Uvicorn · pydub · FFmpeg     │ │
│  │  SQLAlchemy (async) · SQLite · aiosqlite               │ │
│  └──┬─────────────────┬────────────────────┬──────────────┘ │
│     │                 │                    │                │
│  ┌──▼──────────┐  ┌───▼──────────┐  ┌─────▼─────────────┐  │
│  │ Audio       │  │ AI Provider  │  │ Storage Layer     │  │
│  │ Engine      │  │ Adapters     │  │                   │  │
│  │             │  │              │  │ ~/sonicforge-     │  │
│  │ pydub       │  │ MusicGen     │  │   projects/       │  │
│  │ FFmpeg      │  │ MAGNeT       │  │                   │  │
│  │             │  │ HF API       │  │ SQLite DB         │  │
│  └─────────────┘  └──────┬───────┘  └───────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐ │
│  │             Job Queue                                  │ │
│  │  Celery · Redis                                        │ │
│  │  (AI generation runs as background tasks)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Frontend (apps/web)

| Layer | Responsibility |
|---|---|
| `pages/` | Top-level route views: Dashboard, Workspace, Settings |
| `components/timeline/` | BPM-aware multitrack timeline, clip drag-drop |
| `components/waveform/` | WaveSurfer.js wrapper, peaks rendering |
| `components/generation/` | AI prompt UI, job status, model picker |
| `components/mixer/` | Per-track volume/pan, master bus |
| `stores/` | Zustand slices: project, playback, ui, jobs |
| `services/` | Typed API client, SSE listener for job progress |

### Backend (apps/api)

| Layer | Responsibility |
|---|---|
| `api/` | Thin FastAPI route handlers — no business logic |
| `services/` | Business logic: project CRUD, audio ops, export |
| `ai/` | Provider adapter pattern — all models implement the same interface |
| `jobs/` | Celery task definitions — generation tasks dispatched here |
| `models/` | SQLAlchemy ORM models (Project, Track, Clip, GenerationJob) |
| `storage/` | File I/O abstraction — project folders, assets, exports |

---

## AI Provider System

Every AI provider implements `MusicGenerationProvider`:

```python
class MusicGenerationProvider(ABC):
    @property
    def provider_id(self) -> str: ...
    @property
    def display_name(self) -> str: ...
    def is_available(self) -> bool: ...
    def get_capabilities(self) -> ProviderCapabilities: ...
    async def generate(self, request: GenerationRequest) -> str:  # returns job_id
    async def get_status(self, job_id: str) -> GenerationStatus: ...
```

Adding a new model = create one file in `ai/providers/`, register in `ai/registry.py`.

---

## Data Flow: AI Generation

```
User enters prompt
       │
       ▼
Frontend sends POST /api/generation/jobs
       │
       ▼
FastAPI validates request → dispatches Celery task → returns job_id
       │
       ▼
Frontend opens SSE stream: GET /api/generation/jobs/{job_id}/stream
       │
       ▼
Celery worker runs MusicGen inference (CPU, background)
       │
       ▼
Worker writes audio file to projects/{id}/assets/generated/
Worker updates job status in SQLite
Worker sends SSE event: { status, progress, file_path }
       │
       ▼
Frontend receives SSE → updates job card → clip auto-added to timeline
```

---

## Project File Format

```json
{
  "id": "uuid",
  "name": "My Track",
  "bpm": 120,
  "time_signature": [4, 4],
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "tracks": [
    {
      "id": "uuid",
      "name": "Track 1",
      "volume": 1.0,
      "pan": 0.0,
      "muted": false,
      "solo": false,
      "clips": [
        {
          "id": "uuid",
          "asset_path": "assets/generated/clip.wav",
          "start_beat": 0,
          "duration_beats": 16,
          "trim_start": 0.0,
          "trim_end": 0.0,
          "fade_in": 0.0,
          "fade_out": 0.0,
          "volume": 1.0
        }
      ]
    }
  ]
}
```

---

## Non-Destructive Editing Principle

1. Imported files go into `assets/imported/` and are **never modified**
2. Generated files go into `assets/generated/`
3. All edits (trim, volume, fades) are stored in `project.json` only
4. Export reads `project.json` + source files → renders new file into `assets/rendered/`

---

## Security Model

- API keys stored in backend `.env` only — never sent to frontend
- Frontend only receives `provider_id` and `display_name`, never credentials
- File upload validation: MIME type + extension + max size check
- All file paths resolved against `PROJECTS_ROOT` — no path traversal
- CORS locked to `localhost:5173` in development
