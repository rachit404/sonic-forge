import { useProjectStore } from '@/stores/projectStore'

export function MixerPanel() {
  const { activeProject, updateTrack } = useProjectStore()

  if (!activeProject) {
    return <div className="flex items-center justify-center h-full text-gray-600">No project loaded</div>
  }

  return (
    <div className="h-full bg-surface p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-6">Mixer</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeProject.tracks.map((track) => (
          <TrackChannel
            key={track.id}
            track={track}
            onVolumeChange={(v) => updateTrack(track.id, { volume: v })}
            onPanChange={(p) => updateTrack(track.id, { pan: p })}
            onMuteToggle={() => updateTrack(track.id, { muted: !track.muted })}
            onSoloToggle={() => updateTrack(track.id, { solo: !track.solo })}
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
  track: import('@/types').Track
  onVolumeChange: (v: number) => void
  onPanChange: (p: number) => void
  onMuteToggle: () => void
  onSoloToggle: () => void
}) {
  return (
    <div className="flex flex-col items-center bg-surface-raised rounded-xl p-4 w-24 shrink-0 gap-3">
      <div className="w-full h-1 rounded-full" style={{ backgroundColor: track.color }} />

      <div className="w-full">
        <label className="text-xs text-gray-500 block text-center mb-1">PAN</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => onPanChange(parseFloat(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="flex flex-col items-center gap-1 flex-1">
        <label className="text-xs text-gray-500">VOL</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          orient="vertical"
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="h-24 accent-accent"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
        <span className="text-xs font-mono text-gray-400">
          {Math.round(track.volume * 100)}
        </span>
      </div>

      <div className="flex gap-1 w-full">
        <button
          onClick={onMuteToggle}
          className={`flex-1 text-xs py-1 rounded font-bold transition-colors ${
            track.muted ? 'bg-yellow-500/80 text-black' : 'bg-surface text-gray-500 hover:text-white'
          }`}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          className={`flex-1 text-xs py-1 rounded font-bold transition-colors ${
            track.solo ? 'bg-accent text-white' : 'bg-surface text-gray-500 hover:text-white'
          }`}
        >
          S
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center truncate w-full">{track.name}</p>
    </div>
  )
}
