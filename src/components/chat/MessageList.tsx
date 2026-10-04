import { useCallback, useEffect, useRef } from 'react'
import { UI_CONFIG } from '@/config'
import { useChatStore } from '@/store/chatStore'
import { MessageItem } from './MessageItem'
import { StreamingBubble } from './StreamingBubble'

interface MessageListProps {
  currentDeviceId: string
  /** 从搜索结果定位过来的消息 ID，滚动到该消息并高亮 */
  highlightMessageId?: number | null
  onHighlightDone?: () => void
}

/** 消息列表：增量渲染、底部自动滚动、向上无限加载 */
export function MessageList({ currentDeviceId, highlightMessageId, onHighlightDone }: MessageListProps) {
  const messages = useChatStore((state) => state.messages)
  const loaded = useChatStore((state) => state.loaded)
  const isLoadingMore = useChatStore((state) => state.isLoadingMore)
  const hasMore = useChatStore((state) => state.hasMore)
  const totalLoaded = useChatStore((state) => state.totalLoaded)
  const streaming = useChatStore((state) => state.streaming)
  const scrollSignal = useChatStore((state) => state.scrollSignal)
  const loadMore = useChatStore((state) => state.loadMore)

  const listRef = useRef<HTMLDivElement>(null)
  const pendingRestoreRef = useRef<{ prevHeight: number; prevTotal: number } | null>(null)
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 需要滚动到底部时统一由 scrollSignal 驱动（首屏、发送消息、实时新消息）
  useEffect(() => {
    const element = listRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [scrollSignal])

  // 向上加载历史后，按高度差恢复视觉位置，避免内容跳动
  useEffect(() => {
    const pending = pendingRestoreRef.current
    const element = listRef.current
    if (!pending || !element) return
    pendingRestoreRef.current = null
    element.scrollTop += element.scrollHeight - pending.prevHeight
  }, [totalLoaded])

  const handleScroll = useCallback(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)

    scrollDebounceRef.current = setTimeout(() => {
      const element = listRef.current
      if (!element || !hasMore) return
      if (element.scrollTop > UI_CONFIG.INFINITE_SCROLL_THRESHOLD) return

      const prevHeight = element.scrollHeight
      const prevTotal = useChatStore.getState().totalLoaded
      pendingRestoreRef.current = { prevHeight, prevTotal }

      void loadMore().then(() => {
        // 没有真正加载到更多内容时撤销位置恢复，交给下次滚动
        if (useChatStore.getState().totalLoaded === prevTotal) {
          pendingRestoreRef.current = null
        }
      })
    }, UI_CONFIG.SCROLL_DEBOUNCE_DELAY)
  }, [hasMore, loadMore])

  useEffect(
    () => () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)
    },
    [],
  )

  // 搜索结果定位：滚动并短暂高亮
  useEffect(() => {
    if (highlightMessageId == null) return
    const element = listRef.current?.querySelector(`[data-message-id="${highlightMessageId}"]`)
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('message-highlight')
    const timer = setTimeout(() => {
      element.classList.remove('message-highlight')
      onHighlightDone?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [highlightMessageId, onHighlightDone])

  return (
    <div className="message-list" ref={listRef} onScroll={handleScroll}>
      {isLoadingMore && (
        <div className="top-loading-indicator fade-in" style={{ display: 'flex' }}>
          <div className="top-loading-content">
            <div className="top-loading-spinner">⏳</div>
            <span className="top-loading-text">加载历史消息中...</span>
          </div>
        </div>
      )}

      {loaded && messages.length === 0 && !streaming && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>还没有消息，开始聊天吧！</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentDeviceId={currentDeviceId} />
      ))}

      {streaming && <StreamingBubble content={streaming.content} thinking={streaming.thinking} />}
    </div>
  )
}