import { useEffect } from 'react'
import { captureInstallPrompt } from '@/lib/pwa'
import { useUiStore } from '@/store/uiStore'

/** 初始化 PWA：注册 Service Worker、捕获安装提示、提示新版本 */
export function usePwa(): void {
  const setUpdateAvailable = useUiStore((state) => state.setUpdateAvailable)

  useEffect(() => {
    return captureInstallPrompt(() => setUpdateAvailable(true))
  }, [setUpdateAvailable])
}