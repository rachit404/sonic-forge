/**
 * WaveformDisplay — Fast Canvas-based audio waveform renderer
 * Uses pre-extracted normalized peaks for zero-latency UI rendering.
 */
import { useEffect, useRef } from 'react'

interface WaveformDisplayProps {
  peaks?: number[]
  color?: string
  height?: number
  className?: string
}

export function WaveformDisplay({
  peaks = [],
  color = '#4a9eff',
  height = 48,
  className = '',
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth || 200
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, height)

    ctx.clearRect(0, 0, width, 1)

    // Fallback aesthetic waveform if no peaks provided
    const data =
      peaks.length > 0
        ? peaks
        : [0.2, 0.4, 0.7, 0.5, 0.8, 0.9, 0.6, 0.4, 0.7, 0.3, 0.5, 0.2]

    const barWidth = Math.max(2, width / data.length)
    const gap = 1
    const centerY = 0.5

    ctx.fillStyle = color

    data.forEach((peak, index) => {
      const x = index * barWidth
      const barHeight = Math.max(0.04, peak * 0.9)
      const y = centerY - barHeight / 2
      ctx.fillRect(x, y, Math.max(1, barWidth - gap), barHeight)
    })
  }, [peaks, color, height])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
      style={{ height: `${height}px` }}
    />
  )
}
