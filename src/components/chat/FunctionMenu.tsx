import { useUiStore } from '@/store/uiStore'

export type MenuAction =
  | 'photo'
  | 'album'
  | 'emoji'
  | 'file'
  | 'search'
  | 'aiChat'
  | 'aiImageGen'
  | 'clearChat'
  | 'pwaManage'
  | 'logout'

interface MenuItem {
  id: string
  icon: string
  title: string
  action: MenuAction
  iconClass: string
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'photo', icon: '📷', title: '拍摄', action: 'photo', iconClass: 'icon-file' },
  { id: 'album', icon: '🖼️', title: '相册', action: 'album', iconClass: 'icon-file' },
  { id: 'emoji', icon: '😊', title: '表情', action: 'emoji', iconClass: 'icon-default' },
  { id: 'file', icon: '📁', title: '文件', action: 'file', iconClass: 'icon-file' },
  { id: 'search', icon: '🔍', title: '搜索', action: 'search', iconClass: 'icon-search' },
  { id: 'ai-chat', icon: '🤖', title: 'AI助手', action: 'aiChat', iconClass: 'icon-ai' },
  { id: 'ai-image-gen', icon: '🎨', title: 'AI绘画', action: 'aiImageGen', iconClass: 'icon-image' },
  { id: 'clear-chat', icon: '🧹', title: '清理记录', action: 'clearChat', iconClass: 'icon-clear' },
  { id: 'pwa-manage', icon: '📱', title: 'PWA管理', action: 'pwaManage', iconClass: 'icon-settings' },
  { id: 'logout', icon: '🚪', title: '登出', action: 'logout', iconClass: 'icon-default' },
]

interface FunctionMenuProps {
  onAction: (action: MenuAction) => void
}

/** 底部功能面板（微信风格） */
export function FunctionMenu({ onAction }: FunctionMenuProps) {
  const open = useUiStore((state) => state.functionMenuOpen)
  const setOpen = useUiStore((state) => state.setFunctionMenuOpen)

  if (!open) return null

  return (
    <div className={`function-menu show`} role="dialog" aria-modal="true">
      <div className="function-menu-overlay" onClick={() => setOpen(false)} />
      <div className="function-menu-content animate-in">
        <div className="function-menu-header">
          <h3 className="function-menu-title">更多功能</h3>
          <button type="button" className="function-menu-close" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
              />
            </svg>
          </button>
        </div>

        <div className="function-menu-grid">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="function-menu-item"
              onClick={() => {
                setOpen(false)
                onAction(item.action)
              }}
            >
              <div className={`function-menu-item-icon ${item.iconClass}`}>{item.icon}</div>
              <div className="function-menu-item-content">
                <div className="function-menu-item-title">{item.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}