# SonicForge — Product Discovery Notes

> **Last Updated:** 2026-11-19  
> **Status:** Round 1 & 2 Complete — Spec Drafted

---

## Confirmed User Answers

### Core Vision
- **Primary use case:** AI-assisted music composition — generate tracks, stems, ideas with AI, then arrange and edit them
- **Traditional DAW editing:** Important — basic multitrack arrangement and editing needed in V1

### AI Integration
- **Local vs cloud:** Hybrid — local models where hardware allows, external APIs as optional fallback
- **External API policy:** Free/open-source APIs only (user-supplied keys for any paid services; no paid services baked in)
- **Hardware:** CPU-only, no dedicated GPU

### Audio Formats
- **Import:** MP3, WAV, FLAC, OGG, AIFF, M4A
- **Export:** WAV, MP3, FLAC, OGG

### UI/UX
- **Style:** Dark professional DAW aesthetic (Ableton/FL Studio dark theme inspiration)

### Infrastructure
- **Deployment:** Local dev-first (Node + Python running directly); Docker as later packaging step

### V1 Feature Scope
- Project dashboard
- AI generation panel
- Multitrack arrangement
- Audio import & playback
- Waveform visualization
- Basic mixing
- Export

### Technology Stack
- **Frontend:** TypeScript + React
- **Backend:** Python FastAPI

---

## AI Model Research Findings (CPU-Only Hardware)

### Realistic Local Models (CPU-Only)

| Model | Size | License | CPU Feasibility | Notes |
|-------|------|---------|-----------------|-------|
| `facebook/musicgen-small` | ~300M params | MIT ✅ | ✅ Feasible (slow ~2–5 min/clip) | Best option; text-to-music |
| `facebook/magnet-small` | ~300M params | MIT ✅ | ✅ Feasible (non-autoregressive, faster) | Good fallback |
| Stable Audio Open (small) | ~459M params | Research/open-rail ⚠️ | ✅ Borderline feasible | Check exact license version |

### NOT Realistic on CPU-Only

| Model | Reason |
|-------|--------|
| MusicGen Medium/Large (1.5B–3.3B) | Will OOM or take 30+ min per clip |
| Stable Diffusion Audio (full) | Requires GPU |
| Suno / Udio | External paid API — not aligned with free-first policy |

### Free External API Options

| Provider | Notes |
|----------|-------|
| Hugging Face Inference API (free tier) | Works for small models; heavy models time out |
| HF Spaces (community hosted) | Community-hosted spaces with free quota |
| User-supplied HF API key | Unlocks higher limits on HF serverless |

---

## Key Constraints Identified

1. **CPU-only**: Local generation will be slow (2–10 min/clip). UI must handle async generation gracefully with progress feedback.
2. **Free-first**: No paid API mandatory. User supplies keys for any external services.
3. **Privacy**: No audio uploaded anywhere without explicit user action.
4. **Non-destructive**: Original audio files preserved.
