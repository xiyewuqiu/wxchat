import { applyUpdate } from '@/lib/pwa'
import { useUiStore } from '@/store/uiStore'

/** 新版本可用提示浮层横幅 */
export function UpdateBanner() {
  const updateAvailable = useUiStore((state) => state.updateAvailable)
  const setUpdateAvailable = useUiStore((state) => state.setUpdateAvailable)

  if (!updateAvailable) return null

  return (
    <div className="pwa-update-capsule" role="alert">
      <div className="update-capsule-content">
        <span className="update-capsule-icon">🚀</span>
        <span className="update-capsule-text">检测到新版本已发布，支持即时无缝升级</span>
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
            ×
          </button>
        </div>
      </div>
    </div>
  )
}