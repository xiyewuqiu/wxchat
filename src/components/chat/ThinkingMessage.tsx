import { useState } from 'react'

interface ThinkingMessageProps {
  content: string
}

/** AI 思考过程气泡：默认折叠，带有精致科技微光与发光展开面板 */
export function ThinkingMessage({ content }: ThinkingMessageProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="ai-thinking-card">
      <div className="ai-thinking-header" onClick={() => setExpanded((value) => !value)}>
        <div className="ai-thinking-title">
          <span className="ai-pulse-dot" />
          <span className="ai-thinking-text">思考推演过程</span>
        </div>
        <button
          type="button"
          className="ai-thinking-collapse-btn"
          title={expanded ? '折叠推理' : '展开推理'}
        >
          <span className="collapse-text">{expanded ? '收起' : '展开'}</span>
          <svg
            className={`collapse-arrow ${expanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className={`ai-thinking-body ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="thinking-inner-code">{content}</div>
      </div>
    </div>
  )
}