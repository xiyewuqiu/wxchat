import { Hono } from 'hono'
import type { Env, JwtPayload } from '../types.js'

const messages = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

type MessageRow = {
  id: number
  type: 'text' | 'file'
  content: string | null
  device_id: string
  timestamp: string
  original_name: string | null
  file_size: number | null
  mime_type: string | null
  r2_key: string | null
}

// 获取消息列表
// 分页语义：按时间倒序取最近 N 条，再反转成升序返回，
// 因此 offset 表示“跳过最新的 offset 条”，用于向上加载历史消息。
messages.get('/', async (c) => {
  try {
    const { DB } = c.env
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0)

    const [rows, totalRow] = await Promise.all([
      DB.prepare(
        `SELECT
           m.id,
           m.type,
           m.content,
           m.device_id,
           -- SQLite 的 CURRENT_TIMESTAMP 是 UTC 且无时区标记，统一转成 ISO 8601 供前端正确解析
           strftime('%Y-%m-%dT%H:%M:%SZ', m.timestamp) AS timestamp,
           f.original_name,
           f.file_size,
           f.mime_type,
           f.r2_key
         FROM messages m
         LEFT JOIN files f ON m.file_id = f.id
         ORDER BY m.timestamp DESC, m.id DESC
         LIMIT ?1 OFFSET ?2`,
      )
        .bind(limit, offset)
        .all<MessageRow>(),
      DB.prepare('SELECT COUNT(*) as count FROM messages').first<{ count: number }>(),
    ])

    const data = (rows.results ?? []).slice().reverse()

    return c.json({
      success: true,
      data,
      total: totalRow?.count ?? data.length,
      limit,
      offset,
    })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

// 发送文本消息
messages.post('/', async (c) => {
  try {
    const { DB } = c.env
    const { content, deviceId, type = 'text' } = await c.req.json<{
      content?: string
      deviceId?: string
      type?: string
    }>()

    if (!content || !deviceId) {
      return c.json({ success: false, error: '内容和设备ID不能为空' }, 400)
    }

    const result = await DB.prepare('INSERT INTO messages (type, content, device_id) VALUES (?, ?, ?)')
      .bind(type, content, deviceId)
      .run()

    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

export default messages