import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { useUiStore } from '@/store/uiStore'

/**
 * 全局确认对话框：极致现代毛玻璃排版、图标提示与微交互。
 */
export function ConfirmDialog() {
  const confirm = useUiStore((state) => state.confirm)
  const resolveConfirm = useUiStore((state) => state.resolveConfirm)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (confirm.open) setValue('')
  }, [confirm.open])

  if (!confirm.open) return null

  const handleConfirm = () => {
    if (confirm.requireInput && !value.trim()) return
    resolveConfirm(value.trim())
  }

  const isDanger = confirm.confirmText?.includes('退出') || confirm.confirmText?.includes('清空') || confirm.confirmText?.includes('删除')

  return (
    <Modal open onClose={() => resolveConfirm(null)} cardClassName="confirm-dialog-card">
      <div className="confirm-icon-wrapper">
        <span className={`confirm-bubble-icon ${isDanger ? 'is-danger' : 'is-info'}`}>
          {isDanger ? '⚠️' : '💬'}
        </span>
      </div>

      <div className="confirm-content-center">
        <h3 className="confirm-title">{confirm.title}</h3>
        <p className="confirm-message">{confirm.message}</p>
      </div>

      {confirm.requireInput && (
        <div className="confirm-input-row">
          <input
            autoFocus
            className="confirm-input"
            value={value}
            placeholder={confirm.inputPlaceholder || '请输入确认内容...'}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleConfirm()
            }}
          />
        </div>
      )}

      <div className="confirm-actions-row">
        <button
          type="button"
          className="confirm-btn-secondary"
          onClick={() => resolveConfirm(null)}
        >
          {confirm.cancelText ?? '取消'}
        </button>

        <button
          type="button"
          className={`confirm-btn-primary${isDanger ? ' is-danger' : ''}`}
          disabled={!!confirm.requireInput && !value.trim()}
          onClick={handleConfirm}
        >
          {confirm.confirmText ?? '确定'}
        </button>
      </div>
    </Modal>
  )
}