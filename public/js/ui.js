// UI 操作和渲染

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
        // 自动调整文本框高度和切换发送按钮
        this.elements.messageText.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.checkInputAndToggleSendButton();
        });

        // 监听其他可能改变输入框内容的事件
        this.elements.messageText.addEventListener('paste', () => {
            // 粘贴后稍微延迟检查，确保内容已更新
            setTimeout(() => {
                this.checkInputAndToggleSendButton();
            }, 10);
        });

        this.elements.messageText.addEventListener('cut', () => {
            // 剪切后稍微延迟检查
            setTimeout(() => {
                this.checkInputAndToggleSendButton();
            }, 10);
        });

        // 回车发送消息
        this.elements.messageText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                MessageHandler.sendMessage();
            }
        });

        // 初始化时检查输入状态
        this.checkInputAndToggleSendButton();
    },
    

    
    // 自动调整文本框高度
    autoResizeTextarea() {
        const textarea = this.elements.messageText;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
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
    
    // 渲染消息列表（增量更新）
    renderMessages(messages, forceScroll = false) {
        if (!messages || messages.length === 0) {
            this.showEmpty();
            this.messageCache.clear();
            return;
        }

        // 检查用户是否在底部
        const wasAtBottom = this.isAtBottom();

        // 数据库已经按时间戳升序排序，直接使用
        const sortedMessages = messages;

        // 确保顶部加载指示器存在
        this.ensureTopLoadingIndicator();

        // 执行增量更新
        this.updateMessagesIncremental(sortedMessages);

        // 只有在用户原本在底部或强制滚动时才滚动到底部
        if (wasAtBottom || forceScroll) {
            this.scrollToBottom();
        }
    },

    // 增量更新消息列表
    updateMessagesIncremental(messages) {
        const currentDeviceId = Utils.getDeviceId();
        const messageContainer = this.elements.messageList;

        // 如果是空状态，清空并重新开始
        if (messageContainer.querySelector('.empty-state')) {
            messageContainer.innerHTML = '';
            this.messageCache.clear();
        }

        // 确保顶部加载指示器存在
        this.ensureTopLoadingIndicator();

        // 创建新的消息ID集合
        const newMessageIds = new Set(messages.map(msg => msg.id));

        // 移除不存在的消息（静默移除）
        this.messageCache.forEach((element, messageId) => {
            if (!newMessageIds.has(messageId)) {
                element.remove();
                this.messageCache.delete(messageId);
            }
        });

        // 批量处理新消息，减少DOM操作
        const fragment = document.createDocumentFragment();
        const newElements = [];

        messages.forEach((message, index) => {
            if (!this.messageCache.has(message.id)) {
                const messageElement = this.createMessageElement(message, currentDeviceId);

                // 新消息直接添加到fragment，保持数据库排序
                fragment.appendChild(messageElement);

                this.messageCache.set(message.id, messageElement);
                newElements.push(messageElement);
            }
        });

        // 一次性添加所有新消息到末尾（保持时间顺序）
        if (fragment.children.length > 0) {
            messageContainer.appendChild(fragment);
        }

        // 处理需要加载图片的消息
        messages.forEach(message => {
            if (message._needsImageLoad) {
                const { r2Key, safeId } = message._needsImageLoad;
                // 使用setTimeout确保DOM完全插入后再加载图片
                setTimeout(() => {
                    ImageLoader.load(r2Key, safeId);
                }, 10);
            }
        });

        // 批量添加淡入动画
        if (newElements.length > 0) {
            requestAnimationFrame(() => {
                newElements.forEach(element => {
                    element.classList.add('fade-in');
                });
            });
        }
    },
    
    // 创建消息DOM元素（委托给 MessageRenderer）
    createMessageElement(message, currentDeviceId) {
        return MessageRenderer.createMessageElement(message, currentDeviceId);
    },

    // 找到消息的正确插入位置
    findInsertPosition(message, allMessages, currentIndex) {
        const messageContainer = this.elements.messageList;
        const existingMessages = Array.from(messageContainer.children);

        // 如果是第一条消息或容器为空
        if (currentIndex === 0 || existingMessages.length === 0) {
            return existingMessages[0] || null;
        }

        // 查找下一条已存在的消息
        for (let i = currentIndex + 1; i < allMessages.length; i++) {
            const nextMessage = allMessages[i];
            const existingElement = this.messageCache.get(nextMessage.id);
            if (existingElement && messageContainer.contains(existingElement)) {
                return existingElement;
            }
        }

        return null; // 插入到末尾
    },

    // 渲染单个消息（保留用于兼容性）
    renderMessage(message, currentDeviceId) {
        const isOwn = message.device_id === currentDeviceId;
        const time = Utils.formatTime(message.timestamp);
        const deviceName = isOwn ? '我的设备' : '其他设备';

        if (message.type === CONFIG.MESSAGE_TYPES.TEXT) {
            return this.renderTextMessage(message, isOwn, deviceName, time);
        } else if (message.type === CONFIG.MESSAGE_TYPES.FILE) {
            return this.renderFileMessage(message, isOwn, deviceName, time);
        }

        return '';
    },
    
    // 渲染文本消息内容（委托给 MessageRenderer）
    renderTextMessageContent(message, deviceName, time) {
        return MessageRenderer.renderTextMessageContent(message, deviceName, time);
    },

    // 渲染文本消息（保留用于兼容性）
    renderTextMessage(message, isOwn, deviceName, time) {
        const content = MessageRenderer.renderTextMessageContent(message, 
            isOwn ? '我的设备' : '其他设备', 
            Utils.formatTime(message.timestamp));
        return `<div class="message ${isOwn ? 'own' : 'other'} fade-in">${content}</div>`;
    },
    
    // 渲染文件消息内容（委托给 MessageRenderer）
    renderFileMessageContent(message, deviceName, time) {
        return MessageRenderer.renderFileMessageContent(message, deviceName, time);
    },

    // 渲染文件消息（保留用于兼容性）
    renderFileMessage(message, isOwn, deviceName, time) {
        const content = MessageRenderer.renderFileMessageContent(message, 
            isOwn ? '我的设备' : '其他设备', 
            Utils.formatTime(message.timestamp));
        return `<div class="message ${isOwn ? 'own' : 'other'} fade-in">${content}</div>`;
    },
    
    // 添加新消息到列表（增量方式）
    addMessage(message) {
        // 检查用户是否在底部
        const wasAtBottom = this.isAtBottom();

        // 如果当前是空状态，先清空
        if (this.elements.messageList.querySelector('.empty-state')) {
            this.elements.messageList.innerHTML = '';
            this.messageCache.clear();
        }

        // 如果消息已存在，不重复添加
        if (this.messageCache.has(message.id)) {
            return;
        }

        const currentDeviceId = Utils.getDeviceId();
        const messageElement = this.createMessageElement(message, currentDeviceId);

        // 添加到末尾
        this.elements.messageList.appendChild(messageElement);
        this.messageCache.set(message.id, messageElement);

        // 检查是否需要加载图片（DOM插入后）
        if (message._needsImageLoad) {
            const { r2Key, safeId } = message._needsImageLoad;
            // 使用setTimeout确保DOM完全插入后再加载图片
            setTimeout(() => {
                ImageLoader.load(r2Key, safeId);
            }, 10);
        }

        // 添加淡入动画
        requestAnimationFrame(() => {
            messageElement.classList.add('fade-in');
        });

        // 只有在用户原本在底部时才自动滚动
        if (wasAtBottom) {
            this.scrollToBottom();
        }
    },

    // 添加AI消息到列表
    addAIMessage(message) {
        console.log('UI: 添加AI消息', { message });

        // 检查必要的元素
        if (!this.elements.messageList) {
            console.error('UI: messageList 元素不存在');
            return;
        }

        // 检查用户是否在底部
        const wasAtBottom = this.isAtBottom();

        // 如果当前是空状态，先清空
        if (this.elements.messageList.querySelector('.empty-state')) {
            console.log('UI: 清空空状态');
            this.elements.messageList.innerHTML = '';
            this.messageCache.clear();
        }

        // 如果消息已存在，不重复添加
        if (this.messageCache.has(message.id)) {
            console.log('UI: 消息已存在，跳过添加', { messageId: message.id });
            return;
        }

        // 使用AIUI创建AI消息元素
        let messageElement;
        if (window.AIUI && typeof AIUI.createAIMessageElement === 'function') {
            console.log('UI: 使用AIUI创建AI消息元素');
            messageElement = AIUI.createAIMessageElement(message);
        } else {
            console.log('UI: AIUI不可用，使用降级处理');
            // 降级处理：使用普通消息元素
            messageElement = this.createMessageElement(message, 'ai-system');
            messageElement.classList.add('ai');
        }

        if (!messageElement) {
            console.error('UI: 消息元素创建失败');
            return;
        }

        console.log('UI: 准备添加消息元素到DOM', { messageElement });

        // 添加到末尾
        this.elements.messageList.appendChild(messageElement);
        this.messageCache.set(message.id, messageElement);

        console.log('UI: 消息元素已添加到DOM');

        // 添加淡入动画
        requestAnimationFrame(() => {
            messageElement.classList.add('fade-in');
        });

        // 强制滚动到底部
        this.scrollToBottom();

        console.log('UI: AI消息添加完成');
    },

    // 更新AI思考过程
    updateAIThinking(thinkingId, thinking) {
        if (window.AIUI && typeof AIUI.updateThinkingContent === 'function') {
            AIUI.updateThinkingContent(thinkingId, thinking);
        }
    },

    // 更新AI响应
    updateAIResponse(responseId, chunk, fullResponse) {
        if (window.AIUI && typeof AIUI.updateResponseContent === 'function') {
            AIUI.updateResponseContent(responseId, chunk, fullResponse);
        }
    },

    // 完成AI响应
    completeAIResponse(responseId, finalContent) {
        if (window.AIUI && typeof AIUI.completeResponse === 'function') {
            AIUI.completeResponse(responseId, finalContent);
        }
    },

    // 移除消息
    removeMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
            this.messageCache.delete(messageId);
        }

        // 如果是AI消息，也从AI UI中移除
        if (window.AIUI && typeof AIUI.removeAIMessage === 'function') {
            AIUI.removeAIMessage(messageId);
        }
    },

    // 更新AI模式状态
    updateAIMode(isAIMode) {
        console.log('UI: 更新AI模式状态', { isAIMode });

        // 使用AIUI更新模式指示器
        if (window.AIUI && typeof AIUI.updateAIModeIndicator === 'function') {
            AIUI.updateAIModeIndicator(isAIMode);
        }

        // 更新输入框样式
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            if (isAIMode) {
                inputContainer.classList.add('ai-mode');
            } else {
                inputContainer.classList.remove('ai-mode');
            }
        }
    },
    
    // 检查是否在底部
    isAtBottom() {
        const container = this.elements.messageList;
        const threshold = 50; // 50px的容差
        return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    },

    // 滚动到底部
    scrollToBottom() {
        // 使用requestAnimationFrame确保DOM更新完成后再滚动
        requestAnimationFrame(() => {
            const container = this.elements.messageList;

            // iOS Safari 特殊处理
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (isIOS) {
                // iOS上使用smooth滚动可能有问题，使用多重方法确保滚动
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'auto' // iOS上auto比smooth更可靠
                });

                // 备用方法
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                }, 50);
            } else {
                container.scrollTop = container.scrollHeight;
            }
        });
    },
    
    // 设置发送按钮状态 - 微信移动端风格
    setSendButtonState(disabled, loading = false) {
        this.elements.sendButton.disabled = disabled;

        if (loading) {
            this.elements.sendButton.classList.add('loading');
        } else {
            this.elements.sendButton.classList.remove('loading');
        }
    },

    // 显示/隐藏发送按钮 - 微信移动端风格
    toggleSendButton(show) {
        if (show) {
            this.elements.sendButton.classList.add('show');
        } else {
            this.elements.sendButton.classList.remove('show');
        }
    },

    // 显示/隐藏功能按钮 - 微信风格
    toggleFunctionButton(show) {
        if (this.elements.functionButton) {
            if (show) {
                this.elements.functionButton.classList.remove('hide');
                this.elements.functionButton.classList.add('show');
            } else {
                this.elements.functionButton.classList.remove('show');
                this.elements.functionButton.classList.add('hide');
            }
        }
    },

    // 检查输入内容并切换按钮显示 - 动态切换逻辑
    checkInputAndToggleSendButton() {
        const hasContent = this.getInputValue().length > 0;

        // 微信风格：有内容时显示发送按钮，隐藏功能按钮
        // 无内容时显示功能按钮，隐藏发送按钮
        this.toggleSendButton(hasContent);
        this.toggleFunctionButton(!hasContent);

        // 如果有功能按钮组件，也通知它更新状态
        if (window.FunctionButton && typeof window.FunctionButton.updateVisibility === 'function') {
            window.FunctionButton.updateVisibility();
        }
    },
    

    
    // 清空输入框
    clearInput() {
        this.elements.messageText.value = '';
        this.autoResizeTextarea();

        // 清空输入时重新检查按钮状态
        this.checkInputAndToggleSendButton();
    },
    
    // 获取输入内容
    getInputValue() {
        return this.elements.messageText.value.trim();
    },
    
    // 转义HTML（委托给 MessageRenderer）
    escapeHtml(text) {
        return MessageRenderer.escapeHtml(text);
    },
    
    // 显示错误消息 - 弹窗已禁用，避免移动端遮挡输入框
    showError(message) {
        Utils.showNotification(message, 'error');

        // 错误弹窗已禁用，避免遮挡输入框，只在控制台输出
        console.error('UI错误:', message);

        // const errorDiv = document.createElement('div');
        // errorDiv.className = 'error-message';
        // errorDiv.textContent = message;
        // errorDiv.style.cssText = `
        //     position: fixed;
        //     top: 20px;
        //     left: 50%;
        //     transform: translateX(-50%);
        //     background: #ff4757;
        //     color: white;
        //     padding: 10px 20px;
        //     border-radius: 5px;
        //     z-index: 1000;
        //     animation: fadeIn 0.3s ease-out;
        // `;
        //
        // document.body.appendChild(errorDiv);
        //
        // setTimeout(() => {
        //     errorDiv.remove();
        // }, 3000);
    },
    
    // 显示成功消息 - 弹窗已禁用，避免移动端遮挡输入框
    showSuccess(message) {
        Utils.showNotification(message, 'success');

        // 成功弹窗已禁用，避免遮挡输入框，只在控制台输出
        console.log('UI成功:', message);

        // if (message.includes('\n')) {
        //     const successDiv = document.createElement('div');
        //     successDiv.className = 'success-message';
        //     successDiv.innerHTML = message.replace(/\n/g, '<br>');
        //     successDiv.style.cssText = `
        //         position: fixed;
        //         top: 20px;
        //         left: 50%;
        //         transform: translateX(-50%);
        //         background: #07c160;
        //         color: white;
        //         padding: 15px 25px;
        //         border-radius: 8px;
        //         z-index: 1000;
        //         animation: fadeIn 0.3s ease-out;
        //         max-width: 400px;
        //         text-align: center;
        //         box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
        //         font-size: 14px;
        //         line-height: 1.5;
        //     `;
        //
        //     document.body.appendChild(successDiv);
        //
        //     setTimeout(() => {
        //         successDiv.remove();
        //     }, 5000);
        // }
    },

    // 设置连接状态
    setConnectionStatus(status) {
        console.log(`连接状态: ${status}`);

        // 创建或更新连接状态指示器
        let statusElement = document.querySelector('.connection-status');

        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'connection-status';
            document.body.appendChild(statusElement);
        }

        // 更新状态显示
        const isOnline = status === 'connected';
        const isConnecting = status === 'connecting';

        if (isConnecting) {
            statusElement.textContent = '连接中...';
            statusElement.className = 'connection-status connecting';
        } else {
            statusElement.textContent = isOnline ? '已连接' : '离线模式';
            statusElement.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
        }

        // 连接状态通知已禁用，避免移动端弹窗遮挡输入框
        // if (status === 'disconnected' && navigator.onLine) {
        //     Utils.showNotification('连接已断开，正在重连...', 'warning');
        // } else if (!navigator.onLine) {
        //     Utils.showNotification('已切换到离线模式，部分功能可能受限', 'warning');
        // }
    },

    // 显示上传状态
    showUploadStatus(show = true) {
        const uploadStatus = this.elements.uploadStatus;
        if (uploadStatus) {
            uploadStatus.style.display = show ? 'flex' : 'none';
        }
    },

    // 更新上传进度
    updateUploadProgress(percent) {
        const progressBar = document.getElementById('progressBar') || this.elements.progressBar;
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    },

    // 重置上传状态
    resetUploadStatus() {
        this.showUploadStatus(false);
        this.updateUploadProgress(0);
    },

    // 显示键盘快捷键提示
    showKeyboardHint(message, duration = 3000) {
        // 移除现有提示
        const existingHint = document.querySelector('.keyboard-hint');
        if (existingHint) {
            existingHint.remove();
        }

        // 创建新提示
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.textContent = message;
        document.body.appendChild(hint);

        // 显示动画
        setTimeout(() => hint.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => hint.remove(), 300);
        }, duration);
    },

    // 添加消息状态指示器（委托给 MessageRenderer）
    addMessageStatus(messageElement, status) {
        MessageRenderer.addMessageStatus(messageElement, status);
    },

    // 更新消息时间显示格式（委托给 MessageRenderer）
    updateMessageTime(messageElement, timestamp) {
        MessageRenderer.updateMessageTime(messageElement, timestamp);
    },

    // 切换Markdown视图（委托给 MarkdownHandler）
    toggleMarkdownView(messageId) {
        MarkdownHandler.toggleView(messageId);
    },

    // 创建安全的ID（委托给 MessageRenderer）
    createSafeId(str) {
        return MessageRenderer.createSafeId(str);
    },

    // 异步加载图片（委托给 ImageLoader）
    async loadImageAsync(r2Key, safeId) {
        await ImageLoader.load(r2Key, safeId);
    },

    // 重试加载图片（委托给 ImageLoader）
    async retryLoadImage(r2Key, safeId) {
        await ImageLoader.retry(r2Key, safeId);
    },

    // 确保顶部加载指示器存在
    ensureTopLoadingIndicator() {
        const messageContainer = this.elements.messageList;
        let topIndicator = messageContainer.querySelector('.top-loading-indicator');

        if (!topIndicator) {
            topIndicator = document.createElement('div');
            topIndicator.className = 'top-loading-indicator';
            topIndicator.innerHTML = `
                <div class="top-loading-content">
                    <div class="top-loading-spinner">⏳</div>
                    <span class="top-loading-text">加载历史消息中...</span>
                </div>
            `;

            // 插入到消息列表的最前面
            messageContainer.insertBefore(topIndicator, messageContainer.firstChild);

            // 默认隐藏
            topIndicator.style.display = 'none';
        }
    },

    // 显示/隐藏顶部加载指示器
    showTopLoadingIndicator(show) {
        this.ensureTopLoadingIndicator();
        const topIndicator = this.elements.messageList.querySelector('.top-loading-indicator');
        if (topIndicator) {
            if (show) {
                topIndicator.style.display = 'flex';
                // 添加淡入动画
                requestAnimationFrame(() => {
                    topIndicator.classList.add('fade-in');
                });
            } else {
                topIndicator.style.display = 'none';
                topIndicator.classList.remove('fade-in');
            }
        }
    },

    // 获取消息容器
    getMessageContainer() {
        return this.elements.messageList;
    }
};
