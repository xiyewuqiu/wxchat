import { useEffect } from 'react'
import { clearImageCache } from '@/lib/utils'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'

/**
 * 全局副作用：网络状态、页面可见性、卸载清理。
 * 仅在聊天页挂载，避免登录页产生无谓请求。
 */
export function useGlobalCommands(): void {
  const refresh = useChatStore((state) => state.refresh)
  const setConnectionStatus = useUiStore((state) => state.setConnectionStatus)

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected')
      void refresh(false)
    }

    const handleOffline = () => setConnectionStatus('offline')

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh(false)
      }
    }

    const handleUnload = () => clearImageCache()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [refresh, setConnectionStatus])
}