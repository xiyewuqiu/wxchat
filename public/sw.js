// 微信文件传输助手 Service Worker
// 静态资源与哈希产物走缓存优先，导航请求走网络优先，API 一律不缓存。

const CACHE_VERSION = 'v2.0.0'
const STATIC_CACHE = `wxchat-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `wxchat-runtime-${CACHE_VERSION}`

// 需要预缓存的入口与图标（构建产物由运行时缓存接管）
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/ios/32.png',
  '/icons/ios/180.png',
  '/icons/android/android-launchericon-192-192.png',
  '/icons/android/android-launchericon-512-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      // 逐个缓存，单个失败不影响整体安装
      await Promise.all(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((error) => console.warn('预缓存失败:', url, error)),
        ),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('wxchat-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    const fallback = await caches.match('/index.html')
    if (fallback) return fallback
    throw error
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 仅处理同源 GET 请求
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API 与实时通道必须走网络，绝不缓存
  if (url.pathname.startsWith('/api/')) return

  // 页面导航：网络优先，离线回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // 静态资源：缓存优先
  if (/\.(?:js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/.test(url.pathname) || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request))
  }
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})