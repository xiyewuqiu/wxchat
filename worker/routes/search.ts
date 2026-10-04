import { Hono } from 'hono'
import type { Env, JwtPayload } from '../types.js'

const search = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

const FILE_TYPE_MAP: Record<string, string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp'],
  video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv', 'video/flv', 'video/webm'],
  audio: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/m4a'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
  text: ['text/plain', 'text/html', 'text/css', 'text/javascript', 'text/markdown', 'text/csv'],
  code: ['application/javascript', 'application/json', 'application/xml'],
}

const TIME_RANGE_CONDITIONS: Record<string, string> = {
  today: `m.timestamp >= datetime('now', 'start of day')`,
  yesterday: `m.timestamp >= datetime('now', '-1 day', 'start of day') AND m.timestamp < datetime('now', 'start of day')`,
  week: `m.timestamp >= datetime('now', '-7 days')`,
  month: `m.timestamp >= datetime('now', '-30 days')`,
}

// 搜索功能 - 关键词组内 OR、过滤条件之间 AND
search.get('/', async (c) => {
  try {
    const { DB } = c.env
    const query = (c.req.query('q') || '').trim()
    const type = c.req.query('type') || 'all'
    const timeRange = c.req.query('timeRange') || 'all'
    const deviceId = c.req.query('deviceId') || 'all'
    const fileType = c.req.query('fileType') || 'all'
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '100', 10) || 100, 1), 200)
    const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0)

    if (!query) {
      return c.json({ success: false, error: '搜索关键词不能为空' }, 400)
    }

    const searchConditions: string[] = []
    const filterConditions: string[] = []
    const params: (string | number)[] = []
    let needFileJoin = false

    if (type === 'all' || type === 'text') {
      searchConditions.push(`(m.type = 'text' AND m.content LIKE ?)`)
      params.push(`%${query}%`)
    }

    if (type === 'all' || type === 'file') {
      needFileJoin = true
      searchConditions.push(`(m.type = 'file' AND f.original_name LIKE ?)`)
      params.push(`%${query}%`)
    }

    if (searchConditions.length === 0) {
      return c.json({ success: false, error: '无效的搜索条件' }, 400)
    }

    if (timeRange !== 'all' && TIME_RANGE_CONDITIONS[timeRange]) {
      filterConditions.push(TIME_RANGE_CONDITIONS[timeRange])
    }

    if (deviceId !== 'all') {
      filterConditions.push('m.device_id = ?')
      params.push(deviceId)
    }

    if (fileType !== 'all' && (type === 'all' || type === 'file')) {
      const mimeTypes = FILE_TYPE_MAP[fileType] || []
      if (mimeTypes.length > 0) {
        needFileJoin = true
        filterConditions.push(`(${mimeTypes.map(() => 'f.mime_type = ?').join(' OR ')})`)
        params.push(...mimeTypes)
      }
    }

    const joinClause = needFileJoin ? 'LEFT JOIN files f ON m.file_id = f.id' : ''
    const whereParts = [`(${searchConditions.join(' OR ')})`]
    if (filterConditions.length > 0) {
      whereParts.push(`(${filterConditions.join(' AND ')})`)
    }
    const whereClause = `WHERE ${whereParts.join(' AND ')}`

    const selectFields = `
      m.id,
      m.type,
      m.content,
      m.device_id,
      strftime('%Y-%m-%dT%H:%M:%SZ', m.timestamp) AS timestamp,
      f.original_name,
      f.file_size,
      f.mime_type,
      f.r2_key
    `

    const [countResult, dataResult] = await Promise.all([
      DB.prepare(`SELECT COUNT(DISTINCT m.id) as total FROM messages m ${joinClause} ${whereClause}`)
        .bind(...params)
        .first<{ total: number }>(),
      DB.prepare(
        `SELECT ${selectFields} FROM messages m ${joinClause} ${whereClause}
         ORDER BY m.timestamp DESC, m.id DESC LIMIT ? OFFSET ?`,
      )
        .bind(...params, limit, offset)
        .all(),
    ])

    return c.json({
      success: true,
      data: dataResult.results ?? [],
      total: countResult?.total ?? 0,
      limit,
      offset,
      query: { q: query, type, timeRange, deviceId, fileType },
    })
  } catch (error) {
    console.error('搜索失败:', error)
    return c.json({ success: false, error: `搜索失败: ${(error as Error).message}` }, 500)
  }
})

// 搜索建议：基于历史消息内容的去重前缀匹配
search.get('/suggestions', async (c) => {
  try {
    const { DB } = c.env
    const query = (c.req.query('q') || '').trim()

    if (query.length < 2) {
      return c.json({ success: true, data: [] })
    }

    const result = await DB.prepare(
      `SELECT DISTINCT suggestion FROM (
         SELECT
           CASE
             WHEN m.type = 'text' THEN substr(m.content, 1, 50)
             WHEN m.type = 'file' THEN f.original_name
             ELSE NULL
           END AS suggestion
         FROM messages m
         LEFT JOIN files f ON m.file_id = f.id
       )
       WHERE suggestion IS NOT NULL AND suggestion LIKE ?
       ORDER BY suggestion
       LIMIT 10`,
    )
      .bind(`%${query}%`)
      .all<{ suggestion: string }>()

    return c.json({ success: true, data: (result.results ?? []).map((row) => row.suggestion) })
  } catch (error) {
    console.error('搜索建议失败:', error)
    // 建议为增强功能，失败时静默降级为空列表
    return c.json({ success: true, data: [] })
  }
})

export default search