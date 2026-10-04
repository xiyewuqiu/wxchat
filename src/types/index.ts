// 领域类型定义

export type MessageType = 'text' | 'file'
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'read'

/** 后端返回的消息行（DB 结构） */
export interface ChatMessage {
  id: number
  type: MessageType
  content: string | null
  device_id: string
  timestamp: string
  original_name: string | null
  file_size: number | null
  mime_type: string | null
  r2_key: string | null
}

/** 派生自消息内容前缀的 AI 类型 */
export type AiKind = 'response' | 'thinking'

export interface ParsedAiContent {
  kind: AiKind
  text: string
}

/** AI 流式响应的临时视图模型（尚未落库） */
export interface StreamingAiMessage {
  id: string
  kind: 'streaming' | 'error'
  content: string
  thinking: string
  timestamp: string
}

export interface UploadResult {
  fileId: number
  fileName: string
  fileSize: number
  r2Key: string
}

export interface SearchResultItem {
  id: number
  type: MessageType
  content: string | null
  device_id: string
  timestamp: string
  original_name: string | null
  file_size: number | null
  mime_type: string | null
  r2_key: string | null
}

export interface SearchFilters {
  type: 'all' | 'text' | 'file'
  timeRange: 'all' | 'today' | 'yesterday' | 'week' | 'month'
  deviceId: string
  fileType: 'all' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'text' | 'code'
}

export interface SearchResponse {
  success: boolean
  data: SearchResultItem[]
  total: number
  limit: number
  offset: number
  error?: string
}

export interface ClearResult {
  deletedMessages: number
  deletedFiles: number
  deletedFileSize: number
  deletedR2Files: number
  message: string
}

export interface ImageGenOptions {
  prompt: string
  negativePrompt?: string
  imageSize: string
  numInferenceSteps: number
  guidanceScale: number
}

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'offline'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}