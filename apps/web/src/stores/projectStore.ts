import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project, Track, Clip } from '@/types'

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  selectedClipId: string | null
  isLoading: boolean
  error: string | null

  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  setSelectedClipId: (id: string | null) => void

  // Track operations
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  deleteTrack: (trackId: string) => void

  // Clip operations
  addClipToTrack: (trackId: string, clip: Clip) => void
  removeClip: (trackId: string, clipId: string) => void
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void
  moveClip: (fromTrackId: string, toTrackId: string, clipId: string, newStartBeat: number) => void
  duplicateClip: (trackId: string, clipId: string) => void
  splitClip: (trackId: string, clipId: string, splitBeat: number) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set) => ({
      projects: [],
      activeProject: null,
      selectedClipId: null,
      isLoading: false,
      error: null,

      setProjects: (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),
      setSelectedClipId: (selectedClipId) => set({ selectedClipId }),

      updateTrack: (trackId, updates) =>
        set((state) => {
          if (!state.activeProject) return state
          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, ...updates } : t,
              ),
            },
          }
        }),

      deleteTrack: (trackId) =>
        set((state) => {
          if (!state.activeProject) return state
          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.filter((t) => t.id !== trackId),
            },
          }
        }),

      addClipToTrack: (trackId, clip) =>
        set((state) => {
          if (!state.activeProject) return state
          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t,
              ),
            },
          }
        }),

      removeClip: (trackId, clipId) =>
        set((state) => {
          if (!state.activeProject) return state
          return {
            selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId
                  ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
                  : t,
              ),
            },
          }
        }),

      updateClip: (trackId, clipId, updates) =>
        set((state) => {
          if (!state.activeProject) return state
          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId
                  ? {
                      ...t,
                      clips: t.clips.map((c) =>
                        c.id === clipId ? { ...c, ...updates } : c,
                      ),
                    }
                  : t,
              ),
            },
          }
        }),

      moveClip: (fromTrackId, toTrackId, clipId, newStartBeat) =>
        set((state) => {
          if (!state.activeProject) return state
          const fromTrack = state.activeProject.tracks.find((t) => t.id === fromTrackId)
          const targetClip = fromTrack?.clips.find((c) => c.id === clipId)
          if (!targetClip) return state

          const updatedClip = { ...targetClip, startBeat: Math.max(0, newStartBeat) }

          if (fromTrackId === toTrackId) {
            return {
              activeProject: {
                ...state.activeProject,
                tracks: state.activeProject.tracks.map((t) =>
                  t.id === fromTrackId
                    ? {
                        ...t,
                        clips: t.clips.map((c) => (c.id === clipId ? updatedClip : c)),
                      }
                    : t,
                ),
              },
            }
          }

          // Move to a different track
          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) => {
                if (t.id === fromTrackId) {
                  return { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
                }
                if (t.id === toTrackId) {
                  return { ...t, clips: [...t.clips, updatedClip] }
                }
                return t
              }),
            },
          }
        }),

      duplicateClip: (trackId, clipId) =>
        set((state) => {
          if (!state.activeProject) return state
          const track = state.activeProject.tracks.find((t) => t.id === trackId)
          const clip = track?.clips.find((c) => c.id === clipId)
          if (!clip) return state

          const duplicated: Clip = {
            ...clip,
            id: crypto.randomUUID(),
            name: `${clip.name || 'Clip'} (Copy)`,
            startBeat: clip.startBeat + clip.durationBeats,
          }

          return {
            selectedClipId: duplicated.id,
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: [...t.clips, duplicated] } : t,
              ),
            },
          }
        }),

      splitClip: (trackId, clipId, splitBeat) =>
        set((state) => {
          if (!state.activeProject) return state
          const track = state.activeProject.tracks.find((t) => t.id === trackId)
          const clip = track?.clips.find((c) => c.id === clipId)
          if (!clip) return state

          // Verify splitBeat is inside clip boundaries
          const clipEndBeat = clip.startBeat + clip.durationBeats
          if (splitBeat <= clip.startBeat + 0.1 || splitBeat >= clipEndBeat - 0.1) {
            return state
          }

          const firstPartDuration = splitBeat - clip.startBeat
          const secondPartDuration = clipEndBeat - splitBeat

          const bpm = state.activeProject.bpm || 120
          const secondsPerBeat = 60 / bpm
          const offsetSeconds = firstPartDuration * secondsPerBeat

          const firstClip: Clip = {
            ...clip,
            durationBeats: Math.max(0.25, firstPartDuration),
          }

          const secondClip: Clip = {
            ...clip,
            id: crypto.randomUUID(),
            name: `${clip.name || 'Clip'} (Part 2)`,
            startBeat: splitBeat,
            durationBeats: Math.max(0.25, secondPartDuration),
            trimStart: (clip.trimStart || 0) + offsetSeconds,
          }

          return {
            selectedClipId: secondClip.id,
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId
                  ? {
                      ...t,
                      clips: t.clips.map((c) => (c.id === clipId ? firstClip : c)).concat(secondClip),
                    }
                  : t,
              ),
            },
          }
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: 'project-store' },
  ),
)
