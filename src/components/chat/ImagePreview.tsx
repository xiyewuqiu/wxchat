import { useEffect, useState } from 'react'
import { getImageBlobUrl } from '@/api/files'
import { revokeImageUrl } from '@/lib/utils'

interface ImagePreviewProps {
  r2Key: string
  fileName: string
}

/** 图片消息预览：下载为 blob 后内联展示，失败可重试 */
export function ImagePreview({ r2Key, fileName }: ImagePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryKey, setRetryKey] = useState(0)

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
    <div className="image-preview">
      {status === 'loading' && (
        <div className="image-loading">
          <div className="loading-spinner">⏳</div>
          <span>加载图片中...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="image-error">
          <span>🖼️ 图片加载失败</span>
          <button type="button" className="retry-btn" onClick={handleRetry}>
            重试
          </button>
        </div>
      )}

      {status === 'ready' && blobUrl && (
        <img
          src={blobUrl}
          alt={fileName}
          onClick={() => window.open(blobUrl, '_blank', 'noopener')}
        />
      )}
    </div>
  )
}