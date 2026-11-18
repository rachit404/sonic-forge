import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { useUIStore } from '@/stores/uiStore'
import { projectsApi } from '@/services/api'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { Timeline } from '@/components/timeline/Timeline'
import { MixerPanel } from '@/components/mixer/MixerPanel'
import { GenerationPanel } from '@/components/generation/GenerationPanel'
import { Transport } from '@/components/layout/Transport'
import type { Project } from '@/types'

export function Workspace() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { setActiveProject, setLoading, setError } = useProjectStore()
  const { activePanel } = useUIStore()

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    projectsApi.get(projectId)
      .then((res) => setActiveProject(res.data as Project))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
    return () => setActiveProject(null)
  }, [projectId, setActiveProject, setLoading, setError, navigate])

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
