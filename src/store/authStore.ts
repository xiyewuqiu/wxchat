import { create } from 'zustand'
import * as authApi from '@/api/auth'
import { setUnauthorizedHandler } from '@/lib/http'
import { tokenStore } from '@/lib/token'
import { AUTH_CONFIG } from '@/config'

interface AuthState {
  isAuthenticated: boolean
  isInitializing: boolean
  loginAttempts: number
  lastAttemptTime: number
  init: () => Promise<void>
  login: (password: string) => Promise<void>
  logout: () => void
}

interface AttemptRecord {
  count: number
  lastTime: number
}

function loadAttempts(): AttemptRecord {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG.LOGIN_ATTEMPTS_KEY)
    if (!raw) return { count: 0, lastTime: 0 }
    const parsed = JSON.parse(raw) as AttemptRecord
    return { count: parsed.count || 0, lastTime: parsed.lastTime || 0 }
  } catch {
    return { count: 0, lastTime: 0 }
  }
}

function saveAttempts(record: AttemptRecord): void {
  localStorage.setItem(AUTH_CONFIG.LOGIN_ATTEMPTS_KEY, JSON.stringify(record))
}

/** 超过重置窗口的失败计数归零 */
function normalizeAttempts(record: AttemptRecord): AttemptRecord {
  if (record.lastTime && Date.now() - record.lastTime > AUTH_CONFIG.ATTEMPT_RESET_TIME) {
    return { count: 0, lastTime: 0 }
  }
  return record
}

const initialAttempts = normalizeAttempts(loadAttempts())

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isInitializing: true,
  loginAttempts: initialAttempts.count,
  lastAttemptTime: initialAttempts.lastTime,

  async init() {
    const token = tokenStore.get()
    if (!token) {
      set({ isAuthenticated: false, isInitializing: false })
      return
    }

    const valid = await authApi.verifyToken()
    if (!valid) tokenStore.clear()
    set({ isAuthenticated: valid, isInitializing: false })
  },

  async login(password) {
    const state = get()
    const attempts = normalizeAttempts({ count: state.loginAttempts, lastTime: state.lastAttemptTime })

    if (attempts.count >= AUTH_CONFIG.MAX_ATTEMPTS) {
      const remainingMinutes = Math.max(
        1,
        Math.ceil((AUTH_CONFIG.ATTEMPT_RESET_TIME - (Date.now() - attempts.lastTime)) / 60000),
      )
      throw new Error(`登录尝试次数过多，请 ${remainingMinutes} 分钟后再试`)
    }

    try {
      const { token } = await authApi.login(password)
      tokenStore.set(token)
      saveAttempts({ count: 0, lastTime: 0 })
      set({ isAuthenticated: true, loginAttempts: 0, lastAttemptTime: 0 })
    } catch (error) {
      const next: AttemptRecord = { count: attempts.count + 1, lastTime: Date.now() }
      saveAttempts(next)
      set({ loginAttempts: next.count, lastAttemptTime: next.lastTime })

      const remaining = AUTH_CONFIG.MAX_ATTEMPTS - next.count
      const baseMessage = (error as Error).message || '密码错误'
      throw new Error(
        remaining > 0 ? `${baseMessage}，还可尝试 ${remaining} 次` : '登录尝试次数过多，请15分钟后再试',
      )
    }
  },

  logout() {
    tokenStore.clear()
    set({ isAuthenticated: false })
    void authApi.logout()
  },
}))

// 任意请求返回 401 时清理登录态，交由路由守卫跳转登录页
setUnauthorizedHandler(() => {
  const { isAuthenticated } = useAuthStore.getState()
  if (isAuthenticated) {
    tokenStore.clear()
    useAuthStore.setState({ isAuthenticated: false })
  }
})