import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project, Track, Clip } from '@/types'

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  isLoading: boolean
  error: string | null

  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  addClipToTrack: (trackId: string, clip: Clip) => void
  removeClip: (trackId: string, clipId: string) => void
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set) => ({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,

      setProjects: (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),

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

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: 'project-store' },
  ),
)
