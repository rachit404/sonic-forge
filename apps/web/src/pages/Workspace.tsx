import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useUIStore } from '@/stores/uiStore'
import { projectsApi } from '@/services/api'
import { audioEngine } from '@/services/audioEngine'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { Timeline } from '@/components/timeline/Timeline'
import { MixerPanel } from '@/components/mixer/MixerPanel'
import { GenerationPanel } from '@/components/generation/GenerationPanel'
import { Transport } from '@/components/layout/Transport'
import type { Project } from '@/types'

export function Workspace() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { activeProject, setActiveProject, setLoading, setError } = useProjectStore()
  const { setBpm } = usePlaybackStore()
  const { activePanel } = useUIStore()

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    projectsApi
      .get(projectId)
      .then((res) => {
        const project = res.data as Project
        setActiveProject(project)
        setBpm(project.bpm)
        audioEngine.loadProject(project)
      })
      .catch((err) => {
        setError(String(err))
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))

    return () => {
      audioEngine.stop()
      audioEngine.dispose()
      setActiveProject(null)
    }
  }, [projectId, setActiveProject, setBpm, setLoading, setError, navigate])

  // Reload audio engine when tracks or clips change
  useEffect(() => {
    if (activeProject) {
      audioEngine.loadProject(activeProject)
    }
  }, [activeProject])

  // Keyboard shortcut: Spacebar toggles Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault()
        const state = usePlaybackStore.getState().state
        if (state === 'playing') {
          audioEngine.pause()
        } else {
          audioEngine.play()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-full bg-surface">
      <WorkspaceSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex-1 overflow-hidden">
          {activePanel === 'timeline' && <Timeline />}
          {activePanel === 'mixer' && <MixerPanel />}
          {activePanel === 'generation' && <GenerationPanel projectId={projectId ?? ''} />}
        </div>

        <Transport />
      </div>
    </div>
  )
}
