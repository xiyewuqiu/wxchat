import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** 登录页：极致现代毛玻璃流光设计、立体光感卡片与多维安全防护 */
export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 已登录（含从本地恢复的会话）直接进入应用
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isInitializing, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!password.trim()) {
      setError('请输入访问密码')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await login(password.trim())
      navigate('/', { replace: true })
    } catch (loginError) {
      setError((loginError as Error).message || '密码验证失败，请重试')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* 极光流光动态光斑 */}
      <div className="aurora-blob blob-1" />
      <div className="aurora-blob blob-2" />
      <div className="aurora-blob blob-3" />

      <div className="auth-card">
        {/* 顶部微立体 Logo */}
        <div className="auth-brand">
          <div className="auth-icon-wrapper">
            <img src="/icons/icon.svg" alt="微信文件传输助手" className="auth-icon-img" />
            <div className="auth-icon-glow" />
          </div>
          <h1 className="auth-title">微信文件传输助手</h1>
          <p className="auth-subtitle">安全极速 · 跨端互通 · 云端私有伴侣</p>
        </div>

        {/* 登录表单 */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <div className="auth-input-wrapper">
              <span className="auth-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>

              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="请输入访问密钥或密码"
                autoComplete="current-password"
                autoFocus
                value={password}
                disabled={loading}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(null)
                }}
              />

              <button
                type="button"
                className="auth-password-toggle"
                title={showPassword ? '隐藏密码' : '显示密码'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <span className="auth-error-icon">⚠️</span>
              <span className="auth-error-text">{error}</span>
            </div>
          )}

          <button type="submit" className={`auth-submit-btn${loading ? ' is-loading' : ''}`} disabled={loading}>
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              <>
                <span>立即进入</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* 底部安全与特性徽章 */}
        <div className="auth-features-grid">
          <div className="auth-feature-item">
            <span className="feature-icon">🔒</span>
            <div className="feature-desc">
              <span className="feature-title">端到端私有</span>
              <span className="feature-sub">数据隔离加密存储</span>
            </div>
          </div>

          <div className="auth-feature-item">
            <span className="feature-icon">⚡</span>
            <div className="feature-desc">
              <span className="feature-title">边缘加速</span>
              <span className="feature-sub">秒级毫秒同步响应</span>
            </div>
          </div>

          <div className="auth-feature-item">
            <span className="feature-icon">🤖</span>
            <div className="feature-desc">
              <span className="feature-title">AI 全能助手</span>
              <span className="feature-sub">内嵌智能思考绘画</span>
            </div>
          </div>
        </div>

        <div className="auth-footer-note">
          <span>💡 忘记密码？可在 Cloudflare 环境变量中随时更新重置。</span>
        </div>
      </div>
    </div>
  )
}