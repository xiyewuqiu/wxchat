// UI 操作和渲染 - 重构版：补ensureTopLoadingIndicator，修滚动清理

const UI = {
    // DOM 元素缓存
    elements: {},

    // 消息缓存（用于增量更新）
    messageCache: new Map(),

    // 初始化UI
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    // 缓存DOM元素
    cacheElements() {
        this.elements = {
            messageList: document.getElementById('messageList'),
            messageForm: document.getElementById('messageForm'),
            messageText: document.getElementById('messageText'),
            sendButton: document.getElementById('sendButton'),
            functionButton: document.getElementById('functionButton'),
            fileInput: document.getElementById('fileInput'),
            uploadStatus: document.getElementById('uploadStatus'),
            progressBar: document.getElementById('progressBar'),
            fileButton: document.getElementById('fileButton')
        };
    },
    
    // 绑定事件
    bindEvents() {
        this.elements.messageText.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.checkInputAndToggleSendButton();
        });

        this.elements.messageText.addEventListener('paste', () => {
            setTimeout(() => this.checkInputAndToggleSendButton(), 10);
        });

        this.elements.messageText.addEventListener('cut', () => {
            setTimeout(() => this.checkInputAndToggleSendButton(), 10);
        });

        this.elements.messageText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                MessageHandler.sendMessage();
            }
        });

        this.checkInputAndToggleSendButton();
    },
    
    // 自动调整文本框高度
    autoResizeTextarea() {
        const textarea = this.elements.messageText;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    },
    
    // 获取消息容器
    getMessageContainer() {
        return this.elements.messageList;
    },

    // 获取输入框内容
    getInputValue() {
        return this.elements.messageText ? this.elements.messageText.value.trim() : '';
    },

    // 清空输入框
    clearInput() {
        if (this.elements.messageText) {
            this.elements.messageText.value = '';
            this.autoResizeTextarea();
            this.checkInputAndToggleSendButton();
        }
    },

    // 检查是否在底部
    isAtBottom() {
        const container = this.elements.messageList;
        if (!container) return true;
        const threshold = 100;
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    },

    // 滚动到底部
    scrollToBottom(smooth = true) {
        const container = this.elements.messageList;
        if (!container) return;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },
    
    // 显示加载状态
    showLoading(message = '加载中...') {
        this.elements.messageList.innerHTML = `
            <div class="loading">
                <div class="loading-spinner">⏳</div>
                <span>${message}</span>
            </div>
        `;
    },
    
    // 显示空状态
    showEmpty(message = '还没有消息，开始聊天吧！') {
        this.elements.messageList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>${message}</p>
            </div>
        `;
    },
    
    // 确保顶部加载指示器存在（修复之前调用了未定义函数的问题）
    ensureTopLoadingIndicator() {
        const container = this.elements.messageList;
        if (!container) return;
        let indicator = container.querySelector('.top-loading-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'top-loading-indicator';
            indicator.style.cssText = 'display:none;text-align:center;padding:8px;font-size:12px;color:var(--color-gray-400)';
            indicator.textContent = '加载更多...';
            container.insertBefore(indicator, container.firstChild);
        }
        return indicator;
    },

    // 显示/隐藏顶部加载指示器
    showTopLoadingIndicator(show) {
        const indicator = this.ensureTopLoadingIndicator();
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    },
    
    // 渲染消息列表（增量更新）
    renderMessages(messages, forceScroll = false) {
        if (!messages || messages.length === 0) {
            this.showEmpty();
            this.messageCache.clear();
            return;
        }

        const wasAtBottom = this.isAtBottom();

        // 确保顶部加载指示器存在
        this.ensureTopLoadingIndicator();

        // 执行增量更新
        this.updateMessagesIncremental(messages);

        // 只有在用户原本在底部或强制滚动时才滚动到底部
        if (wasAtBottom || forceScroll) {
            this.scrollToBottom();
        }
    },

    // 增量更新消息列表
    updateMessagesIncremental(messages) {
        const messageContainer = this.elements.messageList;
        if (!messageContainer) return;

        // 如果是空状态，清空并重新开始
        if (messageContainer.querySelector('.empty-state')) {
            messageContainer.innerHTML = '';
            this.messageCache.clear();
        }

        // 确保顶部加载指示器存在
        this.ensureTopLoadingIndicator();

        const currentDeviceId = Utils.getDeviceId();
        const preparedMessages = this.prepareMessagesForDisplay(messages, currentDeviceId);

        // 创建新的消息ID集合
        const newMessageIds = new Set(preparedMessages.map(msg => msg.id));

        // 移除不存在的消息
        this.messageCache.forEach((element, messageId) => {
            if (!newMessageIds.has(messageId)) {
                element.remove();
                this.messageCache.delete(messageId);
            }
        });

        // 批量处理新消息
        const fragment = document.createDocumentFragment();
        const newElements = [];
        preparedMessages.forEach((message) => {
            if (!this.messageCache.has(message.id)) {
                const messageElement = this.createMessageElement(message, currentDeviceId);
                fragment.appendChild(messageElement);
                this.messageCache.set(message.id, messageElement);
                newElements.push(messageElement);
            } else {
                MessageRenderer.applyMessagePresentation(
                    this.messageCache.get(message.id),
                    message,
                    currentDeviceId
                );
            }
        });

        if (fragment.children.length > 0) {
            messageContainer.appendChild(fragment);
        }

        // 加载需要图片的消息
        requestAnimationFrame(() => {
            preparedMessages.forEach(message => {
                if (message._needsImageLoad) {
                    const { r2Key, safeId } = message._needsImageLoad;
                    ImageLoader.load(r2Key, safeId);
                }
            });
        });

        // 批量添加淡入动画
        if (newElements.length > 0) {
            requestAnimationFrame(() => {
                newElements.forEach(element => element.classList.add('fade-in'));
            });
        }
    },

    // 为消息计算连续分组和设备颜色
    prepareMessagesForDisplay(messages, currentDeviceId) {
        const groupWindowMs = Math.max(1, Number(CONFIG.MESSAGE?.GROUP_WINDOW_MINUTES) || 15) * 60 * 1000;

        const canAttach = (previous, current) => {
            if (!previous || !current) return false;
            if (previous.device_id !== current.device_id) return false;

            const previousDate = Utils.parseTimestamp(previous.timestamp);
            const currentDate = Utils.parseTimestamp(current.timestamp);
            if (Number.isNaN(previousDate.getTime()) || Number.isNaN(currentDate.getTime())) return false;

            const gap = currentDate.getTime() - previousDate.getTime();
            if (gap < 0 || gap > groupWindowMs) return false;

            return Utils.getTimeZoneDateKey(previousDate) === Utils.getTimeZoneDateKey(currentDate);
        };

        return messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const attachPrevious = canAttach(previous, message);
            const attachNext = canAttach(message, next);

            let groupPosition = 'single';
            if (attachPrevious && attachNext) {
                groupPosition = 'middle';
            } else if (attachPrevious) {
                groupPosition = 'end';
            } else if (attachNext) {
                groupPosition = 'start';
            }

            return {
                ...message,
                _groupPosition: groupPosition,
                _deviceColorIndex: Utils.getDeviceColorIndex(message.device_id),
                _isOwn: message.device_id === currentDeviceId
            };
        });
    },
    
    // 创建消息DOM元素（委托给 MessageRenderer）
    createMessageElement(message, currentDeviceId) {
        return MessageRenderer.createMessageElement(message, currentDeviceId);
    },
    
    // 添加新消息到列表（增量方式）
    addMessage(message) {
        const cachedMessages = window.MessageHandler?.lastMessages || [];
        this.renderMessages([...cachedMessages, message], this.isAtBottom());
    },

    // 添加AI消息到列表
    addAIMessage(message) {
        this.addMessage(message);
    },

    // 设置发送按钮状态
    setSendButtonState(loading, disabled) {
        const btn = this.elements.sendButton;
        if (!btn) return;
        btn.disabled = disabled;
        btn.innerHTML = loading ? '⏳' : '发送';
    },

    // 设置连接状态
    setConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        if (!statusEl) return;

        const statusMap = {
            'connected': { className: 'online', text: '已连接' },
            'disconnected': { className: 'offline', text: '连接断开' },
            'reconnecting': { className: 'reconnecting', text: '重连中...' },
            'connecting': { className: 'connecting', text: '连接中...' },
            'offline': { className: 'offline', text: '离线模式' }
        };

        const s = statusMap[status] || statusMap.disconnected;
        statusEl.className = `connection-status ${s.className}`;
        statusEl.textContent = s.text;
        statusEl.classList.add('show');
    },

    // 显示成功通知
    showSuccess(message) {
        Utils.showNotification(message, 'success');
    },

    // 显示错误通知
    showError(message) {
        Utils.showNotification(message, 'error');
    },

    // 检查输入并切换发送按钮
    checkInputAndToggleSendButton() {
        const input = this.elements.messageText;
        const sendBtn = this.elements.sendButton;
        const funcBtn = this.elements.functionButton;
        if (!input || !sendBtn || !funcBtn) return;

        const hasText = input.value.trim().length > 0;
        sendBtn.classList.toggle('show', hasText);
        funcBtn.classList.toggle('show', !hasText);
    }
};
