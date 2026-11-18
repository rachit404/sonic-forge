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
9. **Always keep main branch stable.** Use feature branches for milestones.

---

## Milestone Status

| Step | Name                              | Status      |
|------|-----------------------------------|-------------|
| 1    | Product Discovery & Requirements  | ✅ Done     |
| 2    | Architecture & Tech Selection     | ✅ Done     |
| 3    | Project Foundation                | ✅ Done     |
| 4    | Audio Engine                      | ⏳ Pending  |
| 5    | Music Workspace                   | ⏳ Pending  |
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
