import { useEffect, useState } from 'react'
import { useUiStore } from '@/store/uiStore'
import type { Toast } from '@/types'

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={`toast-notification toast-${toast.type}${visible ? ' show' : ''}`} role="status">
      {toast.message}
    </div>
  )
}

/** 全局提示层，支持多条纵向堆叠 */
export function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}