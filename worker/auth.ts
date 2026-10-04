import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import type { Env, JwtPayload } from './types.js'

export type AppContext = Context<{ Bindings: Env; Variables: { user: JwtPayload } }>

// 鉴权工具函数：基于 WebCrypto 的 HS256 签名，未引入额外依赖
export const AuthUtils = {
  async generateToken(payload: JwtPayload, secret: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' }
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`, secret)
    return `${encodedHeader}.${encodedPayload}.${signature}`
  },

  async verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
    try {
      const [header, payload, signature] = token.split('.')
      if (!header || !payload || !signature) return null

      const expectedSignature = await this.sign(`${header}.${payload}`, secret)
      if (signature !== expectedSignature) return null

      const decodedPayload = JSON.parse(atob(payload)) as JwtPayload

      if (decodedPayload.exp && Date.now() > decodedPayload.exp) {
        return null
      }

      return decodedPayload
    } catch {
      return null
    }
  },

  async sign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const bytes = new Uint8Array(signature)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary)
  },
}

// 无需鉴权的路径（登录、令牌校验、健康检查）
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/verify', '/api/auth/logout', '/api/health']

// 鉴权中间件：仅作用于 /api/*，未授权时返回 401 JSON
export const authMiddleware = async (c: AppContext, next: Next) => {
  const path = c.req.path

  if (PUBLIC_PATHS.includes(path)) return next()

  let token: string | null = null
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    // SSE / EventSource 无法自定义请求头，允许通过查询参数传递令牌
    token = c.req.query('token') ?? null
  }

  if (!token) {
    return c.json({ success: false, message: '未授权访问' }, 401)
  }

  const payload = await AuthUtils.verifyToken(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ success: false, message: 'Token无效或已过期' }, 401)
  }

  c.set('user', payload)
  return next()
}

export const authRoutes = new Hono<{ Bindings: Env; Variables: { user: JwtPayload } }>()

authRoutes.post('/login', async (c) => {
  try {
    const { password } = await c.req.json<{ password?: string }>()

    if (!password) {
      return c.json({ success: false, message: '密码不能为空' }, 400)
    }

    if (password !== c.env.ACCESS_PASSWORD) {
      return c.json({ success: false, message: '密码错误' }, 401)
    }

    const expireHours = parseInt(c.env.SESSION_EXPIRE_HOURS || '24', 10)
    const payload: JwtPayload = {
      iat: Date.now(),
      exp: Date.now() + expireHours * 60 * 60 * 1000,
      type: 'access',
    }

    const token = await AuthUtils.generateToken(payload, c.env.JWT_SECRET)

    return c.json({ success: true, token, expiresIn: expireHours * 60 * 60 })
  } catch (error) {
    console.error('登录错误:', error)
    return c.json({ success: false, message: '服务器错误' }, 500)
  }
})

authRoutes.get('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ valid: false, message: '缺少认证信息' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await AuthUtils.verifyToken(token, c.env.JWT_SECRET)

    if (!payload) {
      return c.json({ valid: false, message: 'Token无效或已过期' }, 401)
    }

    return c.json({ valid: true, payload })
  } catch (error) {
    console.error('验证token错误:', error)
    return c.json({ valid: false, message: '服务器错误' }, 500)
  }
})

authRoutes.post('/logout', (c) => c.json({ success: true, message: '已登出' }))