import { Hono } from 'hono'
import type { Env, JwtPayload } from '../types.js'

const ai = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

const SILICONFLOW_BASE = 'https://api.siliconflow.cn/v1'

/**
 * 获取 Cloudflare Workers 配置的 AI 密钥
 * 支持 AI_API_KEY 或 SILICONFLOW_API_KEY 作为 Secret
 */
function getApiKey(env: Env): string | null {
  return env.AI_API_KEY || env.SILICONFLOW_API_KEY || null
}

/**
 * POST /api/ai/chat
 * 流式对话代理：前端无需持有任何密钥，Worker 鉴权后代理 SiliconFlow SSE 流
 */
ai.post('/chat', async (c) => {
  const apiKey = getApiKey(c.env)
  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: '未配置 AI 密钥。请在 Cloudflare Dashboard (Workers & Pages -> wxchat -> Settings -> Variables and Secrets) 中添加名为 AI_API_KEY 的 Secret。',
      },
      503,
    )
  }

  try {
    const body = (await c.req.json()) as {
      message?: string
      model?: string
      maxTokens?: number
      temperature?: number
    }

    if (!body.message || typeof body.message !== 'string') {
      return c.json({ success: false, error: '消息内容不能为空' }, 400)
    }

    const upstreamResponse = await fetch(`${SILICONFLOW_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || 'deepseek-ai/DeepSeek-R1',
        messages: [{ role: 'user', content: body.message }],
        stream: true,
        max_tokens: body.maxTokens || 4000,
        temperature: body.temperature ?? 0.7,
      }),
    })

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text()
      return c.json(
        {
          success: false,
          error: `AI 供应商返回错误 (${upstreamResponse.status}): ${errText}`,
        },
        502,
      )
    }

    // 将上游的 SSE 流式响应直接透传给客户端，保持零延迟
    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message || 'AI 对话服务处理异常',
      },
      500,
    )
  }
})

/**
 * POST /api/ai/image
 * AI 绘画代理：Worker 代理 SiliconFlow 图片生成，避免密钥泄露
 */
ai.post('/image', async (c) => {
  const apiKey = getApiKey(c.env)
  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: '未配置 AI 密钥。请在 Cloudflare Dashboard 中添加名为 AI_API_KEY 的 Secret。',
      },
      503,
    )
  }

  try {
    const options = (await c.req.json()) as {
      prompt: string
      imageSize?: string
      numInferenceSteps?: number
      guidanceScale?: number
      negativePrompt?: string
      model?: string
    }

    if (!options.prompt || !options.prompt.trim()) {
      return c.json({ success: false, error: '画面描述 (Prompt) 不能为空' }, 400)
    }

    const payload: Record<string, unknown> = {
      model: options.model || 'Kwai-Kolors/Kolors',
      prompt: options.prompt.trim(),
      image_size: options.imageSize || '1024x1024',
      batch_size: 1,
      num_inference_steps: options.numInferenceSteps || 20,
      guidance_scale: options.guidanceScale ?? 7.5,
    }
    if (options.negativePrompt) {
      payload.negative_prompt = options.negativePrompt.trim()
    }

    const upstreamResponse = await fetch(`${SILICONFLOW_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text()
      return c.json(
        {
          success: false,
          error: `生图服务返回错误 (${upstreamResponse.status}): ${errText}`,
        },
        502,
      )
    }

    const data = await upstreamResponse.json()
    return c.json({ success: true, data })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message || 'AI 生图处理异常',
      },
      500,
    )
  }
})

export default ai
