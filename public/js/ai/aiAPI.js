// AI API 封装
// 前端只调用本服务，真实供应商地址和密钥保留在后端环境变量中。

const AIAPI = {
    // 当前请求的AbortController
    currentController: null,
    
    // 流式聊天 - 核心方法
    async streamChat(message, callbacks = {}) {
        // 取消之前的请求
        if (this.currentController) {
            this.currentController.abort();
        }
        
        this.currentController = new AbortController();
        
        try {
            console.log('AIAPI: 开始AI流式聊天请求', { message });
            
            const headers = typeof Auth !== 'undefined' ? Auth.addAuthHeader({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' };
            const response = await fetch(CONFIG.API.ENDPOINTS.AI_CHAT, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message,
                    model: CONFIG.AI.MODEL,
                    messages: [{ role: 'user', content: message }],
                    stream: true,
                    max_tokens: CONFIG.AI.MAX_TOKENS,
                    temperature: CONFIG.AI.TEMPERATURE
                }),
                signal: this.currentController.signal
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            console.log('AIAPI: API响应成功，开始处理流式数据');
            
            // 处理流式响应
            return await this.processStreamResponse(response, callbacks);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('AIAPI: 请求被取消');
                return { thinking: '', response: '', cancelled: true };
            }
            
            console.error('AIAPI: 请求失败', error);
            throw error;
        } finally {
            this.currentController = null;
        }
    },
    
    // 处理流式响应
    async processStreamResponse(response, callbacks) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let thinking = '';
        let finalResponse = '';
        let buffer = '';
        let isInThinking = false;
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码数据块
                buffer += decoder.decode(value, { stream: true });
                
                // 按行处理
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保留不完整的行
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            console.log('AIAPI: 流式响应完成');
                            continue;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            
                            if (content) {
                                // 检测思考过程标签
                                if (content.includes('<think>')) {
                                    isInThinking = true;
                                    thinking += content;
                                    callbacks.onThinking?.(thinking);
                                } else if (content.includes('</think>')) {
                                    isInThinking = false;
                                    thinking += content;
                                    callbacks.onThinking?.(thinking);
                                    callbacks.onThinkingComplete?.(thinking);
                                } else if (isInThinking) {
                                    // 在思考过程中
                                    thinking += content;
                                    callbacks.onThinking?.(thinking);
                                } else {
                                    // 最终回答
                                    finalResponse += content;
                                    callbacks.onResponse?.(content, finalResponse);
                                }
                            }
                        } catch (parseError) {
                            console.warn('AIAPI: 解析数据失败', parseError, data);
                        }
                    }
                }
            }
            
            console.log('AIAPI: 流式处理完成', { 
                thinkingLength: thinking.length, 
                responseLength: finalResponse.length 
            });
            
            return { 
                thinking: this.cleanThinkingContent(thinking), 
                response: finalResponse.trim() 
            };
            
        } catch (error) {
            console.error('AIAPI: 流式处理错误', error);
            throw error;
        } finally {
            reader.releaseLock();
        }
    },
    
    // 清理思考内容，移除标签
    cleanThinkingContent(thinking) {
        if (!thinking) return '';
        
        return thinking
            .replace(/<think>/g, '')
            .replace(/<\/think>/g, '')
            .trim();
    },
    
    // 取消当前请求
    cancelCurrentRequest() {
        if (this.currentController) {
            console.log('AIAPI: 取消当前AI请求');
            this.currentController.abort();
            this.currentController = null;
        }
    },
    
    // 检查API配置
    validateConfig() {
        if (!CONFIG.AI.ENABLED) {
            throw new Error('AI功能未启用');
        }

        return true;
    },
    
    // 测试API连接
    async testConnection() {
        try {
            this.validateConfig();
            
            const response = await fetch(CONFIG.API.ENDPOINTS.CONFIG, {
                headers: typeof Auth !== 'undefined' ? Auth.addAuthHeader({}) : {}
            });
            const result = await response.json();
            return response.ok && result.success && result.data?.ai?.enabled === true;
        } catch (error) {
            console.error('AIAPI: API连接测试异常', error);
            return false;
        }
    },
    
    // 获取API状态
    getStatus() {
        return {
            enabled: CONFIG.AI.ENABLED,
            hasApiKey: false,
            model: CONFIG.AI.MODEL,
            isRequesting: !!this.currentController
        };
    }
};

// 导出到全局
window.AIAPI = AIAPI;
