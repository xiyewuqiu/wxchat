import { Hono } from 'hono'
import type { Env, JwtPayload } from '../types.js'

const realtime = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

// Server-Sent Events 实时通信
realtime.get('/events', async (c) => {
  const deviceId = c.req.query('deviceId')

  if (!deviceId) {
    return c.json({ error: '设备ID不能为空' }, 400)
  }

  try {
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no',
    })

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    const sendSSE = (data: string, event = 'message') => {
      void writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`)).catch(() => {
        cleanup()
      })
    }

    sendSSE('connected', 'connection')

    const heartbeat = setInterval(() => sendSSE('ping', 'heartbeat'), 30000)

    // 轮询数据库，把“有新消息”作为轻量信号推给客户端，由客户端拉取完整列表
    const checkMessages = setInterval(async () => {
      try {
        const { DB } = c.env
        if (!DB) return

        const result = await DB.prepare(
          `SELECT COUNT(*) as count FROM messages WHERE timestamp > datetime('now', '-10 seconds')`,
        ).first<{ count: number }>()

        if (result && result.count > 0) {
          sendSSE(JSON.stringify({ newMessages: result.count }), 'message')
        }
      } catch (error) {
        console.error('SSE消息检查失败:', error)
      }
    }, 5000)

    let closed = false
    const cleanup = () => {
      if (closed) return
      closed = true
      clearInterval(heartbeat)
      clearInterval(checkMessages)
      void writer.close().catch(() => {
        // 连接已断开时忽略关闭异常
      })
    }

    // 防止连接泄漏：5 分钟超时后主动清理
    const timeout = setTimeout(cleanup, 300000)

    c.req.raw.signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      cleanup()
    })

    return new Response(readable, { headers })
  } catch (error) {
    return c.json({ success: false, error: `SSE连接失败: ${(error as Error).message}` }, 500)
  }
})

// 长轮询接口（SSE 降级方案）
realtime.get('/poll', async (c) => {
  try {
    const { DB } = c.env
    const deviceId = c.req.query('deviceId')
    const lastMessageId = c.req.query('lastMessageId') || '0'
    const timeout = parseInt(c.req.query('timeout') || '30', 10)

    if (!deviceId) {
      return c.json({ error: '设备ID不能为空' }, 400)
    }
    if (!DB) {
      return c.json({ error: '数据库未绑定' }, 500)
    }

    const startTime = Date.now()
    const maxWaitTime = Math.min(timeout * 1000, 30000)

    while (Date.now() - startTime < maxWaitTime) {
      const result = await DB.prepare('SELECT COUNT(*) as count FROM messages WHERE id > ?')
        .bind(lastMessageId)
        .first<{ count: number }>()

      if (result && result.count > 0) {
        return c.json({
          success: true,
          hasNewMessages: true,
          newMessageCount: result.count,
          timestamp: new Date().toISOString(),
        })
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return c.json({
      success: true,
      hasNewMessages: false,
      newMessageCount: 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

export default realtime