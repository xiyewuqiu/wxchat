import { Hono } from 'hono'
import { MessageService } from '../services/messageService.js'

const search = new Hono()

// 文件类型MIME映射
const FILE_TYPE_MAP = {
  'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp'],
  'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv', 'video/flv', 'video/webm'],
  'audio': ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/m4a'],
  'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  'text': ['text/plain', 'text/html', 'text/css', 'text/javascript', 'text/markdown'],
  'code': ['application/javascript', 'application/json', 'application/xml']
}

// 搜索功能 - 多条件搜索
search.get('/', async (c) => {
  try {
    const { DB } = c.env
    await MessageService.ensureSchema(DB)

    const query = c.req.query('q')
    const type = c.req.query('type') || 'all'
    const timeRange = c.req.query('timeRange') || 'all'
    const deviceId = c.req.query('deviceId') || 'all'
    const fileType = c.req.query('fileType') || 'all'
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 200)
    const offset = parseInt(c.req.query('offset') || '0')

    if (!query || query.trim().length === 0) {
      return c.json({ success: false, error: '搜索关键词不能为空' }, 400)
    }

    const whereConditions = []
    const params = []

    // 文本搜索
    if (type === 'all' || type === 'text') {
      whereConditions.push(`(m.content LIKE ? AND m.type = 'text')`)
      params.push(`%${query}%`)
    }

    // 文件搜索
    if (type === 'all' || type === 'file') {
      whereConditions.push(`(f.original_name LIKE ? AND m.type = 'file')`)
      params.push(`%${query}%`)
    }

    // 时间范围
    if (timeRange !== 'all') {
      const timeMap = {
        'today': `m.timestamp >= date('now', 'start of day')`,
        'yesterday': `m.timestamp >= date('now', '-1 day', 'start of day') AND m.timestamp < date('now', 'start of day')`,
        'week': `m.timestamp >= date('now', '-7 days')`,
        'month': `m.timestamp >= date('now', '-30 days')`
      }
      if (timeMap[timeRange]) {
        whereConditions.push(timeMap[timeRange])
      }
    }

    // 设备过滤
    if (deviceId !== 'all') {
      whereConditions.push('m.device_id = ?')
      params.push(deviceId)
    }

    // 文件类型过滤
    if (fileType !== 'all' && (type === 'all' || type === 'file')) {
      const mimeTypes = FILE_TYPE_MAP[fileType] || []
      if (mimeTypes.length > 0) {
        const mimeConditions = mimeTypes.map(() => 'f.mime_type = ?').join(' OR ')
        whereConditions.push(`(${mimeConditions})`)
        params.push(...mimeTypes)
      }
    }

    if (whereConditions.length === 0) {
      return c.json({ success: false, error: '无效的搜索条件' }, 400)
    }

    const joinClause = `
      LEFT JOIN files f ON m.file_id = f.id
      LEFT JOIN devices d ON m.device_id = d.id
    `
    const whereClause = `WHERE ${whereConditions.join(' OR ')}`
    const selectFields = `
      m.id, m.type, m.content, m.device_id, m.device_info, d.name AS device_name, m.timestamp,
      f.original_name, f.file_size, f.mime_type, f.r2_key
    `
    const countParams = [...params]
    const dataParams = [...params, limit, offset]

    const [countResult, dataResult] = await Promise.all([
      DB.prepare(`SELECT COUNT(DISTINCT m.id) as total FROM messages m ${joinClause} ${whereClause}`)
        .bind(...countParams).first(),
      DB.prepare(`SELECT ${selectFields} FROM messages m ${joinClause} ${whereClause} ORDER BY m.timestamp DESC LIMIT ? OFFSET ?`)
        .bind(...dataParams).all()
    ])

    return c.json({
      success: true,
      data: dataResult.results || [],
      total: countResult.total || 0,
      limit, offset,
      query: { q: query, type, timeRange, deviceId, fileType }
    })
  } catch (error) {
    console.error('[Search] 搜索失败:', error)
    return c.json({ success: false, error: `搜索失败: ${error.message}` }, 500)
  }
})

// 搜索建议接口
search.get('/suggestions', async (c) => {
  try {
    const { DB } = c.env
    const query = c.req.query('q')

    if (!query || query.trim().length < 2) {
      return c.json({ success: true, data: [] })
    }

    // 使用子查询避免别名在WHERE中失效
    const stmt = DB.prepare(`
      SELECT DISTINCT substr(m.content, 1, 50) as suggestion
      FROM messages m
      WHERE m.type = 'text' AND m.content LIKE ?
      ORDER BY m.timestamp DESC
      LIMIT 10
    `)

    const result = await stmt.bind(`%${query}%`).all()

    return c.json({
      success: true,
      data: result.results?.map(row => row.suggestion).filter(Boolean) || []
    })
  } catch (error) {
    console.error('[Search] 搜索建议失败:', error)
    return c.json({ success: true, data: [] })
  }
})

export default search
