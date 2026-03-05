import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { authRoutes, authMiddleware } from './auth.js'
import messagesRoutes from './routes/messages.js'
import filesRoutes from './routes/files.js'
import searchRoutes from './routes/search.js'
import syncRoutes from './routes/sync.js'
import realtimeRoutes from './routes/realtime.js'

const app = new Hono()

// CORS配置
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 挂载鉴权API路由（无需认证）
app.route('/api/auth', authRoutes)

// 应用鉴权中间件到所有路由
app.use('*', authMiddleware)

// 挂载API路由（需要认证）
app.route('/api/messages', messagesRoutes)
app.route('/api/files', filesRoutes)
app.route('/api/search', searchRoutes)
app.route('/api', syncRoutes)
app.route('/api', realtimeRoutes)

// 静态文件服务 - 使用getAssetFromKV
app.get('*', async (c) => {
  try {
    return await getAssetFromKV(c.env, {
      request: c.req.raw,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
    })
  } catch (e) {
    // 如果找不到文件，返回index.html
    try {
      return await getAssetFromKV(c.env, {
        request: new Request(new URL('/index.html', c.req.url).toString()),
        waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      })
    } catch {
      return c.text('Not Found', 404)
    }
  }
})

export default app
