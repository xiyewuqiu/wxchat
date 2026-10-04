import { API_ENDPOINTS } from '@/config'
import { requestBlob, upload, uploadWithProgress } from '@/lib/http'
import { cacheImageUrl, getCachedImageUrl } from '@/lib/utils'
import type { UploadResult } from '@/types'

interface Envelope<T> {
  success: boolean
  data?: T
  error?: string
}

export async function uploadFile(
  file: File,
  deviceId: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('deviceId', deviceId)

  const result = onProgress
    ? await uploadWithProgress<Envelope<UploadResult>>(API_ENDPOINTS.FILES_UPLOAD, formData, onProgress)
    : await upload<Envelope<UploadResult>>(API_ENDPOINTS.FILES_UPLOAD, formData)

  if (!result.success || !result.data) throw new Error(result.error || '文件上传失败')
  return result.data
}

function downloadUrl(r2Key: string): string {
  return `${API_ENDPOINTS.FILES_DOWNLOAD}/${encodeURIComponent(r2Key)}`
}

/** 下载并触发浏览器保存 */
export async function downloadFile(r2Key: string, fileName: string): Promise<void> {
  const blob = await requestBlob(downloadUrl(r2Key))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** 获取图片的 blob URL（用于内联预览），带缓存 */
export async function getImageBlobUrl(r2Key: string, signal?: AbortSignal): Promise<string> {
  const cached = getCachedImageUrl(r2Key)
  if (cached) return cached

  const blob = await requestBlob(downloadUrl(r2Key), signal)
  const blobUrl = URL.createObjectURL(blob)
  cacheImageUrl(r2Key, blobUrl)
  return blobUrl
}