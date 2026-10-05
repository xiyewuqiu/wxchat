import { useState } from 'react'
import { downloadFile } from '@/api/files'
import { formatFileSize, getFileIcon, isImageFile } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { ImagePreview } from './ImagePreview'
import type { ChatMessage } from '@/types'

interface FileMessageProps {
  message: ChatMessage
  isOwn?: boolean
}

/** 获取文件后缀名 */
function getExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
}

/** 文件气泡：精致卡片 + 扩展名标签 + 渐变下载微动效 + 图片高质感预览 */
export function FileMessage({ message, isOwn }: FileMessageProps) {
  const toast = useUiStore((state) => state.toast)
  const [downloading, setDownloading] = useState(false)

  const r2Key = message.r2_key
  const fileName = message.original_name ?? '未知文件'
  const icon = getFileIcon(message.mime_type, fileName)
  const size = formatFileSize(message.file_size)
  const ext = getExtension(fileName)
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
    <div className={`message-content file-message-content${isOwn ? ' is-own-file' : ''}`}>
      <div className="file-card-box">
        <div className="file-card-header">
          <div className="file-badge-icon" title={ext}>
            <span className="file-emoji-icon">{icon}</span>
            <span className="file-ext-tag">{ext}</span>
          </div>

          <div className="file-meta-col">
            <div className="file-card-name" title={fileName}>
              {fileName}
            </div>
            <div className="file-card-sub">
              <span className="file-size-badge">{size}</span>
            </div>
          </div>

          <button
            type="button"
            className={`file-download-action-btn${downloading ? ' is-downloading' : ''}`}
            onClick={handleDownload}
            disabled={downloading}
            title={`下载 ${fileName}`}
          >
            {downloading ? (
              <span className="btn-spinner-sm" />
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>
        </div>

        {showPreview && <ImagePreview r2Key={r2Key} fileName={fileName} />}
      </div>
    </div>
  )
}