import { ThinkingMessage } from './ThinkingMessage'

interface StreamingBubbleProps {
  content: string
  thinking: string
}

/** AI 流式实时回复气泡：支持思考过程渐进渲染与灵动打字光标 */
export function StreamingBubble({ content, thinking }: StreamingBubbleProps) {
  return (
    <div className="message-row ai-row streaming-row">
      <div className="message-avatar ai-avatar is-streaming" title="AI 生成中...">
        <span className="streaming-avatar-icon">⚡</span>
      </div>

      <div className="message-bubble-col">
        <div className="message-sender-name">
          <span>AI 智能助手</span>
          <span className="streaming-badge">正在思考与生成...</span>
        </div>

        <div className="message ai streaming">
          {thinking && <ThinkingMessage content={thinking} />}

          <div className="message-content ai-response-message streaming-content">
            <div className="text-message streaming-text">
              {content || <span className="streaming-placeholder">AI 正在组织回答...</span>}
              <span className="ai-typing-cursor" />
            </div>
          </div>

          <div className="message-meta">
            <span className="streaming-time-pulse">实时生成中</span>
          </div>
        </div>
      </div>
    </div>
  )
}