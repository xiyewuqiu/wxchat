// 消息处理逻辑 - 重构版：去掉三重轮询，加发送队列，修复滚动监听

const MessageHandler = {
    // 自动刷新定时器
    autoRefreshTimer: null,

    // 消息缓存（用于检测变化）
    lastMessages: [],

    // 加载状态（防止重复请求）
    isLoading: false,
    isLoadingMore: false,

    // 分页状态
    hasMoreMessages: true,
    totalLoadedMessages: 0,

    // 无限滚动相关
    scrollListener: null,
    scrollDebounceTimer: null,
    isScrollListenerActive: false,

    // 消息发送队列（断网恢复后重试）
    sendQueue: [],

    // 初始化消息处理
    init() {
        this.bindEvents();
        this.initRealtime();
        this.loadMessages(true);
        this.syncDevice();
        this.initInfiniteScroll();

        // 如果实时连接失败，启用轮询
        setTimeout(() => {
            if (!window.Realtime || !window.Realtime.isConnectionAlive()) {
                this.startAutoRefresh();
            }
        }, 2000);
    },

    // 初始化实时通信
    initRealtime() {
        if (typeof EventSource === 'undefined') {
            this.startAutoRefresh();
            return;
        }

        const deviceId = Utils.getDeviceId();

        if (window.Realtime) {
            Realtime.init(deviceId);

            Realtime.on('connected', () => {
                this.stopAutoRefresh();
                // 连接恢复后发送队列中的消息
                this.flushSendQueue();
            });

            Realtime.on('disconnected', () => {
                this.startAutoRefresh();
            });

            Realtime.on('newMessages', () => {
                // SSE推送新消息，单次刷新
                this.loadMessages(true);
            });
        } else {
            this.startAutoRefresh();
        }
    },
    
    // 绑定事件
    bindEvents() {
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }
    },
    
    // 加载消息列表
    async loadMessages(forceScroll = false) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const messages = await API.getMessages();

            const hasChanges = this.detectMessageChanges(messages);
            const isFirstLoad = this.lastMessages.length === 0;
            const userAtBottom = UI.isAtBottom();
            const shouldScroll = forceScroll || (hasChanges && userAtBottom) || isFirstLoad;

            if (hasChanges || forceScroll || isFirstLoad) {
                UI.renderMessages(messages, shouldScroll);
                this.lastMessages = [...messages];
                this.totalLoadedMessages = messages.length;
                this.hasMoreMessages = messages.length >= CONFIG.UI.MESSAGE_LOAD_LIMIT;
                this.updateInfiniteScrollState();
            }
        } catch (error) {
            console.error('[MessageHandler] 加载消息失败:', error);
            if (this.lastMessages.length === 0) {
                UI.showEmpty('还没有消息，开始聊天吧！');
            } else {
                UI.showError(error.message || CONFIG.ERRORS.LOAD_MESSAGES_FAILED);
            }
        } finally {
            this.isLoading = false;
        }
    },

    // 初始化无限滚动
    initInfiniteScroll() {
        const messageContainer = UI.getMessageContainer();
        if (!messageContainer) {
            console.warn('[MessageHandler] 消息容器未找到，无法初始化无限滚动');
            return;
        }

        this.scrollListener = this.createScrollListener();
        this.updateInfiniteScrollState();
    },

    // 创建滚动监听器（带防抖）
    createScrollListener() {
        return (event) => {
            if (this.scrollDebounceTimer) {
                clearTimeout(this.scrollDebounceTimer);
            }
            this.scrollDebounceTimer = setTimeout(() => {
                this.handleScroll(event);
            }, CONFIG.UI.SCROLL_DEBOUNCE_DELAY);
        };
    },

    // 处理滚动事件
    async handleScroll(event) {
        if (this.isLoadingMore || !this.hasMoreMessages) return;

        const container = event.target;
        const scrollTop = container.scrollTop;
        const threshold = CONFIG.UI.INFINITE_SCROLL_THRESHOLD;

        if (scrollTop <= threshold) {
            await this.loadMoreMessagesInfinite();
        }
    },

    // 无限滚动加载更多消息
    async loadMoreMessagesInfinite() {
        if (this.isLoadingMore || !this.hasMoreMessages) return;

        this.isLoadingMore = true;
        UI.showTopLoadingIndicator(true);

        try {
            const scrollContainer = UI.getMessageContainer();
            const oldScrollHeight = scrollContainer.scrollHeight;
            const oldScrollTop = scrollContainer.scrollTop;

            const moreMessages = await API.getMessages(
                CONFIG.UI.LOAD_MORE_BATCH_SIZE,
                this.totalLoadedMessages
            );

            if (moreMessages && moreMessages.length > 0) {
                const allMessages = [...moreMessages, ...this.lastMessages];
                UI.renderMessages(allMessages, false);
                this.lastMessages = allMessages;
                this.totalLoadedMessages += moreMessages.length;
                this.hasMoreMessages = moreMessages.length >= CONFIG.UI.LOAD_MORE_BATCH_SIZE;

                requestAnimationFrame(() => {
                    const newScrollHeight = scrollContainer.scrollHeight;
                    scrollContainer.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
                });
            } else {
                this.hasMoreMessages = false;
            }

            this.updateInfiniteScrollState();
        } catch (error) {
            console.error('[MessageHandler] 无限滚动加载失败:', error);
        } finally {
            this.isLoadingMore = false;
            UI.showTopLoadingIndicator(false);
        }
    },

    // 更新无限滚动状态
    updateInfiniteScrollState() {
        const messageContainer = UI.getMessageContainer();
        if (!messageContainer) return;

        if (this.hasMoreMessages && !this.isScrollListenerActive) {
            messageContainer.addEventListener('scroll', this.scrollListener, { passive: true });
            this.isScrollListenerActive = true;
        } else if (!this.hasMoreMessages && this.isScrollListenerActive) {
            messageContainer.removeEventListener('scroll', this.scrollListener);
            this.isScrollListenerActive = false;
        }
    },

    // 清理无限滚动
    cleanupInfiniteScroll() {
        const messageContainer = UI.getMessageContainer();
        if (messageContainer && this.scrollListener) {
            messageContainer.removeEventListener('scroll', this.scrollListener);
        }
        if (this.scrollDebounceTimer) {
            clearTimeout(this.scrollDebounceTimer);
            this.scrollDebounceTimer = null;
        }
        this.isScrollListenerActive = false;
    },

    // 检测消息变化
    detectMessageChanges(newMessages) {
        if (newMessages.length !== this.lastMessages.length) return true;
        for (let i = 0; i < newMessages.length; i++) {
            const newMsg = newMessages[i];
            const oldMsg = this.lastMessages[i];
            if (!oldMsg || newMsg.id !== oldMsg.id || newMsg.timestamp !== oldMsg.timestamp) {
                return true;
            }
        }
        return false;
    },
    
    // 发送文本消息 - 重构版：去掉三重轮询，改为等待SSE推送
    async sendMessage() {
        const content = UI.getInputValue();
        if (!content) return;

        // 检查是否为AI消息
        if (this.isAIMessage(content)) {
            await this.handleAIMessage(content);
            return;
        }

        // 检查特殊指令
        if (this.isClearCommand(content)) { await this.handleClearCommand(); return; }
        if (this.isLogoutCommand(content)) { await this.handleLogoutCommand(); return; }
        if (this.isPWACommand(content)) { await this.handlePWACommand(); return; }

        try {
            UI.setSendButtonState(true, true);
            UI.setConnectionStatus('connecting');

            const deviceId = Utils.getDeviceId();
            await API.sendMessage(content, deviceId);

            // 清空输入框
            UI.clearInput();

            // 不再三重轮询！只做一次立即加载
            // 后续消息会通过 SSE 推送自动更新
            await this.loadMessages(true);

            UI.showSuccess(CONFIG.SUCCESS.MESSAGE_SENT);
            UI.setConnectionStatus('connected');

        } catch (error) {
            console.error('[MessageHandler] 发送消息失败:', error);
            
            // 断网时加入发送队列
            if (!navigator.onLine) {
                this.addToSendQueue(content);
                UI.showError('网络离线，消息已加入发送队列');
            } else {
                UI.showError(error.message || CONFIG.ERRORS.MESSAGE_SEND_FAILED);
            }
            
            UI.setConnectionStatus('disconnected');
        } finally {
            UI.setSendButtonState(false, false);
        }
    },

    // 消息发送队列管理
    addToSendQueue(content) {
        this.sendQueue.push({
            content,
            deviceId: Utils.getDeviceId(),
            deviceInfo: Utils.getMessageDeviceInfo(),
            timestamp: Date.now()
        });
        // 持久化到 localStorage，页面刷新不丢失
        try {
            localStorage.setItem('sendQueue', JSON.stringify(this.sendQueue));
        } catch (e) { /* 忽略 */ }
    },

    // 发送队列中的消息
    async flushSendQueue() {
        if (this.sendQueue.length === 0) return;

        // 从 localStorage 恢复
        try {
            const saved = localStorage.getItem('sendQueue');
            if (saved) {
                this.sendQueue = JSON.parse(saved);
            }
        } catch (e) { /* 忽略 */ }

        const remaining = [];
        for (const item of this.sendQueue) {
            try {
                await API.sendMessage(item.content, item.deviceId, item.deviceInfo || Utils.getMessageDeviceInfo());
            } catch (error) {
                remaining.push(item);
            }
        }
        this.sendQueue = remaining;
        localStorage.setItem('sendQueue', JSON.stringify(this.sendQueue));

        if (remaining.length === 0) {
            UI.showSuccess('离线消息已全部发送');
            this.loadMessages(true);
        }
    },

    // 检查是否为AI消息
    isAIMessage(content) {
        if (window.AIHandler && AIHandler.isAIMode) return true;
        const trimmed = content.trim();
        return trimmed.startsWith('🤖') ||
               trimmed.toLowerCase().startsWith('ai:') ||
               trimmed.toLowerCase().startsWith('ai ');
    },

    // 处理AI消息
    async handleAIMessage(content) {
        UI.clearInput();

        if (!window.AIHandler) {
            UI.showError('AI模块未加载，请刷新页面重试');
            return;
        }

        const event = new CustomEvent('beforeMessageSend', {
            detail: { content },
            cancelable: true
        });
        document.dispatchEvent(event);
    },

    // 自动刷新（轮询降级）
    startAutoRefresh() {
        if (this.autoRefreshTimer) return;
        this.autoRefreshTimer = setInterval(() => {
            if (!window.Realtime || !window.Realtime.isConnectionAlive()) {
                this.loadMessages(false);
            }
        }, CONFIG.UI.AUTO_REFRESH_INTERVAL);
    },

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    },

    // 检查是否为清理指令
    isClearCommand(content) {
        const trimmed = content.trim().toLowerCase();
        return trimmed === '/clear' || trimmed === '/clean';
    },

    // 处理清理指令
    async handleClearCommand() {
        const confirmCode = prompt('请输入确认码 1234 以清空所有数据：');
        if (!confirmCode) return;

        try {
            UI.setConnectionStatus('connecting');
            const result = await API.clearAllData(confirmCode);
            if (result && result.success) {
                UI.showSuccess('数据已清空');
                this.lastMessages = [];
                this.totalLoadedMessages = 0;
                this.hasMoreMessages = true;
                UI.renderMessages([], false);
                UI.showEmpty('数据已清空');
            } else {
                UI.showError(result?.error || '清理失败');
            }
        } catch (error) {
            UI.showError('清理失败: ' + error.message);
        } finally {
            UI.setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');
        }
    },

    // 登出指令
    isLogoutCommand(content) {
        return content.trim().toLowerCase() === '/logout';
    },
    async handleLogoutCommand() {
        if (typeof Auth !== 'undefined' && Auth.logout) {
            Auth.logout();
            window.location.href = '/login.html';
        }
    },

    // PWA指令
    isPWACommand(content) {
        const lower = content.trim().toLowerCase();
        return lower === '/install' || lower === '/pwa';
    },
    async handlePWACommand() {
        if (window.PWA) {
            PWA.promptInstall();
        }
    },

    // 设备同步
    async syncDevice() {
        try {
            const deviceId = Utils.getDeviceId();
            const deviceName = Utils.getDeviceName();
            await API.syncDevice(deviceId, deviceName);
        } catch (error) {
            console.error('[MessageHandler] 设备同步失败:', error);
        }
    }
};
