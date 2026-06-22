// API 接口封装 - 重构版：加 AbortController 超时，改 getMessages 静默失败为透传

const API = {
    // 通用请求方法（支持超时）
    async request(url, options = {}) {
        const { timeout = 15000, ...fetchOptions } = options;

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        const authHeaders = Auth ? Auth.addAuthHeader(defaultHeaders) : defaultHeaders;

        const config = {
            ...fetchOptions,
            headers: {
                ...authHeaders,
                ...(fetchOptions.headers || {}),
            },
        };

        // 支持超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                throw error;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error(`请求超时: ${url}`);
            }

            console.error('[API] 请求失败:', url, error.message);
            throw error;
        }
    },
    
    // GET 请求
    async get(url, params = {}) {
        const urlParams = new URLSearchParams(params);
        const fullUrl = urlParams.toString() ? `${url}?${urlParams}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },
    
    // POST 请求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 按运行时开关附带消息设备信息
    withDeviceInfo(payload, deviceInfo = Utils.getMessageDeviceInfo()) {
        if (deviceInfo) {
            return { ...payload, deviceInfo };
        }
        return payload;
    },
    
    // 文件上传请求
    async upload(url, formData) {
        const authHeaders = Auth ? Auth.addAuthHeader({}) : {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 文件上传60秒超时

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { ...authHeaders },
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('文件上传超时');
            }
            throw error;
        }
    },
    
    // 获取消息列表（修复：不再静默返回空数组，让调用方处理错误）
    async getMessages(limit = CONFIG.UI.MESSAGE_LOAD_LIMIT, offset = 0) {
        const response = await this.get(CONFIG.API.ENDPOINTS.MESSAGES, { limit, offset });

        if (response && response.success) {
            return response.data || [];
        }

        // 不再静默返回空数组，抛出错误让调用方处理
        throw new Error(response?.error || CONFIG.ERRORS.LOAD_MESSAGES_FAILED);
    },
    
    // 发送文本消息
    async sendMessage(content, deviceId, deviceInfo = Utils.getMessageDeviceInfo()) {
        const response = await this.post(
            CONFIG.API.ENDPOINTS.MESSAGES,
            this.withDeviceInfo({ content, deviceId }, deviceInfo)
        );

        if (response.success) {
            return response.data;
        }
        throw new Error(response.error || CONFIG.ERRORS.MESSAGE_SEND_FAILED);
    },

    // 发送AI消息
    async sendAIMessage(content, deviceId = 'ai-system', type = 'ai_response', deviceInfo = null) {
        const response = await this.post(CONFIG.API.ENDPOINTS.AI_MESSAGE || '/api/ai/message', {
            content,
            deviceId,
            type,
            ...(deviceInfo ? { deviceInfo } : {})
        });

        if (response && response.success) {
            return response.data;
        }
        throw new Error(response?.error || 'AI消息发送失败');
    },
    
    // 上传文件
    async uploadFile(file, deviceId, onProgress = null, deviceInfo = Utils.getMessageDeviceInfo()) {
        if (!Utils.validateFileSize(file.size)) {
            throw new Error(CONFIG.ERRORS.FILE_TOO_LARGE);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('deviceId', deviceId);
        if (deviceInfo) {
            formData.append('deviceInfo', JSON.stringify(deviceInfo));
        }

        if (onProgress) {
            return this.uploadWithProgress(CONFIG.API.ENDPOINTS.FILES_UPLOAD, formData, onProgress);
        }

        const response = await this.upload(CONFIG.API.ENDPOINTS.FILES_UPLOAD, formData);

        if (response.success) {
            return response.data;
        }
        throw new Error(response.error || CONFIG.ERRORS.FILE_UPLOAD_FAILED);
    },
    
    // 带进度的文件上传
    uploadWithProgress(url, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            const timeoutId = setTimeout(() => {
                xhr.abort();
                reject(new Error('文件上传超时'));
            }, 60000);

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    onProgress((event.loaded / event.total) * 100);
                }
            });

            xhr.addEventListener('load', () => {
                clearTimeout(timeoutId);
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('响应解析失败'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('网络错误')));
            xhr.addEventListener('abort', () => reject(new Error('上传已取消')));

            xhr.open('POST', url);
            if (Auth && Auth.getToken()) {
                xhr.setRequestHeader('Authorization', `Bearer ${Auth.getToken()}`);
            }
            xhr.send(formData);
        });
    },
    
    // 下载文件
    async downloadFile(r2Key, fileName) {
        try {
            const url = `${CONFIG.API.ENDPOINTS.FILES_DOWNLOAD}/${r2Key}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const headers = Auth ? Auth.addAuthHeader({}) : {};
            const response = await fetch(url, { headers, signal: controller.signal });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('[API] 文件下载失败:', error);
            if (error.name === 'AbortError') {
                console.error('下载超时');
            } else if (error.message.includes('401')) {
                if (typeof Auth !== 'undefined' && Auth.logout) {
                    setTimeout(() => { Auth.logout(); window.location.href = '/login.html'; }, 2000);
                }
            }
            return false;
        }
    },

    // 设备同步
    async syncDevice(deviceId, deviceName) {
        return this.post(CONFIG.API.ENDPOINTS.SYNC, { deviceId, deviceName });
    },

    // 清空所有数据
    async clearAllData(confirmCode) {
        return this.post(CONFIG.API.ENDPOINTS.CLEAR_ALL || '/api/clear-all', { confirmCode });
    },

    // 检查认证状态
    async checkAuthStatus() {
        try {
            const response = await this.get(CONFIG.API.ENDPOINTS.AUTH_VERIFY);
            return response.valid === true;
        } catch (error) {
            console.warn('[API] 认证状态检查失败:', error);
            return false;
        }
    }
};
