import { Hono } from 'hono'

const search = new Hono()

// 搜索功能 - 强大的多条件搜索
search.get('/', async (c) => {
  try {
    const { DB } = c.env
    const query = c.req.query('q')
    const type = c.req.query('type') || 'all'
    const timeRange = c.req.query('timeRange') || 'all'
    const deviceId = c.req.query('deviceId') || 'all'
    const fileType = c.req.query('fileType') || 'all'
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')

    if (!query || query.trim().length === 0) {
      return c.json({
        success: false,
        error: '搜索关键词不能为空'
      }, 400)
    }

    // 构建基础查询
    let whereConditions = []
    let joinConditions = []
    let params = []

    // 文本搜索条件
    if (type === 'all' || type === 'text') {
      whereConditions.push(`(m.content LIKE ? AND m.type = 'text')`)
      params.push(`%${query}%`)
    }

    if (type === 'all' || type === 'file') {
      joinConditions.push('LEFT JOIN files f ON m.file_id = f.id')
      whereConditions.push(`(f.original_name LIKE ? AND m.type = 'file')`)
      params.push(`%${query}%`)
    }

    // 如果只搜索文件但没有JOIN，则添加JOIN
    if (type === 'file' && joinConditions.length === 0) {
      joinConditions.push('LEFT JOIN files f ON m.file_id = f.id')
    }

    // 时间范围过滤
    if (timeRange !== 'all') {
      switch (timeRange) {
        case 'today':
          whereConditions.push(`m.timestamp >= date('now', 'start of day')`)
          break
        case 'yesterday':
          whereConditions.push(`m.timestamp >= date('now', '-1 day', 'start of day') AND m.timestamp < date('now', 'start of day')`)
          break
        case 'week':
          whereConditions.push(`m.timestamp >= date('now', '-7 days')`)
          break
        case 'month':
          whereConditions.push(`m.timestamp >= date('now', '-30 days')`)
          break
      }
    }

    // 设备过滤
    if (deviceId !== 'all') {
      whereConditions.push(`m.device_id = ?`)
      params.push(deviceId)
    }

    // 文件类型过滤
    if (fileType !== 'all' && (type === 'all' || type === 'file')) {
      // 确保有文件表的JOIN
      if (joinConditions.length === 0) {
        joinConditions.push('LEFT JOIN files f ON m.file_id = f.id')
      }

      // 文件类型映射
      const fileTypeMap = {
        'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp'],
        'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv', 'video/flv', 'video/webm'],
        'audio': ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/m4a'],
        'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
        'text': ['text/plain', 'text/html', 'text/css', 'text/javascript', 'text/markdown'],
        'code': ['application/javascript', 'application/json', 'application/xml']
      }

      const mimeTypes = fileTypeMap[fileType] || []
      if (mimeTypes.length > 0) {
        const mimeConditions = mimeTypes.map(() => 'f.mime_type = ?').join(' OR ')
        whereConditions.push(`(${mimeConditions})`)
        params.push(...mimeTypes)
      }
    }

    // 如果没有WHERE条件，返回错误
    if (whereConditions.length === 0) {
      return c.json({
        success: false,
        error: '无效的搜索条件'
      }, 400)
    }

    // 构建完整查询
    const joinClause = joinConditions.length > 0 ? joinConditions.join(' ') : ''
    const whereClause = whereConditions.length > 0 ? `WHERE (${whereConditions.join(' OR ')})` : ''

    let selectFields = `
      m.id,
      m.type,
      m.content,
      m.device_id,
      m.timestamp,
      f.original_name,
      f.file_size,
      f.mime_type,
      f.r2_key
    `

    // 总数查询
    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM messages m
      ${joinClause}
      ${whereClause}
    `

    // 数据查询
    const dataQuery = `
      SELECT ${selectFields}
      FROM messages m
      ${joinClause}
      ${whereClause}
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `

    // 执行查询
    const countStmt = DB.prepare(countQuery)
    const dataStmt = DB.prepare(dataQuery)

    // 为计数查询添加参数
    const countParams = [...params]
    
    // 为数据查询添加分页参数
    const dataParams = [...params, limit, offset]

    const [countResult, dataResult] = await Promise.all([
      countStmt.bind(...countParams).first(),
      dataStmt.bind(...dataParams).all()
    ])

    return c.json({
      success: true,
      data: dataResult.results || [],
      total: countResult.total || 0,
      limit,
      offset,
      query: {
        q: query,
        type,
        timeRange,
        deviceId,
        fileType
      }
    })

  } catch (error) {
    console.error('搜索失败:', error)
    return c.json({
      success: false,
      error: `搜索失败: ${error.message}`
    }, 500)
  }
})

// 搜索建议接口
search.get('/suggestions', async (c) => {
  try {
    const { DB } = c.env
    const query = c.req.query('q')

    if (!query || query.trim().length < 2) {
      return c.json({
        success: true,
        data: []
      })
    }

    // 获取最近的相关搜索词（基于消息内容）
    const stmt = DB.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN m.type = 'text' THEN substr(m.content, 1, 50)
          WHEN m.type = 'file' THEN f.original_name
          ELSE '未知'
        END as suggestion
      FROM messages m
      LEFT JOIN files f ON m.file_id = f.id
      WHERE suggestion LIKE ?
      ORDER BY m.timestamp DESC
      LIMIT 10
    `)

    const result = await stmt.bind(`%${query}%`).all()

    return c.json({
      success: true,
      data: result.results?.map(row => row.suggestion) || []
    })

  } catch (error) {
    console.error('搜索建议失败:', error)
    return c.json({
      success: true,
      data: [] // 建议功能失败时静默处理
    })
  }
})

export default search
