// 功能菜单组件 - 微信风格功能选项弹出层
// 提供Web端适用的功能选项界面框架

const FunctionMenu = {
    STYLE_VERSION: '2.2.4',
    timeZoneOptions: [],

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
            id: 'timezone',
            icon: '🕘',
            title: '时区',
            action: 'timezone'
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
        this.ensureModalStyles();
        this.bindEvents();
        this.isInitialized = true;
    },

    // 确保新版弹层样式已加载，绕过旧 Service Worker 对裸 CSS 路径的缓存
    ensureModalStyles() {
        const versionedHref = `./css/modals.css?v=${this.STYLE_VERSION}`;
        const hasVersionedStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .some(link => link.href.includes(`/css/modals.css?v=${this.STYLE_VERSION}`));

        if (hasVersionedStyles) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = versionedHref;
        link.dataset.wxchatModalStyles = this.STYLE_VERSION;
        document.head.appendChild(link);
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
            case 'timezone':
                this.handleTimezone();
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

    // 时区设置
    handleTimezone() {
        this.createTimezoneDialog();
        const dialog = document.getElementById('timezoneDialog');
        if (!dialog) return;

        Utils.applyTimeZonePreference();
        const mode = CONFIG.TIMEZONE.MODE || 'browser';
        const activeTimeZone = Utils.getActiveTimeZone();
        const customValue = CONFIG.TIMEZONE.CUSTOM || activeTimeZone || Utils.getBrowserTimeZone();
        const serverTimeZone = CONFIG.TIMEZONE.DEFAULT || CONFIG.TIMEZONE.SERVER || 'UTC';
        const browserTimeZone = Utils.getBrowserTimeZone();

        dialog.querySelectorAll('input[name="timezoneMode"]').forEach(input => {
            input.checked = input.value === mode;
            input.disabled = CONFIG.TIMEZONE.ALLOW_CLIENT_OVERRIDE === false && input.value !== 'server';
        });

        const customInput = dialog.querySelector('#timezoneCustomValue');
        if (customInput) customInput.value = customValue;

        const summary = dialog.querySelector('#timezoneSummary');
        if (summary) {
            summary.textContent = `当前: ${activeTimeZone} · 浏览器: ${browserTimeZone} · 服务端: ${serverTimeZone}`;
        }

        this.updateTimezoneCustomInputState();
        this.renderTimezoneOptions();
        dialog.classList.add('show');
    },

    createTimezoneDialog() {
        if (document.getElementById('timezoneDialog')) return;

        const dialogHTML = `
            <div class="timezone-dialog" id="timezoneDialog" role="dialog" aria-modal="true" aria-label="时区设置">
                <div class="timezone-dialog-overlay"></div>
                <div class="timezone-dialog-content">
                    <div class="timezone-dialog-header">
                        <h3>时区</h3>
                        <button class="timezone-dialog-close" id="timezoneDialogClose" aria-label="关闭时区设置">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="timezone-dialog-body">
                        <div class="timezone-summary" id="timezoneSummary"></div>
                        <label class="timezone-option">
                            <input type="radio" name="timezoneMode" value="server">
                            <span>跟随服务端 <small id="timezoneServerLabel"></small></span>
                        </label>
                        <label class="timezone-option">
                            <input type="radio" name="timezoneMode" value="browser">
                            <span>跟随当前浏览器 <small id="timezoneBrowserLabel"></small></span>
                        </label>
                        <label class="timezone-option timezone-option-custom">
                            <input type="radio" name="timezoneMode" value="custom">
                            <span>自定义</span>
                        </label>
                        <div class="timezone-combobox" id="timezoneCombobox">
                            <input class="timezone-custom-input" id="timezoneCustomValue" type="text" placeholder="输入或选择时区" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="timezoneOptionList">
                            <div class="timezone-option-list" id="timezoneOptionList" role="listbox"></div>
                        </div>
                    </div>
                    <div class="timezone-dialog-actions">
                        <button class="timezone-text-button" id="timezoneCancelBtn" type="button">取消</button>
                        <button class="timezone-tonal-button" id="timezoneSaveBtn" type="button">保存</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        const close = () => this.hideTimezoneDialog();
        document.getElementById('timezoneDialogClose')?.addEventListener('click', close);
        document.getElementById('timezoneCancelBtn')?.addEventListener('click', close);
        document.querySelector('#timezoneDialog .timezone-dialog-overlay')?.addEventListener('click', close);
        document.getElementById('timezoneSaveBtn')?.addEventListener('click', () => this.saveTimezonePreference());
        document.querySelectorAll('#timezoneDialog input[name="timezoneMode"]').forEach(input => {
            input.addEventListener('change', () => {
                this.updateTimezoneCustomInputState({ showOptions: input.value === 'custom', resetFilter: input.value === 'custom' });
            });
        });
        document.querySelectorAll('#timezoneDialog .timezone-option').forEach(option => {
            option.addEventListener('click', () => {
                const input = option.querySelector('input[name="timezoneMode"]');
                if (!input || input.disabled) return;
                input.checked = true;
                this.updateTimezoneCustomInputState({ showOptions: input.value === 'custom', resetFilter: input.value === 'custom' });
            });
        });
        const customInput = document.getElementById('timezoneCustomValue');
        customInput?.addEventListener('focus', () => {
            const customRadio = document.querySelector('#timezoneDialog input[name="timezoneMode"][value="custom"]');
            if (customRadio && !customRadio.disabled) {
                customRadio.checked = true;
                this.updateTimezoneCustomInputState({ showOptions: true, resetFilter: true });
            }
        });
        customInput?.addEventListener('input', () => {
            this.selectTimezoneMode('custom');
            this.renderTimezoneOptions(customInput.value);
            this.showTimezoneOptions();
        });
        customInput?.addEventListener('keydown', (event) => this.handleTimezoneComboboxKeydown(event));
        document.getElementById('timezoneOptionList')?.addEventListener('mousedown', (event) => {
            const option = event.target.closest('[data-timezone]');
            if (!option) return;
            event.preventDefault();
            this.chooseTimezoneOption(option.dataset.timezone);
        });
        document.addEventListener('mousedown', (event) => {
            const dialog = document.getElementById('timezoneDialog');
            const combobox = document.getElementById('timezoneCombobox');
            if (!dialog?.classList.contains('show') || combobox?.contains(event.target)) return;
            this.hideTimezoneOptions();
        });
    },

    updateTimezoneCustomInputState(options = {}) {
        const dialog = document.getElementById('timezoneDialog');
        if (!dialog) return;

        const customInput = dialog.querySelector('#timezoneCustomValue');
        const checked = dialog.querySelector('input[name="timezoneMode"]:checked');
        const customEnabled = checked?.value === 'custom';
        if (customInput) {
            customInput.disabled = !customEnabled;
            customInput.setAttribute('aria-expanded', customEnabled ? 'true' : 'false');
        }

        const combobox = dialog.querySelector('#timezoneCombobox');
        if (combobox) {
            combobox.classList.toggle('disabled', !customEnabled);
        }

        const serverLabel = dialog.querySelector('#timezoneServerLabel');
        if (serverLabel) serverLabel.textContent = CONFIG.TIMEZONE.DEFAULT || CONFIG.TIMEZONE.SERVER || 'UTC';

        const browserLabel = dialog.querySelector('#timezoneBrowserLabel');
        if (browserLabel) browserLabel.textContent = Utils.getBrowserTimeZone();

        if (customEnabled) {
            this.renderTimezoneOptions(options.resetFilter ? '' : (customInput?.value || ''));
            if (options.showOptions) this.showTimezoneOptions();
        } else {
            this.hideTimezoneOptions();
        }
    },

    selectTimezoneMode(mode) {
        const radio = document.querySelector(`#timezoneDialog input[name="timezoneMode"][value="${mode}"]`);
        if (!radio || radio.disabled) return;
        radio.checked = true;
        this.updateTimezoneCustomInputState();
    },

    getTimezoneOptions() {
        if (this.timeZoneOptions.length > 0) return this.timeZoneOptions;

        const preferred = [
            Utils.getBrowserTimeZone(),
            CONFIG.TIMEZONE.DEFAULT,
            CONFIG.TIMEZONE.SERVER,
            'Asia/Shanghai',
            'Asia/Hong_Kong',
            'Asia/Tokyo',
            'Asia/Singapore',
            'Asia/Seoul',
            'Etc/UTC',
            'Europe/London',
            'Europe/Paris',
            'America/New_York',
            'America/Los_Angeles'
        ].filter(Boolean);

        let supported = [];
        if (typeof Intl.supportedValuesOf === 'function') {
            try {
                supported = Intl.supportedValuesOf('timeZone');
            } catch {
                supported = [];
            }
        }

        const fallback = [
            'Asia/Shanghai',
            'Asia/Hong_Kong',
            'Asia/Taipei',
            'Asia/Tokyo',
            'Asia/Singapore',
            'Asia/Seoul',
            'Asia/Bangkok',
            'Asia/Dubai',
            'Etc/UTC',
            'UTC',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Australia/Sydney'
        ];

        this.timeZoneOptions = [...new Set([...preferred, ...(supported.length ? supported : fallback)])]
            .filter(timeZone => Utils.isValidTimeZone(timeZone))
            .sort((a, b) => a.localeCompare(b));
        return this.timeZoneOptions;
    },

    renderTimezoneOptions(query = '') {
        const list = document.getElementById('timezoneOptionList');
        if (!list) return;

        const normalizedQuery = query.trim().toLowerCase();
        const matches = this.getTimezoneOptions()
            .filter(timeZone => !normalizedQuery || timeZone.toLowerCase().includes(normalizedQuery))
            .slice(0, 80);

        if (matches.length === 0) {
            list.innerHTML = '<div class="timezone-option-empty">没有匹配的时区</div>';
            return;
        }

        list.innerHTML = matches
            .map((timeZone, index) => {
                const selected = timeZone === document.getElementById('timezoneCustomValue')?.value?.trim();
                return `<button class="timezone-option-item${index === 0 ? ' active' : ''}" type="button" role="option" data-timezone="${Utils.escapeHtml(timeZone)}" aria-selected="${selected ? 'true' : 'false'}">${Utils.escapeHtml(timeZone)}</button>`;
            })
            .join('');
    },

    showTimezoneOptions() {
        const dialog = document.getElementById('timezoneDialog');
        const checked = dialog?.querySelector('input[name="timezoneMode"]:checked');
        if (checked?.value !== 'custom') return;

        const list = document.getElementById('timezoneOptionList');
        const input = document.getElementById('timezoneCustomValue');
        if (list) list.classList.add('show');
        if (input) input.setAttribute('aria-expanded', 'true');
    },

    hideTimezoneOptions() {
        const list = document.getElementById('timezoneOptionList');
        const input = document.getElementById('timezoneCustomValue');
        if (list) list.classList.remove('show');
        if (input) input.setAttribute('aria-expanded', 'false');
    },

    chooseTimezoneOption(timeZone) {
        const input = document.getElementById('timezoneCustomValue');
        if (input) input.value = timeZone;
        this.selectTimezoneMode('custom');
        this.renderTimezoneOptions(timeZone);
        this.hideTimezoneOptions();
    },

    handleTimezoneComboboxKeydown(event) {
        const list = document.getElementById('timezoneOptionList');
        if (!list) return;

        const items = Array.from(list.querySelectorAll('.timezone-option-item'));
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this.showTimezoneOptions();
            if (items.length === 0) return;

            const currentIndex = Math.max(0, items.findIndex(item => item.classList.contains('active')));
            const nextIndex = event.key === 'ArrowDown'
                ? Math.min(items.length - 1, currentIndex + 1)
                : Math.max(0, currentIndex - 1);
            items.forEach(item => item.classList.remove('active'));
            items[nextIndex].classList.add('active');
            items[nextIndex].scrollIntoView({ block: 'nearest' });
        } else if (event.key === 'Enter' && list.classList.contains('show')) {
            const active = list.querySelector('.timezone-option-item.active');
            if (active) {
                event.preventDefault();
                this.chooseTimezoneOption(active.dataset.timezone);
            }
        } else if (event.key === 'Escape') {
            this.hideTimezoneOptions();
        }
    },

    hideTimezoneDialog() {
        document.getElementById('timezoneDialog')?.classList.remove('show');
    },

    saveTimezonePreference() {
        const checked = document.querySelector('#timezoneDialog input[name="timezoneMode"]:checked');
        const mode = checked?.value || 'server';
        const customValue = document.getElementById('timezoneCustomValue')?.value?.trim() || '';

        try {
            const active = Utils.setTimeZonePreference(mode, customValue);
            this.hideTimezoneDialog();
            UI.showSuccess(`时区已切换为 ${active}`);
            if (window.UI && typeof UI.refreshMessagePresentation === 'function') {
                UI.refreshMessagePresentation();
            } else if (window.MessageHandler && typeof MessageHandler.loadMessages === 'function') {
                MessageHandler.loadMessages(true);
            }
            if (window.SearchAPI && typeof SearchAPI.clearCache === 'function') {
                SearchAPI.clearCache();
            }
        } catch (error) {
            UI.showError(error.message || '时区设置失败');
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
