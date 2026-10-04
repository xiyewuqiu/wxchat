// PWA 能力封装：Service Worker 注册、安装提示、缓存信息

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let registration: ServiceWorkerRegistration | null = null

export interface PwaStatus {
  installed: boolean
  serviceWorkerSupported: boolean
  serviceWorkerRegistered: boolean
  installPromptAvailable: boolean
  manifestAccessible: boolean
  cacheCount: number
}

export function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** 捕获浏览器安装提示事件（需在应用启动时调用一次） */
export function captureInstallPrompt(onUpdateAvailable: () => void): () => void {
  const handleBeforeInstall = (event: Event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
  }

  const handleInstalled = () => {
    deferredPrompt = null
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstall)
  window.addEventListener('appinstalled', handleInstalled)

  // 注册 Service Worker 并监听新版本
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        registration = reg
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdateAvailable()
            }
          })
        })
      })
      .catch((error) => {
        console.error('Service Worker 注册失败:', error)
      })
  }

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    window.removeEventListener('appinstalled', handleInstalled)
  }
}

async function getCacheCount(): Promise<number> {
  if (!('caches' in window)) return 0
  try {
    return (await caches.keys()).length
  } catch {
    return 0
  }
}

async function checkManifest(): Promise<boolean> {
  try {
    return (await fetch('/manifest.json')).ok
  } catch {
    return false
  }
}

export async function getPwaStatus(): Promise<PwaStatus> {
  return {
    installed: isInstalled(),
    serviceWorkerSupported: 'serviceWorker' in navigator,
    serviceWorkerRegistered: !!registration,
    installPromptAvailable: !!deferredPrompt,
    manifestAccessible: await checkManifest(),
    cacheCount: await getCacheCount(),
  }
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false

  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  return outcome === 'accepted'
}

/** 应用待更新的 Service Worker 并刷新页面 */
export function applyUpdate(): void {
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  window.location.reload()
}