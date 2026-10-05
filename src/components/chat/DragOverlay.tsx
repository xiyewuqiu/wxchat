import { useEffect, useRef, useState } from 'react'

interface DragOverlayProps {
  onFiles: (files: File[]) => void
}

/** 拖拽覆盖层：全屏毛玻璃流光遮罩 + 动态脉冲卡片 */
export function DragOverlay({ onFiles }: DragOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault()
      dragCounterRef.current += 1
      if (event.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      dragCounterRef.current -= 1
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0
        setIsDragging(false)
      }
    }

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
    }

    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      const files = Array.from(event.dataTransfer?.files ?? [])
      if (files.length > 0) {
        onFiles(files)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [onFiles])

  if (!isDragging) return null

  return (
    <div className="drag-overlay active" role="region" aria-label="文件拖放区域">
      <div className="drag-content-card">
        <div className="drag-icon-glow">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h3 className="drag-main-title">松开立即传输到云端</h3>
        <p className="drag-sub-hint">支持任意格式文件、高清照片、视频与压缩包</p>
      </div>
    </div>
  )
}