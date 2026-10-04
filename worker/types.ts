// Cloudflare Workers 运行时绑定与环境变量
export interface Env {
  DB: D1Database
  R2: R2Bucket
  /** 静态资源绑定（指向 Vite 构建产物 dist/） */
  ASSETS: Fetcher
  ACCESS_PASSWORD: string
  JWT_SECRET: string
  SESSION_EXPIRE_HOURS?: string
  MAX_LOGIN_ATTEMPTS?: string
}

export interface JwtPayload {
  iat: number
  exp: number
  type: 'access'
}