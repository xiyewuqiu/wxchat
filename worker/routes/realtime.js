import { Hono } from 'hono'
import { MessageService } from '../services/messageService.js'

const realtime = new Hono()

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
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()
    let isClosed = false

    const sendSSE = (data, event = 'message') => {
      if (isClosed) return
      try {
        const message = `event: ${event}\ndata: ${data}\n\n`
        writer.write(encoder.encode(message))
      } catch (error) {
        // 流已关闭，忽略
      }
    }

    // 发送连接确认
    sendSSE(JSON.stringify({ status: 'connected', deviceId }), 'connection')

    // 心跳检测（每30秒）
    const heartbeatTimer = setInterval(() => {
      sendSSE('ping', 'heartbeat')
    }, 30000)

    // 轮询新消息（每3秒，比之前5秒更灵敏）
    const messageCheckTimer = setInterval(async () => {
      if (isClosed) return
      try {
        const { DB } = c.env
        if (!DB) return

        const count = await MessageService.getRecentMessageCount(DB, 5)
        if (count > 0) {
          sendSSE(JSON.stringify({ newMessages: count }), 'message')
        }
      } catch (error) {
        // 静默处理
      }
    }, 3000)

    // 流关闭清理
    const cleanup = () => {
      if (isClosed) return
      isClosed = true
      clearInterval(heartbeatTimer)
      clearInterval(messageCheckTimer)
      try { writer.close() } catch (e) { /* 忽略 */ }
    }

    // Worker 最长执行 30 秒，设置 25 秒超时提前关闭
    const timeout = setTimeout(() => {
      sendSSE(JSON.stringify({ reason: 'timeout', reconnect: true }), 'timeout')
      cleanup()
    }, 25000)

    // 监听中断信号
    if (c.req.signal) {
      c.req.signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        cleanup()
      })
    }

    return new Response(readable, { headers })
  } catch (error) {
    console.error('[Realtime] SSE连接失败:', error)
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
    const timeout = Math.min(
      parseInt(c.req.query('timeout') || '30'),
      25 // 最长25秒，适配Worker限制
    )

    if (!deviceId) {
      return c.json({ error: '设备ID不能为空' }, 400)
    }
    if (!DB) {
      return c.json({ error: '数据库未绑定' }, 500)
    }

    const startTime = Date.now()
    const maxWaitTime = timeout * 1000

    while (Date.now() - startTime < maxWaitTime) {
      const count = await MessageService.getNewMessageCount(DB, lastMessageId)

      if (count > 0) {
        return c.json({
          success: true,
          hasNewMessages: true,
          newMessageCount: count,
          timestamp: new Date().toISOString()
        })
      }

      // 等待1.5秒后再次检查（比之前1秒更友好，减少DB压力）
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    return c.json({
      success: true,
      hasNewMessages: false,
      newMessageCount: 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Realtime] 长轮询失败:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default realtime