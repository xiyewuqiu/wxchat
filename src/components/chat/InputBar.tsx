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

/** 输入区：文件按钮、自适应文本框、功能/发送按钮动态切换 */
export function InputBar({ value, onChange, onSubmit, onPickFiles }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const aiMode = useUiStore((state) => state.aiMode)
  const setFunctionMenuOpen = useUiStore((state) => state.setFunctionMenuOpen)
  const upload = useChatStore((state) => state.upload)

  const hasContent = value.trim().length > 0

  // 内容或宽度变化时重算高度（上限 120px）
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={`input-container${aiMode ? ' ai-mode' : ''}`}>
      {aiMode && <div className="ai-mode-indicator">🤖 AI模式</div>}

      {upload.active && (
        <div className="upload-status" style={{ display: 'flex' }}>
          <div className="upload-spinner">⏳</div>
          <div className="upload-info">
            <div className="upload-text">
              正在上传 {upload.total} 个文件...
            </div>
            {upload.fileName && (
              <div className="upload-current">
                正在上传: {getFileIconByName(upload.fileName)}{' '}
                {truncateFileName(upload.fileName)} ({upload.current}/{upload.total})
              </div>
            )}
            <div className="upload-progress">
              <div className="progress-bar" style={{ width: `${upload.progress}%` }} />
            </div>
          </div>
        </div>
      )}

      <form
        className="message-input"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="input-wrapper">
          <button type="button" className="file-button" title="上传文件" onClick={onPickFiles}>
            📁
          </button>

          <div className="input-field-container">
            <textarea
              ref={textareaRef}
              value={value}
              rows={1}
              placeholder={aiMode ? '向 AI 提问...' : '输入消息...'}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />

            {!hasContent && (
              <button
                type="button"
                className="function-button show"
                title="更多功能"
                onClick={() => setFunctionMenuOpen(true)}
              >
                <svg className="function-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </button>
            )}

            {hasContent && (
              <button type="submit" className="send-button show" title="发送">
                <svg className="send-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}