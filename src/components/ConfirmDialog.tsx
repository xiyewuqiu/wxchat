import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { useUiStore } from '@/store/uiStore'

/**
 * 全局确认框，替代 window.confirm / prompt。
 * 返回值：取消为 null；确定时返回空串；需要输入时返回用户输入内容。
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

  return (
    <Modal open onClose={() => resolveConfirm(null)}>
      <div className="modal-title">{confirm.title}</div>
      <div className="modal-message">{confirm.message}</div>

      {confirm.requireInput && (
        <input
          autoFocus
          className="modal-input"
          value={value}
          placeholder={confirm.inputPlaceholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleConfirm()
          }}
        />
      )}

      <div className="modal-actions">
        <button type="button" className="modal-btn-secondary" onClick={() => resolveConfirm(null)}>
          {confirm.cancelText ?? '取消'}
        </button>
        <button
          type="button"
          className="modal-btn-primary"
          disabled={!!confirm.requireInput && !value.trim()}
          onClick={handleConfirm}
        >
          {confirm.confirmText ?? '确定'}
        </button>
      </div>
    </Modal>
  )
}