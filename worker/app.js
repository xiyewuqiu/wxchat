import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes, authMiddleware } from './auth.js'
import messagesRoutes from './routes/messages.js'
import filesRoutes from './routes/files.js'
import searchRoutes from './routes/search.js'
import syncRoutes from './routes/sync.js'
import realtimeRoutes from './routes/realtime.js'
import configRoutes from './routes/config.js'
import aiRoutes from './routes/ai.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = new Hono()

  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }))

  app.route('/api/auth', authRoutes)

  app.use('/api/*', authMiddleware)

  app.route('/api/messages', messagesRoutes)
  app.route('/api/files', filesRoutes)
  app.route('/api/search', searchRoutes)
  app.route('/api/config', configRoutes)
  app.route('/api/ai', aiRoutes)
  app.route('/api', syncRoutes)
  app.route('/api', realtimeRoutes)

  app.onError(errorHandler)
  app.notFound(notFoundHandler)

  return app
}

export default createApp
