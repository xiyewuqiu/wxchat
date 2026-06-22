// AI消息处理核心
// 负责AI模式管理、消息处理和与UI的交互

const AIHandler = {
    // AI模式状态
    isAIMode: false,
    
    // 当前AI对话状态
    currentThinkingMessageId: null,
    currentResponseMessageId: null,
    isProcessing: false,
    
    // 初始化AI处理器
    init() {
        // 验证AI配置
        try {
            AIAPI.validateConfig();
        } catch (error) {
            console.error('AIHandler: AI配置验证失败', error);
            return false;
        }
        
        // 绑定事件
        this.bindEvents();
        
        return true;
    },
    
    // 绑定事件
    bindEvents() {
        // 监听消息发送事件，检查是否为AI消息
        document.addEventListener('beforeMessageSend', (event) => {
            const { content } = event.detail;
            if (this.isAIMessage(content)) {
                event.preventDefault();
                this.handleAIMessage(content);
            }
        });
        
        // 监听AI模式切换事件
        document.addEventListener('aiModeToggle', (event) => {
            this.toggleAIMode();
        });
    },
    
    // 检查是否为AI消息
    isAIMessage(content) {
        return this.isAIMode || content.startsWith('🤖') || content.toLowerCase().includes('ai');
    },
    
    // 切换AI模式
    toggleAIMode() {
        this.isAIMode = !this.isAIMode;

        // 更新UI状态
        if (window.UI && typeof UI.updateAIMode === 'function') {
            UI.updateAIMode(this.isAIMode);
        }
        
        // 显示模式切换提示
        const message = this.isAIMode ? CONFIG.SUCCESS.AI_MODE_ENABLED : CONFIG.SUCCESS.AI_MODE_DISABLED;
        if (window.UI && typeof UI.showSuccess === 'function') {
            UI.showSuccess(message);
        }
        
        // 分发自定义事件
        document.dispatchEvent(new CustomEvent('aiModeChanged', {
            detail: { isAIMode: this.isAIMode }
        }));
        
        return this.isAIMode;
    },
    
    // 处理AI消息
    async handleAIMessage(content) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // 清理消息内容（移除AI标识符）
            const cleanContent = this.cleanAIMessage(content);

            // 发送用户消息
            await this.sendUserAIMessage(cleanContent);

            // 创建流式显示的AI响应元素
            const streamingElement = this.createStreamingAIMessage();

            // 调用AI API，流式显示
            const result = await AIAPI.streamChat(cleanContent, {
                onResponse: (chunk, fullResponse) => {
                    this.updateStreamingMessage(streamingElement, fullResponse);
                }
            });

            // 标记流式显示完成
            this.completeStreamingMessage(streamingElement);

            // 等用户看完流式效果
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 移除临时流式元素
            if (streamingElement && streamingElement.parentNode) {
                streamingElement.parentNode.removeChild(streamingElement);
            }

            // 存储最终AI响应到数据库，触发SSE推送
            await this.storeAIResponse(result.response || '抱歉，我无法生成回答。');

        } catch (error) {
            console.error('[AIHandler] AI消息处理失败:', error);
            await this.handleAIError(error);
        } finally {
            this.isProcessing = false;
            this.currentThinkingMessageId = null;
            this.currentResponseMessageId = null;
        }
    },

    // 清理AI消息内容
    cleanAIMessage(content) {
        return content.replace(/^🤖\s*/, '').replace(/\s*🤖\s*$/, '').trim();
    },

    // 发送用户AI消息
    async sendUserAIMessage(content) {
        const deviceId = Utils.getDeviceId();
        await API.sendMessage(content, deviceId);
        if (window.MessageHandler) {
            await MessageHandler.loadMessages(true);
        }
    },

    // 存储AI响应到数据库
    async storeAIResponse(content) {
        try {
            if (window.API && typeof API.sendAIMessage === 'function') {
                const result = await API.sendAIMessage(content, 'ai-system', 'ai_response');
                if (window.MessageHandler) {
                    await MessageHandler.loadMessages(true);
                }
                return result.id;
            } else {
                throw new Error('API.sendAIMessage 方法不可用');
            }
        } catch (error) {
            console.error('[AIHandler] 存储AI响应失败:', error);
            // 降级：直接前端显示
            this.addMessageDirectly({
                id: `response-${Date.now()}`,
                type: 'ai_response',
                content: content,
                device_id: 'ai-system',
                timestamp: new Date().toISOString(),
                isAIResponse: true
            });
        }
    },

    // 创建流式显示的AI消息元素
    createStreamingAIMessage() {

        const messageList = document.getElementById('messageList');
        if (!messageList) {
            console.error('AIHandler: 找不到messageList元素');
            return null;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai fade-in streaming';
        messageDiv.dataset.messageId = `streaming-${Date.now()}`;
        messageDiv.innerHTML = `<div class="message-content" style="background: linear-gradient(135deg, #1e90ff, #4169e1); color: white; padding: 12px; border-radius: 8px; position: relative;"><div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">🤖 AI助手 (实时回复中...)</div><div class="streaming-content" style="min-height: 20px; line-height: 1.5;"><span class="typing-cursor" style="animation: blink 1s infinite;">▋</span></div></div><div class="message-meta"><span>AI助手</span> <span class="message-time">${new Date().toLocaleTimeString()}</span></div>`;

        // 添加打字动画样式
        if (!document.getElementById('streaming-styles')) {
            const style = document.createElement('style');
            style.id = 'streaming-styles';
            style.textContent = `
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                .streaming-content {
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }
                .typing-cursor {
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }

        messageList.appendChild(messageDiv);
        messageList.scrollTop = messageList.scrollHeight;


        return messageDiv;
    },

    // 更新流式消息内容
    updateStreamingMessage(element, content) {
        if (!element) return;

        const contentDiv = element.querySelector('.streaming-content');
        if (contentDiv) {
            // 移除打字光标
            const cursor = contentDiv.querySelector('.typing-cursor');
            if (cursor) cursor.remove();

            // 更新内容
            contentDiv.textContent = content;

            // 重新添加打字光标
            const newCursor = document.createElement('span');
            newCursor.className = 'typing-cursor';
            newCursor.style.animation = 'blink 1s infinite';
            newCursor.textContent = '▋';
            contentDiv.appendChild(newCursor);

            // 滚动到底部
            const messageList = document.getElementById('messageList');
            if (messageList) {
                messageList.scrollTop = messageList.scrollHeight;
            }
        }
    },

    // 完成流式消息
    completeStreamingMessage(element) {
        if (!element) return;

        // 移除打字光标
        const cursor = element.querySelector('.typing-cursor');
        if (cursor) cursor.remove();

        // 更新标题
        const header = element.querySelector('.message-content > div:first-child');
        if (header) {
            header.textContent = '🤖 AI助手 (回复完成)';
            header.style.opacity = '0.6';
        }

        // 添加完成标识
        element.classList.add('completed');
    },

    // 直接添加消息到DOM（备用方案）
    addMessageDirectly(message) {

        const messageList = document.getElementById('messageList');
        if (!messageList) {
            console.error('AIHandler: 找不到messageList元素');
            return null;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai fade-in';
        messageDiv.dataset.messageId = message.id;
        messageDiv.innerHTML = `<div class="message-content" style="background: #1e90ff; color: white; padding: 12px; border-radius: 8px;"><div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">🤖 AI助手</div><div id="ai-msg-${message.id}">${message.content || '正在处理...'}</div></div><div class="message-meta"><span>AI助手</span> <span class="message-time">${new Date().toLocaleTimeString()}</span></div>`;

        messageList.appendChild(messageDiv);
        messageList.scrollTop = messageList.scrollHeight;

        return messageDiv;
    },

    // 处理AI错误
    async handleAIError(error) {
        console.error('[AIHandler] AI错误:', error);
        if (this.currentThinkingMessageId && window.UI && typeof UI.removeMessage === 'function') {
            UI.removeMessage(this.currentThinkingMessageId);
        }

        if (this.currentResponseMessageId && window.UI && typeof UI.removeMessage === 'function') {
            UI.removeMessage(this.currentResponseMessageId);
        }

        if (window.UI && typeof UI.showError === 'function') {
            UI.showError(error.message || 'AI处理失败，请稍后重试');
        }
    },

    // 降级方案：前端显示AI响应
    completeAIResponseFallback(result) {
        // 直接添加AI响应到DOM
        this.addMessageDirectly({
            id: `response-${Date.now()}`,
            type: 'ai_response',
            content: result.response || '抱歉，我无法生成回答。',
            device_id: 'ai-system',
            timestamp: new Date().toISOString(),
            isAIResponse: true
        });
    },

    // 取消当前AI请求
    cancelCurrentRequest() {
        if (this.isProcessing) {
            // 取消API请求
            if (window.AIAPI && typeof AIAPI.cancelCurrentRequest === 'function') {
                AIAPI.cancelCurrentRequest();
            }
            
            // 重置状态
            this.isProcessing = false;
            this.currentThinkingMessageId = null;
            this.currentResponseMessageId = null;
        }
    },
    
    // 获取AI状态
    getStatus() {
        return {
            isAIMode: this.isAIMode,
            isProcessing: this.isProcessing,
            hasThinking: !!this.currentThinkingMessageId,
            hasResponse: !!this.currentResponseMessageId
        };
    }
};

// 导出到全局
window.AIHandler = AIHandler;
