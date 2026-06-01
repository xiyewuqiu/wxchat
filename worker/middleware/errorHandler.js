/**
 * 统一错误处理中间件
 * 捕获所有路由中的未处理异常，统一返回格式
 */

export const errorHandler = async (error, c) => {
  console.error(`[ErrorHandler] ${c.req.method} ${c.req.path}:`, error)

  const status = error.status || 500
  const message = error.message || '服务器内部错误'

  // 开发环境可返回详细错误，生产环境只返回概括信息
  const isProduction = typeof c.env !== 'undefined' && c.env.ENVIRONMENT === 'production'

  return c.json({
    success: false,
    error: isProduction && status === 500 ? '服务器内部错误' : message,
    ...(isProduction ? {} : { stack: error.stack })
  }, status)
}

/**
 * 404 处理中间件
 */
export const notFoundHandler = (c) => {
  return c.json({
    success: false,
    error: `接口不存在: ${c.req.method} ${c.req.path}`
  }, 404)
}

/**
 * 请求参数验证辅助
 */
export function validateParams(params, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = params[field]
    return value === undefined || value === null || value === ''
  })

  if (missing.length > 0) {
    const error = new Error(`缺少必要参数: ${missing.join(', ')}`)
    error.status = 400
    throw error
  }
}
