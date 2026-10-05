import { useEffect, useState } from 'react'
import { useUiStore } from '@/store/uiStore'
import type { Toast } from '@/types'

function ToastIcon({ type }: { type: Toast['type'] }) {
  switch (type) {
    case 'success':
      return <span className="toast-type-icon success">✓</span>
    case 'error':
      return <span className="toast-type-icon error">✕</span>
    case 'warning':
      return <span className="toast-type-icon warning">!</span>
    default:
      return <span className="toast-type-icon info">ℹ</span>
  }
}

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={`dynamic-island-toast toast-${toast.type}${visible ? ' show' : ''}`}
      role="status"
    >
      <ToastIcon type={toast.type} />
      <span className="toast-text-msg">{toast.message}</span>
    </div>
  )
}

/** 全局灵动岛通知层，轻巧优雅不遮挡视线 */
export function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-island-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}