import { useEffect } from 'react'
import { debounce, isIOSDevice } from '@/lib/utils'

/**
 * 视口高度修复：
 * 1. 用 --vh 自定义属性替代不稳定的 100vh；
 * 2. iOS 虚拟键盘弹出时通过 keyboard-open 类调整输入区定位。
 */
export function useViewportFix(): void {
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }

    setVh()

    const initialHeight = window.innerHeight

    const handleViewportChange = () => {
      setVh()
      const heightDiff = initialHeight - window.innerHeight
      if (heightDiff > 150) {
        document.body.classList.add('keyboard-open')
      } else {
        document.body.classList.remove('keyboard-open')
      }
    }

    const onResize = debounce(handleViewportChange, 100)
    const onOrientation = () => setTimeout(setVh, 500)

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientation)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientation)
      document.body.classList.remove('keyboard-open')
    }
  }, [])

  // iOS 上 `window.MSStream` 不存在，这里显式标记以便调试
  useEffect(() => {
    document.documentElement.dataset.ios = String(isIOSDevice())
  }, [])
}