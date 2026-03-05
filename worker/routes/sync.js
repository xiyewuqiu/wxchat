import { Hono } from 'hono'

const sync = new Hono()

// AI消息处理接口
sync.post('/ai/message', async (c) => {
  try {
    const { DB } = c.env
    const { content, deviceId, type = 'ai_response' } = await c.req.json()

    if (!content || !deviceId) {
      return c.json({
        success: false,
        error: '内容和设备ID不能为空'
      }, 400)
    }

    // 将AI消息作为特殊的文本消息存储，在内容前添加标识符
    let messageContent = content;
    if (type === 'ai_response') {
      messageContent = `[AI] ${content}`;
    } else if (type === 'ai_thinking') {
      messageContent = `[AI-THINKING] ${content}`;
    }

    // 存储AI消息到数据库（使用text类型）
    const stmt = DB.prepare(`
      INSERT INTO messages (type, content, device_id)
      VALUES (?, ?, ?)
    `)

    const result = await stmt.bind('text', messageContent, deviceId).run()

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        type: 'text',
        content: messageContent,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
        originalType: type
      }
    })
  } catch (error) {
    console.error('AI消息存储失败:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 设备同步
sync.post('/sync', async (c) => {
  try {
    const { DB } = c.env
    const { deviceId, deviceName } = await c.req.json()

    // 更新或插入设备信息
    const stmt = DB.prepare(`
      INSERT OR REPLACE INTO devices (id, name, last_active)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `)

    await stmt.bind(deviceId, deviceName || '未知设备').run()

    return c.json({
      success: true,
      message: '设备同步成功'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 数据清理 - 清空所有数据
sync.post('/clear-all', async (c) => {
  try {
    const { DB, R2 } = c.env
    const { confirmCode } = await c.req.json()

    // 简单的确认码验证
    if (confirmCode !== '1234') {
      return c.json({
        success: false,
        error: '确认码错误，请输入正确的确认码'
      }, 400)
    }

    // 统计清理前的数据
    const messageCountStmt = DB.prepare('SELECT COUNT(*) as count FROM messages')
    const fileCountStmt = DB.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize FROM files')

    const messageCount = await messageCountStmt.first()
    const fileStats = await fileCountStmt.first()

    // 获取所有文件的R2 keys
    const filesStmt = DB.prepare('SELECT r2_key FROM files')
    const files = await filesStmt.all()

    // 删除R2中的所有文件
    let deletedFilesCount = 0
    for (const file of files.results) {
      try {
        await R2.delete(file.r2_key)
        deletedFilesCount++
      } catch (error) {
        // 静默处理R2删除失败
      }
    }

    // 清空数据库表
    const deleteMessagesStmt = DB.prepare('DELETE FROM messages')
    const deleteFilesStmt = DB.prepare('DELETE FROM files')
    const deleteDevicesStmt = DB.prepare('DELETE FROM devices')

    // 执行删除操作
    await deleteMessagesStmt.run()
    await deleteFilesStmt.run()
    await deleteDevicesStmt.run()

    return c.json({
      success: true,
      data: {
        deletedMessages: messageCount.count,
        deletedFiles: fileStats.count,
        deletedFileSize: fileStats.totalSize,
        deletedR2Files: deletedFilesCount,
        message: '所有数据已成功清理'
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 调试接口 - 检查文件上传状态
sync.get('/debug/upload-status', async (c) => {
  try {
    const { DB, R2 } = c.env

    return c.json({
      success: true,
      data: {
        hasDB: !!DB,
        hasR2: !!R2,
        timestamp: new Date().toISOString(),
        workerVersion: '2024-12-23-v3'
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default sync
