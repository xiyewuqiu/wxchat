import { memo } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch,
  IconSparkles,
  IconMoreHorizontal,
  IconLogOut,
  IconPalette,
} from '@/components/icons'

interface ChatHeaderProps {
  currentDeviceId: string
}

/** 顶栏导航：微信经典精致克制排版、移动端全视口融合与触控优化 */
export const ChatHeader = memo(function ChatHeader({ currentDeviceId }: ChatHeaderProps) {
  const navigate = useNavigate()
  const status = useUiStore((state) => state.connectionStatus)
  const aiMode = useUiStore((state) => state.aiMode)
  const toggleAiMode = useUiStore((state) => state.toggleAiMode)
  const setSearchOpen = useUiStore((state) => state.setSearchOpen)
  const setImageGenOpen = useUiStore((state) => state.setImageGenOpen)
  const setFunctionMenuOpen = useUiStore((state) => state.setFunctionMenuOpen)
  const askConfirm = useUiStore((state) => state.askConfirm)
  const logout = useAuthStore((state) => state.logout)
  const totalLoaded = useChatStore((state) => state.totalLoaded)

  const isConnected = status === 'connected'

  const handleLogout = async () => {
    const confirmed = await askConfirm({
      title: '确认退出登录',
      message: '退出后需要重新输入密码才能查看与传输记录。确定退出吗？',
      confirmText: '退出登录',
    })
    if (confirmed !== null) {
      logout()
      navigate('/login', { replace: true })
    }
  }

  const shortDeviceId = currentDeviceId ? currentDeviceId.slice(-4) : '本地'

  return (
    <header className="chat-header">
      <div className="header-left">
        <div className="header-avatar-box">
          <img src="/icons/icon.svg" alt="文件传输助手" className="header-avatar-img" />
          <span
            className={`header-status-indicator ${isConnected ? 'online' : 'offline'}`}
            title={isConnected ? '已连接' : '连接中断'}
          />
        </div>

        <div className="header-title-meta">
          <div className="header-name-row">
            <h1 className="header-title-text">文件传输助手</h1>
            {aiMode && <span className="ai-active-pill">AI 模式</span>}
          </div>
          <div className="header-sub-text">
            <span>#{shortDeviceId}</span>
            <span className="sub-dot">·</span>
            <span>{isConnected ? '在线' : '离线'}</span>
            {totalLoaded > 0 && (
              <>
                <span className="sub-dot">·</span>
                <span>{totalLoaded}条</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-action-btn"
          title="搜索消息和文件"
          onClick={() => setSearchOpen(true)}
        >
          <IconSearch size={18} />
        </button>

        <button
          type="button"
          className={`header-action-btn ai-mode-btn${aiMode ? ' is-active' : ''}`}
          title={aiMode ? '关闭 AI 伴随' : '开启 AI 伴随'}
          onClick={() => toggleAiMode()}
        >
          <IconSparkles size={16} />
          <span className="btn-label">AI</span>
        </button>

        <button
          type="button"
          className="header-action-btn desktop-only"
          title="AI 绘图工坊"
          onClick={() => setImageGenOpen(true)}
        >
          <IconPalette size={18} />
        </button>

        <button
          type="button"
          className="header-action-btn"
          title="更多功能"
          onClick={() => setFunctionMenuOpen(true)}
        >
          <IconMoreHorizontal size={19} />
        </button>

        <button
          type="button"
          className="header-action-btn logout-btn desktop-only"
          title="退出登录"
          onClick={handleLogout}
        >
          <IconLogOut size={17} />
        </button>
      </div>
    </header>
  )
})
