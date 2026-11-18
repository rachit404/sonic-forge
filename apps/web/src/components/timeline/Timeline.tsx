import { useProjectStore } from '@/stores/projectStore'
import { useUIStore } from '@/stores/uiStore'

export function Timeline() {
  const { activeProject } = useProjectStore()
  const { timelineZoom } = useUIStore()

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        <p>No project loaded</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      <TimelineRuler bpm={activeProject.bpm} zoom={timelineZoom} />

      <div className="flex-1 overflow-y-auto">
        {activeProject.tracks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
            No tracks yet — add tracks from the mixer panel
          </div>
        )}
        {activeProject.tracks.map((track) => (
          <TrackRow key={track.id} track={track} zoom={timelineZoom} />
        ))}
      </div>
    </div>
  )
}

function TimelineRuler({ bpm, zoom }: { bpm: number; zoom: number }) {
  const bars = Array.from({ length: 32 }, (_, i) => i + 1)

  return (
    <div className="h-8 bg-surface-raised border-b border-white/5 flex items-center overflow-x-auto shrink-0">
      <div className="w-48 shrink-0 border-r border-white/5" />
      <div className="flex items-end h-full">
        {bars.map((bar) => (
          <div
            key={bar}
            className="shrink-0 border-r border-white/5 h-full flex items-center justify-start pl-1"
            style={{ width: zoom * 4 }}
          >
            <span className="text-xs text-gray-600 font-mono">{bar}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrackRow({ track, zoom }: { track: import('@/types').Track; zoom: number }) {
  return (
    <div className="flex border-b border-white/5 h-20">
      <div className="w-48 shrink-0 bg-surface-raised border-r border-white/5 flex items-center px-3 gap-2">
        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: track.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{track.name}</p>
          <p className="text-xs text-gray-500">
            {track.muted ? 'Muted' : track.solo ? 'Solo' : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 relative bg-surface">
        {track.clips.map((clip) => (
          <ClipBlock key={clip.id} clip={clip} zoom={zoom} trackColor={track.color} />
        ))}
      </div>
    </div>
  )
}

function ClipBlock({
  clip,
  zoom,
  trackColor,
}: {
  clip: import('@/types').Clip
  zoom: number
  trackColor: string
}) {
  return (
    <div
      className="absolute top-1 bottom-1 rounded opacity-80 hover:opacity-100 transition-opacity cursor-grab flex items-center px-2"
      style={{
        left: clip.startBeat * zoom,
        width: clip.durationBeats * zoom,
        backgroundColor: trackColor + '33',
        borderLeft: `2px solid ${trackColor}`,
      }}
    >
      <span className="text-xs text-white truncate">{clip.name ?? 'Clip'}</span>
    </div>
  )
}
