import { Hono } from 'hono'

const messages = new Hono()

// 获取消息列表
messages.get('/', async (c) => {
  try {
    const { DB } = c.env
    const limit = c.req.query('limit') || 50
    const offset = c.req.query('offset') || 0

    const stmt = DB.prepare(`
      SELECT
        m.id,
        m.type,
        m.content,
        m.device_id,
        m.timestamp,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.r2_key
      FROM messages m
      LEFT JOIN files f ON m.file_id = f.id
      ORDER BY m.timestamp ASC
    `)

    const result = await stmt.all()

    return c.json({
      success: true,
      data: result.results,
      total: result.results.length
    })
  } catch (error) {
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
    const { content, deviceId, type = 'text' } = await c.req.json()

    if (!content || !deviceId) {
      return c.json({
        success: false,
        error: '内容和设备ID不能为空'
      }, 400)
    }

    const stmt = DB.prepare(`
      INSERT INTO messages (type, content, device_id)
      VALUES (?, ?, ?)
    `)

    const result = await stmt.bind(type, content, deviceId).run()

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default messages
