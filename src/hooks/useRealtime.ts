import { useEffect } from 'react'
import { API_ENDPOINTS, UI_CONFIG } from '@/config'
import { get } from '@/lib/http'
import { tokenStore } from '@/lib/token'
import { getDeviceId } from '@/lib/utils'
import { useChatStore, selectLastMessageId } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'

interface PollResponse {
  success: boolean
  hasNewMessages: boolean
  newMessageCount: number
}

/**
 * 实时通信：优先 SSE 推送，连续重连失败后降级为长轮询。
 * 服务端只推送“有新消息”的信号，完整列表统一由 chatStore 拉取，保证单一数据源。
 */
export function useRealtime(enabled: boolean): void {
  const refresh = useChatStore((state) => state.refresh)
  const setConnectionStatus = useUiStore((state) => state.setConnectionStatus)

  useEffect(() => {
    if (!enabled) return

    const deviceId = getDeviceId()
    const token = tokenStore.get() ?? ''

    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    let polling = false
    let disposed = false

    const startPolling = () => {
      if (polling || disposed) return
      polling = true

      const poll = async () => {
        if (disposed) return
        try {
          const result = await get<PollResponse>(API_ENDPOINTS.POLL, {
            deviceId,
            lastMessageId: selectLastMessageId(useChatStore.getState()),
            timeout: 30,
          })
          if (result.success && result.hasNewMessages) {
            await refresh(true)
          }
          setConnectionStatus('connected')
        } catch {
          setConnectionStatus('disconnected')
        }
        if (!disposed) pollTimer = setTimeout(poll, UI_CONFIG.AUTO_REFRESH_INTERVAL)
      }

      void poll()
    }

    const connect = () => {
      if (disposed) return
      const url = `${API_ENDPOINTS.EVENTS}?deviceId=${encodeURIComponent(deviceId)}&token=${encodeURIComponent(token)}`
      eventSource = new EventSource(url)

      eventSource.addEventListener('connection', () => {
        attempts = 0
        setConnectionStatus('connected')
      })

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as { newMessages?: number }
          if (data.newMessages && data.newMessages > 0) {
            void refresh(true)
          }
        } catch {
          // 忽略无法解析的推送
        }
      })

      eventSource.onerror = () => {
        eventSource?.close()
        eventSource = null
        if (disposed) return

        if (attempts >= UI_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          startPolling()
          return
        }

        attempts++
        setConnectionStatus('reconnecting')
        reconnectTimer = setTimeout(connect, 1000 * 2 ** (attempts - 1))
      }
    }

    connect()

    return () => {
      disposed = true
      eventSource?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [enabled, refresh, setConnectionStatus])
}