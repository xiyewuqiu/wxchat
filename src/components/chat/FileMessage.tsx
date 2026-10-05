import { useState } from 'react'
import { downloadFile } from '@/api/files'
import { formatFileSize, isImageFile } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { ImagePreview } from './ImagePreview'
import { IconFile, IconFileText, IconFileImage, IconDownload } from '@/components/icons'
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

/** 根据文件类型返回专属纯矢量图标 */
function renderFileTypeIcon(mime: string | null | undefined, fileName: string) {
  const ext = getExtension(fileName).toLowerCase()
  if (isImageFile(mime) || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <IconFileImage size={22} className="file-type-svg img" />
  }
  if (['txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return <IconFileText size={22} className="file-type-svg doc" />
  }
  return <IconFile size={22} className="file-type-svg default" />
}

/** 文件气泡：精致矢量卡片 + 扩展名标签 + 渐变下载微动效 + 图片高质感预览 (零 Emoji) */
export function FileMessage({ message, isOwn }: FileMessageProps) {
  const toast = useUiStore((state) => state.toast)
  const [downloading, setDownloading] = useState(false)

  const r2Key = message.r2_key
  const fileName = message.original_name ?? '未知文件'
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
            <span className="file-vector-icon">
              {renderFileTypeIcon(message.mime_type, fileName)}
            </span>
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
              <IconDownload size={16} />
            )}
          </button>
        </div>

        {showPreview && <ImagePreview r2Key={r2Key} fileName={fileName} />}
      </div>
    </div>
  )
}