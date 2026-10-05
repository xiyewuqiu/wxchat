import { memo } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useNavigate } from 'react-router-dom'
import { IconSparkles } from '@/components/icons'

interface ChatHeaderProps {
  currentDeviceId: string
}

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
      message: '退出后需要重新输入访问密码才能查看与传输文件。确定要退出吗？',
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
        <div className="header-avatar-wrap">
          <img src="/icons/icon.svg" alt="微信文件传输助手" className="header-avatar" />
          <span
            className={`header-status-dot ${isConnected ? 'online' : 'offline'}`}
            title={isConnected ? '实时在线' : '离线/重连中'}
          />
        </div>
        <div className="header-info">
          <div className="header-title-row">
            <h1 className="header-title">文件传输助手</h1>
            {aiMode && <span className="header-ai-badge">AI 伴随</span>}
          </div>
          <div className="header-subtitle">
            <span className="device-tag">本机: #{shortDeviceId}</span>
            <span className="dot-divider">•</span>
            <span className="status-text">{isConnected ? '实时同步中' : '连接维护中'}</span>
            {totalLoaded > 0 && (
              <>
                <span className="dot-divider">•</span>
                <span className="msg-count-tag">{totalLoaded} 条记录</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-icon-btn"
          title="全文搜索 (Ctrl+F)"
          onClick={() => setSearchOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <button
          type="button"
          className={`header-icon-btn ai-toggle-btn ${aiMode ? 'active' : ''}`}
          title={aiMode ? '关闭 AI 助手模式' : '开启 AI 助手模式'}
          onClick={() => toggleAiMode()}
        >
          <IconSparkles size={14} className="ai-icon-sparkle" />
          <span className="ai-btn-text">AI</span>
        </button>

        <button
          type="button"
          className="header-icon-btn"
          title="AI 绘图工坊"
          onClick={() => setImageGenOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <button
          type="button"
          className="header-icon-btn"
          title="更多功能面板"
          onClick={() => setFunctionMenuOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
          </svg>
        </button>

        <button
          type="button"
          className="header-icon-btn danger-hover"
          title="安全退出"
          onClick={handleLogout}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  )
})
