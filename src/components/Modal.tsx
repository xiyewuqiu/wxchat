import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** 覆盖内容卡片类名，默认通用卡片样式 */
  cardClassName?: string
}

/** 通用高质感模态框：支持磨砂玻璃背景、ESC 监听与平滑弹性缩放动画 */
export function Modal({ open, onClose, children, cardClassName = 'glass-dialog-card' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={cardClassName} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}