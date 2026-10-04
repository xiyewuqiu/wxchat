import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ToastContainer } from '@/components/ToastContainer'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useViewportFix } from '@/hooks/useViewportFix'

/** 应用外壳：承载全局鉴权初始化、视口修复与全局浮层 */
export function RootLayout() {
  const init = useAuthStore((state) => state.init)

  useViewportFix()

  useEffect(() => {
    void init()
  }, [init])

  return (
    <>
      <Outlet />
      <ToastContainer />
      <ConfirmDialog />
    </>
  )
}