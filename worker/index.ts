import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware, authRoutes } from './auth.js'
import type { Env, JwtPayload } from './types.js'
import messagesRoutes from './routes/messages.js'
import filesRoutes from './routes/files.js'
import searchRoutes from './routes/search.js'
import syncRoutes from './routes/sync.js'
import realtimeRoutes from './routes/realtime.js'
import aiRoutes from './routes/ai.js'

type AppEnv = { Bindings: Env; Variables: { user: JwtPayload } }

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// 健康检查（无需鉴权）
app.get('/api/health', (c) =>
  c.json({
    success: true,
    status: 'ok',
    hasDB: !!c.env.DB,
    hasR2: !!c.env.R2,
    timestamp: new Date().toISOString(),
  }),
)

// 鉴权 API（登录 / 校验 / 登出，无需 token）
app.route('/api/auth', authRoutes)

// 其余 /api/* 全部需要鉴权
app.use('/api/*', authMiddleware)

app.route('/api/messages', messagesRoutes)
app.route('/api/files', filesRoutes)
app.route('/api/search', searchRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api', syncRoutes)
app.route('/api', realtimeRoutes)


// 静态资源与 SPA 回退。
// 命中真实资源时按原样返回；未命中（如前端路由 /login）回退到 index.html，
// 由前端路由接管渲染。
app.get('*', async (c) => {
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw)
  if (assetResponse.status !== 404) return assetResponse

  const indexUrl = new URL('/index.html', c.req.url)
  return c.env.ASSETS.fetch(indexUrl.toString())
})

export default app