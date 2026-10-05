import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'
import { truncateFileName, getFileIconByName } from '@/lib/utils'

interface InputBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onPickFiles: () => void
}

/** 底部输入栏：现代化悬浮岛屿胶囊、多维快捷操作、自适应弹性输入与动态微交互 */
export function InputBar({ value, onChange, onSubmit, onPickFiles }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const aiMode = useUiStore((state) => state.aiMode)
  const toggleAiMode = useUiStore((state) => state.toggleAiMode)
  const setFunctionMenuOpen = useUiStore((state) => state.setFunctionMenuOpen)
  const upload = useChatStore((state) => state.upload)

  const hasContent = value.trim().length > 0

  // 内容或宽度变化时重算高度（上限 130px）
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 130)}px`
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    textareaRef.current?.focus()
  }

  return (
    <div className={`input-container-island${aiMode ? ' is-ai-mode' : ''}`}>
      {/* AI 模式微光胶囊标签 */}
      {aiMode && (
        <div className="input-ai-floating-pill" onClick={() => toggleAiMode()}>
          <span className="ai-pill-sparkle">✨</span>
          <span className="ai-pill-label">AI 对话模式开启中</span>
          <span className="ai-pill-close" title="退出 AI 模式">×</span>
        </div>
      )}

      {/* 批量上传进行中状态卡片 */}
      {upload.active && (
        <div className="upload-progress-card">
          <div className="upload-card-header">
            <div className="upload-card-title">
              <span className="upload-pulse-icon">⏳</span>
              <span>正在向云端传输 ({upload.current}/{upload.total})</span>
            </div>
            <span className="upload-percentage">{upload.progress}%</span>
          </div>

          {upload.fileName && (
            <div className="upload-file-label">
              <span className="upload-file-icon">{getFileIconByName(upload.fileName)}</span>
              <span className="upload-file-name">{truncateFileName(upload.fileName, 24)}</span>
            </div>
          )}

          <div className="upload-track">
            <div className="upload-bar-fill" style={{ width: `${upload.progress}%` }} />
          </div>
        </div>
      )}

      {/* 主输入胶囊 */}
      <form
        className="composer-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="composer-wrapper">
          {/* 左侧功能按键：附件上传 */}
          <button
            type="button"
            className="composer-action-btn"
            title="发送文件或照片"
            onClick={onPickFiles}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* 快捷表情按键 */}
          <button
            type="button"
            className="composer-action-btn emoji-btn"
            title="插入常用表情"
            onClick={() => insertEmoji('👍')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
            </svg>
          </button>

          {/* 自适应输入区 */}
          <div className="composer-textarea-box">
            <textarea
              ref={textareaRef}
              value={value}
              rows={1}
              placeholder={aiMode ? '向 AI 提问、探索灵感或命令...' : '输入消息、按 Enter 发送...'}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* 右侧主交互按钮：动态无缝形变（发送 / 更多） */}
          <div className="composer-right-actions">
            {hasContent ? (
              <button
                type="submit"
                className="composer-send-btn animate-pop"
                title="发送 (Enter)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="composer-plus-btn"
                title="打开更多扩展功能"
                onClick={() => setFunctionMenuOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}