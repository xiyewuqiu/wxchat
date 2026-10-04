import { Hono } from 'hono'
import type { Env, JwtPayload } from '../types.js'

const sync = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

// AI 消息落库：数据库消息类型仅支持 text/file，
// 因此用内容前缀区分 AI 回答与思考过程，前端据此还原气泡样式。
sync.post('/ai/message', async (c) => {
  try {
    const { DB } = c.env
    const { content, deviceId, type = 'ai_response' } = await c.req.json<{
      content?: string
      deviceId?: string
      type?: 'ai_response' | 'ai_thinking'
    }>()

    if (!content || !deviceId) {
      return c.json({ success: false, error: '内容和设备ID不能为空' }, 400)
    }

    let messageContent = content
    if (type === 'ai_response') {
      messageContent = `[AI] ${content}`
    } else if (type === 'ai_thinking') {
      messageContent = `[AI-THINKING] ${content}`
    }

    const result = await DB.prepare('INSERT INTO messages (type, content, device_id) VALUES (?, ?, ?)')
      .bind('text', messageContent, deviceId)
      .run()

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        type: 'text',
        content: messageContent,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
        originalType: type,
      },
    })
  } catch (error) {
    console.error('AI消息存储失败:', error)
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

// 设备同步
sync.post('/sync', async (c) => {
  try {
    const { DB } = c.env
    const { deviceId, deviceName } = await c.req.json<{ deviceId?: string; deviceName?: string }>()

    if (!deviceId) {
      return c.json({ success: false, error: '设备ID不能为空' }, 400)
    }

    await DB.prepare(
      `INSERT INTO devices (id, name, last_active) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, last_active = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
    )
      .bind(deviceId, deviceName || '未知设备')
      .run()

    return c.json({ success: true, message: '设备同步成功' })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

// 数据清理 - 清空所有数据
sync.post('/clear-all', async (c) => {
  try {
    const { DB, R2 } = c.env
    const { confirmCode } = await c.req.json<{ confirmCode?: string }>()

    if (confirmCode !== '1234') {
      return c.json({ success: false, error: '确认码错误，请输入正确的确认码' }, 400)
    }

    const [messageCount, fileStats] = await Promise.all([
      DB.prepare('SELECT COUNT(*) as count FROM messages').first<{ count: number }>(),
      DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize FROM files').first<{
        count: number
        totalSize: number
      }>(),
    ])

    const files = await DB.prepare('SELECT r2_key FROM files').all<{ r2_key: string }>()

    // 逐个删除 R2 对象；单个失败不阻断整体清理
    let deletedFilesCount = 0
    for (const file of files.results ?? []) {
      try {
        await R2.delete(file.r2_key)
        deletedFilesCount++
      } catch (error) {
        console.error('删除R2文件失败:', file.r2_key, error)
      }
    }

    await DB.prepare('DELETE FROM messages').run()
    await DB.prepare('DELETE FROM files').run()
    await DB.prepare('DELETE FROM devices').run()

    return c.json({
      success: true,
      data: {
        deletedMessages: messageCount?.count ?? 0,
        deletedFiles: fileStats?.count ?? 0,
        deletedFileSize: fileStats?.totalSize ?? 0,
        deletedR2Files: deletedFilesCount,
        message: '所有数据已成功清理',
      },
    })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

export default sync