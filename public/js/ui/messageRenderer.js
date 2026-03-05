// 消息渲染模块
// 负责消息的DOM创建和渲染逻辑

const MessageRenderer = {
    // 创建消息DOM元素
    createMessageElement(message, currentDeviceId) {
        const isOwn = message.device_id === currentDeviceId;
        const time = Utils.formatTime(message.timestamp);
        const deviceName = isOwn ? '我的设备' : '其他设备';

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        messageDiv.dataset.messageId = message.id;
        messageDiv.dataset.timestamp = message.timestamp;

        if (message.type === CONFIG.MESSAGE_TYPES.TEXT) {
            messageDiv.innerHTML = this.renderTextMessageContent(message, deviceName, time);
        } else if (message.type === CONFIG.MESSAGE_TYPES.FILE) {
            messageDiv.innerHTML = this.renderFileMessageContent(message, deviceName, time);
        }

        return messageDiv;
    },

    // 渲染文本消息内容
    renderTextMessageContent(message, deviceName, time) {
        const hasMarkdown = Utils.markdown.hasMarkdownSyntax(message.content);
        const messageId = `msg-${message.id}`;

        // 默认显示渲染后的内容（如果有markdown语法）
        const displayContent = hasMarkdown
            ? Utils.markdown.renderToHtml(message.content)
            : this.escapeHtml(message.content);

        const textMessageClass = hasMarkdown ? 'text-message markdown-rendered' : 'text-message';
        const toggleButton = hasMarkdown
            ? `<button class="markdown-toggle" onclick="MarkdownHandler.toggleView('${messageId}')" title="切换源码/渲染视图">📝</button>`
            : '';

        return `<div class="message-content"><div class="${textMessageClass}" id="${messageId}" data-original="${this.escapeHtml(message.content)}" data-rendered="${displayContent.replace(/"/g, '&quot;')}" data-is-rendered="${hasMarkdown ? 'true' : 'false'}">${displayContent}${toggleButton}</div></div><div class="message-meta"><span>${deviceName}</span> <span class="message-time">${time}</span></div>`;
    },

    // 渲染文件消息内容
    renderFileMessageContent(message, deviceName, time) {
        const fileIcon = Utils.getFileIcon(message.mime_type, message.original_name);
        const fileSize = Utils.formatFileSize(message.file_size);
        const isImage = Utils.isImageFile(message.mime_type);

        let imagePreview = '';
        if (isImage) {
            const safeId = this.createSafeId(message.r2_key);
            const imageId = `img-${safeId}`;
            imagePreview = `<div class="image-preview" id="preview-${safeId}"><div class="image-loading" id="loading-${safeId}"><div class="loading-spinner">⏳</div><span>加载图片中...</span></div><img id="${imageId}" alt="${this.escapeHtml(message.original_name)}" style="display: none;" /><div class="image-error" id="error-${safeId}" style="display: none;"><span>🖼️ 图片加载失败</span><button onclick="ImageLoader.retry('${message.r2_key}', '${safeId}')" class="retry-btn">重试</button></div></div>`;
            message._needsImageLoad = { r2Key: message.r2_key, safeId: safeId };
        }

        return `<div class="message-content"><div class="file-message"><div class="file-info"><div class="file-icon">${fileIcon}</div><div class="file-details"><div class="file-name">${this.escapeHtml(message.original_name)}</div><div class="file-size">${fileSize}</div></div><button class="download-btn" onclick="API.downloadFile('${message.r2_key}', '${this.escapeHtml(message.original_name)}')">⬇️ 下载</button></div>${imagePreview}</div></div><div class="message-meta"><span>${deviceName}</span> <span class="message-time">${time}</span></div>`;
    },

    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 创建安全的ID（移除特殊字符）
    createSafeId(str) {
        return str.replace(/[^a-zA-Z0-9-_]/g, '');
    },

    // 更新消息时间显示格式
    updateMessageTime(messageElement, timestamp) {
        const timeElement = messageElement.querySelector('.message-meta span:last-child');
        if (timeElement) {
            timeElement.innerHTML = `<span class="message-time">${Utils.formatTime(timestamp)}</span>`;
        }
    },

    // 添加消息状态指示器
    addMessageStatus(messageElement, status) {
        const metaElement = messageElement.querySelector('.message-meta');
        if (metaElement) {
            const statusSpan = document.createElement('span');
            statusSpan.className = `message-status status-${status}`;

            switch (status) {
                case 'sending':
                    statusSpan.textContent = '⏳';
                    break;
                case 'sent':
                    statusSpan.textContent = '✓';
                    break;
                case 'failed':
                    statusSpan.textContent = '✗';
                    break;
            }

            metaElement.appendChild(statusSpan);
        }
    }
};
