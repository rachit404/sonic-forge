import { Play, Pause, Square, SkipBack } from 'lucide-react'
import { usePlaybackStore } from '@/stores/playbackStore'

export function Transport() {
  const { state, currentBeat, bpm, play, pause, stop } = usePlaybackStore()

  const handlePlayPause = () => {
    if (state === 'playing') pause()
    else play()
  }

  const formatBeat = (beat: number) => {
    const bar = Math.floor(beat / 4) + 1
    const beatInBar = (beat % 4) + 1
    return `${bar}:${beatInBar}`
  }

  return (
    <div className="h-14 bg-surface-raised border-t border-white/5 flex items-center px-6 gap-6 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={stop}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Stop"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={handlePlayPause}
          className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors"
          title={state === 'playing' ? 'Pause' : 'Play'}
        >
          {state === 'playing' ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={stop}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Stop"
        >
          <Square size={16} />
        </button>
      </div>

      <div className="font-mono text-sm text-white bg-surface px-3 py-1 rounded">
        {formatBeat(currentBeat)}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>BPM</span>
        <span className="font-mono text-white">{bpm}</span>
      </div>

      <div className="flex items-center gap-2 ml-auto text-xs text-gray-600">
        {state === 'playing' && (
          <span className="flex items-center gap-1 text-accent">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            Playing
          </span>
        )}
      </div>
    </div>
  )
}
