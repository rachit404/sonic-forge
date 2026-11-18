import { useRef } from 'react'
import { Plus, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useUIStore } from '@/stores/uiStore'
import { audioApi, tracksApi } from '@/services/api'
import { audioEngine } from '@/services/audioEngine'
import { WaveformDisplay } from '@/components/waveform/WaveformDisplay'
import type { Track, Clip } from '@/types'

export function Timeline() {
  const { activeProject, setActiveProject, addClipToTrack } = useProjectStore()
  const { timelineZoom, setTimelineZoom } = useUIStore()
  const { currentBeat } = usePlaybackStore()
  const timelineRef = useRef<HTMLDivElement | null>(null)

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        <p>No project loaded</p>
      </div>
    )
  }

  const handleAddTrack = async () => {
    try {
      const res = await tracksApi.create(activeProject.id, {
        name: `Track ${activeProject.tracks.length + 1}`,
      })
      const newTrack = res.data as Track
      setActiveProject({
        ...activeProject,
        tracks: [...activeProject.tracks, newTrack],
      })
    } catch (err) {
      console.error('Failed to create track:', err)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const beat = Math.max(0, clickX / timelineZoom)
    audioEngine.seek(beat)
  }

  const playheadX = currentBeat * timelineZoom

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden select-none">
      {/* Timeline Toolbar */}
      <div className="h-10 bg-surface-raised border-b border-white/5 flex items-center px-4 justify-between shrink-0">
        <button
          onClick={handleAddTrack}
          className="flex items-center gap-1.5 text-xs bg-surface-overlay hover:bg-white/10 text-white px-2.5 py-1.5 rounded transition-colors"
        >
          <Plus size={14} />
          Add Track
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTimelineZoom(Math.max(20, timelineZoom - 10))}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-mono text-gray-400 w-10 text-center">{timelineZoom}px</span>
          <button
            onClick={() => setTimelineZoom(Math.min(120, timelineZoom + 10))}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Timeline Ruler */}
      <TimelineRuler
        zoom={timelineZoom}
        onSeek={handleSeek}
        playheadX={playheadX}
      />

      {/* Tracks Area */}
      <div className="flex-1 overflow-y-auto relative">
        {activeProject.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-3">
            <p>No tracks in this project yet.</p>
            <button
              onClick={handleAddTrack}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add First Track
            </button>
          </div>
        ) : (
          <div className="relative">
            {activeProject.tracks.map((track) => (
              <TrackRow
                key={track.id}
                projectId={activeProject.id}
                track={track}
                zoom={timelineZoom}
                onAddClip={(clip) => addClipToTrack(track.id, clip)}
              />
            ))}

            {/* Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30"
              style={{ left: `calc(12rem + ${playheadX}px)` }}
            >
              <div className="w-0.5 h-full bg-accent" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineRuler({
  zoom,
  onSeek,
  playheadX,
}: {
  zoom: number
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  playheadX: number
}) {
  const bars = Array.from({ length: 64 }, (_, i) => i + 1)

  return (
    <div className="h-8 bg-surface-raised border-b border-white/5 flex items-center overflow-x-hidden shrink-0 relative">
      <div className="w-48 shrink-0 border-r border-white/5 px-3 flex items-center text-xs text-gray-500 font-mono">
        TRACKS
      </div>

      <div
        className="flex items-end h-full flex-1 cursor-pointer relative"
        onClick={onSeek}
      >
        {bars.map((bar) => (
          <div
            key={bar}
            className="shrink-0 border-r border-white/5 h-full flex items-center justify-start pl-1 text-[10px] text-gray-500 font-mono"
            style={{ width: zoom * 4 }}
          >
            {bar}
          </div>
        ))}

        {/* Playhead indicator top badge */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: `${playheadX}px` }}
        >
          <div className="w-2.5 h-3 bg-accent -ml-1 rounded-b shadow-sm" />
        </div>
      </div>
    </div>
  )
}

function TrackRow({
  projectId,
  track,
  zoom,
  onAddClip,
}: {
  projectId: string
  track: Track
  zoom: number
  onAddClip: (clip: Clip) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await audioApi.upload(projectId, file)
      const data = res.data

      const bpm = 120
      const durationSeconds = data.duration_seconds || 4
      const durationBeats = Math.max(1, Math.round(durationSeconds * (bpm / 60)))

      const newClip: Clip = {
        id: crypto.randomUUID(),
        name: file.name,
        assetPath: data.asset_path,
        startBeat: 0,
        durationBeats: durationBeats,
        trimStart: 0,
        trimEnd: 0,
        fadeIn: 0,
        fadeOut: 0,
        volume: 1.0,
        peaks: data.peaks || [],
      }

      onAddClip(newClip)
    } catch (err) {
      console.error('Failed to upload audio:', err)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex border-b border-white/5 h-24 group">
      {/* Track Info Header */}
      <div className="w-48 shrink-0 bg-surface-raised border-r border-white/5 flex flex-col justify-between p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-6 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{track.name}</p>
            <p className="text-[10px] text-gray-500">
              {track.muted ? 'MUTED' : track.solo ? 'SOLO' : `${Math.round(track.volume * 100)}%`}
            </p>
          </div>
        </div>

        {/* Audio import button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.flac,.ogg,.aiff,.m4a"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-white bg-surface hover:bg-surface-overlay border border-white/5 rounded py-1 transition-colors"
          >
            <Upload size={12} />
            Import Audio
          </button>
        </div>
      </div>

      {/* Clip Placement Area */}
      <div className="flex-1 relative bg-surface overflow-x-hidden">
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
  clip: Clip
  zoom: number
  trackColor: string
}) {
  return (
    <div
      className="absolute top-2 bottom-2 rounded overflow-hidden flex flex-col justify-between border cursor-pointer hover:brightness-110 transition-all shadow-md group/clip"
      style={{
        left: clip.startBeat * zoom,
        width: Math.max(40, clip.durationBeats * zoom),
        backgroundColor: `${trackColor}22`,
        borderColor: trackColor,
      }}
    >
      {/* Clip Header */}
      <div
        className="px-2 py-0.5 text-[11px] font-medium text-white truncate flex items-center justify-between"
        style={{ backgroundColor: `${trackColor}66` }}
      >
        <span className="truncate">{clip.name ?? 'Audio Clip'}</span>
        <span className="text-[9px] opacity-75">{clip.durationBeats}b</span>
      </div>

      {/* Waveform Renderer */}
      <div className="flex-1 px-1 flex items-center">
        <WaveformDisplay
          peaks={clip.peaks}
          color={trackColor}
          height={32}
        />
      </div>
    </div>
  )
}
