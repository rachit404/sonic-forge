type SSECallback = (data: Record<string, unknown>) => void

export function subscribeToJobProgress(jobId: string, onMessage: SSECallback, onError?: () => void): () => void {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  const url = `${BASE_URL}/api/generation/jobs/${jobId}/stream`
  const es = new EventSource(url)

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as Record<string, unknown>
      onMessage(data)
    } catch {
      // ignore
    }
  }

  es.onerror = () => {
    onError?.()
    es.close()
  }

  return () => es.close()
}
