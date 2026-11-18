import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Music, Clock } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { projectsApi } from '@/services/api'
import type { Project } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const { projects, setProjects, isLoading, setLoading, setError } = useProjectStore()

  useEffect(() => {
    setLoading(true)
    projectsApi.list()
      .then((res) => setProjects(res.data as Project[]))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [setProjects, setLoading, setError])

  const createProject = async () => {
    try {
      const res = await projectsApi.create({ name: 'New Project', bpm: 120 })
      const project = res.data as Project
      navigate(`/workspace/${project.id}`)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="h-full bg-surface p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Projects</h1>
            <p className="text-gray-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={createProject}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Music size={48} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-6">Create your first project to start composing</p>
            <button
              onClick={createProject}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Create Project
            </button>
          </div>
        )}

        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/workspace/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const updatedAt = new Date(project.updatedAt).toLocaleDateString()
  return (
    <button
      onClick={onClick}
      className="bg-surface-raised border border-white/5 rounded-xl p-5 text-left hover:border-accent/40 hover:bg-surface-overlay transition-all group"
    >
      <div className="h-16 bg-surface-overlay rounded-lg mb-4 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
        <Music size={24} className="text-gray-600 group-hover:text-accent transition-colors" />
      </div>

      <h3 className="font-semibold text-white truncate mb-1">{project.name}</h3>
      <p className="text-xs text-gray-500">{project.bpm} BPM · {project.tracks.length} tracks</p>

      <div className="flex items-center gap-1 mt-3 text-xs text-gray-600">
        <Clock size={12} />
        <span>{updatedAt}</span>
      </div>
    </button>
  )
}
