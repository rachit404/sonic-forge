import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

export const projectsApi = {
  list: () => apiClient.get('/projects'),
  get: (id: string) => apiClient.get(`/projects/${id}`),
  create: (data: { name: string; bpm?: number }) => apiClient.post('/projects', data),
  update: (id: string, data: Partial<{ name: string; bpm: number }>) =>
    apiClient.patch(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
}

export const tracksApi = {
  create: (projectId: string, data: { name: string }) =>
    apiClient.post(`/projects/${projectId}/tracks`, data),
  update: (projectId: string, trackId: string, data: object) =>
    apiClient.patch(`/projects/${projectId}/tracks/${trackId}`, data),
  delete: (projectId: string, trackId: string) =>
    apiClient.delete(`/projects/${projectId}/tracks/${trackId}`),
}

export const audioApi = {
  upload: (projectId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/projects/${projectId}/audio/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getWaveform: (projectId: string, assetPath: string) =>
    apiClient.get(`/projects/${projectId}/audio/waveform`, { params: { asset_path: assetPath } }),
}

export const generationApi = {
  getProviders: () => apiClient.get('/generation/providers'),
  createJob: (data: { project_id: string; prompt: string; provider_id: string; duration_seconds?: number }) =>
    apiClient.post('/generation/jobs', data),
  getJob: (jobId: string) => apiClient.get(`/generation/jobs/${jobId}`),
  listJobs: (projectId: string) => apiClient.get('/generation/jobs', { params: { project_id: projectId } }),
}

export const exportApi = {
  export: (projectId: string, options: { format: string; sample_rate?: number; bit_depth?: number }) =>
    apiClient.post(`/projects/${projectId}/export`, options),
}

export const healthApi = {
  check: () => apiClient.get('/health'),
}
