import { create } from 'zustand'
import type { PlaybackState } from '@/types'

interface PlaybackStoreState {
  state: PlaybackState
  currentBeat: number
  currentTimeSeconds: number
  bpm: number

  setState: (state: PlaybackState) => void
  setCurrentBeat: (beat: number) => void
  setCurrentTime: (seconds: number) => void
  setBpm: (bpm: number) => void
  play: () => void
  pause: () => void
  stop: () => void
}

export const usePlaybackStore = create<PlaybackStoreState>()((set) => ({
  state: 'stopped',
  currentBeat: 0,
  currentTimeSeconds: 0,
  bpm: 120,

  setState: (state) => set({ state }),
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  setCurrentTime: (currentTimeSeconds) => set({ currentTimeSeconds }),
  setBpm: (bpm) => set({ bpm }),
  play: () => set({ state: 'playing' }),
  pause: () => set({ state: 'paused' }),
  stop: () => set({ state: 'stopped', currentBeat: 0, currentTimeSeconds: 0 }),
}))
