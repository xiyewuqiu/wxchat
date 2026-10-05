import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { parseAiContent } from '@/lib/aiContent'
import { formatTime } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { MarkdownContent } from './MarkdownContent'
import { FileMessage } from './FileMessage'
import { ThinkingMessage } from './ThinkingMessage'
import {
  IconBrain,
  IconBot,
  IconMonitor,
  IconSmartphone,
  IconCheck,
  IconCopy,
  IconMoreHorizontal,
} from '@/components/icons'
import type { ChatMessage } from '@/types'

interface MessageItemProps {
  message: ChatMessage
  currentDeviceId: string
}

/** 单条消息：微信经典原生布局、温润护眼色彩、克制气泡边角与高可读排印 */
export const MessageItem = memo(function MessageItem({ message, currentDeviceId }: MessageItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toast = useUiStore((state) => state.toast)
  const ai = parseAiContent(message.content)
  const time = formatTime(message.timestamp)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [menuOpen])

  const handleCopy = useCallback(async () => {
    const textToCopy = ai ? ai.text : (message.content || '')
    if (!textToCopy) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      toast('已复制到剪贴板', 'info')
    } catch {
      toast('复制失败，请手动选择复制', 'error')
    }
    setMenuOpen(false)
  }, [ai, message.content, toast])

  if (ai?.kind === 'thinking') {
    return (
      <div className="message-row ai-row" data-message-id={message.id}>
        <div className="message-avatar-box ai" title="AI 推理">
          <IconBrain size={16} />
        </div>
        <div className="message-col">
          <div className="message-bubble ai-bubble">
            <ThinkingMessage content={ai.text} />
            <div className="bubble-meta">
              <span className="bubble-time">{time}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (ai?.kind === 'response') {
    return (
      <div className="message-row ai-row" data-message-id={message.id}>
        <div className="message-avatar-box ai" title="AI 助手">
          <IconBot size={16} />
        </div>
        <div className="message-col">
          <div className="message-bubble ai-bubble" ref={menuRef}>
            <div className="ai-bubble-tag">AI 助手</div>
            <div className="bubble-content-text">
              <MarkdownContent content={ai.text} />
            </div>
            <div className="bubble-meta">
              <span className="bubble-time">{time}</span>
              <button
                type="button"
                className="bubble-action-trigger"
                title="操作"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <IconMoreHorizontal size={13} />
              </button>
            </div>

            {menuOpen && (
              <div className="wechat-popover-menu left">
                <button type="button" className="popover-menu-item" onClick={handleCopy}>
                  <IconCopy size={13} />
                  <span>复制</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isOwn = message.device_id === currentDeviceId

  return (
    <div className={`message-row ${isOwn ? 'own-row' : 'other-row'}`} data-message-id={message.id}>
      {!isOwn && (
        <div className="message-avatar-box other" title="协同设备">
          <IconMonitor size={16} />
        </div>
      )}

      <div className="message-col">
        <div className={`message-bubble ${isOwn ? 'own-bubble' : 'other-bubble'}`} ref={menuRef}>
          {message.type === 'file' ? (
            <FileMessage message={message} isOwn={isOwn} />
          ) : (
            <div className="bubble-content-text">
              <MarkdownContent content={message.content ?? ''} />
            </div>
          )}

          <div className="bubble-meta">
            <span className="bubble-time">{time}</span>
            {isOwn && (
              <span className="bubble-check-icon" title="已同步">
                <IconCheck size={11} />
              </span>
            )}
            <button
              type="button"
              className="bubble-action-trigger"
              title="操作"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <IconMoreHorizontal size={13} />
            </button>
          </div>

          {menuOpen && (
            <div className={`wechat-popover-menu ${isOwn ? 'right' : 'left'}`}>
              <button type="button" className="popover-menu-item" onClick={handleCopy}>
                <IconCopy size={13} />
                <span>复制文本</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isOwn && (
        <div className="message-avatar-box own" title="本机">
          <IconSmartphone size={16} />
        </div>
      )}
    </div>
  )
})