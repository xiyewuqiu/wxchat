/**
 * 设备服务层 - 设备管理与同步
 */

import { DBService } from './database.js'

export const DeviceService = {
  /**
   * 同步设备信息（注册或更新）
   */
  async syncDevice(db, { deviceId, deviceName }) {
    await DBService.execute(db,
      `INSERT OR REPLACE INTO devices (id, name, last_active)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [deviceId, deviceName || '未知设备']
    )
    return { success: true }
  },

  /**
   * 删除所有设备
   */
  async deleteAll(db) {
    await DBService.execute(db, `DELETE FROM devices`)
  }
}
