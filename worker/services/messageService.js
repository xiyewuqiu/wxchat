/**
 * 消息服务层 - 消息CRUD操作
 */

import { DBService } from './database.js'

export const MessageService = {
  /**
   * 获取消息列表（支持分页）
   */
  async getMessages(db, { limit = 50, offset = 0 } = {}) {
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 200)
    const offsetNum = Math.max(0, parseInt(offset))

    const sql = `
      SELECT
        m.id,
        m.type,
        m.content,
        m.device_id,
        m.status,
        m.timestamp,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.r2_key
      FROM messages m
      LEFT JOIN files f ON m.file_id = f.id
      ORDER BY m.timestamp ASC
      LIMIT ? OFFSET ?
    `

    const countSql = `SELECT COUNT(*) as total FROM messages`

    const [dataResult, countResult] = await Promise.all([
      DBService.queryAll(db, sql, [limitNum, offsetNum]),
      DBService.queryFirst(db, countSql)
    ])

    return {
      data: dataResult.results || [],
      total: countResult?.total || 0,
      limit: limitNum,
      offset: offsetNum
    }
  },

  /**
   * 创建文本消息
   */
  async createMessage(db, { type, content, deviceId }) {
    const result = await DBService.execute(db,
      `INSERT INTO messages (type, content, device_id) VALUES (?, ?, ?)`,
      [type || 'text', content, deviceId]
    )
    return { id: result.meta.last_row_id }
  },

  /**
   * 创建文件消息
   */
  async createFileMessage(db, fileId, deviceId) {
    const result = await DBService.execute(db,
      `INSERT INTO messages (type, file_id, device_id) VALUES (?, ?, ?)`,
      ['file', fileId, deviceId]
    )
    return { id: result.meta.last_row_id }
  },

  /**
   * 创建AI消息
   */
  async createAIMessage(db, { content, deviceId, type = 'ai_response' }) {
    const prefix = type === 'ai_response' ? '[AI] ' :
                   type === 'ai_thinking' ? '[AI-THINKING] ' : ''
    const messageContent = prefix + content

    const result = await DBService.execute(db,
      `INSERT INTO messages (type, content, device_id) VALUES (?, ?, ?)`,
      ['text', messageContent, deviceId]
    )
    return {
      id: result.meta.last_row_id,
      type: 'text',
      content: messageContent,
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      originalType: type
    }
  },

  /**
   * 获取新消息数量（用于轮询）
   */
  async getNewMessageCount(db, lastMessageId = '0') {
    const result = await DBService.queryFirst(db,
      `SELECT COUNT(*) as count FROM messages WHERE id > ?`,
      [lastMessageId]
    )
    return result?.count || 0
  },

  /**
   * 获取最近消息数（用于SSE检查）
   */
  async getRecentMessageCount(db, seconds = 10) {
    const result = await DBService.queryFirst(db,
      `SELECT COUNT(*) as count FROM messages WHERE timestamp > datetime('now', ? || ' seconds')`,
      [`-${seconds}`]
    )
    return result?.count || 0
  },

  /**
   * 删除所有消息
   */
  async deleteAll(db) {
    await DBService.execute(db, `DELETE FROM messages`)
  },

  /**
   * 统计消息数量
   */
  async countAll(db) {
    const result = await DBService.queryFirst(db,
      `SELECT COUNT(*) as count FROM messages`
    )
    return result?.count || 0
  }
}
