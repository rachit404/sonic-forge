# SonicForge

> A privacy-first, self-hosted, AI-assisted music composition and production application.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is SonicForge?

SonicForge lets you compose music by:
1. Generating audio stems with AI (text prompt → audio)
2. Importing your own audio files
3. Arranging clips on a multitrack timeline
4. Applying basic mixing (volume, pan, fades)
5. Exporting finished compositions

Everything runs locally. No audio leaves your machine without your explicit action.

---

## Quick Start (Development)

### Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Python** 3.11+
- **FFmpeg** (must be on PATH)
- **Redis** (for background job queue)
- **uv** (Python package manager)

### Setup

```powershell
# 1. Clone the repo
git clone https://github.com/rachit404/sonic-forge.git
cd sonic-forge

# 2. Run setup script (installs deps, checks prerequisites)
.\scripts\setup.ps1

# 3. Start all services
.\scripts\dev.ps1
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8000  
API Docs: http://localhost:8000/docs

---

## Project Structure

```
sonic-forge/
├── apps/
│   ├── web/          # React + TypeScript frontend
│   └── api/          # Python FastAPI backend
├── infra/            # Docker Compose (Step 9)
├── docs/             # Architecture and API docs
├── scripts/          # Dev and setup scripts
└── .antigravity/     # Agent coordination files
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture guide.

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and component overview |
| [TECH_STACK.md](docs/TECH_STACK.md) | Technology choices and rationale |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | 10-milestone roadmap and status |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [.env.example](.env.example) | All environment variables documented |

---

## AI Models (Local, CPU-Compatible)

| Model | License | RAM | Speed |
|---|---|---|---|
| MusicGen Small | MIT ✅ | ~3 GB | 2–5 min / 10s clip |
| MAGNeT Small | MIT ✅ | ~3 GB | 1–3 min / 10s clip |

Models are downloaded on first use via the in-app setup wizard.

---

## Privacy

- All project data stored locally (`~/sonicforge-projects/` by default)
- No audio uploaded without explicit user action
- API keys stored in backend config only — never in the frontend bundle
- No analytics or telemetry

---

## License

MIT — see [LICENSE](LICENSE).
