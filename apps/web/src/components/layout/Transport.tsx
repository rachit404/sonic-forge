import { Play, Pause, Square, SkipBack } from 'lucide-react'
import { usePlaybackStore } from '@/stores/playbackStore'
import { audioEngine } from '@/services/audioEngine'

export function Transport() {
  const { state, currentBeat, bpm, setBpm } = usePlaybackStore()

  const handlePlayPause = async () => {
    if (state === 'playing') {
      audioEngine.pause()
    } else {
      await audioEngine.play()
    }
  }

  const handleStop = () => {
    audioEngine.stop()
  }

  const handleRewind = () => {
    audioEngine.stop()
    audioEngine.seek(0)
  }

  const formatBeat = (beat: number) => {
    const bar = Math.floor(beat / 4) + 1
    const beatInBar = (Math.floor(beat) % 4) + 1
    return `${bar}:${beatInBar}`
  }

  return (
    <div className="h-14 bg-surface-raised border-t border-white/5 flex items-center px-6 gap-6 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRewind}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Rewind to start"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={handlePlayPause}
          className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors shadow-md"
          title={state === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
        >
          {state === 'playing' ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={handleStop}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Stop"
        >
          <Square size={16} />
        </button>
      </div>

      <div className="font-mono text-sm text-white bg-surface px-3 py-1 rounded border border-white/5">
        {formatBeat(currentBeat)}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>BPM</span>
        <input
          type="number"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 120
            setBpm(val)
          }}
          className="w-16 bg-surface border border-white/10 rounded px-2 py-0.5 text-white font-mono text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto text-xs text-gray-500">
        {state === 'playing' && (
          <span className="flex items-center gap-1.5 text-accent font-medium">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            Playing
          </span>
        )}
      </div>
    </div>
  )
}
