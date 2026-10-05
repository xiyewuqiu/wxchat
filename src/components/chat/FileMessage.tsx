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

/** 微信经典文件卡片：左文右图卡片结构、整块可触控、轻巧下载状态指示 (零 Emoji) */
export function FileMessage({ message }: FileMessageProps) {
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
    <div className="wechat-file-bubble">
      {/* 微信原生经典左文右图文件卡片 */}
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
            <IconLoader size={20} className="spin-fast" />
          ) : (
            renderFileTypeIcon(message.mime_type, fileName)
          )}
        </div>
      </div>

      {/* 图片原图预览 */}
      {showPreview && <ImagePreview r2Key={r2Key} fileName={fileName} />}
    </div>
  )
}