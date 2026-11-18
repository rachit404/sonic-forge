# SonicForge — Development Plan

> **Last Updated:** 2026-11-19

---

## Milestone Tracker

| Step | Name | Status | Approved | Started | Completed |
|------|------|--------|----------|---------|-----------|
| 1 | Product Discovery & Requirements | ✅ Done | ✅ | 2026-11-19 | 2026-11-19 |
| 2 | Architecture & Tech Selection | ✅ Done | ✅ | 2026-11-19 | 2026-11-19 |
| 3 | Project Foundation | ✅ Done | ✅ | 2026-11-19 | 2026-11-19 |
| 4 | Audio Engine | ⏳ Pending | — | — | — |
| 5 | Music Workspace | ⏳ Pending | — | — | — |
| 6 | AI Model Integration | ⏳ Pending | — | — | — |
| 7 | AI Music Generation | ⏳ Pending | — | — | — |
| 8 | Advanced Production Tools | ⏳ Pending | — | — | — |
| 9 | Export & Self-Hosting | ⏳ Pending | — | — | — |
| 10 | V1 Completion & Verification | ⏳ Pending | — | — | — |

---

## Step Details

### Step 1 — Product Discovery & Requirements ✅
**Deliverables:**
- Discovery interview completed
- V1 Product Specification written and approved
- `.antigravity/` agent coordination folder created

**Key decisions made:**
- Primary use case: AI-assisted music composition
- Hardware: CPU-only (constrains local model selection)
- Stack: React/TypeScript + Python FastAPI
- Job queue: Celery + Redis
- Timeline: BPM-aware
- AI models: MusicGen Small + MAGNeT Small (MIT license)
- Formats: Import MP3/WAV/FLAC/OGG/AIFF/M4A, Export WAV/MP3/FLAC/OGG

---

### Step 2 — Architecture & Tech Selection 🔄
**Deliverables:**
- Full project structure scaffolded
- pnpm workspace configured
- pyproject.toml configured
- docs/ARCHITECTURE.md written
- docs/TECH_STACK.md written
- .gitignore, .env.example, scripts written

---

### Step 3 — Project Foundation 🔄
**Deliverables:**
- Frontend shell: Vite + React + TypeScript + Tailwind running
- Backend shell: FastAPI running with health check endpoint
- Database: SQLite with initial schema
- Celery + Redis: connected and accepting tasks
- Component folder structure in place
- Both servers start with one command (`scripts/dev.ps1`)

---

### Step 4 — Audio Engine ⏳
**Deliverables:**
- Audio import endpoint (MP3/WAV/FLAC/OGG/AIFF/M4A)
- FFmpeg integration via pydub
- Audio file validation and metadata extraction
- Waveform data generation (peaks array for frontend)
- WaveSurfer.js waveform rendering component
- Audio playback via Tone.js
- Play/pause/stop/seek transport

---

### Step 5 — Music Workspace ⏳
**Deliverables:**
- BPM-aware multitrack timeline
- Track create/delete/rename
- Clip placement, move, resize, trim
- Snap-to-beat grid
- Per-track mute/solo
- Playhead with time/beat display
- Timeline zoom in/out

---

### Step 6 — AI Model Integration ⏳
**Deliverables:**
- Provider adapter interface (abstract base class)
- Provider registry
- MusicGen Small local provider
- MAGNeT Small local provider
- HuggingFace API provider
- Model download wizard (first-run)
- Provider availability checks

---

### Step 7 — AI Music Generation ⏳
**Deliverables:**
- AI generation panel UI
- Text prompt input
- Model/provider selector
- Celery job dispatch
- SSE progress streaming to frontend
- Generated clip auto-added to project
- Job history panel

---

### Step 8 — Advanced Production Tools ⏳
**Deliverables:**
- Per-track volume/pan controls
- Fade in/out on clips
- Volume envelope (basic)
- Master bus volume
- Mixer panel layout

---

### Step 9 — Export & Self-Hosting ⏳
**Deliverables:**
- Export modal (format, sample rate, bit depth)
- FFmpeg mixdown rendering
- Export progress feedback
- Docker Compose setup (API + Web + Redis)
- Dockerfile.api and Dockerfile.web
- Production build scripts

---

### Step 10 — V1 Completion & Verification ⏳
**Deliverables:**
- Full test suite (unit + integration + E2E)
- All manual verification items checked
- Documentation review
- Security review
- README finalized
- CHANGELOG finalized
- Release tag

---

## Open Technical Risks

| Risk | Mitigation |
|------|-----------|
| MusicGen CPU inference is very slow | Async job queue; UI stays responsive; clear time estimates shown |
| FFmpeg not installed on user machine | `setup.ps1` checks and guides installation |
| Redis not available | Setup script handles; Docker Compose bundles Redis for production |
| pydub wav export quality | Test all format combinations in Step 4 |
| WaveSurfer peaks generation performance | Pre-generate peaks on import, cache in project.json |
