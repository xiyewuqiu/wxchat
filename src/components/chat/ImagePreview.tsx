import { useEffect, useState } from 'react'
import { getImageBlobUrl } from '@/api/files'
import { revokeImageUrl } from '@/lib/utils'

interface ImagePreviewProps {
  r2Key: string
  fileName: string
}

/** 图片消息预览：支持骨架渐变加载、缩略图抗锯齿裁剪、全屏高清 Lightbox 浮层查看 */
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
            <div className="skeleton-icon">🖼️</div>
            <span className="skeleton-text">正在渲染高清图像...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="image-error-state">
            <span className="image-error-icon">⚠️</span>
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
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
              <button
                type="button"
                className="lightbox-btn close"
                title="关闭 (Esc)"
                onClick={() => setFullscreenOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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