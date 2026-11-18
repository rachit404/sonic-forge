import { create } from 'zustand'
import type { GenerationJob, Provider } from '@/types'

interface GenerationState {
  jobs: GenerationJob[]
  providers: Provider[]
  selectedProviderId: string | null
  isLoadingProviders: boolean

  setJobs: (jobs: GenerationJob[]) => void
  addJob: (job: GenerationJob) => void
  updateJob: (jobId: string, updates: Partial<GenerationJob>) => void
  setProviders: (providers: Provider[]) => void
  setSelectedProvider: (id: string | null) => void
  setLoadingProviders: (loading: boolean) => void
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  jobs: [],
  providers: [],
  selectedProviderId: null,
  isLoadingProviders: false,

  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
  updateJob: (jobId, updates) =>
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
    })),
  setProviders: (providers) => set({ providers }),
  setSelectedProvider: (selectedProviderId) => set({ selectedProviderId }),
  setLoadingProviders: (isLoadingProviders) => set({ isLoadingProviders }),
}))
