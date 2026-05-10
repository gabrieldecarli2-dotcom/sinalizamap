const defaultApiUrl = `${window.location.origin}/api/index.php`

export const apiBaseUrl = import.meta.env.VITE_API_URL || defaultApiUrl

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function buildUrl(path: string, params?: Record<string, string>) {
  const url = new URL(apiBaseUrl)
  url.searchParams.set('resource', path.replace(/^\//, ''))

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return url.toString()
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  params?: Record<string, string>,
) {
  const response = await fetch(buildUrl(path, params), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error ?? 'Erro ao comunicar com a API.')
  }

  return data as T
}
