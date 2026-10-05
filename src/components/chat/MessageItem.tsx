import { memo } from 'react'
import { parseAiContent } from '@/lib/aiContent'
import { formatTime } from '@/lib/utils'
import { MarkdownContent } from './MarkdownContent'
import { FileMessage } from './FileMessage'
import { ThinkingMessage } from './ThinkingMessage'
import {
  IconBrain,
  IconBot,
  IconMonitor,
  IconSmartphone,
  IconSparkles,
  IconCheck,
} from '@/components/icons'
import type { ChatMessage } from '@/types'

interface MessageItemProps {
  message: ChatMessage
  currentDeviceId: string
}

/** 单条消息：按 AI 思考 / AI 回答 / 文件 / 文本 分派渲染，配备纯矢量图标与精细圆角排版 */
export const MessageItem = memo(function MessageItem({ message, currentDeviceId }: MessageItemProps) {
  const ai = parseAiContent(message.content)
  const time = formatTime(message.timestamp)

  if (ai?.kind === 'thinking') {
    return (
      <div className="message-row ai-row" data-message-id={message.id}>
        <div className="message-avatar ai-avatar" title="AI 深度推理">
          <IconBrain size={18} />
        </div>
        <div className="message-bubble-col">
          <div className="message-sender-name">AI 深度推理模型</div>
          <div className="message ai">
            <ThinkingMessage content={ai.text} />
            <div className="message-meta">
              <span className="message-time">{time}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (ai?.kind === 'response') {
    return (
      <div className="message-row ai-row" data-message-id={message.id}>
        <div className="message-avatar ai-avatar" title="AI 助手">
          <IconBot size={18} />
        </div>
        <div className="message-bubble-col">
          <div className="message-sender-name">
            <span>AI 智能助手</span>
            <span className="ai-model-tag">DeepSeek / Cloudflare AI</span>
          </div>
          <div className="message ai">
            <div className="message-content ai-response-message">
              <MarkdownContent content={ai.text} />
            </div>
            <div className="message-meta">
              <span className="message-time">{time}</span>
              <span className="ai-verified-badge" title="AI 生成">
                <IconSparkles size={11} />
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isOwn = message.device_id === currentDeviceId
  const shortId = message.device_id ? message.device_id.slice(-4) : '本地'
  const senderLabel = isOwn ? '本机设备' : `协同端 #${shortId}`

  return (
    <div className={`message-row ${isOwn ? 'own-row' : 'other-row'}`} data-message-id={message.id}>
      {!isOwn && (
        <div className="message-avatar other-avatar" title={senderLabel}>
          <IconMonitor size={18} />
        </div>
      )}

      <div className="message-bubble-col">
        <div className="message-sender-name">{senderLabel}</div>
        <div className={`message ${isOwn ? 'own' : 'other'}`}>
          {message.type === 'file' ? (
            <FileMessage message={message} isOwn={isOwn} />
          ) : (
            <div className="message-content">
              <MarkdownContent content={message.content ?? ''} />
            </div>
          )}

          <div className="message-meta">
            <span className="message-time">{time}</span>
            {isOwn && (
              <span className="message-status-icon" title="已同步至云端">
                <IconCheck size={12} />
              </span>
            )}
          </div>
        </div>
      </div>

      {isOwn && (
        <div className="message-avatar own-avatar" title="本机设备">
          <IconSmartphone size={18} />
        </div>
      )}
    </div>
  )
})