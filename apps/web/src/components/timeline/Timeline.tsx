import { useState, useRef, useEffect } from 'react'
import { Plus, Upload, ZoomIn, ZoomOut, Trash2, Magnet } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useUIStore } from '@/stores/uiStore'
import { audioApi, tracksApi } from '@/services/api'
import { audioEngine } from '@/services/audioEngine'
import { snapBeat, type SnapValue, pxToBeat } from '@/utils/grid'
import { ClipBlock } from '@/components/timeline/ClipBlock'
import type { Track, Clip } from '@/types'

const SNAP_OPTIONS: { label: string; value: SnapValue }[] = [
  { label: '1 Bar (4b)', value: 'bar' },
  { label: '1/1 Beat', value: '1' },
  { label: '1/2 Beat', value: '1/2' },
  { label: '1/4 Beat', value: '1/4' },
  { label: 'Snap Off', value: 'off' },
]

export function Timeline() {
  const {
    activeProject,
    setActiveProject,
    addClipToTrack,
    deleteTrack,
    selectedClipId,
    removeClip,
    duplicateClip,
    splitClip,
  } = useProjectStore()
  const { timelineZoom, setTimelineZoom } = useUIStore()
  const { currentBeat } = usePlaybackStore()
  const [snap, setSnap] = useState<SnapValue>('1')
  const timelineRef = useRef<HTMLDivElement | null>(null)

  // Keyboard shortcuts: Delete, Duplicate (Ctrl+D), Split (S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      if (!activeProject || !selectedClipId) return

      // Find which track holds the selected clip
      const track = activeProject.tracks.find((t) =>
        t.clips.some((c) => c.id === selectedClipId),
      )
      if (!track) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeClip(track.id, selectedClipId)
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        duplicateClip(track.id, selectedClipId)
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        splitClip(track.id, selectedClipId, currentBeat)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeProject, selectedClipId, currentBeat, removeClip, duplicateClip, splitClip])

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
    const rawBeat = pxToBeat(clickX, timelineZoom)
    const finalBeat = snapBeat(rawBeat, snap)
    audioEngine.seek(finalBeat)
  }

  const playheadX = currentBeat * timelineZoom

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden select-none">
      {/* Timeline Toolbar */}
      <div className="h-10 bg-surface-raised border-b border-white/5 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddTrack}
            className="flex items-center gap-1.5 text-xs bg-surface-overlay hover:bg-white/10 text-white px-2.5 py-1.5 rounded transition-colors shadow-sm"
          >
            <Plus size={14} />
            Add Track
          </button>

          {/* Snap Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 border-l border-white/10 pl-3">
            <Magnet size={13} className={snap !== 'off' ? 'text-accent' : 'text-gray-500'} />
            <span>Snap:</span>
            <select
              value={snap}
              onChange={(e) => setSnap(e.target.value as SnapValue)}
              className="bg-surface border border-white/10 text-white rounded px-2 py-0.5 text-xs focus:outline-none focus:border-accent"
            >
              {SNAP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          <div ref={timelineRef} className="relative">
            {activeProject.tracks.map((track) => (
              <TrackRow
                key={track.id}
                projectId={activeProject.id}
                track={track}
                zoom={timelineZoom}
                snap={snap}
                onAddClip={(clip) => addClipToTrack(track.id, clip)}
                onDeleteTrack={() => deleteTrack(track.id)}
              />
            ))}

            {/* Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30"
              style={{ left: `calc(12rem + ${playheadX}px)` }}
            >
              <div className="w-0.5 h-full bg-accent shadow-sm" />
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
      <div className="w-48 shrink-0 border-r border-white/5 px-3 flex items-center text-[11px] text-gray-500 font-mono">
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
  snap,
  onAddClip,
  onDeleteTrack,
}: {
  projectId: string
  track: Track
  zoom: number
  snap: SnapValue
  onAddClip: (clip: Clip) => void
  onDeleteTrack: () => void
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-6 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{track.name}</p>
              <p className="text-[10px] text-gray-500">
                {track.muted ? 'MUTED' : track.solo ? 'SOLO' : `${Math.round(track.volume * 100)}%`}
              </p>
            </div>
          </div>

          <button
            onClick={onDeleteTrack}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-all"
            title="Delete Track"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Audio Import Button */}
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
          <ClipBlock
            key={clip.id}
            clip={clip}
            trackId={track.id}
            trackColor={track.color}
            zoom={zoom}
            snap={snap}
          />
        ))}
      </div>
    </div>
  )
}
