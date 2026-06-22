import { Hono } from 'hono'
import { MessageService } from '../services/messageService.js'
import { validateParams } from '../middleware/errorHandler.js'

const messages = new Hono()

function deviceInfoEnabled(env) {
  return env.MESSAGE_DEVICE_INFO_ENABLED === true || env.MESSAGE_DEVICE_INFO_ENABLED === 'true'
}

// 获取消息列表（支持分页）
messages.get('/', async (c) => {
  try {
    const { DB } = c.env
    const limit = c.req.query('limit') || '50'
    const offset = c.req.query('offset') || '0'

    const result = await MessageService.getMessages(DB, { limit, offset })

    return c.json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset
    })
  } catch (error) {
    console.error('[Messages] 获取消息列表失败:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 发送文本消息
messages.post('/', async (c) => {
  try {
    const { DB } = c.env
    const { content, deviceId, type = 'text', deviceInfo } = await c.req.json()

    validateParams({ content, deviceId }, ['content', 'deviceId'])

    const result = await MessageService.createMessage(DB, {
      type,
      content,
      deviceId,
      deviceInfo: deviceInfoEnabled(c.env) ? deviceInfo : null
    })

    return c.json({
      success: true,
      data: { id: result.id }
    })
  } catch (error) {
    const status = error.status || 500
    return c.json({
      success: false,
      error: error.message
    }, status)
  }
})

export default messages
