import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PWA_CONFIG, SUCCESS } from '@/config'
import { isAiPrompt } from '@/lib/aiContent'
import { isClearCommand, isLogoutCommand, isPwaCommand } from '@/lib/commands'
import { getPwaStatus, promptInstall, isInstalled } from '@/lib/pwa'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'

/**
 * 输入发送编排：统一分发命令（清理/登出/PWA）、AI 对话与普通消息。
 * 返回值表示输入是否已被消费，调用方据此清空输入框。
 */
export function useComposer(): (raw: string) => Promise<boolean> {
  const aiMode = useUiStore((state) => state.aiMode)
  const toast = useUiStore((state) => state.toast)
  const askConfirm = useUiStore((state) => state.askConfirm)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  return useCallback(
    async (raw: string): Promise<boolean> => {
      const content = raw.trim()
      if (!content) return false

      if (isClearCommand(content)) {
        await useChatStore.getState().clearAll()
        return true
      }

      if (isLogoutCommand(content)) {
        const confirmed = await askConfirm({
          title: '登出确认',
          message: '确定要登出吗？登出后需要重新输入密码才能访问。',
          confirmText: '登出',
        })
        if (confirmed === null) {
          toast('登出已取消', 'warning')
          return true
        }
        logout()
        navigate('/login', { replace: true })
        return true
      }

      if (isPwaCommand(content)) {
        await handlePwaManage(toast)
        return true
      }

      if (isAiPrompt(content, aiMode)) {
        await useChatStore.getState().sendAi(content)
        return true
      }

      try {
        await useChatStore.getState().sendText(content)
        toast(SUCCESS.MESSAGE_SENT, 'success')
      } catch (error) {
        toast((error as Error).message || '消息发送失败', 'error')
      }
      return true
    },
    [aiMode, askConfirm, logout, navigate, toast],
  )
}

type ToastFn = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void

/** PWA 管理命令：已安装 / 可安装 / 需手动安装 三种分支 */
async function handlePwaManage(toast: ToastFn): Promise<void> {
  if (isInstalled()) {
    toast('📱 应用已安装，当前运行在独立模式', 'success')
    return
  }

  const status = await getPwaStatus()

  if (status.installPromptAvailable) {
    const confirmed = await useUiStore.getState().askConfirm({
      title: '安装到桌面',
      message: `安装后可以：\n${PWA_CONFIG.INSTALL_BENEFITS.map((item) => `• ${item}`).join('\n')}`,
      confirmText: '安装',
    })
    if (confirmed === null) {
      toast('安装已取消，随时输入 /pwa 可重新安装', 'info')
      return
    }
    const accepted = await promptInstall()
    toast(accepted ? '正在安装...' : '安装已取消', accepted ? 'success' : 'info')
    return
  }

  const lines = [
    '📱 PWA 应用状态',
    status.serviceWorkerRegistered ? '✅ Service Worker: 已注册' : '❌ Service Worker: 未注册',
    status.manifestAccessible ? '✅ 应用清单: 可访问' : '❌ 应用清单: 不可访问',
    `💾 缓存数量: ${status.cacheCount}`,
    '',
    'Android (Chrome): 地址栏安装图标 或 菜单 → 安装应用',
    'iPhone (Safari): 分享按钮 → 添加到主屏幕',
    '桌面 (Chrome/Edge): 地址栏安装图标 或 菜单 → 安装',
  ]
  toast(lines.join('\n'), 'info')
}