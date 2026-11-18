/**
 * Interactive ClipBlock — handles moving, trimming, splitting, and selection.
 * Pure native pointer events — zero bloat, high precision.
 */
import { useState, useRef } from 'react'
import { Copy, Scissors, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { snapBeat, type SnapValue, pxToBeat } from '@/utils/grid'
import { WaveformDisplay } from '@/components/waveform/WaveformDisplay'
import type { Clip } from '@/types'

interface ClipBlockProps {
  clip: Clip
  trackId: string
  trackColor: string
  zoom: number
  snap: SnapValue
}

export function ClipBlock({
  clip,
  trackId,
  trackColor,
  zoom,
  snap,
}: ClipBlockProps) {
  const {
    selectedClipId,
    setSelectedClipId,
    moveClip,
    updateClip,
    removeClip,
    duplicateClip,
    splitClip,
  } = useProjectStore()
  const { currentBeat } = usePlaybackStore()

  const [isDragging, setIsDragging] = useState(false)
  const isSelected = selectedClipId === clip.id

  // Dragging state
  const dragStartRef = useRef<{ startX: number; originalStartBeat: number }>({
    startX: 0,
    originalStartBeat: 0,
  })

  // Trimming state
  const trimStartRef = useRef<{ startX: number; originalDuration: number; originalStartBeat: number; originalTrimStart: number }>({
    startX: 0,
    originalDuration: 0,
    originalStartBeat: 0,
    originalTrimStart: 0,
  })

  // 1. Move clip (horizontal drag)
  const handleBodyPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    setSelectedClipId(clip.id)
    setIsDragging(true)

    dragStartRef.current = {
      startX: e.clientX,
      originalStartBeat: clip.startBeat,
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaPx = moveEvt.clientX - dragStartRef.current.startX
      const deltaBeats = pxToBeat(deltaPx, zoom)
      const rawNewBeat = dragStartRef.current.originalStartBeat + deltaBeats
      const finalBeat = snapBeat(rawNewBeat, snap)
      moveClip(trackId, trackId, clip.id, finalBeat)
    }

    const onPointerUp = () => {
      setIsDragging(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // 2. Trim right handle (change duration)
  const handleRightTrimPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    trimStartRef.current = {
      startX: e.clientX,
      originalDuration: clip.durationBeats,
      originalStartBeat: clip.startBeat,
      originalTrimStart: clip.trimStart || 0,
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaPx = moveEvt.clientX - trimStartRef.current.startX
      const deltaBeats = pxToBeat(deltaPx, zoom)
      const rawDuration = trimStartRef.current.originalDuration + deltaBeats
      const finalDuration = Math.max(0.25, snapBeat(rawDuration, snap))
      updateClip(trackId, clip.id, { durationBeats: finalDuration })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // 3. Trim left handle (change start beat and duration)
  const handleLeftTrimPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    trimStartRef.current = {
      startX: e.clientX,
      originalDuration: clip.durationBeats,
      originalStartBeat: clip.startBeat,
      originalTrimStart: clip.trimStart || 0,
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaPx = moveEvt.clientX - trimStartRef.current.startX
      const deltaBeats = pxToBeat(deltaPx, zoom)
      const rawStartBeat = trimStartRef.current.originalStartBeat + deltaBeats
      const finalStartBeat = Math.max(0, snapBeat(rawStartBeat, snap))

      const diff = finalStartBeat - trimStartRef.current.originalStartBeat
      const newDuration = Math.max(0.25, trimStartRef.current.originalDuration - diff)

      updateClip(trackId, clip.id, {
        startBeat: finalStartBeat,
        durationBeats: newDuration,
      })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const leftPx = clip.startBeat * zoom
  const widthPx = Math.max(36, clip.durationBeats * zoom)

  return (
    <div
      onPointerDown={handleBodyPointerDown}
      className={`absolute top-2 bottom-2 rounded-lg overflow-hidden flex flex-col justify-between border cursor-grab select-none shadow-md transition-shadow group/clip ${
        isDragging ? 'cursor-grabbing opacity-90 scale-[1.01] z-20 shadow-xl' : 'z-10'
      } ${
        isSelected ? 'ring-2 ring-white border-white' : 'hover:brightness-110'
      }`}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
        backgroundColor: `${trackColor}22`,
        borderColor: isSelected ? '#ffffff' : trackColor,
      }}
    >
      {/* Left Trim Handle */}
      <div
        onPointerDown={handleLeftTrimPointerDown}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 transition-colors z-20"
        title="Trim Start"
      />

      {/* Clip Header Banner */}
      <div
        className="px-2 py-0.5 text-[11px] font-medium text-white truncate flex items-center justify-between"
        style={{ backgroundColor: `${trackColor}77` }}
      >
        <span className="truncate pr-1">{clip.name ?? 'Audio Clip'}</span>
        <span className="text-[9px] opacity-80 shrink-0 font-mono">{clip.durationBeats}b</span>
      </div>

      {/* Waveform Visualization */}
      <div className="flex-1 px-1 flex items-center overflow-hidden">
        <WaveformDisplay peaks={clip.peaks} color={trackColor} height={32} />
      </div>

      {/* Floating Action Bar (visible on hover / selected) */}
      <div className="absolute top-1 right-1 opacity-0 group-hover/clip:opacity-100 flex items-center gap-0.5 bg-surface-raised/90 rounded px-1 py-0.5 border border-white/10 shadow transition-opacity z-30">
        <button
          onClick={(e) => {
            e.stopPropagation()
            duplicateClip(trackId, clip.id)
          }}
          className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded"
          title="Duplicate Clip"
        >
          <Copy size={11} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            splitClip(trackId, clip.id, currentBeat)
          }}
          className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded"
          title="Split at Playhead (S)"
        >
          <Scissors size={11} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            removeClip(trackId, clip.id)
          }}
          className="p-1 hover:text-red-400 text-gray-400 hover:bg-white/10 rounded"
          title="Delete Clip (Del)"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Right Trim Handle */}
      <div
        onPointerDown={handleRightTrimPointerDown}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 transition-colors z-20"
        title="Trim End"
      />
    </div>
  )
}
