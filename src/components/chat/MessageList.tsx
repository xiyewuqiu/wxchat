import { useCallback, useEffect, useRef } from 'react'
import { UI_CONFIG } from '@/config'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'
import { MessageItem } from './MessageItem'
import { StreamingBubble } from './StreamingBubble'
import { IconSparkles, IconPalette, IconSearch } from '@/components/icons'

interface MessageListProps {
  currentDeviceId: string
  highlightMessageId?: number | null
  onHighlightDone?: () => void
  onQuickPrompt?: (text: string) => void
}

/** 消息列表：智能平滑自适应滚动、弹性上滑加载、纯矢量空状态引导与精准锚定 */
export function MessageList({
  currentDeviceId,
  highlightMessageId,
  onHighlightDone,
  onQuickPrompt,
}: MessageListProps) {
  const messages = useChatStore((state) => state.messages)
  const loaded = useChatStore((state) => state.loaded)
  const isLoadingMore = useChatStore((state) => state.isLoadingMore)
  const hasMore = useChatStore((state) => state.hasMore)
  const totalLoaded = useChatStore((state) => state.totalLoaded)
  const streaming = useChatStore((state) => state.streaming)
  const scrollSignal = useChatStore((state) => state.scrollSignal)
  const loadMore = useChatStore((state) => state.loadMore)
  const setImageGenOpen = useUiStore((state) => state.setImageGenOpen)
  const setSearchOpen = useUiStore((state) => state.setSearchOpen)
  const toggleAiMode = useUiStore((state) => state.toggleAiMode)

  const listRef = useRef<HTMLDivElement>(null)
  const pendingRestoreRef = useRef<{ prevHeight: number; prevTotal: number } | null>(null)
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth',
    })
  }, [scrollSignal])

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

  useEffect(() => {
    if (highlightMessageId == null) return
    const element = listRef.current?.querySelector(`[data-message-id="${highlightMessageId}"]`)
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('message-highlight')
    const timer = setTimeout(() => {
      element.classList.remove('message-highlight')
      onHighlightDone?.()
    }, 2800)

    return () => clearTimeout(timer)
  }, [highlightMessageId, onHighlightDone])

  return (
    <div className="message-list" ref={listRef} onScroll={handleScroll}>
      {isLoadingMore && (
        <div className="top-loading-indicator" style={{ display: 'flex' }}>
          <div className="top-loading-card">
            <span className="top-loading-spinner" />
            <span className="top-loading-text">正在回溯云端历史消息...</span>
          </div>
        </div>
      )}

      {/* 初始空状态欢迎探索卡片 (前沿纯矢量图标) */}
      {loaded && messages.length === 0 && !streaming && (
        <div className="welcome-empty-container">
          <div className="welcome-hero-card">
            <div className="welcome-icon-glow">
              <img src="/icons/icon.svg" alt="文件传输助手" className="welcome-avatar-img" />
            </div>
            <h2 className="welcome-hero-title">文件传输助手已就绪</h2>
            <p className="welcome-hero-desc">
              在手机、电脑等任意设备间即时同步文件、图片与文本，同时支持内嵌 AI 深度创作。
            </p>

            <div className="welcome-quick-actions">
              <button
                type="button"
                className="quick-pill-card"
                onClick={() => {
                  toggleAiMode()
                  onQuickPrompt?.('帮我写一段精简的周工作汇报总结')
                }}
              >
                <div className="pill-vector-icon ai">
                  <IconSparkles size={18} />
                </div>
                <div className="pill-content">
                  <span className="pill-title">AI 智能辅助</span>
                  <span className="pill-hint">写总结、改代码、提炼要点</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-pill-card"
                onClick={() => setImageGenOpen(true)}
              >
                <div className="pill-vector-icon draw">
                  <IconPalette size={18} />
                </div>
                <div className="pill-content">
                  <span className="pill-title">AI 绘图工坊</span>
                  <span className="pill-hint">一键绘制高品质插画与灵感</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-pill-card"
                onClick={() => setSearchOpen(true)}
              >
                <div className="pill-vector-icon search">
                  <IconSearch size={18} />
                </div>
                <div className="pill-content">
                  <span className="pill-title">全域文件检索</span>
                  <span className="pill-hint">按类型和时间秒级定位历史</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 消息流 */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentDeviceId={currentDeviceId} />
      ))}

      {streaming && <StreamingBubble content={streaming.content} thinking={streaming.thinking} />}
    </div>
  )
}