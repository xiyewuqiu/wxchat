import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'
import { truncateFileName } from '@/lib/utils'
import {
  IconPlus,
  IconPaperclip,
  IconSparkles,
  IconLoader,
} from '@/components/icons'


interface InputBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onPickFiles: () => void
}

/** 底部输入栏：微信原生经典架构、移动端紧凑无缝贴合、自适应高度与平滑交互 */
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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={`wechat-input-container${aiMode ? ' is-ai-mode' : ''}`}>
      {/* AI 伴随模式微弱提示标签 */}
      {aiMode && (
        <div className="wechat-ai-bar" onClick={() => toggleAiMode()}>
          <IconSparkles size={12} className="ai-icon" />
          <span>AI 伴随模式</span>
          <span className="ai-close-btn" title="退出 AI 模式">×</span>
        </div>
      )}

      {/* 极简上传进度条 */}
      {upload.active && (
        <div className="wechat-upload-strip">
          <IconLoader size={12} className="spin-fast" />
          <span className="strip-text">
            正在上传 {truncateFileName(upload.fileName || '', 18)} ({upload.current}/{upload.total})
          </span>
          <span className="strip-pct">{upload.progress}%</span>
          <div className="strip-line" style={{ width: `${upload.progress}%` }} />
        </div>
      )}

      {/* 核心输入行 */}
      <div className="wechat-input-row">
        {/* 左侧附件快捷按键 */}
        <button
          type="button"
          className="input-tool-btn"
          title="上传文件"
          onClick={onPickFiles}
        >
          <IconPaperclip size={21} />
        </button>

        {/* 中间自适应输入框 */}
        <div className="input-textarea-wrapper">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            placeholder={aiMode ? '向 AI 提问...' : '输入消息...'}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 右侧扩展与发送按钮 */}
        {hasContent ? (
          <button
            type="button"
            className="input-send-btn"
            title="发送"
            onClick={onSubmit}
          >
            发送
          </button>
        ) : (
          <button
            type="button"
            className="input-tool-btn more-btn"
            title="更多功能"
            onClick={() => setFunctionMenuOpen(true)}
          >
            <IconPlus size={22} />
          </button>
        )}
      </div>
    </div>
  )
}