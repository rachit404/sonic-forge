import { create } from 'zustand'
import type { PanelView } from '@/types'

interface UIState {
  activePanel: PanelView
  timelineZoom: number
  sidebarOpen: boolean
  
  setActivePanel: (panel: PanelView) => void
  setTimelineZoom: (zoom: number) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  activePanel: 'timeline',
  timelineZoom: 40,
  sidebarOpen: true,

  setActivePanel: (activePanel) => set({ activePanel }),
  setTimelineZoom: (timelineZoom) => set({ timelineZoom }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
