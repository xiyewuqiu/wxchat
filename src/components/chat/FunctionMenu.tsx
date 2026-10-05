import type { ReactNode } from 'react'
import { useUiStore } from '@/store/uiStore'
import {
  IconCamera,
  IconImage,
  IconFolder,
  IconBot,
  IconPalette,
  IconSearch,
  IconLayers,
  IconTrash,
  IconLogOut,
  IconX,
} from '@/components/icons'

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
  icon: ReactNode
  title: string
  action: MenuAction
  iconColor: string
  bgTint: string
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'album',
    icon: <IconImage size={24} />,
    title: '相册照片',
    action: 'album',
    iconColor: '#059669',
    bgTint: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'photo',
    icon: <IconCamera size={24} />,
    title: '拍摄照片',
    action: 'photo',
    iconColor: '#0891b2',
    bgTint: 'rgba(6, 182, 212, 0.1)',
  },
  {
    id: 'file',
    icon: <IconFolder size={24} />,
    title: '本地文件',
    action: 'file',
    iconColor: '#2563eb',
    bgTint: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: 'ai-chat',
    icon: <IconBot size={24} />,
    title: 'AI 伴随',
    action: 'aiChat',
    iconColor: '#7c3aed',
    bgTint: 'rgba(124, 58, 237, 0.1)',
  },
  {
    id: 'ai-image-gen',
    icon: <IconPalette size={24} />,
    title: 'AI 绘图',
    action: 'aiImageGen',
    iconColor: '#db2777',
    bgTint: 'rgba(236, 72, 153, 0.1)',
  },
  {
    id: 'search',
    icon: <IconSearch size={24} />,
    title: '全文搜索',
    action: 'search',
    iconColor: '#d97706',
    bgTint: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'pwa-manage',
    icon: <IconLayers size={24} />,
    title: '应用管理',
    action: 'pwaManage',
    iconColor: '#475569',
    bgTint: 'rgba(100, 116, 139, 0.1)',
  },
  {
    id: 'clear-chat',
    icon: <IconTrash size={24} />,
    title: '清空会话',
    action: 'clearChat',
    iconColor: '#ea580c',
    bgTint: 'rgba(249, 115, 22, 0.1)',
  },
  {
    id: 'logout',
    icon: <IconLogOut size={24} />,
    title: '退出登录',
    action: 'logout',
    iconColor: '#dc2626',
    bgTint: 'rgba(239, 68, 68, 0.1)',
  },
]

interface FunctionMenuProps {
  onAction: (action: MenuAction) => void
}

/** 底部功能抽屉面板：微信经典 4 列 Squircle 雅致网格架构 (零 Emoji，纯矢量) */
export function FunctionMenu({ onAction }: FunctionMenuProps) {
  const open = useUiStore((state) => state.functionMenuOpen)
  const setOpen = useUiStore((state) => state.setFunctionMenuOpen)

  if (!open) return null

  return (
    <div className="function-menu show" role="dialog" aria-modal="true">
      <div className="function-menu-overlay" onClick={() => setOpen(false)} />

      <div className="function-menu-drawer">
        {/* 顶部防滑拖拽指示条 */}
        <div className="drawer-drag-pill" />

        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3 className="drawer-title">功能与工具</h3>
            <span className="drawer-hint">即时传输与智能辅助</span>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            title="关闭面板"
            onClick={() => setOpen(false)}
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="drawer-grid-body">
          <div className="wechat-function-grid">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="wechat-grid-btn"
                onClick={() => {
                  setOpen(false)
                  onAction(item.action)
                }}
              >
                <div
                  className="grid-btn-squircle"
                  style={{ color: item.iconColor, background: item.bgTint }}
                >
                  {item.icon}
                </div>
                <span className="grid-btn-label">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}