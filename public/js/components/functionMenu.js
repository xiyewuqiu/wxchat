// 功能菜单组件 - 微信风格功能选项弹出层
// 提供Web端适用的功能选项界面框架

const FunctionMenu = {
    // 菜单配置 - 微信风格
    menuItems: [
        {
            id: 'photo',
            icon: '📷',
            title: '拍摄',
            action: 'photo'
        },
        {
            id: 'album',
            icon: '🖼️',
            title: '相册',
            action: 'album'
        },


        {
            id: 'emoji',
            icon: '😊',
            title: '表情',
            action: 'emoji'
        },
        {
            id: 'file',
            icon: '📁',
            title: '文件',
            action: 'file'
        },
        {
            id: 'search',
            icon: '🔍',
            title: '搜索',
            action: 'search'
        },

        {
            id: 'ai-chat',
            icon: '🤖',
            title: 'AI助手',
            action: 'aiChat'
        },
        {
            id: 'ai-image-gen',
            icon: '🎨',
            title: 'AI绘画',
            action: 'aiImageGen'
        },
        {
            id: 'clear-chat',
            icon: '🧹',
            title: '清理记录',
            action: 'clearChat'
        },
        {
            id: 'pwa-manage',
            icon: '📱',
            title: 'PWA管理',
            action: 'pwaManage'
        },
        {
            id: 'logout',
            icon: '🚪',
            title: '登出',
            action: 'logout'
        }
    ],

    emojiPickerItems: [
        '😀', '😄', '😊', '😍', '🥰', '😘', '😎', '🤔',
        '😂', '🤣', '😅', '😭', '😢', '😡', '😴', '🤯',
        '👍', '👎', '👏', '🙏', '💪', '🤝', '👌', '✌️',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🔥', '💯',
        '🎉', '✨', '🌟', '🎁', '☕', '🍻', '🍚', '🍜'
    ],

    // 组件状态
    isInitialized: false,
    isEmojiPickerOpen: false,

    // 初始化菜单
    init() {
        if (this.isInitialized) {
            return;
        }

        this.createMenuElement();
        this.createEmojiPickerElement();
        this.bindEvents();
        this.isInitialized = true;
    },

    // 创建菜单DOM元素
    createMenuElement() {
        // 检查是否已存在
        const existingMenu = document.getElementById('functionMenu');
        if (existingMenu) {
            return;
        }
        const menuHTML = `
            <div class="function-menu" id="functionMenu">
                <div class="function-menu-overlay"></div>
                <div class="function-menu-content">
                    <div class="function-menu-header">
                        <h3>更多功能</h3>
                        <button class="function-menu-close" id="functionMenuClose">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="function-menu-grid">
                        ${this.generateMenuItems()}
                    </div>
                </div>
            </div>
        `;

        // 插入到body中
        document.body.insertAdjacentHTML('beforeend', menuHTML);
    },

    // 创建表情选择器DOM元素
    createEmojiPickerElement() {
        const existingPicker = document.getElementById('emojiPicker');
        if (existingPicker) {
            return;
        }

        const pickerHTML = `
            <div class="emoji-picker" id="emojiPicker" role="dialog" aria-modal="true" aria-label="选择表情">
                <div class="emoji-picker-overlay"></div>
                <div class="emoji-picker-content">
                    <div class="emoji-picker-header">
                        <h3>选择表情</h3>
                        <button class="emoji-picker-close" id="emojiPickerClose" aria-label="关闭表情选择">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="emoji-picker-grid">
                        ${this.generateEmojiItems()}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', pickerHTML);
    },

    // 生成菜单项HTML - 微信风格
    generateMenuItems() {
        return this.menuItems.map(item => `
            <div class="function-menu-item" data-action="${item.action}" data-id="${item.id}">
                <div class="function-menu-item-icon">${item.icon}</div>
                <div class="function-menu-item-content">
                    <div class="function-menu-item-title">${item.title}</div>
                </div>
            </div>
        `).join('');
    },

    // 生成表情按钮HTML
    generateEmojiItems() {
        return this.emojiPickerItems.map(emoji => `
            <button type="button" class="emoji-picker-item" data-emoji="${emoji}" aria-label="插入表情 ${emoji}">
                ${emoji}
            </button>
        `).join('');
    },

    // 绑定事件
    bindEvents() {
        // 菜单项点击事件
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.function-menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                const itemId = menuItem.dataset.id;
                this.handleMenuItemClick(action, itemId);
            }
        });

        // 关闭按钮事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#functionMenuClose')) {
                this.hide();
            }
        });

        // 遮罩层点击关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('function-menu-overlay')) {
                this.hide();
            }
        });

        // 表情选择
        document.addEventListener('click', (e) => {
            const emojiItem = e.target.closest('.emoji-picker-item');
            if (emojiItem) {
                const emoji = emojiItem.dataset.emoji;
                if (emoji) {
                    this.insertTextToInput(emoji);
                }
                this.hideEmojiPicker();
            }
        });

        // 关闭表情选择器
        document.addEventListener('click', (e) => {
            if (e.target.closest('#emojiPickerClose') || e.target.classList.contains('emoji-picker-overlay')) {
                this.hideEmojiPicker();
            }
        });

        // ESC键关闭表情选择器
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isEmojiPickerOpen) {
                this.hideEmojiPicker();
            }
        });
    },

    // 处理菜单项点击
    handleMenuItemClick(action, itemId) {
        // 分发自定义事件
        const event = new CustomEvent('functionMenu:itemClick', {
            detail: { action, itemId }
        });
        document.dispatchEvent(event);

        // 执行对应的动作
        this.executeAction(action, itemId);
        
        // 关闭菜单
        this.hide();
        this.syncFunctionButtonState(false);
    },

    // 执行功能动作 - 微信风格功能
    executeAction(action, itemId) {
        switch (action) {
            case 'photo':
                this.handlePhoto();
                break;
            case 'album':
                this.handleAlbum();
                break;


            case 'emoji':
                this.handleEmoji();
                break;
            case 'file':
                this.handleFile();
                break;
            case 'search':
                this.handleSearch();
                break;

            case 'aiChat':
                this.handleAiChat();
                break;
            case 'aiImageGen':
                this.handleAiImageGen();
                break;
            case 'clearChat':
                this.handleClearChat();
                break;
            case 'pwaManage':
                this.handlePwaManage();
                break;
            case 'logout':
                this.handleLogout();
                break;
            default:
                this.showComingSoon(action);
        }
    },

    // 拍摄功能 - 调用系统原生相机
    handlePhoto() {
        // 创建隐藏的文件输入元素，设置为调用相机
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment'; // 调用后置摄像头
        cameraInput.style.display = 'none';

        // 监听文件选择
        cameraInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    // 显示上传状态
                    UI.showSuccess('📸 正在处理照片...');

                    // 上传文件
                    const deviceId = Utils.getDeviceId();
                    await API.uploadFile(file, deviceId);

                    // 刷新消息列表
                    setTimeout(async () => {
                        await MessageHandler.loadMessages(true);
                    }, 500);

                    UI.showSuccess('📸 照片发送成功！');
                } catch (error) {
                    console.error('拍照上传失败:', error);
                    UI.showError('照片上传失败，请重试');
                }
            }

            // 清理临时元素
            if (cameraInput.parentNode) {
                cameraInput.parentNode.removeChild(cameraInput);
            }
        });

        // 添加到DOM并触发点击
        document.body.appendChild(cameraInput);
        cameraInput.click();
    },

    // 相册功能
    handleAlbum() {
        // 触发文件选择
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.accept = 'image/*';
            fileInput.click();
        } else {
            this.showComingSoon('相册');
        }
    },





    // 表情功能
    handleEmoji() {
        this.showEmojiPicker();
    },

    // 文件功能
    handleFile() {
        // 触发文件选择
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.accept = '*/*';
            fileInput.click();
        } else {
            this.showComingSoon('文件');
        }
    },



    // 搜索功能
    handleSearch() {
        // 检查搜索功能是否可用
        if (!CONFIG.SEARCH.ENABLED) {
            this.insertTextToInput('🔍 搜索功能暂未启用');
            return;
        }

        // 检查SearchUI是否已加载
        if (window.SearchUI && typeof SearchUI.showSearchModal === 'function') {
            // 显示搜索模态框
            SearchUI.showSearchModal();
        } else {
            // 如果搜索模块未加载，显示提示
            this.insertTextToInput('🔍 搜索模块正在加载中...');

            // 尝试初始化搜索模块
            setTimeout(() => {
                if (window.SearchUI && typeof SearchUI.init === 'function') {
                    SearchUI.init();
                    SearchUI.showSearchModal();
                }
            }, 100);
        }
    },

    // AI助手功能
    handleAiChat() {
        // 检查AI功能是否可用
        if (!CONFIG.AI.ENABLED) {
            this.insertTextToInput('🤖 AI功能暂未启用');
            return;
        }

        // 切换AI模式
        if (window.AIHandler && typeof AIHandler.toggleAIMode === 'function') {
            const isAIMode = AIHandler.toggleAIMode();

            // 如果启用了AI模式，在输入框中添加AI标识
            if (isAIMode) {
                this.insertTextToInput('🤖 ');
            }
        } else {
            // 如果AI模块未加载，显示提示
            this.insertTextToInput('🤖 AI模块正在加载中...');

            // 尝试初始化AI模块
            setTimeout(() => {
                if (window.AIHandler && typeof AIHandler.init === 'function') {
                    AIHandler.init();
                }
            }, 100);
        }
    },

    // AI图片生成功能
    handleAiImageGen() {
        // 检查图片生成功能是否可用
        if (!CONFIG.IMAGE_GEN.ENABLED) {
            this.insertTextToInput('🎨 AI图片生成功能暂未启用');
            return;
        }

        // 检查ImageGenUI是否已加载
        if (window.ImageGenUI && typeof ImageGenUI.showImageGenModal === 'function') {
            // 显示图片生成模态框
            ImageGenUI.showImageGenModal();
        } else {
            // 如果UI模块未加载，显示提示
            this.insertTextToInput('🎨 AI图片生成模块正在加载中...');

            // 尝试初始化图片生成模块
            setTimeout(() => {
                if (window.ImageGenUI && typeof ImageGenUI.init === 'function') {
                    ImageGenUI.init();
                    ImageGenUI.showImageGenModal();
                }
            }, 100);
        }
    },

    // 聊天记录清理功能
    handleClearChat() {
        // 复用现有的清理逻辑
        if (window.MessageHandler && typeof MessageHandler.handleClearCommand === 'function') {
            MessageHandler.handleClearCommand();
        } else {
            // 如果MessageHandler未加载，显示提示
            this.insertTextToInput('🧹 正在初始化清理功能...');

            // 尝试通过输入清理命令来触发
            setTimeout(() => {
                const messageText = document.getElementById('messageText');
                if (messageText) {
                    messageText.value = '/clear-all';
                    // 触发发送消息
                    const sendButton = document.getElementById('sendButton');
                    if (sendButton) {
                        sendButton.click();
                    }
                }
            }, 100);
        }
    },

    // PWA管理功能
    handlePwaManage() {
        // 复用现有的PWA逻辑
        if (window.MessageHandler && typeof MessageHandler.handlePWACommand === 'function') {
            MessageHandler.handlePWACommand();
        } else {
            // 如果MessageHandler未加载，显示提示
            this.insertTextToInput('📱 正在初始化PWA管理功能...');

            // 尝试通过输入PWA命令来触发
            setTimeout(() => {
                const messageText = document.getElementById('messageText');
                if (messageText) {
                    messageText.value = '/pwa';
                    // 触发发送消息
                    const sendButton = document.getElementById('sendButton');
                    if (sendButton) {
                        sendButton.click();
                    }
                }
            }, 100);
        }
    },

    // 登出功能
    handleLogout() {
        // 复用现有的登出逻辑
        if (window.MessageHandler && typeof MessageHandler.handleLogoutCommand === 'function') {
            MessageHandler.handleLogoutCommand();
        } else {
            // 如果MessageHandler未加载，显示提示
            this.insertTextToInput('🚪 正在初始化登出功能...');

            // 尝试通过输入登出命令来触发
            setTimeout(() => {
                const messageText = document.getElementById('messageText');
                if (messageText) {
                    messageText.value = '/logout';
                    // 触发发送消息
                    const sendButton = document.getElementById('sendButton');
                    if (sendButton) {
                        sendButton.click();
                    }
                }
            }, 100);
        }
    },

    // 显示即将推出提示
    showComingSoon(feature) {
        this.insertTextToInput(`🚧 ${feature}功能即将推出，敬请期待！`);
    },

    // 向输入框插入文本
    insertTextToInput(text) {
        const messageText = document.getElementById('messageText');
        if (!messageText) return;

        const currentValue = messageText.value;
        const cursorPos = messageText.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPos) + text + currentValue.slice(cursorPos);
        messageText.value = newValue;
        
        // 设置光标位置
        const newCursorPos = cursorPos + text.length;
        messageText.setSelectionRange(newCursorPos, newCursorPos);
        
        // 触发input事件以更新UI状态
        messageText.dispatchEvent(new Event('input', { bubbles: true }));
        
        // 聚焦输入框
        messageText.focus();
    },

    // 显示菜单
    show() {
        const menu = document.getElementById('functionMenu');
        if (menu) {
            menu.classList.add('show');
            this.syncFunctionButtonState(true);
        } else {
            console.error('FunctionMenu: 无法显示菜单，元素不存在');
        }
    },

    // 隐藏菜单
    hide() {
        const menu = document.getElementById('functionMenu');
        if (menu) {
            menu.classList.remove('show');
            this.syncFunctionButtonState(false);
        } else {
            console.error('FunctionMenu: 无法隐藏菜单，元素不存在');
        }
    },

    // 显示表情选择器
    showEmojiPicker() {
        this.createEmojiPickerElement();

        const picker = document.getElementById('emojiPicker');
        if (!picker) return;

        picker.classList.add('show');
        this.isEmojiPickerOpen = true;

        const firstEmoji = picker.querySelector('.emoji-picker-item');
        if (firstEmoji) {
            setTimeout(() => firstEmoji.focus(), 120);
        }
    },

    // 隐藏表情选择器
    hideEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.classList.remove('show');
        }
        this.isEmojiPickerOpen = false;
    },

    // 同步功能按钮内部状态，避免菜单关闭后下一次点击被误判为关闭
    syncFunctionButtonState(isOpen) {
        if (window.FunctionButton) {
            window.FunctionButton.isMenuOpen = isOpen;
        }
    },

    // 添加自定义菜单项
    addMenuItem(item) {
        this.menuItems.push(item);
        if (this.isInitialized) {
            this.refreshMenu();
        }
    },

    // 刷新菜单
    refreshMenu() {
        const menuGrid = document.querySelector('.function-menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = this.generateMenuItems();
        }
    }
};

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FunctionMenu;
}
