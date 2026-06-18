export default defineEventHandler((event) => {
  const target = `http://127.0.0.1:8000${event.path}`
  console.log(`[proxy] ${event.method} ${target}`)
  return proxyRequest(event, target)
})
