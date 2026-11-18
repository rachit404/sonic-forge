# SonicForge — Agent Communication Guidelines

> **Last Updated:** 2026-11-19  
> **Status:** Step 1 — Product Discovery (IN PROGRESS)

---

## Purpose

This folder is the shared communication layer for all Antigravity agents working on the SonicForge project.  
Every agent that touches this codebase **must** read this file before making any changes.

---

## Ground Rules

1. **Never proceed to a new milestone without user explicit approval.**
2. **Never overwrite existing user work.** Read the repo state first.
3. **Never expose credentials in code or Git history.**
4. **Never hardcode one AI model as the only backend.**
5. **Never report a test as passing unless it was actually executed.**
6. **Never start writing code before Step 1 is complete and approved.**
7. **Always update the relevant MD files** after meaningful changes.
8. **Always prefer non-destructive audio editing.**
9. **Always keep main branch stable.** Use feature branches or clean milestone commits.

---

## 🪢 The Ponytail Principle (Lazy Senior Developer Philosophy)

Always evaluate solutions using the **Ponytail 7-rung decision ladder**:
1. **Does this need to exist at all?** (Strict YAGNI — avoid speculative abstractions)
2. **Is it already in the codebase?** (Reuse existing components, stores, utilities)
3. **Does the standard library do it?** (Use built-ins before adding dependencies)
4. **Is there a native platform / Web Audio feature?** (e.g. native AudioContext, Canvas, Web Audio API)
5. **Is it available in an already-installed dependency?** (e.g. Tone.js, WaveSurfer, pydub)
6. **Can it be done cleanly and directly?** (Simple, readable, focused implementation)
7. **Write the strict minimum that works reliably**: Never write boilerplate wrappers or complex layers for simple tasks. Always protect security, error handling, trust boundaries, and data integrity.


---

## Milestone Status

| Step | Name                              | Status      |
|------|-----------------------------------|-------------|
| 1    | Product Discovery & Requirements  | ✅ Done     |
| 2    | Architecture & Tech Selection     | ✅ Done     |
| 3    | Project Foundation                | ✅ Done     |
| 4    | Audio Engine                      | ✅ Done     |
| 5    | Music Workspace                   | ✅ Done     |
| 6    | AI Model Integration              | ⏳ Pending  |
| 7    | AI Music Generation               | ⏳ Pending  |
| 8    | Advanced Production Tools         | ⏳ Pending  |
| 9    | Export & Self-Hosting             | ⏳ Pending  |
| 10   | V1 Completion & Verification      | ⏳ Pending  |

---

## File Index

| File                    | Purpose                                      |
|-------------------------|----------------------------------------------|
| `AGENT_GUIDELINES.md`   | This file — rules every agent must follow    |
| `DISCOVERY_NOTES.md`    | Raw answers from product discovery interview |
| `V1_SPEC.md`            | Approved V1 product specification            |
| `DECISIONS.md`          | Architectural decisions and rationale        |
| `PROGRESS_LOG.md`       | Running log of completed work per milestone  |

---

## How to Update This Folder

- After each user Q&A session, update `DISCOVERY_NOTES.md`.
- After Step 1 approval, write `V1_SPEC.md`.
- After each architectural decision, append to `DECISIONS.md`.
- After each milestone implementation, append to `PROGRESS_LOG.md`.
- Keep `AGENT_GUIDELINES.md` milestone table up to date.
