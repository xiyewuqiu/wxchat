import { applyUpdate } from '@/lib/pwa'
import { useUiStore } from '@/store/uiStore'

/** 新版本可用横幅 */
export function UpdateBanner() {
  const updateAvailable = useUiStore((state) => state.updateAvailable)
  const setUpdateAvailable = useUiStore((state) => state.setUpdateAvailable)

  if (!updateAvailable) return null

  return (
    <div className="pwa-update-banner">
      <div className="update-content">
        <span>🚀 新版本可用</span>
        <button type="button" className="update-btn" onClick={applyUpdate}>
          更新
        </button>
        <button type="button" className="close-btn" onClick={() => setUpdateAvailable(false)}>
          ×
        </button>
      </div>
    </div>
  )
}