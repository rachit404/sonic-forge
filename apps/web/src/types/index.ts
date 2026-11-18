export interface Project {
  id: string
  name: string
  bpm: number
  timeSignature: [number, number]
  createdAt: string
  updatedAt: string
  tracks: Track[]
}

export interface Track {
  id: string
  name: string
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  color: string
  clips: Clip[]
}

export interface Clip {
  id: string
  assetPath: string
  startBeat: number
  durationBeats: number
  trimStart: number
  trimEnd: number
  fadeIn: number
  fadeOut: number
  volume: number
  peaks?: number[]
  name?: string
}

export type GenerationStatus = 'queued' | 'running' | 'done' | 'failed'

export interface GenerationJob {
  id: string
  prompt: string
  providerId: string
  status: GenerationStatus
  progress: number
  resultPath?: string
  error?: string
  createdAt: string
}

export interface Provider {
  id: string
  displayName: string
  isAvailable: boolean
  isLocal: boolean
  capabilities: ProviderCapabilities
}

export interface ProviderCapabilities {
  maxDurationSeconds: number
  supportsPrompt: boolean
  supportsAudioInput: boolean
  typicalCpuMinutes: number
}

export type PlaybackState = 'stopped' | 'playing' | 'paused'
export type PanelView = 'timeline' | 'mixer' | 'generation'
