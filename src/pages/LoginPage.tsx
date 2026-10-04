import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** 登录页：密码校验、失败次数限制、密码可见性切换 */
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
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await login(password.trim())
      navigate('/', { replace: true })
    } catch (loginError) {
      setError((loginError as Error).message)
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">
          <img src="/icons/icon.svg" alt="微信文件传输助手" className="auth-icon-img" />
        </div>

        <h1 className="auth-title">微信文件传输助手</h1>
        <p className="auth-subtitle">请输入访问密码以继续使用</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="请输入访问密码"
              autoComplete="current-password"
              value={password}
              disabled={loading}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
            />
            <button
              type="button"
              className="password-toggle"
              title={showPassword ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button type="submit" className={`auth-button${loading ? ' loading' : ''}`} disabled={loading}>
            登录
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-help">
          <p>🔒 为了保护您的隐私，本应用需要密码验证</p>
          <p>💡 如果忘记密码，请在Cloudflare控制台重新设置</p>
        </div>

        <div className="security-tips">
          <strong>🛡️ 安全提示：</strong>
          <ul>
            <li>请勿在公共设备上保存密码</li>
            <li>建议定期更换访问密码</li>
            <li>密码可在Cloudflare控制台随时修改</li>
          </ul>
        </div>
      </div>
    </div>
  )
}