import { useState } from 'react'

interface ThinkingMessageProps {
  content: string
}

/** AI 思考过程气泡：默认折叠，可展开查看 */
export function ThinkingMessage({ content }: ThinkingMessageProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="message-content ai-thinking-message">
      <div className="ai-thinking-header">
        <span className="ai-thinking-indicator">🤔 AI正在思考</span>
        <button
          type="button"
          className="ai-thinking-toggle"
          title="展开/折叠思考过程"
          onClick={() => setExpanded((value) => !value)}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
            <path fill="currentColor" d={expanded ? 'M7,14L12,9L17,14H7Z' : 'M7,10L12,15L17,10H7Z'} />
          </svg>
        </button>
      </div>
      <div className={`ai-thinking-content ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="thinking-text">{content}</div>
      </div>
    </div>
  )
}