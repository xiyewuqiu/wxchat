import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'
import { truncateFileName } from '@/lib/utils'
import {
  IconPaperclip,
  IconSmile,
  IconSend,
  IconPlus,
  IconSparkles,
  IconLoader,
  IconFile,
} from '@/components/icons'

interface InputBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onPickFiles: () => void
}

/** 底部输入栏：现代化悬浮岛屿胶囊、全套前沿纯矢量图标、自适应弹性输入与动态微交互 */
export function InputBar({ value, onChange, onSubmit, onPickFiles }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const aiMode = useUiStore((state) => state.aiMode)
  const toggleAiMode = useUiStore((state) => state.toggleAiMode)
  const setFunctionMenuOpen = useUiStore((state) => state.setFunctionMenuOpen)
  const upload = useChatStore((state) => state.upload)

  const hasContent = value.trim().length > 0

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
          <IconSparkles size={13} className="ai-pill-sparkle" />
          <span className="ai-pill-label">AI 对话模式开启中</span>
          <span className="ai-pill-close" title="退出 AI 模式">×</span>
        </div>
      )}

      {/* 批量上传进行中状态卡片 */}
      {upload.active && (
        <div className="upload-progress-card">
          <div className="upload-card-header">
            <div className="upload-card-title">
              <IconLoader size={14} className="upload-pulse-icon spin-icon" />
              <span>正在向云端传输 ({upload.current}/{upload.total})</span>
            </div>
            <span className="upload-percentage">{upload.progress}%</span>
          </div>

          {upload.fileName && (
            <div className="upload-file-label">
              <IconFile size={13} className="upload-file-icon" />
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
            <IconPaperclip size={19} />
          </button>

          {/* 快捷表情按键 */}
          <button
            type="button"
            className="composer-action-btn emoji-btn"
            title="快速表情"
            onClick={() => insertEmoji(' ')}
          >
            <IconSmile size={19} />
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
                <IconSend size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="composer-plus-btn"
                title="打开更多扩展功能"
                onClick={() => setFunctionMenuOpen(true)}
              >
                <IconPlus size={19} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}