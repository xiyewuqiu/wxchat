import { Hono } from 'hono'
import type { Env, JwtPayload } from '../types.js'

const files = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

// 文件上传
files.post('/upload', async (c) => {
  try {
    const { DB, R2 } = c.env
    const formData = await c.req.formData()
    const file = formData.get('file')
    const deviceId = formData.get('deviceId')

    if (!(file instanceof File) || typeof deviceId !== 'string' || !deviceId) {
      return c.json({ success: false, error: '文件和设备ID不能为空' }, 400)
    }

    // 生成唯一的存储键
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const r2Key = `${timestamp}-${randomStr}.${fileExtension}`

    try {
      await R2.put(r2Key, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          contentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
        },
      })
    } catch (r2Error) {
      console.error('R2上传失败:', r2Error)
      return c.json({ success: false, error: `文件上传到存储失败: ${(r2Error as Error).message}` }, 500)
    }

    try {
      const fileResult = await DB.prepare(
        `INSERT INTO files (original_name, file_name, file_size, mime_type, r2_key, upload_device_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(file.name, r2Key, file.size, file.type || 'application/octet-stream', r2Key, deviceId)
        .run()

      await DB.prepare('INSERT INTO messages (type, file_id, device_id) VALUES (?, ?, ?)')
        .bind('file', fileResult.meta.last_row_id, deviceId)
        .run()

      return c.json({
        success: true,
        data: {
          fileId: fileResult.meta.last_row_id,
          fileName: file.name,
          fileSize: file.size,
          r2Key,
        },
      })
    } catch (dbError) {
      console.error('数据库操作失败:', dbError)
      // 数据库写入失败时回滚已上传的对象，避免产生孤儿文件
      try {
        await R2.delete(r2Key)
      } catch (deleteError) {
        console.error('清理R2文件失败:', deleteError)
      }
      return c.json({ success: false, error: `数据库操作失败: ${(dbError as Error).message}` }, 500)
    }
  } catch (error) {
    console.error('文件上传总体失败:', error)
    return c.json({ success: false, error: `文件上传失败: ${(error as Error).message}` }, 500)
  }
})

// 文件下载
files.get('/download/:r2Key', async (c) => {
  try {
    const { DB, R2 } = c.env
    const r2Key = c.req.param('r2Key')

    const fileInfo = await DB.prepare('SELECT * FROM files WHERE r2_key = ?')
      .bind(r2Key)
      .first<{ original_name: string; mime_type: string; file_size: number }>()

    if (!fileInfo) {
      return c.json({ success: false, error: '文件不存在' }, 404)
    }

    const object = await R2.get(r2Key)
    if (!object) {
      return c.json({ success: false, error: '文件不存在' }, 404)
    }

    await DB.prepare('UPDATE files SET download_count = download_count + 1 WHERE r2_key = ?')
      .bind(r2Key)
      .run()

    return new Response(object.body, {
      headers: {
        'Content-Type': fileInfo.mime_type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.original_name)}"; filename*=UTF-8''${encodeURIComponent(fileInfo.original_name)}`,
        'Content-Length': fileInfo.file_size.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

export default files