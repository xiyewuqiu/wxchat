import { Hono } from 'hono'
import { MessageService } from '../services/messageService.js'
import { validateParams } from '../middleware/errorHandler.js'

const ai = new Hono()

function enabled(value) {
  return value === true || value === 'true'
}

function authHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }
  return headers
}

ai.post('/chat', async (c) => {
  if (!enabled(c.env.AI_ENABLED)) {
    return c.json({ success: false, error: 'AI功能未启用' }, 503)
  }
  if (!c.env.AI_CHAT_BASE_URL || !c.env.AI_CHAT_API_KEY) {
    return c.json({ success: false, error: 'AI聊天服务未配置' }, 503)
  }

  const body = await c.req.json()
  const message = body.message || body.content
  if (!message) {
    return c.json({ success: false, error: '消息不能为空' }, 400)
  }

  const upstreamResponse = await fetch(c.env.AI_CHAT_BASE_URL, {
    method: 'POST',
    headers: authHeaders(c.env.AI_CHAT_API_KEY),
    body: JSON.stringify({
      model: c.env.AI_CHAT_MODEL,
      messages: body.messages || [{ role: 'user', content: message }],
      stream: body.stream !== false,
      max_tokens: body.max_tokens || Number.parseInt(c.env.AI_CHAT_MAX_TOKENS || '4000', 10),
      temperature: body.temperature ?? Number.parseFloat(c.env.AI_CHAT_TEMPERATURE || '0.7'),
    }),
  })

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: {
      'Content-Type': upstreamResponse.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
})

ai.post('/message', async (c) => {
  try {
    const { DB } = c.env
    const { content, deviceId, type = 'ai_response' } = await c.req.json()

    validateParams({ content, deviceId }, ['content', 'deviceId'])

    const result = await MessageService.createAIMessage(DB, { content, deviceId, type })

    return c.json({ success: true, data: result })
  } catch (error) {
    const status = error.status || 500
    console.error('[AI] AI消息存储失败:', error)
    return c.json({ success: false, error: error.message }, status)
  }
})

ai.post('/image', async (c) => {
  if (!enabled(c.env.IMAGE_GEN_ENABLED)) {
    return c.json({ success: false, error: 'AI图片生成功能未启用' }, 503)
  }
  if (!c.env.AI_IMAGE_BASE_URL || !c.env.AI_IMAGE_API_KEY) {
    return c.json({ success: false, error: 'AI图片生成服务未配置' }, 503)
  }

  const body = await c.req.json()
  if (!body.prompt) {
    return c.json({ success: false, error: '提示词不能为空' }, 400)
  }

  const requestBody = {
    model: c.env.AI_IMAGE_MODEL,
    prompt: body.prompt,
    image_size: body.image_size || body.imageSize || c.env.AI_IMAGE_DEFAULT_SIZE || '1024x1024',
    batch_size: body.batch_size || 1,
    num_inference_steps: body.num_inference_steps || body.numInferenceSteps || Number.parseInt(c.env.AI_IMAGE_DEFAULT_STEPS || '20', 10),
    guidance_scale: body.guidance_scale || body.guidanceScale || Number.parseFloat(c.env.AI_IMAGE_DEFAULT_GUIDANCE || '7.5'),
  }

  if (body.negative_prompt || body.negativePrompt) {
    requestBody.negative_prompt = body.negative_prompt || body.negativePrompt
  }
  if (body.seed) {
    requestBody.seed = body.seed
  }

  const upstreamResponse = await fetch(c.env.AI_IMAGE_BASE_URL, {
    method: 'POST',
    headers: authHeaders(c.env.AI_IMAGE_API_KEY),
    body: JSON.stringify(requestBody),
  })

  const data = await upstreamResponse.json().catch(() => null)
  if (!upstreamResponse.ok) {
    return c.json({
      success: false,
      error: data?.error?.message || data?.error || `图片生成请求失败: ${upstreamResponse.status}`,
    }, upstreamResponse.status)
  }

  return c.json({ success: true, data })
})

export default ai
