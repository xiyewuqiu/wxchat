import { ThinkingMessage } from './ThinkingMessage'

interface StreamingBubbleProps {
  content: string
  thinking: string
}

/** AI 流式回复气泡：回答未落库前先在这里实时展示 */
export function StreamingBubble({ content, thinking }: StreamingBubbleProps) {
  return (
    <div className="message ai streaming">
      {thinking && <ThinkingMessage content={thinking} />}
      <div className="message-content ai-response-message">
        <div className="ai-response-header">
          <span className="ai-response-indicator">🤖 AI助手（实时回复中...）</span>
        </div>
        <div className="text-message">
          {content}
          <span className="ai-typing-indicator">▋</span>
        </div>
      </div>
      <div className="message-meta">
        <span>🤖 AI助手</span>
      </div>
    </div>
  )
}