interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

const backendUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL || '').replace(/\/$/, '')

export function getBackendUrl() {
  return backendUrl
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!backendUrl) throw new Error('BACKEND_URL is not configured; RepoLens is running in demo mode.')
  const response = await fetch(`${backendUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  if (!response.ok) throw new Error(`Backend request failed: ${response.status}`)
  return response.json() as Promise<T>
}
