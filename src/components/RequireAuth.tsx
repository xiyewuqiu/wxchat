import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** 路由守卫：初始化未完成时展示占位，未登录跳转登录页 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitializing = useAuthStore((state) => state.isInitializing)

  if (isInitializing) {
    return (
      <div className="app-fallback">
        <span className="loading-spinner">⏳</span>
        <span>正在验证登录状态...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}