import { useEffect, useState } from 'react'
import { getImageBlobUrl } from '@/api/files'
import { revokeImageUrl } from '@/lib/utils'
import { IconImage, IconAlertCircle, IconDownload, IconX } from '@/components/icons'

interface ImagePreviewProps {
  r2Key: string
  fileName: string
}

/** 图片消息预览：支持骨架渐变加载、缩略图抗锯齿裁剪、全屏高清 Lightbox 浮层查看 (纯矢量) */
export function ImagePreview({ r2Key, fileName }: ImagePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryKey, setRetryKey] = useState(0)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setBlobUrl(null)

    getImageBlobUrl(r2Key, controller.signal)
      .then((url) => {
        if (controller.signal.aborted) return
        setBlobUrl(url)
        setStatus('ready')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setStatus('error')
      })

    return () => controller.abort()
  }, [r2Key, retryKey])

  const handleRetry = () => {
    revokeImageUrl(r2Key)
    setRetryKey((key) => key + 1)
  }

  return (
    <>
      <div className="image-preview-wrapper">
        {status === 'loading' && (
          <div className="image-skeleton-shimmer">
            <IconImage size={28} className="skeleton-icon-svg" />
            <span className="skeleton-text">正在渲染图像...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="image-error-state">
            <IconAlertCircle size={16} className="image-error-icon" />
            <span className="image-error-text">图片预览加载失败</span>
            <button type="button" className="image-retry-action" onClick={handleRetry}>
              重试
            </button>
          </div>
        )}

        {status === 'ready' && blobUrl && (
          <div className="image-thumb-container" onClick={() => setFullscreenOpen(true)}>
            <img src={blobUrl} alt={fileName} className="image-thumb-img" loading="lazy" />
            <div className="image-hover-glass-mask">
              <span className="zoom-hint-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </span>
              <span className="zoom-hint-text">点击全屏查看</span>
            </div>
          </div>
        )}
      </div>

      {/* 全屏高清查看模态框 */}
      {fullscreenOpen && blobUrl && (
        <div className="image-lightbox-overlay" onClick={() => setFullscreenOpen(false)}>
          <div className="image-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
            <span className="lightbox-filename">{fileName}</span>
            <div className="lightbox-actions">
              <a
                href={blobUrl}
                download={fileName}
                className="lightbox-btn"
                title="保存原图"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDownload size={18} />
              </a>
              <button
                type="button"
                className="lightbox-btn close"
                title="关闭 (Esc)"
                onClick={() => setFullscreenOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
          </div>
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={blobUrl} alt={fileName} className="image-lightbox-img" />
          </div>
        </div>
      )}
    </>
  )
}