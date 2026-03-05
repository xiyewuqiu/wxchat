import { Hono } from 'hono'

const files = new Hono()

// 文件上传
files.post('/upload', async (c) => {
  try {
    const { DB, R2 } = c.env
    const formData = await c.req.formData()
    const file = formData.get('file')
    const deviceId = formData.get('deviceId')

    if (!file || !deviceId) {
      return c.json({
        success: false,
        error: '文件和设备ID不能为空'
      }, 400)
    }

    // 检查文件大小限制（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return c.json({
        success: false,
        error: '文件大小不能超过10MB'
      }, 400)
    }

    // 生成唯一的文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const r2Key = `${timestamp}-${randomStr}.${fileExtension}`

    // 上传到R2
    try {
      await R2.put(r2Key, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          contentDisposition: `attachment; filename="${file.name}"`
        }
      })
    } catch (r2Error) {
      console.error('R2上传失败:', r2Error)
      return c.json({
        success: false,
        error: `文件上传到存储失败: ${r2Error.message}`
      }, 500)
    }

    // 保存文件信息到数据库
    try {
      const fileStmt = DB.prepare(`
        INSERT INTO files (original_name, file_name, file_size, mime_type, r2_key, upload_device_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      const fileResult = await fileStmt.bind(
        file.name,
        r2Key,
        file.size,
        file.type || 'application/octet-stream',
        r2Key,
        deviceId
      ).run()

      // 创建文件消息
      const messageStmt = DB.prepare(`
        INSERT INTO messages (type, file_id, device_id)
        VALUES (?, ?, ?)
      `)

      await messageStmt.bind('file', fileResult.meta.last_row_id, deviceId).run()

      return c.json({
        success: true,
        data: {
          fileId: fileResult.meta.last_row_id,
          fileName: file.name,
          fileSize: file.size,
          r2Key: r2Key
        }
      })
    } catch (dbError) {
      console.error('数据库操作失败:', dbError)
      // 如果数据库操作失败，尝试删除已上传的R2文件
      try {
        await R2.delete(r2Key)
      } catch (deleteError) {
        console.error('清理R2文件失败:', deleteError)
      }

      return c.json({
        success: false,
        error: `数据库操作失败: ${dbError.message}`
      }, 500)
    }
  } catch (error) {
    console.error('文件上传总体失败:', error)
    return c.json({
      success: false,
      error: `文件上传失败: ${error.message}`
    }, 500)
  }
})

// 文件下载
files.get('/download/:r2Key', async (c) => {
  try {
    const { DB, R2 } = c.env
    const r2Key = c.req.param('r2Key')

    // 获取文件信息
    const stmt = DB.prepare(`
      SELECT * FROM files WHERE r2_key = ?
    `)
    const fileInfo = await stmt.bind(r2Key).first()

    if (!fileInfo) {
      return c.json({
        success: false,
        error: '文件不存在'
      }, 404)
    }

    // 从R2获取文件
    const object = await R2.get(r2Key)

    if (!object) {
      return c.json({
        success: false,
        error: '文件不存在'
      }, 404)
    }

    // 更新下载次数
    const updateStmt = DB.prepare(`
      UPDATE files SET download_count = download_count + 1 WHERE r2_key = ?
    `)
    await updateStmt.bind(r2Key).run()

    return new Response(object.body, {
      headers: {
        'Content-Type': fileInfo.mime_type,
        'Content-Disposition': `attachment; filename="${fileInfo.original_name}"`,
        'Content-Length': fileInfo.file_size.toString()
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default files
