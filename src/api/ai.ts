import { AI_CONFIG, IMAGE_GEN_CONFIG } from '@/config'
import { parseStream, type StreamState } from '@/lib/streamParse'
import { tokenStore } from '@/lib/token'
import type { ImageGenOptions } from '@/types'

export type { StreamState }

export interface StreamResult extends StreamState {
  cancelled: boolean
}

/** 调用 AI 对话模型（优先通过 Cloudflare Worker 安全代理，避免开源密钥泄露） */
export async function streamChat(
  message: string,
  onProgress: (state: StreamState) => void,
  signal: AbortSignal,
): Promise<StreamResult> {
  if (!AI_CONFIG.ENABLED) {
    throw new Error('AI功能未启用')
  }

  const isDirect = AI_CONFIG.API_BASE_URL.startsWith('http') && Boolean(AI_CONFIG.API_KEY)
  const targetUrl = isDirect ? `${AI_CONFIG.API_BASE_URL}/chat/completions` : '/api/ai/chat'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (isDirect && AI_CONFIG.API_KEY) {
    headers['Authorization'] = `Bearer ${AI_CONFIG.API_KEY}`
  } else {
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const requestBody = isDirect
    ? {
        model: AI_CONFIG.MODEL,
        messages: [{ role: 'user', content: message }],
        stream: true,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
      }
    : {
        message,
        model: AI_CONFIG.MODEL,
        maxTokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
      }

  const response = await fetch(targetUrl, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorData = (await response.json()) as { error?: string; message?: string }
      detail = errorData.error || errorData.message || ''
    } catch {
      // 忽略非 JSON
    }
    throw new Error(detail || `AI服务返回错误: ${response.status} ${response.statusText}`)
  }
  if (!response.body) {
    throw new Error('AI服务未返回流式内容')
  }


  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let raw = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') continue

        try {
          const parsed = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }
          const chunk = parsed.choices?.[0]?.delta?.content
          if (!chunk) continue

          raw += chunk
          onProgress(parseStream(raw))
        } catch {
          // 单个分片解析失败不影响整体流
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return { thinking: '', response: '', cancelled: true }
    }
    throw error
  } finally {
    reader.releaseLock()
  }

  const state = parseStream(raw)
  return { ...state, response: state.response.trim(), cancelled: false }
}

/** 校验图片生成提示词 */
export function validateImagePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: '请输入图片描述' }
  }
  if (prompt.length > IMAGE_GEN_CONFIG.MAX_PROMPT_LENGTH) {
    return { valid: false, error: '图片描述过长，请简化' }
  }
  return { valid: true }
}

export const SUPPORTED_IMAGE_SIZES = [
  { value: '512x512', label: '512×512 (正方形小图)' },
  { value: '768x768', label: '768×768 (正方形中图)' },
  { value: '1024x1024', label: '1024×1024 (正方形大图)' },
  { value: '1024x1536', label: '1024×1536 (竖版)' },
  { value: '1536x1024', label: '1536×1024 (横版)' },
]

export const IMAGE_STEP_OPTIONS = [
  { value: 15, label: '15 (快速)' },
  { value: 20, label: '20 (推荐)' },
  { value: 30, label: '30 (精细)' },
  { value: 50, label: '50 (最佳)' },
]

/** 调用 Kolors 模型生成图片（优先通过 Cloudflare Worker 安全代理） */
export async function generateImage(prompt: string, options: ImageGenOptions): Promise<string> {
  if (!IMAGE_GEN_CONFIG.ENABLED) {
    throw new Error('AI图片生成功能未启用')
  }

  const isDirect = IMAGE_GEN_CONFIG.API_BASE_URL.startsWith('http') && Boolean(IMAGE_GEN_CONFIG.API_KEY)
  const targetUrl = isDirect ? IMAGE_GEN_CONFIG.API_BASE_URL : '/api/ai/image'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (isDirect && IMAGE_GEN_CONFIG.API_KEY) {
    headers['Authorization'] = `Bearer ${IMAGE_GEN_CONFIG.API_KEY}`
  } else {
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const body: Record<string, unknown> = {
    model: IMAGE_GEN_CONFIG.MODEL,
    prompt,
    image_size: options.imageSize,
    imageSize: options.imageSize,
    batch_size: 1,
    num_inference_steps: options.numInferenceSteps,
    numInferenceSteps: options.numInferenceSteps,
    guidance_scale: options.guidanceScale,
    guidanceScale: options.guidanceScale,
  }
  if (options.negativePrompt) {
    body.negative_prompt = options.negativePrompt
    body.negativePrompt = options.negativePrompt
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorData = (await response.json()) as { error?: string; message?: string }
      detail = errorData.error || errorData.message || ''
    } catch {
      // 忽略非 JSON 错误体
    }
    throw new Error(detail || `AI图片生成失败: ${response.status}`.trim())
  }

  const result = (await response.json()) as {
    data?: { images?: { url: string }[] }
    images?: { url: string }[]
  }

  // 兼容 worker 返回的包裹对象 { success: true, data: { images: [...] } } 与供应商直连返回
  const images = result.data?.images || result.images
  const imageUrl = images?.[0]?.url
  if (!imageUrl) throw new Error('AI图片生成失败: 未返回图片')

  return imageUrl
}


/** 下载生成的图片为 Blob，用于上传到 R2 持久化 */
export async function downloadImageBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`图片下载失败: ${response.status} ${response.statusText}`)
  }
  return response.blob()
}