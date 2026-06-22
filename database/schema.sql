-- 微信文件传输助手数据库结构

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('text', 'file')), -- 消息类型：文本或文件
    content TEXT, -- 文本消息内容
    file_id INTEGER, -- 关联的文件ID（如果是文件消息）
    device_id TEXT NOT NULL, -- 发送设备标识
    device_info TEXT, -- 发送设备信息快照（JSON格式，可选）
    status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'failed', 'read')), -- 消息状态
    read_by TEXT DEFAULT '[]', -- 已读设备列表（JSON格式）
    retry_count INTEGER DEFAULT 0, -- 重试次数
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- 文件表
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL, -- 原始文件名
    file_name TEXT NOT NULL, -- 存储在R2中的文件名
    file_size INTEGER NOT NULL, -- 文件大小（字节）
    mime_type TEXT NOT NULL, -- 文件MIME类型
    r2_key TEXT NOT NULL UNIQUE, -- R2存储的key
    upload_device_id TEXT NOT NULL, -- 上传设备标识
    download_count INTEGER DEFAULT 0, -- 下载次数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 设备表
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY, -- 设备唯一标识
    name TEXT, -- 设备名称
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages(device_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_files_r2_key ON files(r2_key);
CREATE INDEX IF NOT EXISTS idx_files_upload_device ON files(upload_device_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_active ON devices(last_active DESC);

-- 插入默认设备（可选）
INSERT OR IGNORE INTO devices (id, name) VALUES 
('web-default', 'Web浏览器'),
('mobile-default', '移动设备');
