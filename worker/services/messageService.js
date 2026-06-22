/**
 * 消息服务层 - 消息CRUD操作
 */

import { DBService } from './database.js'

const MAX_DEVICE_INFO_FIELD_LENGTH = 160
const MAX_DEVICE_INFO_USER_AGENT_LENGTH = 240
const deviceInfoColumnReady = new WeakSet()

function clip(value, maxLength = MAX_DEVICE_INFO_FIELD_LENGTH) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function normalizeDeviceInfo(deviceInfo) {
  if (!deviceInfo || typeof deviceInfo !== 'object' || Array.isArray(deviceInfo)) {
    return null
  }

  const normalized = {}
  for (const key of ['name', 'type', 'os', 'browser', 'platform', 'language', 'timezone', 'capturedAt']) {
    const value = clip(deviceInfo[key])
    if (value) normalized[key] = value
  }

  const userAgent = clip(deviceInfo.userAgent, MAX_DEVICE_INFO_USER_AGENT_LENGTH)
  if (userAgent) normalized.userAgent = userAgent

  if (deviceInfo.screen && typeof deviceInfo.screen === 'object') {
    const screen = {}
    for (const key of ['width', 'height', 'pixelRatio']) {
      const value = Number(deviceInfo.screen[key])
      if (Number.isFinite(value) && value > 0) screen[key] = value
    }
    if (Object.keys(screen).length > 0) normalized.screen = screen
  }

  return Object.keys(normalized).length > 0 ? JSON.stringify(normalized) : null
}

async function ensureDeviceInfoColumn(db) {
  if (deviceInfoColumnReady.has(db)) return

  const result = await DBService.queryAll(db, `PRAGMA table_info(messages)`)
  const hasDeviceInfo = (result.results || []).some(column => column.name === 'device_info')
  if (!hasDeviceInfo) {
    try {
      await DBService.execute(db, `ALTER TABLE messages ADD COLUMN device_info TEXT`)
    } catch (error) {
      if (!/duplicate column name/i.test(error.message || '')) {
        throw error
      }
    }
  }

  deviceInfoColumnReady.add(db)
}

export const MessageService = {
  /**
   * 确保消息表结构为当前版本
   */
  async ensureSchema(db) {
    await ensureDeviceInfoColumn(db)
  },

  /**
   * 获取消息列表（支持分页）
   */
  async getMessages(db, { limit = 50, offset = 0 } = {}) {
    await this.ensureSchema(db)

    const limitNum = Math.min(Math.max(1, parseInt(limit)), 200)
    const offsetNum = Math.max(0, parseInt(offset))

    const sql = `
      SELECT
        m.id,
        m.type,
        m.content,
        m.device_id,
        m.device_info,
        d.name AS device_name,
        m.status,
        m.timestamp,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.r2_key
      FROM messages m
      LEFT JOIN files f ON m.file_id = f.id
      LEFT JOIN devices d ON m.device_id = d.id
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
  async createMessage(db, { type, content, deviceId, deviceInfo = null }) {
    await this.ensureSchema(db)

    const result = await DBService.execute(db,
      `INSERT INTO messages (type, content, device_id, device_info) VALUES (?, ?, ?, ?)`,
      [type || 'text', content, deviceId, normalizeDeviceInfo(deviceInfo)]
    )
    return { id: result.meta.last_row_id }
  },

  /**
   * 创建文件消息
   */
  async createFileMessage(db, fileId, deviceId, deviceInfo = null) {
    await this.ensureSchema(db)

    const result = await DBService.execute(db,
      `INSERT INTO messages (type, file_id, device_id, device_info) VALUES (?, ?, ?, ?)`,
      ['file', fileId, deviceId, normalizeDeviceInfo(deviceInfo)]
    )
    return { id: result.meta.last_row_id }
  },

  /**
   * 创建AI消息
   */
  async createAIMessage(db, { content, deviceId, type = 'ai_response', deviceInfo = null }) {
    await this.ensureSchema(db)

    const prefix = type === 'ai_response' ? '[AI] ' :
                   type === 'ai_thinking' ? '[AI-THINKING] ' : ''
    const messageContent = prefix + content

    const result = await DBService.execute(db,
      `INSERT INTO messages (type, content, device_id, device_info) VALUES (?, ?, ?, ?)`,
      ['text', messageContent, deviceId, normalizeDeviceInfo(deviceInfo)]
    )
    return {
      id: result.meta.last_row_id,
      type: 'text',
      content: messageContent,
      device_id: deviceId,
      device_info: normalizeDeviceInfo(deviceInfo),
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
