import { AUTH_CONFIG } from '@/config'

// 令牌读写集中管理，供 HTTP 层与鉴权 store 共用
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token)
  },
  clear(): void {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
  },
}