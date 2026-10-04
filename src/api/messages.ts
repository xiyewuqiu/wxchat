import { API_ENDPOINTS } from '@/config'
import { get, post } from '@/lib/http'
import type { ChatMessage, ClearResult } from '@/types'

interface Envelope<T> {
  success: boolean
  data?: T
  total?: number
  error?: string
}

export interface MessagePage {
  messages: ChatMessage[]
  /** 服务端消息总数，用于精确判断是否还有更早的历史消息 */
  total: number
}

export async function fetchMessages(limit: number, offset = 0): Promise<MessagePage> {
  const result = await get<Envelope<ChatMessage[]>>(API_ENDPOINTS.MESSAGES, { limit, offset })
  if (!result.success) throw new Error(result.error || '加载消息失败')
  const messages = result.data ?? []
  return { messages, total: result.total ?? messages.length }
}

export async function sendMessage(content: string, deviceId: string): Promise<{ id: number }> {
  const result = await post<Envelope<{ id: number }>>(API_ENDPOINTS.MESSAGES, { content, deviceId })
  if (!result.success || !result.data) throw new Error(result.error || '消息发送失败')
  return result.data
}

export async function sendAiMessage(
  content: string,
  deviceId = 'ai-system',
  type: 'ai_response' | 'ai_thinking' = 'ai_response',
): Promise<{ id: number }> {
  const result = await post<Envelope<{ id: number }>>(API_ENDPOINTS.AI_MESSAGE, { content, deviceId, type })
  if (!result.success || !result.data) throw new Error(result.error || 'AI消息发送失败')
  return result.data
}

export async function syncDevice(deviceId: string, deviceName: string): Promise<boolean> {
  try {
    const result = await post<Envelope<never>>(API_ENDPOINTS.SYNC, { deviceId, deviceName })
    return result.success === true
  } catch {
    // 设备同步失败不阻断应用运行
    return false
  }
}

export async function clearAllData(confirmCode: string): Promise<ClearResult> {
  const result = await post<Envelope<ClearResult>>(API_ENDPOINTS.CLEAR_ALL, { confirmCode })
  if (!result.success || !result.data) throw new Error(result.error || '数据清理失败')
  return result.data
}