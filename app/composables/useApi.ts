export const useApi = () => {
  const config = useRuntimeConfig()

  const get = <T>(endpoint: string) =>
    useFetch<T>(`${config.public.apiBase}${endpoint}`)

  const post = <T>(endpoint: string, body: object) =>
    useFetch<T>(`${config.public.apiBase}${endpoint}`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    })

  const put = <T>(endpoint: string, body: object) =>
    useFetch<T>(`${config.public.apiBase}${endpoint}`, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/json' },
    })

  const del = <T>(endpoint: string) =>
    useFetch<T>(`${config.public.apiBase}${endpoint}`, { method: 'DELETE' })

  return { get, post, put, del }
}
