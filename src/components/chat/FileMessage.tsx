import { useState } from 'react'
import { downloadFile } from '@/api/files'
import { formatFileSize, getFileIcon, isImageFile } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { ImagePreview } from './ImagePreview'
import type { ChatMessage } from '@/types'

interface FileMessageProps {
  message: ChatMessage
}

/** 文件气泡：图标 + 文件名/大小 + 下载，图片额外内联预览 */
export function FileMessage({ message }: FileMessageProps) {
  const toast = useUiStore((state) => state.toast)
  const [downloading, setDownloading] = useState(false)

  const r2Key = message.r2_key
  const fileName = message.original_name ?? '未知文件'
  const icon = getFileIcon(message.mime_type, fileName)
  const size = formatFileSize(message.file_size)
  const showPreview = isImageFile(message.mime_type) && !!r2Key

  const handleDownload = async () => {
    if (!r2Key || downloading) return
    setDownloading(true)
    try {
      await downloadFile(r2Key, fileName)
    } catch (error) {
      toast((error as Error).message || '文件下载失败', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="message-content">
      <div className="file-message">
        <div className="file-info">
          <div className="file-icon">{icon}</div>
          <div className="file-details">
            <div className="file-name">{fileName}</div>
            <div className="file-size">{size}</div>
          </div>
          <button type="button" className="download-btn" onClick={handleDownload} disabled={downloading}>
            {downloading ? '⏳' : '⬇️ 下载'}
          </button>
        </div>
        {showPreview && <ImagePreview r2Key={r2Key} fileName={fileName} />}
      </div>
    </div>
  )
}