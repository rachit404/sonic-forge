/**
 * SonicForge Audio Engine — Tone.js & Web Audio API Player
 * Follows the Ponytail principle: concise, direct, resilient, no bloated abstractions.
 */
import * as Tone from 'tone'
import type { Project, Track, Clip } from '@/types'
import { usePlaybackStore } from '@/stores/playbackStore'

interface TrackNode {
  gain: Tone.Volume
  panner: Tone.Panner
  solo: Tone.Solo
}

class AudioEngine {
  private isInitialized = false
  private currentProject: Project | null = null
  private trackNodes: Map<string, TrackNode> = new Map()
  private players: Map<string, Tone.Player> = new Map()
  private scheduledEvents: number[] = []
  private animFrameId: number | null = null

  /**
   * Ensure Web Audio Context is started (must be triggered by user interaction).
   */
  async init(): Promise<void> {
    if (this.isInitialized) return
    await Tone.start()
    this.isInitialized = true
  }

  /**
   * Sync the audio engine with project tracks and clips.
   */
  async loadProject(project: Project): Promise<void> {
    this.currentProject = project
    Tone.getTransport().bpm.value = project.bpm

    // Clean up old players and track nodes
    this.clearScheduledEvents()
    this.players.forEach((p) => p.dispose())
    this.players.clear()

    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

    // Create channel strip per track (Volume -> Panner -> Solo -> Destination)
    project.tracks.forEach((track) => {
      let node = this.trackNodes.get(track.id)
      if (!node) {
        const solo = new Tone.Solo()
        const panner = new Tone.Panner(track.pan)
        const gain = new Tone.Volume(Tone.gainToDb(track.muted ? 0 : track.volume))

        gain.connect(panner)
        panner.connect(solo)
        solo.toDestination()

        node = { gain, panner, solo }
        this.trackNodes.set(track.id, node)
      } else {
        node.panner.pan.value = track.pan
        node.gain.volume.value = Tone.gainToDb(track.muted ? 0 : track.volume)
        node.solo.solo = track.solo
      }

      // Preload clip audio buffers
      track.clips.forEach((clip) => {
        if (!clip.assetPath) return
        const streamUrl = `${apiBase}/api/projects/${project.id}/audio/stream?asset_path=${encodeURIComponent(
          clip.assetPath,
        )}`

        try {
          const player = new Tone.Player({
            url: streamUrl,
            loop: false,
            volume: Tone.gainToDb(clip.volume ?? 1.0),
          }).connect(node.gain)

          this.players.set(clip.id, player)
        } catch (e) {
          console.warn(`Could not preload audio for clip ${clip.id}:`, e)
        }
      })
    })

    this.scheduleClips()
  }

  /**
   * Schedule all clips on the Tone.Transport timeline.
   */
  private scheduleClips(): void {
    if (!this.currentProject) return
    this.clearScheduledEvents()

    const bpm = this.currentProject.bpm
    const secondsPerBeat = 60 / bpm

    this.currentProject.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const player = this.players.get(clip.id)
        if (!player) return

        const startTime = clip.startBeat * secondsPerBeat
        const offset = clip.trimStart || 0
        const duration = clip.durationBeats * secondsPerBeat

        const eventId = Tone.getTransport().schedule((time) => {
          if (player.loaded) {
            player.start(time, offset, duration)
          }
        }, startTime)

        this.scheduledEvents.push(eventId)
      })
    })
  }

  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach((id) => Tone.getTransport().clear(id))
    this.scheduledEvents = []
  }

  /**
   * Transport Controls
   */
  async play(): Promise<void> {
    await this.init()
    Tone.getTransport().start()
    usePlaybackStore.getState().setState('playing')
    this.startClockLoop()
  }

  pause(): void {
    Tone.getTransport().pause()
    usePlaybackStore.getState().setState('paused')
    this.stopClockLoop()
  }

  stop(): void {
    Tone.getTransport().stop()
    this.players.forEach((p) => {
      if (p.state === 'started') p.stop()
    })
    usePlaybackStore.getState().stop()
    this.stopClockLoop()
  }

  seek(beat: number): void {
    if (!this.currentProject) return
    const seconds = beat * (60 / this.currentProject.bpm)
    Tone.getTransport().seconds = seconds
    usePlaybackStore.getState().setCurrentBeat(beat)
    usePlaybackStore.getState().setCurrentTime(seconds)
  }

  /**
   * Update real-time track volume and pan without reloading.
   */
  updateTrackControls(track: Track): void {
    const node = this.trackNodes.get(track.id)
    if (!node) return
    node.panner.pan.rampTo(track.pan, 0.05)
    node.gain.volume.rampTo(Tone.gainToDb(track.muted ? 0 : track.volume), 0.05)
    node.solo.solo = track.solo
  }

  /**
   * Real-time animation loop updating playback beat in store.
   */
  private startClockLoop(): void {
    const update = () => {
      if (Tone.getTransport().state === 'started') {
        const seconds = Tone.getTransport().seconds
        const bpm = this.currentProject?.bpm ?? 120
        const beat = seconds / (60 / bpm)
        usePlaybackStore.getState().setCurrentTime(seconds)
        usePlaybackStore.getState().setCurrentBeat(Math.round(beat * 100) / 100)
        this.animFrameId = requestAnimationFrame(update)
      }
    }
    this.animFrameId = requestAnimationFrame(update)
  }

  private stopClockLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  dispose(): void {
    this.stop()
    this.clearScheduledEvents()
    this.players.forEach((p) => p.dispose())
    this.players.clear()
    this.trackNodes.forEach((n) => {
      n.gain.dispose()
      n.panner.dispose()
      n.solo.dispose()
    })
    this.trackNodes.clear()
  }
}

export const audioEngine = new AudioEngine()
