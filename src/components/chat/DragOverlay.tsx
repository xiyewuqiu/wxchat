import { useEffect, useState, type DragEvent } from 'react'
import { getFileTypeCategory, getFileIconByName, getFileIcon } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

interface DragOverlayProps {
  onFiles: (files: File[]) => void
}

/** 全屏拖拽上传层：实时显示拖入文件的数量与类型 */
export function DragOverlay({ onFiles }: DragOverlayProps) {
  const dragActive = useUiStore((state) => state.dragActive)
  const setDragActive = useUiStore((state) => state.setDragActive)
  const [summary, setSummary] = useState<{ icons: string[]; count: number; type: string }>({
    icons: [],
    count: 0,
    type: '',
  })

  useEffect(() => {
    let depth = 0
    let files: File[] = []

    const reset = () => {
      depth = 0
      setDragActive(false)
    }

    const handleDragEnter = (event: DragEvent | globalThis.DragEvent) => {
      event.preventDefault()
      if (!('dataTransfer' in event) || !event.dataTransfer) return
      if (!event.dataTransfer.types.includes('Files')) return

      depth++
      files = Array.from(event.dataTransfer.files ?? [])

      const icons: string[] = []
      const types = new Set<string>()
      for (const file of files.slice(0, 3)) {
        icons.push(getFileIcon(file.type, file.name) || getFileIconByName(file.name))
      }
      for (const file of files) types.add(getFileTypeCategory(file.type, file.name))

      setSummary({
        icons,
        count: files.length,
        type: types.size === 1 ? Array.from(types)[0] : types.size > 1 ? '多种类型' : '',
      })
      setDragActive(true)
    }

    const handleDragOver = (event: globalThis.DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = (event: globalThis.DragEvent) => {
      event.preventDefault()
      depth--
      if (depth <= 0) reset()
    }

    const handleDrop = (event: globalThis.DragEvent) => {
      event.preventDefault()
      const dropped = Array.from(event.dataTransfer?.files ?? [])
      reset()
      if (dropped.length > 0) onFiles(dropped)
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
      document.body.classList.remove('dragging')
    }
  }, [onFiles, setDragActive])

  useEffect(() => {
    document.body.classList.toggle('dragging', dragActive)
  }, [dragActive])

  const { icons, count, type } = summary
  const iconText = count === 0 ? '📁' : icons.slice(0, 3).join(' ')

  return (
    <div className={`drag-overlay${dragActive ? ' active' : ''}`} id="dragOverlay">
      <div className="drag-content">
        <div className="drag-icon">{iconText}</div>
        <div className="drag-text">
          {count > 1 ? `拖拽 ${count} 个${type}文件到此处上传` : `拖拽${type}文件到此处上传`}
        </div>
        <div className="drag-hint">{count > 1 ? '支持批量上传' : '支持多文件同时上传'}</div>
      </div>
    </div>
  )
}