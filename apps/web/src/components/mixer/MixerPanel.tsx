import { useProjectStore } from '@/stores/projectStore'
import { audioEngine } from '@/services/audioEngine'
import type { Track } from '@/types'

export function MixerPanel() {
  const { activeProject, updateTrack } = useProjectStore()

  if (!activeProject) {
    return <div className="flex items-center justify-center h-full text-gray-600">No project loaded</div>
  }

  const handleUpdate = (track: Track, updates: Partial<Track>) => {
    updateTrack(track.id, updates)
    const updated = { ...track, ...updates }
    audioEngine.updateTrackControls(updated)
  }

  return (
    <div className="h-full bg-surface p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Mixer</h2>
        <span className="text-xs text-gray-500 font-mono">{activeProject.tracks.length} Channels</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeProject.tracks.map((track) => (
          <TrackChannel
            key={track.id}
            track={track}
            onVolumeChange={(v) => handleUpdate(track, { volume: v })}
            onPanChange={(p) => handleUpdate(track, { pan: p })}
            onMuteToggle={() => handleUpdate(track, { muted: !track.muted })}
            onSoloToggle={() => handleUpdate(track, { solo: !track.solo })}
          />
        ))}
      </div>
    </div>
  )
}

function TrackChannel({
  track,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
}: {
  track: Track
  onVolumeChange: (v: number) => void
  onPanChange: (p: number) => void
  onMuteToggle: () => void
  onSoloToggle: () => void
}) {
  return (
    <div className="flex flex-col items-center bg-surface-raised rounded-xl p-4 w-28 shrink-0 gap-3 border border-white/5 shadow-md">
      {/* Track Color Pill */}
      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: track.color }} />

      {/* Track Name */}
      <p className="text-xs font-medium text-white text-center truncate w-full" title={track.name}>
        {track.name}
      </p>

      {/* Pan Knobs / Slider */}
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
          <span>L</span>
          <span className="font-mono">{track.pan > 0 ? `+${track.pan}` : track.pan === 0 ? 'C' : track.pan}</span>
          <span>R</span>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.05"
          value={track.pan}
          onChange={(e) => onPanChange(parseFloat(e.target.value))}
          className="w-full accent-accent cursor-pointer h-1 bg-surface-overlay rounded-lg"
        />
      </div>

      {/* Volume Fader */}
      <div className="flex flex-col items-center gap-1.5 flex-1 my-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          orient="vertical"
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="h-28 accent-accent cursor-pointer"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
        <span className="text-[11px] font-mono text-gray-300">
          {Math.round(track.volume * 100)}%
        </span>
      </div>

      {/* Mute & Solo Buttons */}
      <div className="flex gap-1.5 w-full mt-auto">
        <button
          onClick={onMuteToggle}
          className={`flex-1 text-xs py-1 rounded font-bold transition-all shadow-sm ${
            track.muted
              ? 'bg-yellow-500 text-black font-extrabold'
              : 'bg-surface text-gray-500 hover:text-white hover:bg-white/5'
          }`}
          title="Mute Track"
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          className={`flex-1 text-xs py-1 rounded font-bold transition-all shadow-sm ${
            track.solo
              ? 'bg-accent text-white font-extrabold'
              : 'bg-surface text-gray-500 hover:text-white hover:bg-white/5'
          }`}
          title="Solo Track"
        >
          S
        </button>
      </div>
    </div>
  )
}
