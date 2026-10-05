// 通用工具函数

import { FILE_EXTENSION_ICONS, FILE_ICONS, FILE_TYPE_NAMES } from '@/config/fileIcons'
import { DEVICE_CONFIG } from '@/config'

/** 生成并持久化设备 ID */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_CONFIG.STORAGE_KEY)
  if (!deviceId) {
    const random = Math.random().toString(36).substring(2)
    deviceId = `${DEVICE_CONFIG.ID_PREFIX}${Date.now()}-${random}`
    localStorage.setItem(DEVICE_CONFIG.STORAGE_KEY, deviceId)
  }
  return deviceId
}

export function getDeviceType(): string {
  return /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
    ? DEVICE_CONFIG.NAME_MOBILE
    : DEVICE_CONFIG.NAME_DESKTOP
}

export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 兼容解析时间戳。
 * 后端可能返回 "YYYY-MM-DD HH:MM:SS"（UTC 无时区标记）或 "YYYY-MM-DDTHH:MM:SSZ"，
 * 前者若直接交给 Date 会按本地时区解析，导致时间显示偏移。
 */
export function parseTimestamp(timestamp: string | number | Date): Date {
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp === 'number') return new Date(timestamp)

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)
    ? `${timestamp.replace(' ', 'T')}Z`
    : timestamp

  return new Date(normalized)
}

/** 微信风格时间格式化：今天显示时间、昨天加前缀、更早显示日期 */
export function formatTime(timestamp: string | number | Date): string {
  const date = parseTimestamp(timestamp)
  const now = new Date()

  if (Number.isNaN(date.getTime())) return ''

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (isYesterday) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** 是否需要在两条相邻消息间插入微信居中时间小标签 (相隔超过 5 分钟) */
export function shouldShowTimeDivider(
  currentTimestamp: string | number | Date,
  prevTimestamp?: string | number | Date | null,
): boolean {
  if (!prevTimestamp) return true
  const curr = parseTimestamp(currentTimestamp).getTime()
  const prev = parseTimestamp(prevTimestamp).getTime()
  if (Number.isNaN(curr) || Number.isNaN(prev)) return false
  return curr - prev > 5 * 60 * 1000
}


export function getFileExtension(fileName: string | null | undefined): string | null {
  if (!fileName || typeof fileName !== 'string') return null
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === fileName.length - 1) return null
  return fileName.substring(lastDot + 1).toLowerCase()
}

export function getFileIcon(mimeType: string | null | undefined, fileName?: string | null): string {
  if (mimeType) {
    if (FILE_ICONS[mimeType]) return FILE_ICONS[mimeType]
    for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
      if (prefix !== 'default' && mimeType.startsWith(prefix)) return icon
    }
  }

  const extension = getFileExtension(fileName)
  if (extension && FILE_EXTENSION_ICONS[extension]) return FILE_EXTENSION_ICONS[extension]

  return FILE_ICONS.default
}

export function getFileIconByName(fileName: string): string {
  return getFileIcon(null, fileName)
}

export function getFileTypeName(mimeType: string | null | undefined, fileName?: string | null): string {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return '图片'
    if (mimeType.startsWith('video/')) return '视频'
    if (mimeType.startsWith('audio/')) return '音频'
    if (mimeType.includes('pdf')) return 'PDF文档'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word文档'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel表格'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint演示'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '压缩文件'
    if (mimeType.startsWith('text/')) return '文本文件'
  }

  const ext = getFileExtension(fileName)
  if (ext && FILE_TYPE_NAMES[ext]) return FILE_TYPE_NAMES[ext]

  return '文件'
}

/** 拖拽/选择文件时的类型归类，用于提示文案 */
export function getFileTypeCategory(mimeType: string | null | undefined, fileName?: string | null): string {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return '图片'
    if (mimeType.startsWith('video/')) return '视频'
    if (mimeType.startsWith('audio/')) return '音频'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('document')) return '文档'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '表格'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '演示'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '压缩'
    if (mimeType.startsWith('text/')) return '文本'
  }

  const ext = getFileExtension(fileName)
  if (ext) {
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return '图片'
    if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv'].includes(ext)) return '视频'
    if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) return '音频'
    if (ext === 'pdf') return 'PDF'
    if (['doc', 'docx'].includes(ext)) return '文档'
    if (['xls', 'xlsx'].includes(ext)) return '表格'
    if (['ppt', 'pptx'].includes(ext)) return '演示'
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '压缩'
    if (['txt', 'md', 'html', 'css', 'js', 'json'].includes(ext)) return '文本'
  }

  return ''
}

export function isImageFile(mimeType: string | null | undefined): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return (...args) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}

/** 转义 HTML，用于纯文本场景 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function truncateFileName(name: string, max = 30): string {
  return name.length > max ? `${name.substring(0, max - 3)}...` : name
}

/** 图片 blob URL 缓存，按 r2Key 复用，避免重复下载 */
const imageBlobCache = new Map<string, string>()

export function getCachedImageUrl(r2Key: string): string | undefined {
  return imageBlobCache.get(r2Key)
}

export function cacheImageUrl(r2Key: string, blobUrl: string): void {
  const existing = imageBlobCache.get(r2Key)
  if (existing && existing !== blobUrl) URL.revokeObjectURL(existing)
  imageBlobCache.set(r2Key, blobUrl)
}

export function revokeImageUrl(r2Key: string): void {
  const url = imageBlobCache.get(r2Key)
  if (url) {
    URL.revokeObjectURL(url)
    imageBlobCache.delete(r2Key)
  }
}

export function clearImageCache(): void {
  for (const url of imageBlobCache.values()) URL.revokeObjectURL(url)
  imageBlobCache.clear()
}