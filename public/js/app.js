// 应用主入口文件

class WeChatApp {
    constructor() {
        this.isInitialized = false;
        this.deviceId = null;
    }
    
    // 初始化应用
    async init() {
        try {
            // 初始化鉴权模块
            Auth.init();

            // 检查认证状态
            const isAuthenticated = await Auth.checkAuthentication();
            if (!isAuthenticated) {
                // 未认证，跳转到登录页面
                window.location.href = '/login.html';
                return;
            }

            // iOS Safari 视口修复
            this.initIOSViewportFix();

            // 检查浏览器兼容性
            this.checkBrowserCompatibility();

            // 初始化设备ID
            this.deviceId = Utils.getDeviceId();

            // 请求通知权限 - 已禁用，避免移动端弹窗遮挡输入框
            // await Utils.requestNotificationPermission();

            // 初始化各个模块
            UI.init();
            FileUpload.init();

            // 初始化功能组件 - 确保在UI初始化之后
            if (typeof FunctionMenu !== 'undefined') {
                FunctionMenu.init();
                // 将组件暴露到全局
                window.FunctionMenu = FunctionMenu;
            }

            if (typeof FunctionButton !== 'undefined') {
                FunctionButton.init();
                // 将组件暴露到全局，供UI模块使用
                window.FunctionButton = FunctionButton;
            }

            // 初始化PWA功能
            if (typeof PWA !== 'undefined') {
                PWA.init();
            }

            // 初始化AI模块
            if (typeof AIUI !== 'undefined') {
                AIUI.init();
                window.AIUI = AIUI;
            }

            if (typeof AIHandler !== 'undefined') {
                const aiInitSuccess = AIHandler.init();
                if (aiInitSuccess) {
                    window.AIHandler = AIHandler;
                }
            }

            // 初始化AI图片生成模块
            if (typeof ImageGenUI !== 'undefined') {
                ImageGenUI.init();
                window.ImageGenUI = ImageGenUI;
            }

            if (typeof ImageGenHandler !== 'undefined') {
                ImageGenHandler.init();
                window.ImageGenHandler = ImageGenHandler;
            }

            // 初始化搜索模块
            if (typeof SearchUI !== 'undefined') {
                SearchUI.init();
                window.SearchUI = SearchUI;
            }

            if (typeof SearchHandler !== 'undefined') {
                SearchHandler.init();
                window.SearchHandler = SearchHandler;
            }

            // 设置初始连接状态
            UI.setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');

            MessageHandler.init();

            // 绑定功能菜单事件
            this.bindFunctionMenuEvents();

            // 标记为已初始化
            this.isInitialized = true;

            // 显示欢迎消息
            this.showWelcomeMessage();

        } catch (error) {
            this.showInitError(error);
        }
    }

    // iOS Safari 视口修复
    initIOSViewportFix() {
        // 检测是否为iOS设备
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isIOS) {
            // 设置CSS自定义属性来修复100vh问题
            const setVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };

            // 初始设置
            setVH();

            // 监听窗口大小变化（包括虚拟键盘弹出/收起）
            window.addEventListener('resize', Utils.debounce(setVH, 100));
            window.addEventListener('orientationchange', () => {
                setTimeout(setVH, 500); // 延迟执行，等待方向改变完成
            });

            // 监听虚拟键盘事件
            this.handleIOSKeyboard();
        }
    }

    // 处理iOS虚拟键盘
    handleIOSKeyboard() {
        let initialViewportHeight = window.innerHeight;

        const handleViewportChange = () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;

            // 如果高度减少超过150px，认为是虚拟键盘弹出
            if (heightDifference > 150) {
                document.body.classList.add('keyboard-open');
                // 确保输入框可见
                setTimeout(() => {
                    const inputContainer = document.querySelector('.input-container');
                    if (inputContainer) {
                        inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }, 300);
            } else {
                document.body.classList.remove('keyboard-open');
            }
        };

        window.addEventListener('resize', Utils.debounce(handleViewportChange, 100));
    }

    // 检查浏览器兼容性
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'localStorage',
            'FormData',
            'FileReader'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            return !(feature in window);
        });

        if (missingFeatures.length > 0) {
            throw new Error(`浏览器不支持以下功能: ${missingFeatures.join(', ')}`);
        }

        // 检查ES6支持
        try {
            eval('const test = () => {};');
        } catch (e) {
            throw new Error('浏览器不支持ES6语法，请使用现代浏览器');
        }

        // 浏览器兼容性检查通过
    }

    // 显示欢迎消息 - 已禁用，避免移动端弹窗遮挡输入框
    showWelcomeMessage() {
        const isFirstTime = !localStorage.getItem('hasVisited');

        if (isFirstTime) {
            localStorage.setItem('hasVisited', 'true');

            // 欢迎通知已禁用，避免遮挡输入框
            // setTimeout(() => {
            //     Utils.showNotification('欢迎使用微信文件传输助手！', 'info');
            // }, 1000);
        }
    }

    // 绑定功能菜单事件
    bindFunctionMenuEvents() {
        // 监听功能菜单项点击事件
        document.addEventListener('functionMenu:itemClick', (e) => {
            const { action, itemId } = e.detail;
            this.handleFunctionMenuAction(action, itemId);
        });

        // 监听清空聊天事件
        document.addEventListener('functionMenu:clearChat', async () => {
            try {
                await MessageHandler.clearAllMessages();
                UI.showSuccess('聊天记录已清空');
            } catch (error) {
                UI.showError('清空聊天记录失败');
                console.error('清空聊天记录失败:', error);
            }
        });
    }

    // 处理功能菜单动作
    handleFunctionMenuAction(action, itemId) {
        // 这里可以根据需要添加更多的功能处理逻辑
        switch (action) {
            case 'quickReply':
                // 快速回复功能已在 FunctionMenu 组件中处理
                break;
            case 'emoji':
                // 表情功能已在 FunctionMenu 组件中处理
                break;
            case 'markdown':
                // Markdown 功能已在 FunctionMenu 组件中处理
                break;
            case 'codeSnippet':
                // 代码片段功能已在 FunctionMenu 组件中处理
                break;
            case 'settings':
                // 可以在这里添加更复杂的设置功能
                this.showSettings();
                break;
            default:
                break;
        }
    }

    // 显示设置界面（占位符）
    showSettings() {
        // 这里可以实现设置界面
        alert('设置功能将在后续版本中实现');
    }

    // 显示初始化错误
    showInitError(error) {
        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        const errorMessage = `
            <div style="text-align: center; padding: 2rem; color: #ff4757;">
                <h2>😵 应用启动失败</h2>
                <p>${escapeHtml(error.message)}</p>
                <button onclick="location.reload()" style="
                    background: #07c160; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-top: 1rem;
                ">
                    🔄 重新加载
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }

    // 获取应用状态
    getStatus() {
        return {
            initialized: this.isInitialized,
            deviceId: this.deviceId,
            online: navigator.onLine,
            timestamp: new Date().toISOString()
        };
    }

    // 重启应用
    restart() {
        console.log('🔄 重启应用...');
        location.reload();
    }



    // 清理应用数据
    clearData() {
        if (confirm('确定要清除所有本地数据吗？这将删除设备ID等信息。')) {
            localStorage.clear();
            console.log('🗑️ 本地数据已清除');
            this.restart();
        }
    }
}

// 创建应用实例
const app = new WeChatApp();

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 全局错误处理 - 通知已禁用，避免移动端弹窗遮挡输入框
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    // Utils.showNotification('应用发生错误，请刷新页面重试', 'error');
});

// 未处理的Promise错误 - 通知已禁用，避免移动端弹窗遮挡输入框
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    // Utils.showNotification('网络请求失败，请检查网络连接', 'error');
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    // 清理图片blob URL缓存，避免内存泄漏
    if (typeof API !== 'undefined' && API.clearImageBlobCache) {
        API.clearImageBlobCache();
    }
});

// 导出到全局作用域（用于调试）
window.WeChatApp = app;
window.CONFIG = CONFIG;
window.Utils = Utils;
window.API = API;
window.UI = UI;
window.FileUpload = FileUpload;
window.MessageHandler = MessageHandler;
if (typeof PWA !== 'undefined') {
    window.PWA = PWA;
}
// AI模块全局导出
if (typeof AIAPI !== 'undefined') {
    window.AIAPI = AIAPI;
}
if (typeof AIUI !== 'undefined') {
    window.AIUI = AIUI;
}
if (typeof AIHandler !== 'undefined') {
    window.AIHandler = AIHandler;
}

// AI图片生成模块全局导出
if (typeof ImageGenAPI !== 'undefined') {
    window.ImageGenAPI = ImageGenAPI;
}
if (typeof ImageGenUI !== 'undefined') {
    window.ImageGenUI = ImageGenUI;
}
if (typeof ImageGenHandler !== 'undefined') {
    window.ImageGenHandler = ImageGenHandler;
}

// 搜索模块全局导出
if (typeof SearchAPI !== 'undefined') {
    window.SearchAPI = SearchAPI;
}
if (typeof SearchUI !== 'undefined') {
    window.SearchUI = SearchUI;
}
if (typeof SearchHandler !== 'undefined') {
    window.SearchHandler = SearchHandler;
}

// 开发模式下的调试信息
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('🔧 开发模式已启用');
    console.log('可用的全局对象:', {
        WeChatApp: app,
        CONFIG,
        Utils,
        API,
        UI,
        FileUpload,
        MessageHandler,
        PWA: typeof PWA !== 'undefined' ? PWA : undefined,
        AIAPI: typeof AIAPI !== 'undefined' ? AIAPI : undefined,
        AIUI: typeof AIUI !== 'undefined' ? AIUI : undefined,
        AIHandler: typeof AIHandler !== 'undefined' ? AIHandler : undefined,
        ImageGenAPI: typeof ImageGenAPI !== 'undefined' ? ImageGenAPI : undefined,
        ImageGenUI: typeof ImageGenUI !== 'undefined' ? ImageGenUI : undefined,
        ImageGenHandler: typeof ImageGenHandler !== 'undefined' ? ImageGenHandler : undefined,
        SearchAPI: typeof SearchAPI !== 'undefined' ? SearchAPI : undefined,
        SearchUI: typeof SearchUI !== 'undefined' ? SearchUI : undefined,
        SearchHandler: typeof SearchHandler !== 'undefined' ? SearchHandler : undefined
    });
}