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
  subtitle: string
  action: MenuAction
  gradient: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: '传输与多媒体',
    items: [
      { id: 'photo', icon: '📷', title: '即时拍照', subtitle: '调用设备相机', action: 'photo', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
      { id: 'album', icon: '🖼️', title: '手机相册', subtitle: '选图与高清原图', action: 'album', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
      { id: 'file', icon: '📁', title: '本地文件', subtitle: '文档与压缩包', action: 'file', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
      { id: 'emoji', icon: '✨', title: '趣味表情', subtitle: '快速心情符号', action: 'emoji', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    ],
  },
  {
    title: 'AI 实验室与检索',
    items: [
      { id: 'ai-chat', icon: '🤖', title: 'AI 伴随对话', subtitle: '智能深度思考', action: 'aiChat', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
      { id: 'ai-image-gen', icon: '🎨', title: 'AI 绘画创作', subtitle: '文本生成画卷', action: 'aiImageGen', gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
      { id: 'search', icon: '🔍', title: '全文闪电搜', subtitle: '消息与文件定位', action: 'search', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' },
    ],
  },
  {
    title: '系统与会话设置',
    items: [
      { id: 'pwa-manage', icon: '📱', title: '应用安装', subtitle: 'PWA离线与更新', action: 'pwaManage', gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
      { id: 'clear-chat', icon: '🧹', title: '清空聊天', subtitle: '云端同步销毁', action: 'clearChat', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
      { id: 'logout', icon: '🚪', title: '安全登出', subtitle: '清理设备授权', action: 'logout', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    ],
  },
]

interface FunctionMenuProps {
  onAction: (action: MenuAction) => void
}

/** 底部功能抽屉面板：分类卡片式排版、晶体渐变底色与平滑抽屉升降 */
export function FunctionMenu({ onAction }: FunctionMenuProps) {
  const open = useUiStore((state) => state.functionMenuOpen)
  const setOpen = useUiStore((state) => state.setFunctionMenuOpen)

  if (!open) return null

  return (
    <div className="function-menu show" role="dialog" aria-modal="true">
      <div className="function-menu-overlay" onClick={() => setOpen(false)} />

      <div className="function-menu-drawer">
        {/* 顶部防滑小手柄 */}
        <div className="drawer-drag-pill" />

        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3 className="drawer-title">扩展功能中心</h3>
            <span className="drawer-hint">极速传输与 AI 伴随能力</span>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            title="关闭面板"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} className="menu-group-section">
              <div className="menu-group-title">{section.title}</div>
              <div className="menu-group-grid">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="menu-card-item"
                    onClick={() => {
                      setOpen(false)
                      onAction(item.action)
                    }}
                  >
                    <div className="menu-card-icon" style={{ background: item.gradient }}>
                      {item.icon}
                    </div>
                    <div className="menu-card-info">
                      <span className="menu-card-name">{item.title}</span>
                      <span className="menu-card-sub">{item.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}