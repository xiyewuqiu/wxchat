// 应用配置文件

const CONFIG = {
    // API 配置
    API: {
        BASE_URL: '',  // 使用相对路径
        ENDPOINTS: {
            MESSAGES: '/api/messages',
            FILES_UPLOAD: '/api/files/upload',
            FILES_DOWNLOAD: '/api/files/download',
            SYNC: '/api/sync',
            CLEAR_ALL: '/api/clear-all',
            // 鉴权相关接口
            AUTH_LOGIN: '/api/auth/login',
            AUTH_VERIFY: '/api/auth/verify',
            AUTH_LOGOUT: '/api/auth/logout',
            // 搜索相关接口
            SEARCH: '/api/search',
            SEARCH_SUGGESTIONS: '/api/search/suggestions'
        }
    },
    
    // 文件上传配置
    FILE: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: '*', // 允许所有类型
        CHUNK_SIZE: 1024 * 1024 // 1MB chunks (如果需要分片上传)
    },
    
    // UI 配置
    UI: {
        AUTO_REFRESH_INTERVAL: 1000, // 1秒自动刷新（更快响应）
        MESSAGE_LOAD_LIMIT: 50, // 每次加载消息数量
        ANIMATION_DURATION: 100, // 动画持续时间(ms)（更快动画）
        TYPING_INDICATOR_DELAY: 1000, // 输入指示器延迟
        LOAD_MORE_BATCH_SIZE: 30, // 每次无限滚动加载的消息数量
        INFINITE_SCROLL_THRESHOLD: 80, // 距离顶部多少px时触发无限滚动
        SCROLL_DEBOUNCE_DELAY: 100 // 滚动事件防抖延迟(ms)
    },
    
    // 设备配置
    DEVICE: {
        ID_PREFIX: 'web-',
        NAME_MOBILE: '移动设备',
        NAME_DESKTOP: 'Web浏览器',
        STORAGE_KEY: 'deviceId'
    },
    
    // 消息类型
    MESSAGE_TYPES: {
        TEXT: 'text',
        FILE: 'file',
        AI_THINKING: 'ai_thinking',
        AI_RESPONSE: 'ai_response'
    },

    // AI 配置
    AI: {
        ENABLED: true,
        API_BASE_URL: 'https://api.siliconflow.cn/v1',
        API_KEY: process.env.AI_API_KEY, // Use environment variable for API key
        MODEL: 'deepseek-ai/DeepSeek-R1',
        MAX_TOKENS: 4000,
        TEMPERATURE: 0.7,
        STREAM: true,
        THINKING_INDICATOR: '🤔 AI正在思考...',
        RESPONSE_INDICATOR: '🤖 AI助手',
        MODE_INDICATOR: '🤖 AI模式'
    },

    // AI图片生成配置
    IMAGE_GEN: {
        ENABLED: true,
        API_KEY: process.env.IMAGE_GEN_API_KEY, // Use environment variable for API key
        MODEL: 'Kwai-Kolors/Kolors',
        DEFAULT_SIZE: '1024x1024',
        DEFAULT_STEPS: 20,
        DEFAULT_GUIDANCE: 7.5,
        MAX_PROMPT_LENGTH: 1000,
        GENERATING_INDICATOR: '🎨 AI正在生成图片...',
        UPLOADING_INDICATOR: '📤 正在保存图片...',
        SUCCESS_INDICATOR: '✅ 图片生成完成'
    },
    
    // 文件类型图标映射 - 完整版
    FILE_ICONS: {
        // 图片文件
        'image/': '🖼️',
        'image/jpeg': '🖼️',
        'image/jpg': '🖼️',
        'image/png': '🖼️',
        'image/gif': '🎞️',
        'image/bmp': '🖼️',
        'image/svg+xml': '🎨',
        'image/webp': '🖼️',
        'image/tiff': '🖼️',
        'image/ico': '🖼️',

        // 视频文件
        'video/': '🎥',
        'video/mp4': '🎥',
        'video/avi': '🎥',
        'video/mov': '🎥',
        'video/wmv': '🎥',
        'video/mkv': '🎥',
        'video/flv': '🎥',
        'video/webm': '🎥',
        'video/m4v': '🎥',

        // 音频文件
        'audio/': '🎵',
        'audio/mp3': '🎵',
        'audio/wav': '🎵',
        'audio/aac': '🎵',
        'audio/flac': '🎵',
        'audio/ogg': '🎵',
        'audio/m4a': '🎵',
        'audio/wma': '🎵',

        // 文档文件
        'application/pdf': '📕',
        'application/msword': '📘',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
        'application/vnd.ms-excel': '📗',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
        'application/vnd.ms-powerpoint': '📙',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📙',
        'application/rtf': '📄',

        // 压缩文件
        'application/zip': '📦',
        'application/x-rar-compressed': '📦',
        'application/x-7z-compressed': '📦',
        'application/x-tar': '📦',
        'application/gzip': '📦',
        'application/x-bzip2': '📦',

        // 文本文件
        'text/': '📄',
        'text/plain': '📄',
        'text/html': '🌐',
        'text/css': '🎨',
        'text/javascript': '⚡',
        'text/xml': '📋',
        'text/csv': '📊',
        'text/markdown': '📝',

        // 代码文件
        'application/javascript': '⚡',
        'application/json': '📋',
        'application/xml': '📋',

        // 其他常见格式
        'application/octet-stream': '📄',
        'application/x-executable': '⚙️',
        'application/x-msi': '💿',
        'application/x-deb': '📦',
        'application/x-rpm': '📦',

        // 默认图标
        'default': '📄'
    },

    // 文件扩展名图标映射 - 用于无MIME类型时的备用检测
    FILE_EXTENSION_ICONS: {
        // 图片
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🎞️', 'bmp': '🖼️',
        'svg': '🎨', 'webp': '🖼️', 'tiff': '🖼️', 'tif': '🖼️', 'ico': '🖼️',

        // 视频
        'mp4': '🎥', 'avi': '🎥', 'mov': '🎥', 'wmv': '🎥', 'mkv': '🎥',
        'flv': '🎥', 'webm': '🎥', 'm4v': '🎥', 'mpg': '🎥', 'mpeg': '🎥',

        // 音频
        'mp3': '🎵', 'wav': '🎵', 'aac': '🎵', 'flac': '🎵', 'ogg': '🎵',
        'm4a': '🎵', 'wma': '🎵', 'opus': '🎵',

        // 文档
        'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗', 'xlsx': '📗',
        'ppt': '📙', 'pptx': '📙', 'rtf': '📄', 'odt': '📘', 'ods': '📗', 'odp': '📙',

        // 压缩
        'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
        'bz2': '📦', 'xz': '📦', 'dmg': '💿', 'iso': '💿',

        // 文本和代码
        'txt': '📄', 'md': '📝', 'html': '🌐', 'htm': '🌐', 'css': '🎨',
        'js': '⚡', 'ts': '⚡', 'jsx': '⚡', 'tsx': '⚡', 'json': '📋',
        'xml': '📋', 'csv': '📊', 'sql': '🗃️',

        // 编程语言
        'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'h': '⚙️',
        'php': '🐘', 'rb': '💎', 'go': '🐹', 'rs': '🦀', 'swift': '🦉',
        'kt': '🎯', 'scala': '📐', 'r': '📊', 'matlab': '📊', 'm': '📊',

        // 配置文件
        'ini': '⚙️', 'cfg': '⚙️', 'conf': '⚙️', 'yaml': '⚙️', 'yml': '⚙️',
        'toml': '⚙️', 'env': '⚙️',

        // 可执行文件
        'exe': '⚙️', 'msi': '💿', 'deb': '📦', 'rpm': '📦', 'dmg': '💿',
        'app': '📱', 'apk': '📱',

        // 字体文件
        'ttf': '🔤', 'otf': '🔤', 'woff': '🔤', 'woff2': '🔤', 'eot': '🔤',

        // 其他
        'log': '📜', 'bak': '💾', 'tmp': '🗂️', 'cache': '🗂️'
    },
    
    // 清理功能配置
    CLEAR: {
        TRIGGER_COMMANDS: ['/clear-all', '清空数据', '/清空', 'clear all'],
        CONFIRM_CODE: '1234',
        CONFIRM_MESSAGE: '⚠️ 此操作将永久删除所有聊天记录和文件，无法恢复！\n\n请输入确认码：1234'
    },

    // PWA功能配置
    PWA: {
        TRIGGER_COMMANDS: ['/pwa', '/install', '/安装', 'pwa', 'install', '安装'],
        INSTALL_BENEFITS: [
            '像原生应用一样使用',
            '快速启动，无需浏览器',
            '离线访问缓存内容',
            '自动更新到最新版本'
        ]
    },

    // 错误消息
    ERRORS: {
        NETWORK: '网络连接失败，请检查网络',
        FILE_TOO_LARGE: '文件大小不能超过10MB',
        FILE_UPLOAD_FAILED: '文件上传失败',
        MESSAGE_SEND_FAILED: '消息发送失败',
        LOAD_MESSAGES_FAILED: '加载消息失败',
        DEVICE_SYNC_FAILED: '设备同步失败',
        CLEAR_FAILED: '数据清理失败',
        CLEAR_CANCELLED: '数据清理已取消',
        AI_REQUEST_FAILED: 'AI请求失败，请稍后重试',
        AI_STREAM_ERROR: 'AI流式响应中断',
        AI_PARSE_ERROR: 'AI响应解析失败',
        IMAGE_GEN_FAILED: 'AI图片生成失败',
        IMAGE_GEN_PROMPT_EMPTY: '请输入图片描述',
        IMAGE_GEN_PROMPT_TOO_LONG: '图片描述过长，请简化',
        IMAGE_GEN_DOWNLOAD_FAILED: '图片下载失败',
        IMAGE_GEN_UPLOAD_FAILED: '图片保存失败',
        IMAGE_GEN_API_ERROR: 'AI图片生成服务暂时不可用',
        IMAGE_GEN_QUOTA_EXCEEDED: '图片生成次数已达上限',
        SEARCH_FAILED: '搜索失败，请稍后重试',
        SEARCH_QUERY_TOO_SHORT: '搜索关键词太短',
        SEARCH_NO_RESULTS: '没有找到匹配的结果',
        SEARCH_SERVER_ERROR: '搜索服务暂时不可用'
    },
    
    // 成功消息
    SUCCESS: {
        FILE_UPLOADED: '文件上传成功',
        MESSAGE_SENT: '消息发送成功',
        DEVICE_SYNCED: '设备同步成功',
        DATA_CLEARED: '数据清理成功',
        AI_MODE_ENABLED: 'AI模式已启用',
        AI_MODE_DISABLED: 'AI模式已关闭',
        IMAGE_GEN_SUCCESS: '图片生成成功',
        IMAGE_GEN_SAVED: '图片已保存到聊天记录',
        SEARCH_COMPLETED: '搜索完成',
        SEARCH_HISTORY_CLEARED: '搜索历史已清除'
    },

    // 搜索功能配置
    SEARCH: {
        ENABLED: true,
        MAX_RESULTS: 100,
        RESULTS_PER_PAGE: 20,
        DEBOUNCE_DELAY: 300,
        MIN_QUERY_LENGTH: 1,
        HIGHLIGHT_CLASS: 'search-highlight',
        HISTORY_LIMIT: 20,
        DEFAULT_FILTERS: {
            type: 'all',
            timeRange: 'all',
            deviceId: 'all'
        },
        FILE_TYPE_CATEGORIES: {
            'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp'],
            'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv', 'video/flv', 'video/webm'],
            'audio': ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/m4a'],
            'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            'archive': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar'],
            'text': ['text/plain', 'text/html', 'text/css', 'text/javascript', 'text/markdown'],
            'code': ['application/javascript', 'application/json', 'application/xml']
        }
    },
};

// 冻结配置对象，防止意外修改
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.API.ENDPOINTS);
Object.freeze(CONFIG.FILE);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.DEVICE);
Object.freeze(CONFIG.MESSAGE_TYPES);
Object.freeze(CONFIG.AI);
Object.freeze(CONFIG.IMAGE_GEN);
Object.freeze(CONFIG.FILE_ICONS);
Object.freeze(CONFIG.FILE_EXTENSION_ICONS);
Object.freeze(CONFIG.CLEAR);
Object.freeze(CONFIG.PWA);
Object.freeze(CONFIG.ERRORS);
Object.freeze(CONFIG.SUCCESS);
Object.freeze(CONFIG.SEARCH);
