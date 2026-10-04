import { API_ENDPOINTS } from '@/config'
import { post, request } from '@/lib/http'

interface LoginResponse {
  success: boolean
  token?: string
  expiresIn?: number
  message?: string
}

export async function login(password: string): Promise<{ token: string; expiresIn: number }> {
  const result = await post<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, { password })
  if (!result.success || !result.token) {
    throw new Error(result.message || '密码错误')
  }
  return { token: result.token, expiresIn: result.expiresIn ?? 86400 }
}

export async function verifyToken(): Promise<boolean> {
  try {
    const result = await request<{ valid: boolean }>(API_ENDPOINTS.AUTH_VERIFY)
    return result.valid === true
  } catch {
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    await post(API_ENDPOINTS.AUTH_LOGOUT)
  } catch {
    // 登出以本地清理为准，服务端接口失败不阻断流程
  }
}