// 鉴权模块 - 处理登录验证和会话管理

const Auth = {
    // 配置
    config: {
        TOKEN_KEY: process.env.TOKEN_KEY || 'wxchat_auth_token', // Use environment variable
        LOGIN_ATTEMPTS_KEY: 'wxchat_login_attempts',
        MAX_ATTEMPTS: 5,
        ATTEMPT_RESET_TIME: 15 * 60 * 1000, // 15分钟
        TOKEN_REFRESH_INTERVAL: 30 * 60 * 1000, // 30分钟刷新token
    },

    // 当前状态
    state: {
        isAuthenticated: false,
        token: null,
        refreshTimer: null,
        loginAttempts: 0,
        lastAttemptTime: 0
    },

    // 初始化鉴权模块
    init() {
        this.loadStoredData();
        this.checkAuthentication();
        this.startTokenRefresh();
    },

    // 初始化登录页面
    initLoginPage() {
        this.loadStoredData();
        this.bindLoginEvents();
        this.checkLoginAttempts();
        
        // 如果已经登录，直接跳转
        if (this.isAuthenticated()) {
            this.redirectToApp();
        }
    },

    // 加载存储的数据
    loadStoredData() {
        try {
            this.state.token = localStorage.getItem(this.config.TOKEN_KEY);
            
            const attemptsData = localStorage.getItem(this.config.LOGIN_ATTEMPTS_KEY);
            if (attemptsData) {
                const data = JSON.parse(attemptsData);
                this.state.loginAttempts = data.count || 0;
                this.state.lastAttemptTime = data.lastTime || 0;
            }
        } catch (error) {
            console.error('加载存储数据失败:', error);
        }
    },

    // 绑定登录页面事件
    bindLoginEvents() {
        const form = document.getElementById('loginForm');
        const passwordInput = document.getElementById('passwordInput');
        const passwordToggle = document.getElementById('passwordToggle');
        const loginButton = document.getElementById('loginButton');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });

            // 输入时清除错误消息
            passwordInput.addEventListener('input', () => {
                this.hideMessage('errorMessage');
                this.hideMessage('warningMessage');
            });
        }

        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
    },

    // 切换密码可见性
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('passwordInput');
        const passwordToggle = document.getElementById('passwordToggle');
        
        if (passwordInput && passwordToggle) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordToggle.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                passwordToggle.textContent = '👁️';
            }
        }
    },

    // 检查登录尝试次数
    checkLoginAttempts() {
        const now = Date.now();
        
        // 如果超过重置时间，清除尝试次数
        if (now - this.state.lastAttemptTime > this.config.ATTEMPT_RESET_TIME) {
            this.state.loginAttempts = 0;
            this.saveLoginAttempts();
        }

        // 如果达到最大尝试次数，显示警告
        if (this.state.loginAttempts >= this.config.MAX_ATTEMPTS) {
            const remainingTime = Math.ceil((this.config.ATTEMPT_RESET_TIME - (now - this.state.lastAttemptTime)) / 60000);
            this.showWarning(`登录尝试次数过多，请 ${remainingTime} 分钟后再试`);
            this.disableLogin();
        }
    },

    // 处理登录
    async handleLogin() {
        if (this.state.loginAttempts >= this.config.MAX_ATTEMPTS) {
            this.showError('登录尝试次数过多，请稍后再试');
            return;
        }

        const passwordInput = document.getElementById('passwordInput');
        const password = passwordInput?.value?.trim();

        if (!password) {
            this.showError('请输入密码');
            passwordInput?.focus();
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (result.success) {
                // 登录成功
                this.state.token = result.token;
                this.state.isAuthenticated = true;
                localStorage.setItem(this.config.TOKEN_KEY, result.token);
                
                // 清除登录尝试记录
                this.state.loginAttempts = 0;
                this.saveLoginAttempts();
                
                // 跳转到应用
                this.redirectToApp();
            } else {
                // 登录失败
                this.handleLoginFailure(result.message || '密码错误');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            this.showError('网络连接失败，请检查网络后重试');
        } finally {
            this.setLoading(false);
        }
    },

    // 处理登录失败
    handleLoginFailure(message) {
        this.state.loginAttempts++;
        this.state.lastAttemptTime = Date.now();
        this.saveLoginAttempts();

        const remainingAttempts = this.config.MAX_ATTEMPTS - this.state.loginAttempts;
        
        if (remainingAttempts > 0) {
            this.showError(`${message}，还可尝试 ${remainingAttempts} 次`);
        } else {
            this.showError('登录尝试次数过多，请15分钟后再试');
            this.disableLogin();
        }

        // 清空密码输入框
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    },

    // 保存登录尝试记录
    saveLoginAttempts() {
        try {
            localStorage.setItem(this.config.LOGIN_ATTEMPTS_KEY, JSON.stringify({
                count: this.state.loginAttempts,
                lastTime: this.state.lastAttemptTime
            }));
        } catch (error) {
            console.error('保存登录尝试记录失败:', error);
        }
    },

    // 设置加载状态
    setLoading(loading) {
        const loginButton = document.getElementById('loginButton');
        const passwordInput = document.getElementById('passwordInput');

        if (loginButton) {
            loginButton.disabled = loading;
            if (loading) {
                loginButton.classList.add('loading');
            } else {
                loginButton.classList.remove('loading');
            }
        }

        if (passwordInput) {
            passwordInput.disabled = loading;
        }
    },

    // 禁用登录
    disableLogin() {
        const loginButton = document.getElementById('loginButton');
        const passwordInput = document.getElementById('passwordInput');

        if (loginButton) {
            loginButton.disabled = true;
        }
        if (passwordInput) {
            passwordInput.disabled = true;
        }
    },

    // 显示错误消息
    showError(message) {
        this.showMessage('errorMessage', message);
        this.hideMessage('warningMessage');
    },

    // 显示警告消息
    showWarning(message) {
        this.showMessage('warningMessage', message);
        this.hideMessage('errorMessage');
    },

    // 显示消息
    showMessage(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    },

    // 隐藏消息
    hideMessage(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },

    // 跳转到应用
    redirectToApp() {
        window.location.href = '/';
    },

    // 检查认证状态
    async checkAuthentication() {
        if (!this.state.token) {
            this.state.isAuthenticated = false;
            return false;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.state.isAuthenticated = result.valid;
                return result.valid;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('验证token失败:', error);
            this.logout();
            return false;
        }
    },

    // 检查是否已认证
    isAuthenticated() {
        return this.state.isAuthenticated && this.state.token;
    },

    // 获取认证token
    getToken() {
        return this.state.token;
    },

    // 开始token刷新
    startTokenRefresh() {
        if (this.state.refreshTimer) {
            clearInterval(this.state.refreshTimer);
        }

        this.state.refreshTimer = setInterval(() => {
            if (this.isAuthenticated()) {
                this.checkAuthentication();
            }
        }, this.config.TOKEN_REFRESH_INTERVAL);
    },

    // 登出
    logout() {
        this.state.isAuthenticated = false;
        this.state.token = null;
        localStorage.removeItem(this.config.TOKEN_KEY);
        
        if (this.state.refreshTimer) {
            clearInterval(this.state.refreshTimer);
            this.state.refreshTimer = null;
        }

        // 如果不在登录页面，跳转到登录页面
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
    },

    // 为API请求添加认证头
    addAuthHeader(headers = {}) {
        if (this.state.token) {
            headers['Authorization'] = `Bearer ${this.state.token}`;
        }
        return headers;
    }
};
