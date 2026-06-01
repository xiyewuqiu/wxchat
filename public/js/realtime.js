// 实时通信管理器 - 重构版：修复重复连接、优化轮询

class RealtimeManager {
    constructor() {
        this.eventSource = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000;
        this.deviceId = null;
        this.listeners = new Map();
        this.longPollingActive = false;
        this.longPollingTimeout = null;
        this._destroyed = false;
    }

    // 初始化实时连接
    init(deviceId) {
        this.deviceId = deviceId;
        this._destroyed = false;
        this.connect();
    }

    // 建立SSE连接
    connect() {
        // 防止重复连接：如果已有活跃连接，先断开
        if (this.eventSource) {
            const readyState = this.eventSource.readyState;
            if (readyState === EventSource.OPEN || readyState === EventSource.CONNECTING) {
                this.disconnect();
            }
        }

        // 如果已销毁，不再连接
        if (this._destroyed) return;

        try {
            const token = Auth && Auth.getToken() ? Auth.getToken() : '';
            const url = `/api/events?deviceId=${encodeURIComponent(this.deviceId)}&token=${encodeURIComponent(token)}`;
            this.eventSource = new EventSource(url);

            this.eventSource.addEventListener('connection', (event) => {
                if (this._destroyed) return;
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
                UI.setConnectionStatus('connected');
            });

            this.eventSource.addEventListener('message', (event) => {
                if (this._destroyed) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.newMessages > 0) {
                        this.emit('newMessages', data);
                        MessageHandler.loadMessages(true);
                    }
                } catch (error) {
                    // 静默处理解析错误
                }
            });

            this.eventSource.addEventListener('heartbeat', () => {
                this.emit('heartbeat');
            });

            // 超时重连通知
            this.eventSource.addEventListener('timeout', () => {
                if (this._destroyed) return;
                this.disconnect();
                this.connect();
            });

            this.eventSource.onerror = () => {
                if (this._destroyed) return;
                this.isConnected = false;
                this.emit('disconnected');
                UI.setConnectionStatus('disconnected');
                this.handleReconnect();
            };

        } catch (error) {
            if (!this._destroyed) {
                this.handleReconnect();
            }
        }
    }

    // 断开连接
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.stopLongPolling();
        this.isConnected = false;
        this.emit('disconnected');
    }

    // 处理重连逻辑
    handleReconnect() {
        if (this._destroyed) return;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.fallbackToLongPolling();
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        UI.setConnectionStatus('reconnecting');

        setTimeout(() => {
            if (!this.isConnected && !this._destroyed) {
                this.connect();
            }
        }, delay);
    }

    // 降级到长轮询
    fallbackToLongPolling() {
        this.disconnect();
        this.startLongPolling();
    }

    // 开始长轮询
    startLongPolling() {
        if (this.longPollingActive || this._destroyed) return;
        this.longPollingActive = true;
        this.longPoll();
    }

    // 停止长轮询
    stopLongPolling() {
        this.longPollingActive = false;
        if (this.longPollingTimeout) {
            clearTimeout(this.longPollingTimeout);
            this.longPollingTimeout = null;
        }
    }

    // 长轮询实现 - 重构版
    async longPoll() {
        if (!this.longPollingActive || this._destroyed) return;

        try {
            const lastMessageId = this.getLastMessageId();
            const url = `/api/poll?deviceId=${encodeURIComponent(this.deviceId)}&lastMessageId=${lastMessageId}&timeout=25`;

            const headers = Auth ? Auth.addAuthHeader({}) : {};
            const response = await fetch(url, { headers });
            const data = await response.json();

            if (!this.longPollingActive || this._destroyed) return;

            if (data.success && data.hasNewMessages) {
                this.emit('newMessages', { newMessages: data.newMessageCount });
                MessageHandler.loadMessages(true);
            }

            // 只在首次建立连接时设置状态
            if (!this.isConnected) {
                this.isConnected = true;
                this.emit('connected');
                UI.setConnectionStatus('connected');
            }

        } catch (error) {
            this.isConnected = false;
            this.emit('disconnected');
            UI.setConnectionStatus('disconnected');
        }

        // 继续下一次轮询
        if (this.longPollingActive && !this._destroyed) {
            this.longPollingTimeout = setTimeout(() => {
                this.longPoll();
            }, 1000);
        }
    }

    // 获取最后一条消息ID
    getLastMessageId() {
        const messages = MessageHandler.lastMessages || [];
        if (messages.length > 0) {
            return messages[messages.length - 1].id || '0';
        }
        return '0';
    }

    // 检查连接状态
    isConnectionAlive() {
        if (this._destroyed) return false;
        if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) return true;
        if (this.longPollingActive && this.isConnected) return true;
        return false;
    }

    // 事件监听器
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    }

    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try { callback(data); } catch (error) {
                    console.error(`[Realtime] 事件回调执行失败 [${event}]:`, error);
                }
            });
        }
    }

    getStatus() {
        if (this._destroyed) return 'destroyed';
        if (!this.eventSource) return 'disconnected';
        switch (this.eventSource.readyState) {
            case EventSource.CONNECTING: return 'connecting';
            case EventSource.OPEN: return 'connected';
            case EventSource.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    destroy() {
        this._destroyed = true;
        this.disconnect();
        this.stopLongPolling();
        this.listeners.clear();
        this.deviceId = null;
        this.reconnectAttempts = 0;
    }
}

// 创建全局实例
const Realtime = new RealtimeManager();

// 网络状态监听
window.addEventListener('online', () => {
    if (!Realtime.isConnectionAlive()) {
        Realtime.connect();
    }
});

window.addEventListener('offline', () => {
    UI.setConnectionStatus('offline');
});

// 页面可见性变化监听
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!Realtime.isConnectionAlive()) {
            Realtime.connect();
        }
    }
});

window.Realtime = Realtime;