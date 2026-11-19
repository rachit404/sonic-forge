import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project, Track, Clip } from '@/types'
import { tracksApi } from '@/services/api'

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

/** Helper to persist updated clips of a track to the backend */
function syncTrackClips(projectId: string | undefined, trackId: string, clips: Clip[]) {
  if (!projectId) return
  tracksApi.update(projectId, trackId, { clips }).catch((err) => {
    console.warn(`Failed to auto-save clips for track ${trackId}:`, err)
  })
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
          const projectId = state.activeProject.id
          tracksApi.update(projectId, trackId, updates).catch(() => {})

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
          const projectId = state.activeProject.id
          tracksApi.delete(projectId, trackId).catch(() => {})

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
          const track = state.activeProject.tracks.find((t) => t.id === trackId)
          const updatedClips = track ? [...track.clips, clip] : [clip]
          syncTrackClips(state.activeProject.id, trackId, updatedClips)

          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: updatedClips } : t,
              ),
            },
          }
        }),

      removeClip: (trackId, clipId) =>
        set((state) => {
          if (!state.activeProject) return state
          const track = state.activeProject.tracks.find((t) => t.id === trackId)
          const updatedClips = track ? track.clips.filter((c) => c.id !== clipId) : []
          syncTrackClips(state.activeProject.id, trackId, updatedClips)

          return {
            selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: updatedClips } : t,
              ),
            },
          }
        }),

      updateClip: (trackId, clipId, updates) =>
        set((state) => {
          if (!state.activeProject) return state
          const track = state.activeProject.tracks.find((t) => t.id === trackId)
          if (!track) return state
          const updatedClips = track.clips.map((c) =>
            c.id === clipId ? { ...c, ...updates } : c,
          )
          syncTrackClips(state.activeProject.id, trackId, updatedClips)

          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: updatedClips } : t,
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
            const updatedClips = fromTrack ? fromTrack.clips.map((c) => (c.id === clipId ? updatedClip : c)) : []
            syncTrackClips(state.activeProject.id, fromTrackId, updatedClips)

            return {
              activeProject: {
                ...state.activeProject,
                tracks: state.activeProject.tracks.map((t) =>
                  t.id === fromTrackId ? { ...t, clips: updatedClips } : t,
                ),
              },
            }
          }

          // Move to a different track
          const fromUpdatedClips = fromTrack ? fromTrack.clips.filter((c) => c.id !== clipId) : []
          const toTrack = state.activeProject.tracks.find((t) => t.id === toTrackId)
          const toUpdatedClips = toTrack ? [...toTrack.clips, updatedClip] : [updatedClip]

          syncTrackClips(state.activeProject.id, fromTrackId, fromUpdatedClips)
          syncTrackClips(state.activeProject.id, toTrackId, toUpdatedClips)

          return {
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) => {
                if (t.id === fromTrackId) {
                  return { ...t, clips: fromUpdatedClips }
                }
                if (t.id === toTrackId) {
                  return { ...t, clips: toUpdatedClips }
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

          if (!track) return state

          const duplicated: Clip = {
            ...clip,
            id: crypto.randomUUID(),
            name: `${clip.name || 'Clip'} (Copy)`,
            startBeat: clip.startBeat + clip.durationBeats,
          }

          const updatedClips = [...track.clips, duplicated]
          syncTrackClips(state.activeProject.id, trackId, updatedClips)

          return {
            selectedClipId: duplicated.id,
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: updatedClips } : t,
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

          if (!track) return state

          const updatedClips = track.clips
            .map((c) => (c.id === clipId ? firstClip : c))
            .concat(secondClip)

          syncTrackClips(state.activeProject.id, trackId, updatedClips)

          return {
            selectedClipId: secondClip.id,
            activeProject: {
              ...state.activeProject,
              tracks: state.activeProject.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: updatedClips } : t,
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
