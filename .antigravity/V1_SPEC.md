# SonicForge — V1 Product Specification

> **Status:** DRAFT — Awaiting User Approval  
> **Date:** 2026-11-19  
> **Version:** 0.1

---

## 1. Product Summary

SonicForge is a **privacy-first, self-hosted, AI-assisted music composition and production application**.

Users compose music by:
1. Generating audio stems and tracks with AI (text prompt → audio)
2. Importing their own audio files
3. Arranging clips on a multitrack timeline
4. Applying basic mixing (volume, pan, fade)
5. Exporting finished compositions

The application runs locally. No audio leaves the machine without explicit user action.

---

## 2. V1 Feature Scope

### ✅ IN SCOPE

| Feature Area | V1 Capability |
|---|---|
| **Project Dashboard** | Create, open, rename, delete projects; project thumbnails |
| **AI Generation Panel** | Text-prompt → audio generation; model/provider selection; async job queue with progress |
| **Audio Import** | Drag-drop or browse: MP3, WAV, FLAC, OGG, AIFF, M4A |
| **Multitrack Timeline** | 4–8 track horizontal timeline; clip placement, move, resize, trim |
| **Waveform Visualization** | Per-clip waveform rendering; playhead; zoom in/out |
| **Audio Playback** | Play/pause/stop; master transport; per-track mute/solo |
| **Basic Mixing** | Per-track volume, pan; master volume; basic fade in/out on clips |
| **Export** | Mix down to WAV, MP3, FLAC, OGG; configurable sample rate and bit depth |
| **AI Provider Management** | Local model configuration; Hugging Face API key (optional) |
| **Project Persistence** | Save/load projects (JSON project file + audio assets folder) |

### ❌ OUT OF SCOPE for V1

- VST / AU plugin support
- MIDI editor or piano roll
- Recording from microphone/audio interface
- Advanced effects chains (EQ, reverb, compression)
- Stems separation (Demucs)
- Real-time collaboration
- Cloud sync
- Mobile interface

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   SonicForge                        │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │     Frontend (React + TypeScript)            │  │
│  │  Vite · Tailwind CSS · Zustand · WaveSurfer  │  │
│  │  Web Audio API · React-DnD                   │  │
│  └───────────────────┬──────────────────────────┘  │
│                      │ HTTP REST + SSE              │
│  ┌───────────────────▼──────────────────────────┐  │
│  │    Backend API (Python FastAPI)               │  │
│  │  Audio processing · Project management       │  │
│  │  AI provider adapter system · Job queue      │  │
│  └──┬────────────────┬────────────────────────┬─┘  │
│     │                │                        │    │
│  ┌──▼──────┐  ┌──────▼─────┐  ┌──────────────▼─┐  │
│  │ Audio   │  │ AI Model   │  │ Storage         │  │
│  │ Engine  │  │ Adapters   │  │ Layer           │  │
│  │ (pydub/ │  │            │  │                 │  │
│  │ ffmpeg) │  │ Local:     │  │ Project files   │  │
│  │         │  │ MusicGen   │  │ Audio assets    │  │
│  │         │  │ MAGNeT     │  │ SQLite DB       │  │
│  │         │  │            │  │                 │  │
│  │         │  │ Remote:    │  │                 │  │
│  │         │  │ HF API     │  │                 │  │
│  └─────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

### Frontend
| Technology | Purpose | Version Target |
|---|---|---|
| React | UI framework | 18.x |
| TypeScript | Type safety | 5.x |
| Vite | Build tool | 5.x |
| Tailwind CSS | Styling | 3.x |
| Zustand | State management | 4.x |
| WaveSurfer.js | Waveform visualization | 7.x |
| React-DnD | Drag-and-drop timeline | 16.x |
| Tone.js | Audio scheduling/playback | 15.x |

### Backend
| Technology | Purpose | Version Target |
|---|---|---|
| Python | Runtime | 3.11+ |
| FastAPI | REST API + SSE | 0.110+ |
| Uvicorn | ASGI server | 0.27+ |
| pydub + FFmpeg | Audio processing/conversion | latest |
| SQLite + aiosqlite | Project persistence | latest |
| Hugging Face Transformers | Local AI model loading | 4.40+ |
| torch (CPU) | Model inference | 2.2+ (CPU build) |
| Celery + Redis OR asyncio tasks | Background generation jobs | TBD in Step 2 |

### Infrastructure
| Component | Tool |
|---|---|
| Package manager (frontend) | pnpm |
| Package manager (backend) | uv (or pip + venv) |
| Containerization | Docker Compose (Step 9) |
| Version control | Git + GitHub |

---

## 5. AI Provider Architecture

Providers implement a common interface:

```python
class MusicGenerationProvider(ABC):
    @property
    def provider_id(self) -> str: ...
    @property
    def display_name(self) -> str: ...
    def is_available(self) -> bool: ...
    def get_capabilities(self) -> ProviderCapabilities: ...
    async def generate(self, request: GenerationRequest) -> GenerationJob: ...
    async def get_job_status(self, job_id: str) -> GenerationStatus: ...
```

**V1 Providers:**
1. `LocalMusicGenProvider` — `facebook/musicgen-small` via HF Transformers (CPU)
2. `LocalMAGNeTProvider` — `facebook/magnet-small` via HF Transformers (CPU)
3. `HuggingFaceAPIProvider` — HF Serverless Inference API (user-supplied key, optional)

---

## 6. Audio Engine Design

- **Source preservation:** Original imported files are NEVER modified
- **Working copies:** All edits produce working copies in a project-local `assets/` folder
- **Non-destructive timeline:** Timeline stores edit decisions (trim points, volume envelopes) in the project JSON, not in audio files
- **Rendering:** Final export renders the edit decisions to a new file via FFmpeg
- **Playback:** Tone.js (frontend) for low-latency browser playback; backend for rendering

---

## 7. Project File Format

```
~/sonicforge-projects/
  my-project/
    project.json          ← edit decisions, track layout, metadata
    assets/
      imported/           ← original imported files (never modified)
      generated/          ← AI-generated audio files
      rendered/           ← exported/mixed-down files
```

---

## 8. Privacy & Security Commitments

- ✅ All project data stored locally (`~/sonicforge-projects/` by default, configurable)
- ✅ No audio uploaded to external services without explicit user action per generation request
- ✅ API keys stored in backend config file (never in frontend bundle or committed to Git)
- ✅ Clear UI indicator: "Local" vs "External API" for every generation action
- ✅ No analytics, telemetry or usage tracking

---

## 9. UI Layout

```
┌───────────────────────────────────────────────────┐
│  SonicForge   [Projects] [Settings]        [?]   │  ← Top Nav
├──────────┬────────────────────────────────────────┤
│          │                                        │
│ Project  │          ARRANGE VIEW                  │
│ Browser  │  ┌──────────────────────────────────┐  │
│          │  │ Track 1 ░░░██████░░░░███░░░░░░░  │  │
│ [+ New]  │  │ Track 2 ░░░░░░░██████████░░░░░░  │  │
│          │  │ Track 3 ░░░░░░░░░░░░░░███░░░░░░  │  │
│          │  └──────────────────────────────────┘  │
│          │  [◀◀] [◀] [▶] [■] [▶▶]   BPM: 120    │  ← Transport
├──────────┼────────────────────────────────────────┤
│ AI GEN   │  MIXER                                 │
│ Panel    │  T1[vol][pan]  T2[vol][pan]  Master   │
│ [Prompt] │                                        │
│ [Model ▼]│                                        │
│ [Generate│                                        │
└──────────┴────────────────────────────────────────┘
```

---

## 10. Realistic Performance Expectations (CPU-Only)

| Model | RAM Required | Generation Time (10s clip) | Quality |
|---|---|---|---|
| MusicGen Small | ~2–3 GB | 2–5 minutes | Good |
| MAGNeT Small | ~2–3 GB | 1–3 minutes | Good |
| HF API (remote) | None local | 10–60 seconds | Good |

> **UX implication:** The UI must treat generation as an async background job with clear progress feedback. Users should be able to work on the timeline while generation runs.

---

## 11. Development Milestones Summary

| Step | Name | Key Deliverables |
|---|---|---|
| 1 | Product Discovery | ✅ This spec |
| 2 | Architecture & Tech | Stack decisions, project structure design |
| 3 | Project Foundation | Repo scaffold, frontend shell, backend API skeleton |
| 4 | Audio Engine | Import, playback, waveform, FFmpeg integration |
| 5 | Music Workspace | Timeline, tracks, clip management, transport |
| 6 | AI Model Integration | Provider adapter system, MusicGen local setup |
| 7 | AI Music Generation | Generation panel, job queue, result integration |
| 8 | Advanced Production Tools | Mixing controls, fades, volume envelopes |
| 9 | Export & Self-Hosting | Export pipeline, Docker Compose packaging |
| 10 | V1 Completion & Verification | Full test suite, documentation, release |

---

## 12. Open Questions for User Approval

1. **Background job queue:** Simple asyncio background tasks (lighter) vs. Celery + Redis (more robust, heavier). Recommendation: start with asyncio, add Celery in Step 8 if needed.
2. **Storage location:** Default to `~/sonicforge-projects/`? Should this be configurable in a settings UI from day one?
3. **Model download UX:** First use of local AI requires downloading ~300MB–1GB of model weights. Should this be a guided setup wizard, or just a one-time download with progress bar?
4. **BPM / musical grid:** Should the timeline be BPM-aware (snap to beats) in V1, or free-form time-based (simpler to build)?

---

*This spec requires explicit user approval before Step 2 begins.*
