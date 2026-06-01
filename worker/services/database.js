/**
 * 数据库服务层 - 统一DB操作封装
 * 提供错误包装、查询辅助、事务支持
 */

export const DBService = {
  /**
   * 执行查询并返回所有结果
   */
  async queryAll(db, sql, params = []) {
    try {
      const stmt = db.prepare(sql)
      if (params.length > 0) {
        return await stmt.bind(...params).all()
      }
      return await stmt.all()
    } catch (error) {
      console.error(`[DBService] 查询失败:`, error)
      throw new Error(`数据库查询失败: ${error.message}`)
    }
  },

  /**
   * 查询单行结果
   */
  async queryFirst(db, sql, params = []) {
    try {
      const stmt = db.prepare(sql)
      if (params.length > 0) {
        return await stmt.bind(...params).first()
      }
      return await stmt.first()
    } catch (error) {
      console.error(`[DBService] 单行查询失败:`, error)
      throw new Error(`数据库查询失败: ${error.message}`)
    }
  },

  /**
   * 执行写操作（INSERT/UPDATE/DELETE）
   */
  async execute(db, sql, params = []) {
    try {
      const stmt = db.prepare(sql)
      if (params.length > 0) {
        return await stmt.bind(...params).run()
      }
      return await stmt.run()
    } catch (error) {
      console.error(`[DBService] 执行失败:`, error)
      throw new Error(`数据库操作失败: ${error.message}`)
    }
  },

  /**
   * 批量执行写操作（事务）
   */
  async executeBatch(db, operations) {
    try {
      const results = []
      for (const { sql, params } of operations) {
        const stmt = db.prepare(sql)
        if (params && params.length > 0) {
          results.push(await stmt.bind(...params).run())
        } else {
          results.push(await stmt.run())
        }
      }
      return results
    } catch (error) {
      console.error(`[DBService] 批量执行失败:`, error)
      throw new Error(`数据库批量操作失败: ${error.message}`)
    }
  }
}
