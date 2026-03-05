// 工具函数库

const Utils = {
    // 生成设备ID
    generateDeviceId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${CONFIG.DEVICE.ID_PREFIX}${timestamp}-${random}`;
    },
    
    // 获取或创建设备ID
    getDeviceId() {
        let deviceId = localStorage.getItem(CONFIG.DEVICE.STORAGE_KEY);
        if (!deviceId) {
            deviceId = this.generateDeviceId();
            localStorage.setItem(CONFIG.DEVICE.STORAGE_KEY, deviceId);
        }
        return deviceId;
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // 如果是今天
        if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // 如果是昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.getDate() === yesterday.getDate()) {
            return '昨天 ' + date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // 其他日期
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 获取文件图标 - 支持MIME类型和文件扩展名
    getFileIcon(mimeType, fileName = null) {
        // 优先使用MIME类型检测
        if (mimeType) {
            // 检查具体的MIME类型
            if (CONFIG.FILE_ICONS[mimeType]) {
                return CONFIG.FILE_ICONS[mimeType];
            }

            // 检查MIME类型前缀
            for (const [prefix, icon] of Object.entries(CONFIG.FILE_ICONS)) {
                if (prefix !== 'default' && mimeType.startsWith(prefix)) {
                    return icon;
                }
            }
        }

        // 如果MIME类型检测失败，使用文件扩展名
        if (fileName) {
            const extension = this.getFileExtension(fileName);
            if (extension && CONFIG.FILE_EXTENSION_ICONS[extension]) {
                return CONFIG.FILE_EXTENSION_ICONS[extension];
            }
        }

        return CONFIG.FILE_ICONS.default;
    },

    // 获取文件扩展名
    getFileExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') return null;
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot === -1 || lastDot === fileName.length - 1) return null;
        return fileName.substring(lastDot + 1).toLowerCase();
    },

    // 通过文件名获取图标（用于文件选择前的预览）
    getFileIconByName(fileName) {
        return this.getFileIcon(null, fileName);
    },

    // 获取文件类型的友好名称
    getFileTypeName(mimeType, fileName) {
        if (mimeType) {
            if (mimeType.startsWith('image/')) return '图片';
            if (mimeType.startsWith('video/')) return '视频';
            if (mimeType.startsWith('audio/')) return '音频';
            if (mimeType.includes('pdf')) return 'PDF文档';
            if (mimeType.includes('word') || mimeType.includes('document')) return 'Word文档';
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel表格';
            if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint演示';
            if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '压缩文件';
            if (mimeType.startsWith('text/')) return '文本文件';
        }

        if (fileName) {
            const ext = this.getFileExtension(fileName);
            if (ext) {
                const extMap = {
                    'jpg': '图片', 'jpeg': '图片', 'png': '图片', 'gif': '动图', 'bmp': '图片', 'svg': '矢量图', 'webp': '图片',
                    'mp4': '视频', 'avi': '视频', 'mov': '视频', 'wmv': '视频', 'mkv': '视频', 'flv': '视频',
                    'mp3': '音频', 'wav': '音频', 'aac': '音频', 'flac': '音频', 'ogg': '音频',
                    'pdf': 'PDF文档', 'doc': 'Word文档', 'docx': 'Word文档',
                    'xls': 'Excel表格', 'xlsx': 'Excel表格',
                    'ppt': 'PowerPoint演示', 'pptx': 'PowerPoint演示',
                    'zip': '压缩文件', 'rar': '压缩文件', '7z': '压缩文件', 'tar': '压缩文件',
                    'txt': '文本文件', 'md': 'Markdown文档', 'html': 'HTML文档', 'css': 'CSS样式', 'js': 'JavaScript代码',
                    'py': 'Python代码', 'java': 'Java代码', 'cpp': 'C++代码', 'c': 'C代码'
                };
                return extMap[ext] || '文件';
            }
        }

        return '文件';
    },

    // 批量获取文件信息（用于拖拽预览）
    getFilesInfo(files) {
        const filesArray = Array.from(files);
        const info = {
            count: filesArray.length,
            icons: [],
            types: new Set(),
            totalSize: 0
        };

        filesArray.forEach(file => {
            info.icons.push(this.getFileIcon(file.type, file.name));
            info.types.add(this.getFileTypeName(file.type, file.name));
            info.totalSize += file.size;
        });

        return info;
    },
    
    // 检查是否为图片文件
    isImageFile(mimeType) {
        return mimeType && mimeType.startsWith('image/');
    },
    
    // 检查文件大小
    validateFileSize(size) {
        return size <= CONFIG.FILE.MAX_SIZE;
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 安全的JSON解析
    safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn('JSON解析失败:', e);
            return defaultValue;
        }
    },
    
    // 复制文本到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('复制到剪贴板失败:', err);
            return false;
        }
    },
    
    // 检测设备类型
    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return CONFIG.DEVICE.NAME_MOBILE;
        }
        return CONFIG.DEVICE.NAME_DESKTOP;
    },

    // 检测是否为iOS设备
    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },

    // 检测是否为iOS Safari
    isIOSSafari() {
        const userAgent = navigator.userAgent;
        const isIOS = this.isIOSDevice();
        const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
        return isIOS && isSafari;
    },

    // 获取iOS版本
    getIOSVersion() {
        if (!this.isIOSDevice()) return null;

        const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            return {
                major: parseInt(match[1], 10),
                minor: parseInt(match[2], 10),
                patch: parseInt(match[3] || '0', 10)
            };
        }
        return null;
    },
    
    // 创建元素
    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    },
    
    // 显示轻量级 toast 通知（顶部弹出，不遮挡输入框）
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        // 移除已有的 toast
        const existing = document.querySelector('.toast-notification');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 触发动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自动消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, type === 'error' ? 3000 : 2000);
    },
    
    // 请求通知权限
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    },

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Markdown相关工具函数
    markdown: {
        // 检测文本是否包含markdown语法
        hasMarkdownSyntax(text) {
            if (!text || typeof text !== 'string') return false;

            const markdownPatterns = [
                /^#{1,6}\s+/m,           // 标题 # ## ###
                /\*\*[^*]+\*\*/,         // 粗体 **text**
                /\*[^*]+\*/,             // 斜体 *text*
                /^[-*+]\s+/m,            // 列表 - item
                /^>\s+/m,                // 引用 > text
                /```[\s\S]*?```/,        // 代码块 ```code```
                /`[^`]+`/,               // 行内代码 `code`
                /\[([^\]]+)\]\(([^)]+)\)/, // 链接 [text](url)
                /^---+$/m,               // 分割线 ---
                /^\d+\.\s+/m             // 有序列表 1. item
            ];

            return markdownPatterns.some(pattern => pattern.test(text));
        },

        // 渲染markdown为HTML
        renderToHtml(text) {
            if (!window.marked) {
                console.warn('Marked.js 未加载，返回原始文本');
                return Utils.escapeHtml(text);
            }

            try {
                // 配置marked选项
                marked.setOptions({
                    breaks: true,        // 支持换行
                    gfm: true,          // GitHub风格markdown
                    sanitize: false,    // 不过度清理HTML
                    smartLists: true,   // 智能列表
                    smartypants: false  // 不转换引号
                });

                return marked.parse(text);
            } catch (error) {
                console.error('Markdown渲染失败:', error);
                return Utils.escapeHtml(text);
            }
        }
    }
};

// 冻结工具对象
Object.freeze(Utils);
