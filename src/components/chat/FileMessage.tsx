import { useState } from 'react'
import { downloadFile } from '@/api/files'
import { formatFileSize, isImageFile } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { ImagePreview } from './ImagePreview'
import {
  IconFile,
  IconFileText,
  IconFileImage,
  IconLoader,
  IconDownload,
} from '@/components/icons'
import type { ChatMessage } from '@/types'

interface FileMessageProps {
  message: ChatMessage
  isOwn?: boolean
}

function getExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
}

function renderFileTypeIcon(mime: string | null | undefined, fileName: string) {
  const ext = getExtension(fileName).toLowerCase()
  if (isImageFile(mime) || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <IconFileImage size={24} className="wechat-file-svg img" />
  }
  if (['txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return <IconFileText size={24} className="wechat-file-svg doc" />
  }
  return <IconFile size={24} className="wechat-file-svg file" />
}

/**
 * 文件消息组件：
 * 1. 如果是图片：纯净渲染高质感无气泡边框的图片缩略图，点击全屏查看
 * 2. 如果是文档：渲染微信原生的经典左文右图卡片，点击一键下载
 */
export function FileMessage({ message }: FileMessageProps) {
  const toast = useUiStore((state) => state.toast)
  const [downloading, setDownloading] = useState(false)

  const r2Key = message.r2_key
  const fileName = message.original_name ?? '未知文件'
  const size = formatFileSize(message.file_size)
  const ext = getExtension(fileName)
  const isImage = isImageFile(message.mime_type) && !!r2Key

  // 图片消息：纯粹干净地展示独立图片媒体，绝不显示冗余的文件卡片外框
  if (isImage) {
    return (
      <div className="pure-image-message-wrapper">
        <ImagePreview r2Key={r2Key!} fileName={fileName} />
      </div>
    )
  }

  // 普通文件文档：展示经典文件卡片
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
    <div
      className="wechat-file-card"
      onClick={handleDownload}
      role="button"
      tabIndex={0}
      title={`点击下载 ${fileName}`}
    >
      <div className="file-info-main">
        <div className="file-title-text" title={fileName}>
          {fileName}
        </div>
        <div className="file-size-meta">
          <span>{size}</span>
          <span className="meta-sep">·</span>
          <span className="file-ext-label">{ext}</span>
        </div>
      </div>

      <div className="file-icon-box">
        {downloading ? (
          <IconLoader size={22} className="spin-fast" />
        ) : (
          renderFileTypeIcon(message.mime_type, fileName)
        )}
      </div>

      <div className="file-download-badge" title="下载文件">
        <IconDownload size={14} />
      </div>
    </div>
  )
}