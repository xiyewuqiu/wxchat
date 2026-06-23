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

function getSearchTimezone(env) {
  const timezone = env.APP_TIMEZONE || env.SERVER_TIMEZONE || 'UTC'
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
    return timezone
  } catch {
    return 'UTC'
  }
}

function getDatePartsInTimezone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const values = {}
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = part.value
  }
  return values
}

function zonedDateTimeToUtc(dateKey, timeZone) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const parts = getDatePartsInTimezone(utcGuess, timeZone)
  const timezoneAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )
  const offsetMs = timezoneAsUtc - utcGuess.getTime()
  return new Date(utcGuess.getTime() - offsetMs)
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0))
  return date.toISOString().slice(0, 10)
}

function formatSqlUtc(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

function getTimeRangeBounds(timeRange, timeZone) {
  const now = new Date()
  const todayKey = (() => {
    const parts = getDatePartsInTimezone(now, timeZone)
    return `${parts.year}-${parts.month}-${parts.day}`
  })()

  if (timeRange === 'today') {
    const start = zonedDateTimeToUtc(todayKey, timeZone)
    const end = zonedDateTimeToUtc(addDaysToDateKey(todayKey, 1), timeZone)
    return { start, end }
  }

  if (timeRange === 'yesterday') {
    const yesterdayKey = addDaysToDateKey(todayKey, -1)
    return {
      start: zonedDateTimeToUtc(yesterdayKey, timeZone),
      end: zonedDateTimeToUtc(todayKey, timeZone),
    }
  }

  if (timeRange === 'week') {
    return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: null }
  }

  if (timeRange === 'month') {
    return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: null }
  }

  return null
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

    const searchConditions = []
    const filterConditions = []
    const params = []

    // 文本搜索
    if (type === 'all' || type === 'text') {
      searchConditions.push(`(m.content LIKE ? AND m.type = 'text')`)
      params.push(`%${query}%`)
    }

    // 文件搜索
    if (type === 'all' || type === 'file') {
      searchConditions.push(`(f.original_name LIKE ? AND m.type = 'file')`)
      params.push(`%${query}%`)
    }

    // 时间范围
    if (timeRange !== 'all') {
      const bounds = getTimeRangeBounds(timeRange, getSearchTimezone(c.env))
      if (bounds?.start) {
        filterConditions.push('m.timestamp >= ?')
        params.push(formatSqlUtc(bounds.start))
      }
      if (bounds?.end) {
        filterConditions.push('m.timestamp < ?')
        params.push(formatSqlUtc(bounds.end))
      }
    }

    // 设备过滤
    if (deviceId !== 'all') {
      filterConditions.push('m.device_id = ?')
      params.push(deviceId)
    }

    // 文件类型过滤
    if (fileType !== 'all' && (type === 'all' || type === 'file')) {
      const mimeTypes = FILE_TYPE_MAP[fileType] || []
      if (mimeTypes.length > 0) {
        const mimeConditions = mimeTypes.map(() => 'f.mime_type = ?').join(' OR ')
        filterConditions.push(`(${mimeConditions})`)
        params.push(...mimeTypes)
      }
    }

    if (searchConditions.length === 0) {
      return c.json({ success: false, error: '无效的搜索条件' }, 400)
    }

    const joinClause = `
      LEFT JOIN files f ON m.file_id = f.id
      LEFT JOIN devices d ON m.device_id = d.id
    `
    const allConditions = [`(${searchConditions.join(' OR ')})`, ...filterConditions]
    const whereClause = `WHERE ${allConditions.join(' AND ')}`
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
