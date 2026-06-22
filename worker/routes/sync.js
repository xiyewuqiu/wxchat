import { Hono } from 'hono'
import { MessageService } from '../services/messageService.js'
import { FileService } from '../services/fileService.js'
import { DeviceService } from '../services/deviceService.js'
import { validateParams } from '../middleware/errorHandler.js'

const sync = new Hono()

function deviceInfoEnabled(env) {
  return env.MESSAGE_DEVICE_INFO_ENABLED === true || env.MESSAGE_DEVICE_INFO_ENABLED === 'true'
}

// AI消息处理接口
sync.post('/ai/message', async (c) => {
  try {
    const { DB } = c.env
    const { content, deviceId, type = 'ai_response', deviceInfo } = await c.req.json()

    validateParams({ content, deviceId }, ['content', 'deviceId'])

    const result = await MessageService.createAIMessage(DB, {
      content,
      deviceId,
      type,
      deviceInfo: deviceInfoEnabled(c.env) ? deviceInfo : null
    })

    return c.json({ success: true, data: result })
  } catch (error) {
    const status = error.status || 500
    console.error('[Sync] AI消息存储失败:', error)
    return c.json({ success: false, error: error.message }, status)
  }
})

// 设备同步
sync.post('/sync', async (c) => {
  try {
    const { DB } = c.env
    const { deviceId, deviceName } = await c.req.json()

    validateParams({ deviceId }, ['deviceId'])

    await DeviceService.syncDevice(DB, { deviceId, deviceName })

    return c.json({ success: true, message: '设备同步成功' })
  } catch (error) {
    const status = error.status || 500
    return c.json({ success: false, error: error.message }, status)
  }
})

// 数据清理 - 清空所有数据
sync.post('/clear-all', async (c) => {
  try {
    const { DB, R2 } = c.env
    const { confirmCode } = await c.req.json()

    if (confirmCode !== '1234') {
      return c.json({ success: false, error: '确认码错误，请输入正确的确认码' }, 400)
    }

    // 清理前统计
    const messageCount = await MessageService.countAll(DB)
    const fileStats = await FileService.getStats(DB)

    // 删除R2文件
    const r2Keys = await FileService.getAllR2Keys(DB)
    let deletedR2Files = 0
    for (const key of r2Keys) {
      if (await FileService.deleteFromR2(R2, key)) {
        deletedR2Files++
      }
    }

    // 清空数据库表
    await MessageService.deleteAll(DB)
    await FileService.deleteAll(DB)
    await DeviceService.deleteAll(DB)

    return c.json({
      success: true,
      data: {
        deletedMessages: messageCount,
        deletedFiles: fileStats?.count || 0,
        deletedFileSize: fileStats?.totalSize || 0,
        deletedR2Files,
        message: '所有数据已成功清理'
      }
    })
  } catch (error) {
    console.error('[Sync] 清理失败:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default sync
