import { Hono } from 'hono'
import { FileService } from '../services/fileService.js'
import { MessageService } from '../services/messageService.js'
import { validateParams } from '../middleware/errorHandler.js'

const files = new Hono()

function deviceInfoEnabled(env) {
  return env.MESSAGE_DEVICE_INFO_ENABLED === true || env.MESSAGE_DEVICE_INFO_ENABLED === 'true'
}

function parseDeviceInfo(value) {
  if (!value || typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

// 文件上传
files.post('/upload', async (c) => {
  try {
    const { DB, R2 } = c.env
    const formData = await c.req.formData()
    const file = formData.get('file')
    const deviceId = formData.get('deviceId')
    const deviceInfo = deviceInfoEnabled(c.env) ? parseDeviceInfo(formData.get('deviceInfo')) : null

    validateParams({ file: file ? 'present' : null, deviceId }, ['file', 'deviceId'])

    const maxFileSizeMb = Number.parseInt(c.env.MAX_FILE_SIZE_MB || '100', 10)
    const maxFileSize = maxFileSizeMb * 1024 * 1024
    if (Number.isFinite(maxFileSize) && file.size > maxFileSize) {
      return c.json({
        success: false,
        error: `文件大小不能超过 ${maxFileSizeMb}MB`
      }, 413)
    }

    // 生成唯一文件名
    const r2Key = FileService.generateR2Key(file.name)

    // 上传到R2
    await FileService.uploadToR2(R2, r2Key, file.stream(), {
      contentType: file.type,
      fileName: file.name
    })

    // 保存文件信息到数据库
    try {
      const fileRecord = await FileService.saveFileRecord(DB, {
        fileName: file.name,
        r2Key,
        fileSize: file.size,
        mimeType: file.type,
        deviceId
      })

      // 创建文件消息
      await MessageService.createFileMessage(DB, fileRecord.id, deviceId, deviceInfo)

      return c.json({
        success: true,
        data: {
          fileId: fileRecord.id,
          fileName: file.name,
          fileSize: file.size,
          r2Key
        }
      })
    } catch (dbError) {
      console.error('[Files] 数据库操作失败:', dbError)
      // 回滚：删除已上传的R2文件
      await FileService.deleteFromR2(R2, r2Key)
      return c.json({
        success: false,
        error: `数据库操作失败: ${dbError.message}`
      }, 500)
    }
  } catch (error) {
    const status = error.status || 500
    console.error('[Files] 上传失败:', error)
    return c.json({
      success: false,
      error: error.message
    }, status)
  }
})

// 文件下载
files.get('/download/:r2Key', async (c) => {
  try {
    const { DB, R2 } = c.env
    const r2Key = c.req.param('r2Key')

    // 获取文件信息
    const fileInfo = await FileService.getFileByR2Key(DB, r2Key)
    if (!fileInfo) {
      return c.json({ success: false, error: '文件不存在' }, 404)
    }

    // 从R2获取文件
    const object = await FileService.getFromR2(R2, r2Key)
    if (!object) {
      return c.json({ success: false, error: '文件不存在' }, 404)
    }

    // 异步更新下载次数（不阻塞响应）
    c.executionCtx.waitUntil(
      FileService.incrementDownloadCount(DB, r2Key)
    )

    return new Response(object.body, {
      headers: {
        'Content-Type': fileInfo.mime_type,
        'Content-Disposition': `attachment; filename="${fileInfo.original_name}"`,
        'Content-Length': fileInfo.file_size.toString()
      }
    })
  } catch (error) {
    console.error('[Files] 下载失败:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default files
