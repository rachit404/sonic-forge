import { useState, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useGenerationStore } from '@/stores/generationStore'
import { generationApi } from '@/services/api'
import type { GenerationJob, Provider } from '@/types'

export function GenerationPanel({ projectId }: { projectId: string }) {
  const { jobs, providers, addJob, updateJob, setProviders, selectedProviderId, setSelectedProvider } =
    useGenerationStore()
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    generationApi
      .getProviders()
      .then((res) => {
        const providers = res.data as Provider[]
        setProviders(providers)
        if (providers.length > 0 && !selectedProviderId) {
          setSelectedProvider(providers[0].id)
        }
      })
      .catch(() => setProviders([]))
  }, [setProviders, setSelectedProvider, selectedProviderId])

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedProviderId) return
    setIsSubmitting(true)
    try {
      const res = await generationApi.createJob({
        project_id: projectId,
        prompt: prompt.trim(),
        provider_id: selectedProviderId,
        duration_seconds: duration,
      })
      addJob(res.data as GenerationJob)
      setPrompt('')
    } catch (err) {
      console.error('Failed to start generation:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        AI Music Generation
      </h2>

      <div className="bg-surface-raised rounded-xl p-4 mb-4">
        <label className="block text-sm text-gray-400 mb-2">Describe your music</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. lo-fi hip hop with mellow piano and soft drums, 90s nostalgic feel"
          className="w-full h-24 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent resize-none"
        />

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-400">Duration:</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-surface border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-accent"
            >
              {[5, 10, 15, 20, 30].map((s) => (
                <option key={s} value={s}>{s}s</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm flex-1">
            <label className="text-gray-400">Model:</label>
            <select
              value={selectedProviderId ?? ''}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="flex-1 bg-surface border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-accent"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName} {p.isLocal ? '(local)' : '(API)'}
                </option>
              ))}
              {providers.length === 0 && (
                <option value="">No models available</option>
              )}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isSubmitting || !prompt.trim() || !selectedProviderId}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Generate
          </button>
        </div>

        {providers.find((p) => p.id === selectedProviderId)?.isLocal && (
          <p className="text-xs text-yellow-500/80 mt-2">
            ⚠ Local inference on CPU may take 2–5 minutes. You can continue working while it runs.
          </p>
        )}
      </div>

      {jobs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Generation Queue</h3>
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function JobCard({ job }: { job: GenerationJob }) {
  const icon = {
    queued: <Clock size={14} className="text-gray-400" />,
    running: <Loader2 size={14} className="animate-spin text-accent" />,
    done: <CheckCircle size={14} className="text-green-400" />,
    failed: <XCircle size={14} className="text-red-400" />,
  }[job.status]

  return (
    <div className="bg-surface-raised rounded-lg p-3 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{job.prompt}</p>
        <p className="text-xs text-gray-500 capitalize mt-0.5">{job.status}</p>
        {job.status === 'running' && (
          <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        )}
        {job.error && <p className="text-xs text-red-400 mt-1">{job.error}</p>}
      </div>
    </div>
  )
}
