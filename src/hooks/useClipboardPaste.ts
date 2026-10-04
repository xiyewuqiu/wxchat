import { useEffect } from 'react'

/** 监听剪贴板粘贴文件，交由上传流程处理 */
export function useClipboardPaste(onFiles: (files: File[]) => void): void {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (const item of items) {
        if (item.kind !== 'file') continue
        const file = item.getAsFile()
        if (file) files.push(file)
      }

      if (files.length > 0) {
        event.preventDefault()
        onFiles(files)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onFiles])
}