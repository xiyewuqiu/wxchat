// 应用配置中心
// 第三方 AI 密钥优先读取环境变量，未配置时回退到默认值，保证开箱即用。

const env = import.meta.env

export const API_ENDPOINTS = {
  MESSAGES: '/api/messages',
  FILES_UPLOAD: '/api/files/upload',
  FILES_DOWNLOAD: '/api/files/download',
  AI_MESSAGE: '/api/ai/message',
  SYNC: '/api/sync',
  CLEAR_ALL: '/api/clear-all',
  EVENTS: '/api/events',
  POLL: '/api/poll',
  HEALTH: '/api/health',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_VERIFY: '/api/auth/verify',
  AUTH_LOGOUT: '/api/auth/logout',
  SEARCH: '/api/search',
  SEARCH_SUGGESTIONS: '/api/search/suggestions',
} as const

export const UI_CONFIG = {
  /** SSE 断线时的轮询刷新间隔 */
  AUTO_REFRESH_INTERVAL: 1000,
  /** 首屏加载消息数量 */
  MESSAGE_LOAD_LIMIT: 50,
  /** 向上加载历史消息的批量大小 */
  LOAD_MORE_BATCH_SIZE: 30,
  /** 距顶部多少像素触发无限滚动 */
  INFINITE_SCROLL_THRESHOLD: 80,
  /** 滚动事件防抖 */
  SCROLL_DEBOUNCE_DELAY: 100,
  /** SSE 最大重连次数，超出后降级为长轮询 */
  MAX_RECONNECT_ATTEMPTS: 3,
} as const

export const DEVICE_CONFIG = {
  ID_PREFIX: 'web-',
  NAME_MOBILE: '移动设备',
  NAME_DESKTOP: 'Web浏览器',
  STORAGE_KEY: 'deviceId',
} as const

export const AUTH_CONFIG = {
  TOKEN_KEY: 'wxchat_auth_token',
  LOGIN_ATTEMPTS_KEY: 'wxchat_login_attempts',
  MAX_ATTEMPTS: 5,
  ATTEMPT_RESET_TIME: 15 * 60 * 1000,
  TOKEN_REFRESH_INTERVAL: 30 * 60 * 1000,
} as const

export const AI_CONFIG = {
  ENABLED: true,
  API_BASE_URL: '/api/ai',
  API_KEY: (env.VITE_AI_API_KEY as string | undefined) || '',
  MODEL: 'deepseek-ai/DeepSeek-R1',
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
} as const

export const IMAGE_GEN_CONFIG = {
  ENABLED: true,
  API_BASE_URL: '/api/ai/image',
  API_KEY: (env.VITE_IMAGE_GEN_API_KEY as string | undefined) || '',
  MODEL: 'Kwai-Kolors/Kolors',
  DEFAULT_SIZE: '1024x1024',
  DEFAULT_STEPS: 20,
  DEFAULT_GUIDANCE: 7.5,
  MAX_PROMPT_LENGTH: 1000,
} as const



export const MESSAGE_TYPES = {
  TEXT: 'text',
  FILE: 'file',
} as const

/** AI 消息前缀：后端 message.type 仅支持 text/file，用前缀标记 AI 内容 */
export const AI_PREFIX = {
  RESPONSE: '[AI] ',
  THINKING: '[AI-THINKING] ',
} as const

export const CLEAR_COMMAND = {
  TRIGGER_COMMANDS: ['/clear-all', '清空数据', '/清空', 'clear all'],
  CONFIRM_CODE: '1234',
  CONFIRM_MESSAGE: '此操作将永久删除所有聊天记录和文件，无法恢复！',
} as const

export const LOGOUT_COMMANDS = ['/logout', '/登出', 'logout', '登出'] as const

export const PWA_COMMANDS = ['/pwa', '/install', '/安装', 'pwa', 'install', '安装'] as const

export const PWA_CONFIG = {
  INSTALL_BENEFITS: ['像原生应用一样使用', '快速启动，无需浏览器', '离线访问缓存内容', '自动更新到最新版本'],
} as const

export const SEARCH_CONFIG = {
  ENABLED: true,
  MAX_RESULTS: 100,
  RESULTS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
  MIN_QUERY_LENGTH: 1,
  HISTORY_LIMIT: 20,
  HISTORY_KEY: 'searchHistory',
  HIGHLIGHT_CLASS: 'search-highlight',
  DEFAULT_FILTERS: {
    type: 'all',
    timeRange: 'all',
    deviceId: 'all',
    fileType: 'all',
  },
} as const

export const ERRORS = {
  NETWORK: '网络连接失败，请检查网络',
  MESSAGE_SEND_FAILED: '消息发送失败',
  LOAD_MESSAGES_FAILED: '加载消息失败',
  DEVICE_SYNC_FAILED: '设备同步失败',
  CLEAR_FAILED: '数据清理失败',
  CLEAR_CANCELLED: '数据清理已取消',
  FILE_UPLOAD_FAILED: '文件上传失败',
  FILE_DOWNLOAD_FAILED: '文件下载失败',
  AI_REQUEST_FAILED: 'AI请求失败，请稍后重试',
  IMAGE_GEN_FAILED: 'AI图片生成失败',
  IMAGE_GEN_PROMPT_EMPTY: '请输入图片描述',
  IMAGE_GEN_PROMPT_TOO_LONG: '图片描述过长，请简化',
  IMAGE_GEN_DOWNLOAD_FAILED: '图片下载失败',
  IMAGE_GEN_UPLOAD_FAILED: '图片保存失败',
  IMAGE_GEN_API_ERROR: 'AI图片生成服务暂时不可用',
  SEARCH_FAILED: '搜索失败，请稍后重试',
  SEARCH_QUERY_TOO_SHORT: '搜索关键词太短',
} as const

export const SUCCESS = {
  MESSAGE_SENT: '消息发送成功',
  FILE_UPLOADED: '文件上传成功',
  DATA_CLEARED: '数据清理成功',
  AI_MODE_ENABLED: 'AI模式已启用',
  AI_MODE_DISABLED: 'AI模式已关闭',
  IMAGE_GEN_SUCCESS: '图片生成完成',
  SEARCH_HISTORY_CLEARED: '搜索历史已清除',
} as const