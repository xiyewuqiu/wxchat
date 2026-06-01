/**
 * 文件服务层 - 文件CRUD + R2操作
 */

import { DBService } from './database.js'

export const FileService = {
  /**
   * 生成唯一文件名
   */
  generateR2Key(fileName) {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const ext = fileName.split('.').pop() || 'bin'
    return `${timestamp}-${randomStr}.${ext}`
  },

  /**
   * 上传文件到R2
   */
  async uploadToR2(r2, r2Key, fileStream, { contentType, fileName }) {
    try {
      await r2.put(r2Key, fileStream, {
        httpMetadata: {
          contentType: contentType || 'application/octet-stream',
          contentDisposition: `attachment; filename="${fileName}"`
        }
      })
    } catch (error) {
      console.error('[FileService] R2上传失败:', error)
      throw new Error(`文件上传到存储失败: ${error.message}`)
    }
  },

  /**
   * 从R2删除文件
   */
  async deleteFromR2(r2, r2Key) {
    try {
      await r2.delete(r2Key)
      return true
    } catch (error) {
      console.error('[FileService] R2删除失败:', error)
      return false
    }
  },

  /**
   * 从R2获取文件
   */
  async getFromR2(r2, r2Key) {
    try {
      return await r2.get(r2Key)
    } catch (error) {
      console.error('[FileService] R2获取失败:', error)
      throw new Error(`文件获取失败: ${error.message}`)
    }
  },

  /**
   * 保存文件记录到数据库
   */
  async saveFileRecord(db, { fileName, r2Key, fileSize, mimeType, deviceId }) {
    const result = await DBService.execute(db,
      `INSERT INTO files (original_name, file_name, file_size, mime_type, r2_key, upload_device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fileName, r2Key, fileSize, mimeType || 'application/octet-stream', r2Key, deviceId]
    )
    return { id: result.meta.last_row_id }
  },

  /**
   * 根据r2Key获取文件信息
   */
  async getFileByR2Key(db, r2Key) {
    return await DBService.queryFirst(db,
      `SELECT * FROM files WHERE r2_key = ?`,
      [r2Key]
    )
  },

  /**
   * 更新下载计数
   */
  async incrementDownloadCount(db, r2Key) {
    await DBService.execute(db,
      `UPDATE files SET download_count = download_count + 1 WHERE r2_key = ?`,
      [r2Key]
    )
  },

  /**
   * 获取所有文件的R2密钥
   */
  async getAllR2Keys(db) {
    const result = await DBService.queryAll(db, `SELECT r2_key FROM files`)
    return (result.results || []).map(r => r.r2_key)
  },

  /**
   * 删除所有文件记录
   */
  async deleteAll(db) {
    await DBService.execute(db, `DELETE FROM files`)
  },

  /**
   * 统计文件数量与总大小
   */
  async getStats(db) {
    return await DBService.queryFirst(db,
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize FROM files`
    )
  }
}
