import { memo } from 'react'
import { parseAiContent } from '@/lib/aiContent'
import { formatTime } from '@/lib/utils'
import { MarkdownContent } from './MarkdownContent'
import { FileMessage } from './FileMessage'
import { ThinkingMessage } from './ThinkingMessage'
import type { ChatMessage } from '@/types'

interface MessageItemProps {
  message: ChatMessage
  currentDeviceId: string
}

/** 单条消息：按 AI 思考 / AI 回答 / 文件 / 文本 分派渲染 */
export const MessageItem = memo(function MessageItem({ message, currentDeviceId }: MessageItemProps) {
  const ai = parseAiContent(message.content)
  const time = formatTime(message.timestamp)

  if (ai?.kind === 'thinking') {
    return (
      <div className="message ai" data-message-id={message.id}>
        <ThinkingMessage content={ai.text} />
        <div className="message-meta">
          <span>🤖 AI助手</span>
          <span className="message-time">{time}</span>
        </div>
      </div>
    )
  }

  if (ai?.kind === 'response') {
    return (
      <div className="message ai" data-message-id={message.id}>
        <div className="message-content ai-response-message">
          <div className="ai-response-header">
            <span className="ai-response-indicator">🤖 AI助手</span>
          </div>
          <MarkdownContent content={ai.text} />
        </div>
        <div className="message-meta">
          <span>🤖 AI助手</span>
          <span className="message-time">{time}</span>
        </div>
      </div>
    )
  }

  const isOwn = message.device_id === currentDeviceId
  const deviceName = isOwn ? '我的设备' : '其他设备'

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`} data-message-id={message.id}>
      {message.type === 'file' ? (
        <FileMessage message={message} />
      ) : (
        <div className="message-content">
          <MarkdownContent content={message.content ?? ''} />
        </div>
      )}
      <div className="message-meta">
        <span>{deviceName}</span>
        <span className="message-time">{time}</span>
      </div>
    </div>
  )
})