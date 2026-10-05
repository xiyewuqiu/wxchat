import { applyUpdate } from '@/lib/pwa'
import { useUiStore } from '@/store/uiStore'
import { IconSparkles, IconX } from '@/components/icons'

/** 新版本可用提示浮层横幅 (纯矢量微标) */
export function UpdateBanner() {
  const updateAvailable = useUiStore((state) => state.updateAvailable)
  const setUpdateAvailable = useUiStore((state) => state.setUpdateAvailable)

  if (!updateAvailable) return null

  return (
    <div className="pwa-update-capsule" role="alert">
      <div className="update-capsule-content">
        <IconSparkles size={16} className="update-capsule-icon" />
        <span className="update-capsule-text">检测到新版本已发布，支持即时升级</span>
        <div className="update-capsule-actions">
          <button type="button" className="update-capsule-btn" onClick={applyUpdate}>
            立即升级
          </button>
          <button
            type="button"
            className="update-capsule-close"
            title="稍后提醒"
            onClick={() => setUpdateAvailable(false)}
          >
            <IconX size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}