import { AI_PREFIX } from '@/config'
import type { ParsedAiContent } from '@/types'

/**
 * 识别消息内容中的 AI 前缀。
 * 后端把 AI 内容存为 text 类型并附加前缀，这里还原为前端语义。
 */
export function parseAiContent(content: string | null | undefined): ParsedAiContent | null {
  if (!content) return null

  if (content.startsWith(AI_PREFIX.RESPONSE)) {
    return { kind: 'response', text: content.slice(AI_PREFIX.RESPONSE.length) }
  }
  if (content.startsWith(AI_PREFIX.THINKING)) {
    return { kind: 'thinking', text: content.slice(AI_PREFIX.THINKING.length) }
  }
  return null
}

/** 判断用户输入是否属于 AI 对话（AI 模式或显式前缀） */
export function isAiPrompt(content: string, aiMode: boolean): boolean {
  if (aiMode) return true
  const trimmed = content.trim()
  return (
    trimmed.startsWith('🤖') ||
    trimmed.toLowerCase().startsWith('ai:') ||
    trimmed.toLowerCase().startsWith('ai ')
  )
}

export function cleanAiPrompt(content: string): string {
  return content.replace(/^🤖\s*/, '').replace(/\s*🤖\s*$/, '').trim()
}