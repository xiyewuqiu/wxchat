import { Hono } from 'hono'

const realtime = new Hono()

// Server-Sent Events 实时通信
realtime.get('/events', async (c) => {
  const deviceId = c.req.query('deviceId')

  if (!deviceId) {
    return c.json({ error: '设备ID不能为空' }, 400)
  }

  try {
    // 设置SSE响应头
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    // 创建可读流
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    // 发送SSE消息的辅助函数
    const sendSSE = (data, event = 'message') => {
      const message = `event: ${event}\ndata: ${data}\n\n`
      writer.write(encoder.encode(message))
    }

    // 发送连接确认
    sendSSE('connected', 'connection')

    // 定期发送心跳
    const heartbeat = setInterval(() => {
      try {
        sendSSE('ping', 'heartbeat')
      } catch (error) {
        clearInterval(heartbeat)
      }
    }, 30000)

    // 监听新消息
    const checkMessages = setInterval(async () => {
      try {
        const { DB } = c.env
        if (!DB) {
          return
        }

        const stmt = DB.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE timestamp > datetime('now', '-10 seconds')
        `)
        const result = await stmt.first()

        if (result && result.count > 0) {
          sendSSE(JSON.stringify({ newMessages: result.count }), 'message')
        }
      } catch (error) {
        // 静默处理SSE消息检查失败
      }
    }, 5000)

    // 处理连接关闭
    const cleanup = () => {
      clearInterval(heartbeat)
      clearInterval(checkMessages)
      try {
        writer.close()
      } catch (error) {
        // 静默处理writer关闭失败
      }
    }

    // 设置超时清理（防止连接泄漏）
    const timeout = setTimeout(cleanup, 300000) // 5分钟超时

    // 监听中断信号
    c.req.signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      cleanup()
    })

    return new Response(readable, { headers })

  } catch (error) {
    return c.json({
      success: false,
      error: `SSE连接失败: ${error.message}`
    }, 500)
  }
})

// 长轮询接口（SSE降级方案）
realtime.get('/poll', async (c) => {
  try {
    const { DB } = c.env
    const deviceId = c.req.query('deviceId')
    const lastMessageId = c.req.query('lastMessageId') || '0'
    const timeout = parseInt(c.req.query('timeout') || '30') // 30秒超时

    if (!deviceId) {
      return c.json({ error: '设备ID不能为空' }, 400)
    }

    if (!DB) {
      return c.json({ error: '数据库未绑定' }, 500)
    }

    const startTime = Date.now()
    const maxWaitTime = Math.min(timeout * 1000, 30000) // 最大30秒

    // 轮询检查新消息
    while (Date.now() - startTime < maxWaitTime) {
      const stmt = DB.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE id > ?
      `)
      const result = await stmt.bind(lastMessageId).first()

      if (result && result.count > 0) {
        // 有新消息，立即返回
        return c.json({
          success: true,
          hasNewMessages: true,
          newMessageCount: result.count,
          timestamp: new Date().toISOString()
        })
      }

      // 等待1秒后再次检查
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 超时，返回无新消息
    return c.json({
      success: true,
      hasNewMessages: false,
      newMessageCount: 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default realtime
