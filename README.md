<div align="center">

# 🚀 微信文件传输助手 Web 应用

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-Framework-blue.svg)](https://hono.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**支持 Docker 自部署的现代化微信文件传输助手**
*当前 fork 支持 Node.js + SQLite + local uploads，也保留 Cloudflare Workers 原始部署路径*

[🐳 自部署指南](./SELFHOST.md) | [📖 使用指南](#-使用指南) | [🚀 Cloudflare 部署](#-快速开始) | [🐛 问题反馈](https://github.com/xiyewuqiu/wxchat/issues)

</div>

---

## 🐳 自部署版

这个 fork 的推荐部署形态是 Docker Compose 单容器：

```text
Browser / PWA
  -> OpenResty / HTTPS
  -> 127.0.0.1:18091
  -> Node.js + Hono
  -> SQLite + local uploads
```

快速启动：

```bash
npm install
cp .env.example .env
npm run selfhost:dev
```

Docker Compose：

```bash
cp .env.example .env
docker compose up -d --build
```

Compose 默认只绑定本机端口：

```text
127.0.0.1:18091 -> container:3000
```

详细说明见 [SELFHOST.md](./SELFHOST.md)。

## ✨ 功能特性

<div align="center">

| 🎯 核心功能 | 📱 用户体验 | 🔧 技术特色 |
|------------|------------|------------|
| 💬 **实时聊天** | 🎨 **WeChat风格UI** | ⚡ **边缘计算** |
| 📁 **文件传输** | 📱 **响应式设计** | 🛡️ **企业级安全** |
| 🔐 **访问鉴权** | 🌟 **现代动画** | 🚀 **自动扩容** |
| 🔄 **跨设备同步** | 🎯 **零延迟响应** | 🔥 **零依赖前端** |
| 📝 **Markdown渲染** | 🔒 **隐私保护** | 🛡️ **JWT会话管理** |
| 📱 **PWA支持** | 🚀 **原生应用体验** | 🌐 **离线功能** |

</div>

### 🎯 **核心功能详解**

- 💬 **智能聊天系统**
  - 实时文本消息发送与接收
  - 支持表情符号和特殊字符
  - 消息状态追踪（发送中/已发送/已读）
  - 完整的消息历史记录

- 📁 **强大文件传输**
  - 支持所有文件格式（最大10MB）
  - 拖拽上传 + 剪贴板粘贴
  - 多文件批量上传
  - 智能文件类型识别与图标显示
  - 图片文件自动预览

- 📝 **高级Markdown渲染**
  - 自动识别Markdown语法
  - 支持标题、粗体、斜体、列表、代码块
  - 源码/渲染视图一键切换
  - 实时预览效果

- 🔄 **无缝跨设备同步**
  - 多设备间实时消息同步
  - 文件在所有设备间共享
  - 自动设备识别与管理
  - 离线消息缓存

- 🔐 **访问鉴权系统**
  - 密码保护访问控制
  - JWT会话管理机制
  - 防暴力破解保护
  - 自动登录状态维护
  - WeChat风格登录界面

- 🛠️ **智能数据管理**
  - `/clear-all` 命令快速清理数据
  - 自定义确认码保护
  - 数据库 + 存储双重清理
  - 清理进度实时反馈

- 📱 **PWA原生应用体验**
  - 可安装到桌面/主屏幕
  - 离线访问和缓存功能
  - Service Worker后台同步
  - 原生应用般的启动体验
  - 自动更新和版本管理

## 🏗️ 技术架构

<div align="center">

```mermaid
graph TB
    A[用户设备] --> B[Cloudflare Workers]
    B --> C[Hono 框架]
    C --> D[D1 数据库]
    C --> E[R2 存储]
    B --> F[静态资源服务]

    subgraph "前端技术栈"
        G[原生 HTML]
        H[模块化 CSS]
        I[ES6+ JavaScript]
    end

    subgraph "后端服务"
        J[RESTful API]
        K[SSE 实时通信]
        L[文件上传/下载]
    end

    F --> G
    F --> H
    F --> I
    C --> J
    C --> K
    C --> L
```

</div>

### 🛠️ **技术栈详情**

| 层级 | 技术选型 | 特点优势 |
|------|---------|---------|
| **前端** | 原生 HTML + CSS + JavaScript | 🔥 零依赖、极致性能、模块化设计 |
| **后端** | Hono + Cloudflare Workers | ⚡ 边缘计算、毫秒级响应、自动扩容 |
| **数据库** | Cloudflare D1 (SQLite) | 🛡️ 企业级、ACID事务、全球分布 |
| **存储** | Cloudflare R2 | 📦 对象存储、CDN加速、无限容量 |
| **部署** | Cloudflare 生态 | 🌍 全球部署、HTTPS、自动备份 |

## 📦 项目结构

<details>
<summary>🗂️ 点击展开完整项目结构</summary>

```
📁 wxchat/
├── 📄 README.md              # 📖 项目说明文档
├── 📄 package.json           # 📦 项目配置和依赖
├── 📄 wrangler.toml          # ⚙️ Cloudflare Workers 配置
├── 📄 LICENSE                # 📜 开源许可证 (CC BY-NC-SA 4.0)
├── 📄 build.js               # 🔨 构建脚本
│
├── 📁 public/                # 🎨 前端静态资源
│   ├── 📄 index.html         # 🏠 主页面入口
│   ├── 📄 login.html         # 🔐 登录页面
│   ├── 📄 manifest.json      # 📱 PWA应用清单
│   ├── 📄 sw.js              # ⚙️ Service Worker
│   │
│   ├── 📁 css/               # 🎨 样式文件系统
│   │   ├── 📄 reset.css      # 🔄 CSS重置 + 字体优化
│   │   ├── 📄 main.css       # 🎯 主布局 + 动画效果
│   │   ├── 📄 components.css # 🧩 组件样式 + WeChat风格
│   │   ├── 📄 responsive.css # 📱 响应式设计 + 移动优化
│   │   └── 📄 auth.css       # 🔐 登录页面样式
│   │
│   ├── 📁 js/                # ⚡ JavaScript模块系统
│   │   ├── 📄 config.js      # ⚙️ 应用配置中心
│   │   ├── 📄 utils.js       # 🛠️ 工具函数库
│   │   ├── 📄 auth.js        # 🔐 身份验证模块
│   │   ├── 📄 api.js         # 🌐 API接口封装
│   │   ├── 📄 ui.js          # 🎨 UI操作管理
│   │   ├── 📄 fileUpload.js  # 📁 文件上传处理
│   │   ├── 📄 messageHandler.js # 💬 消息处理逻辑
│   │   ├── 📄 realtime.js    # 🔄 实时通信管理
│   │   ├── 📄 pwa.js         # 📱 PWA功能管理
│   │   └── 📄 app.js         # 🚀 应用主入口
│   │
│   └── 📁 icons/             # 📱 PWA应用图标
│       ├── 📄 icon.svg       # 🎨 源图标文件
│       ├── 📄 icon-*.png     # 📱 各尺寸PNG图标
│       └── 📄 README.md      # 📖 图标生成指南
│
├── 📁 worker/                # 🔧 后端服务
│   └── 📄 index.js           # 🌐 Hono服务器 + RESTful API
│
└── 📁 database/              # 🗄️ 数据库相关
    └── 📄 schema.sql         # 📋 数据库结构定义
```

</details>

### 🏗️ 架构设计

```mermaid
graph LR
    subgraph "🎨 前端层"
        A[HTML5 结构] --> B[CSS3 样式]
        B --> C[ES6+ 逻辑]
    end

    subgraph "🌐 网络层"
        D[RESTful API]
        E[WebSocket 连接]
    end

    subgraph "⚡ 服务层"
        F[Hono 路由]
        G[业务逻辑]
        H[文件处理]
    end

    subgraph "💾 数据层"
        I[D1 数据库]
        J[R2 存储]
    end

    C --> D
    D --> F
    F --> I
    F --> J
```

### 🎯 **设计理念**

<div align="center">

| 🏗️ 架构原则 | 🎨 设计哲学 | 🚀 性能策略 |
|------------|------------|------------|
| **模块化分离** | **WeChat风格** | **边缘计算** |
| 职责单一，松耦合 | 像素级界面还原 | 全球节点部署 |
| **响应式优先** | **现代动画** | **零依赖前端** |
| 移动端优先设计 | 流畅过渡效果 | 原生性能优化 |
| **安全可靠** | **用户体验** | **实时同步** |
| 企业级安全标准 | 直观操作逻辑 | SSE+轮询双保障 |

</div>

### 🌟 **核心优势对比**

<div align="center">

| 对比维度 | 传统方案 | 🚀 wxchat | 提升效果 |
|---------|---------|-----------|---------|
| **🚀 部署复杂度** | 需要服务器运维配置 | 一键部署到全球边缘 | **10倍简化** |
| **⚡ 响应速度** | 单点服务器延迟 | 全球边缘节点加速 | **5倍提升** |
| **📈 扩容能力** | 手动扩容限制 | 自动无限弹性扩容 | **无限扩展** |
| **💰 运维成本** | 高昂服务器费用 | 按需付费模式 | **90%节省** |
| **🛡️ 可用性** | 99.9% SLA | 99.99% 企业级 | **10倍可靠** |
| **🎨 用户体验** | 传统Web界面 | WeChat级别UI | **专业级** |

</div>

## 🚀 快速开始

### 📋 前置要求

- ✅ **Cloudflare 账户** - [免费注册](https://dash.cloudflare.com/sign-up)
- ✅ **Node.js 18+** - [下载安装](https://nodejs.org/)
- ✅ **Git** - [下载安装](https://git-scm.com/)

### ⚡ 一键部署

```bash
# 1️⃣ 克隆项目
git clone https://github.com/xiyewuqiu/wxchat.git
cd wxchat

# 2️⃣ 安装依赖
npm install

# 3️⃣ 登录 Cloudflare
npx wrangler login

# 4️⃣ 创建 D1 数据库
npx wrangler d1 create wxchat

# 5️⃣ 创建 R2 存储桶
npx wrangler r2 bucket create wxchat

# 6️⃣ 初始化数据库（二选一）
# 方法1：命令行初始化
npx wrangler d1 execute wxchat --file=./database/schema.sql

# 方法2：控制台初始化（推荐）
# 见下方"数据库初始化"部分

# 7️⃣ 配置访问密码（重要！）
# 见下方"密码配置"部分

# 8️⃣ 部署应用
npm run deploy
```

### 🔐 密码配置

**重要：** 应用包含访问鉴权功能，需要配置密码才能正常使用。

📖 **详细配置指南**: [PASSWORD_CONFIG.md](./PASSWORD_CONFIG.md)

**快速配置**：
1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **wxchat** → **设置** → **变量和机密**
3. 添加环境变量：
   ```bash
   ACCESS_PASSWORD = "你的密码"
   JWT_SECRET = "32位以上随机字符串"
   ```
4. 保存后即可使用！

### 🗄️ 数据库初始化

如果遇到 HTTP 500 错误，通常是数据库未正确初始化导致的。请使用以下方法之一初始化数据库：

<details>
<summary><strong>📋 方法1：Cloudflare D1 控制台初始化（推荐）</strong></summary>

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1 SQL Database**
3. 选择你的 `wxchat` 数据库
4. 点击 **控制台** 标签页
5. 将以下完整SQL代码复制粘贴到查询框中并执行：

```sql
-- 微信文件传输助手数据库完整初始化脚本
-- 直接在Cloudflare D1控制台执行

-- 删除已存在的表（如果需要重新初始化）
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS devices;

-- 创建消息表
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('text', 'file')),
    content TEXT,
    file_id INTEGER,
    device_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- 创建文件表
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    upload_device_id TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建设备表
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_device_id ON messages(device_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_files_r2_key ON files(r2_key);
CREATE INDEX idx_files_upload_device ON files(upload_device_id);
CREATE INDEX idx_devices_last_active ON devices(last_active DESC);

-- 插入默认设备
INSERT INTO devices (id, name) VALUES
('web-default', 'Web浏览器'),
('mobile-default', '移动设备');

-- 验证表创建成功
SELECT 'Tables created successfully!' as status;
SELECT name FROM sqlite_master WHERE type='table';
```

执行成功后，你应该看到：
- ✅ `Tables created successfully!` 成功消息
- ✅ 显示所有创建的表名列表：`devices`, `files`, `messages`

</details>

<details>
<summary><strong>💻 方法2：命令行初始化</strong></summary>

在项目根目录执行：

```bash
npx wrangler d1 execute wxchat --file=./database/schema.sql
```

</details>

<details>
<summary><strong>🔍 验证数据库状态</strong></summary>

初始化完成后，可以通过以下方式验证：

1. **控制台验证**：在D1控制台执行
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

2. **健康检查API**：访问你的应用URL + `/api/health`
```
https://your-app.workers.dev/api/health
```

3. **检查表结构**：
```sql
.schema messages
.schema files
.schema devices
```

</details>

### 🎯 配置说明

在 `wrangler.toml` 中配置你的资源：

```toml
name = "wxchat"
main = "worker/index.js"
compatibility_date = "2025-06-17"

# D1 数据库配置
[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "b58dde57-d777-459f-a6b3-ae4de9c16368"  # 实际数据库ID

# R2 存储桶配置
[[r2_buckets]]
binding = "R2"
bucket_name = "wxchat"
```

## 📱 使用指南

### 🎮 基础功能

<div align="center">

| 功能 | 操作方式 | 说明 |
|------|---------|------|
| 💬 **发送消息** | 输入框输入 → 点击发送 | 支持文本和表情符号 |
| 📝 **Markdown渲染** | 输入Markdown语法 → 自动渲染 | 支持标题、粗体、列表、代码等 |
| 🔄 **视图切换** | 点击消息右下角📝按钮 | 在渲染视图和源码视图间切换 |
| 📁 **上传文件** | 点击📁按钮 或 拖拽文件 | 最大10MB，支持所有格式 |
| ⬇️ **下载文件** | 点击文件消息中的下载按钮 | 保持原始文件名 |
| 🔄 **跨设备同步** | 不同设备访问相同URL | 自动同步所有消息和文件 |

</div>

### 🎯 高级功能

#### 📝 Markdown渲染功能

支持自动识别和渲染Markdown语法，让消息更加丰富和美观：

**支持的语法**：
```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文字** 和 *斜体文字*

- 无序列表项1
- 无序列表项2

1. 有序列表项1
2. 有序列表项2

> 引用文字

`行内代码`

```代码块
console.log('Hello World');
```

[链接文字](https://example.com)

---
分割线
```

**使用方式**：
1. 📝 **自动检测** - 输入包含Markdown语法的消息时自动渲染
2. 🔄 **视图切换** - 点击消息右下角的📝按钮切换源码/渲染视图
3. 🎨 **样式优化** - 渲染后的内容保持微信风格的美观设计

#### 🧹 数据清理功能

当存储空间不足时，可以使用数据清理功能：

```
1️⃣ 发送清理指令：
   /clear-all
   清空数据
   /清空
   clear all

2️⃣ 确认操作：
   点击确认对话框的"确定"

3️⃣ 输入确认码：
   输入：1234

4️⃣ 查看清理结果：
   ✅ 数据清理完成！
   📊 清理统计：
   • 删除消息：XX 条
   • 删除文件：XX 个
   • 释放空间：XX MB
```

#### 🔒 登出功能

使用文本指令方式登出，保持界面简洁：

```
1️⃣ 发送登出指令：
   /logout
   /登出
   logout
   登出

2️⃣ 确认操作：
   点击确认对话框的"确定"

3️⃣ 自动跳转：
   清除登录状态并跳转到登录页面
```

#### 📱 PWA安装功能

使用文本指令快速检查和安装PWA应用：

```
1️⃣ 发送安装指令：
   /pwa
   /install
   /安装
   pwa
   install
   安装

2️⃣ 系统检查：
   • 检测PWA支持状态
   • 显示当前安装状态
   • 提供安装指导

3️⃣ 安装体验：
   • 已安装：显示当前状态
   • 可安装：弹出确认对话框
   • 不可安装：显示手动安装指南
```

#### 📱 PWA原生应用体验

**🚀 安装到桌面**：
- **移动端**: 浏览器提示"添加到主屏幕"，一键安装
- **桌面端**: Chrome/Edge地址栏显示安装图标，点击安装
- **独立运行**: 安装后像原生应用一样运行，无浏览器地址栏

**🌐 离线功能**：
- **离线访问**: 没有网络时也能打开应用查看缓存内容
- **智能缓存**: 自动缓存重要资源和最近的聊天记录
- **后台同步**: 网络恢复后自动同步新消息和文件

**🔄 自动更新**：
- **版本检测**: 自动检测应用更新，顶部显示更新提示
- **一键更新**: 点击更新按钮即可升级到最新版本
- **无缝体验**: 更新过程不影响正常使用

**📊 状态指示**：
- **连接状态**: 右上角实时显示在线/离线状态
- **安装提示**: 智能显示PWA安装建议
- **更新通知**: 新版本可用时及时提醒

#### 📱 微信移动端体验

- **动态发送按钮** - 输入时出现圆形绿色按钮
- **平滑动画** - 微信级别的过渡效果
- **触摸优化** - 移动端友好的交互设计
- **响应式布局** - 完美适配各种屏幕尺寸

### 🔧 快捷操作

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Enter` | 发送消息 | 在输入框中按回车发送 |
| `Shift + Enter` | 换行 | 在消息中添加换行符 |
| `Ctrl + V` | 粘贴文件 | 从剪贴板粘贴图片文件 |
| 拖拽 | 上传文件 | 拖拽文件到聊天区域上传 |

### 📱 PWA功能详解

#### 🔧 开发者调试

在浏览器控制台中可以使用以下命令调试PWA功能：

```javascript
// 检查PWA状态
PWA.getStatus()

// 获取缓存信息
PWA.getCacheInfo()

// 清理所有缓存
PWA.clearCache()

// 手动触发安装提示
PWA.promptInstall()

// 检查Service Worker状态
navigator.serviceWorker.ready.then(registration => {
    console.log('Service Worker状态:', registration);
});
```

#### 📖 详细文档

更多PWA功能说明请参考：[📱 PWA功能使用指南](./docs/PWA_GUIDE.md)

## 🔧 API 接口文档

### 📡 RESTful API

<details>
<summary>📋 点击查看完整API文档</summary>

#### 💬 消息相关

```http
GET /api/messages
```
**功能**: 获取消息列表
**参数**:
- `limit` (可选): 限制返回数量，默认50
- `offset` (可选): 偏移量，默认0

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "text",
      "content": "Hello World",
      "device_id": "web-123456",
      "timestamp": "2025-06-17T00:00:00Z"
    }
  ]
}
```

---

```http
POST /api/messages
```
**功能**: 发送文本消息
**请求体**:
```json
{
  "content": "消息内容",
  "deviceId": "设备ID"
}
```

#### 📁 文件相关

```http
POST /api/files/upload
```
**功能**: 上传文件
**请求**: `multipart/form-data`
- `file`: 文件数据
- `deviceId`: 设备ID

```http
GET /api/files/download/:r2Key
```
**功能**: 下载文件
**参数**: `r2Key` - R2存储键

#### 🔄 设备同步

```http
POST /api/sync
```
**功能**: 设备同步
**请求体**:
```json
{
  "deviceId": "设备ID",
  "deviceName": "设备名称"
}
```

#### 🧹 数据清理

```http
POST /api/clear-all
```
**功能**: 清空所有数据
**请求体**:
```json
{
  "confirmCode": "1234"
}
```

</details>

### 🗄️ 数据库设计

<details>
<summary>📊 点击查看数据库结构</summary>

#### 📋 表结构

```sql
-- 消息表
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('text', 'file')),
    content TEXT,
    file_id INTEGER,
    device_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- 文件表
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    upload_device_id TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 设备表
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 🔗 关系图

```mermaid
erDiagram
    MESSAGES ||--o{ FILES : contains
    MESSAGES }o--|| DEVICES : sent_by
    FILES }o--|| DEVICES : uploaded_by

    MESSAGES {
        int id PK
        string type
        string content
        int file_id FK
        string device_id FK
        datetime timestamp
    }

    FILES {
        int id PK
        string original_name
        string file_name
        int file_size
        string mime_type
        string r2_key
        string upload_device_id FK
        int download_count
        datetime created_at
    }

    DEVICES {
        string id PK
        string name
        datetime last_active
        datetime created_at
    }
```

</details>

## 🚀 部署指南

### 🌍 生产环境部署

<details>
<summary>🔧 详细部署步骤</summary>

#### 1️⃣ GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### 2️⃣ 环境变量配置

在 GitHub Secrets 中添加：
- `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌

#### 3️⃣ 域名配置

```bash
# 绑定自定义域名
npx wrangler route add "your-domain.com/*" wxchat
```

</details>

### 📊 性能监控

<details>
<summary>📈 监控和分析</summary>

#### Cloudflare Analytics

- **请求量监控**: 实时查看API调用量
- **错误率追踪**: 监控应用健康状态
- **性能分析**: 响应时间和延迟统计

#### 存储使用情况

```bash
# 查看 D1 数据库使用情况
npx wrangler d1 info wxchat

# 查看 R2 存储使用情况
npx wrangler r2 bucket info wxchat
```

</details>

## 💡 设计理念

<div align="center">

### 🎯 核心原则

| 原则 | 说明 | 实现 |
|------|------|------|
| **🚀 性能优先** | 极致的加载速度和响应性能 | 边缘计算 + CDN加速 |
| **📱 移动优先** | 完美的移动端用户体验 | 响应式设计 + 触摸优化 |
| **🛡️ 安全可靠** | 数据安全和隐私保护 | 多重验证 + 安全传输 |
| **🎨 美观易用** | 直观的界面和流畅的交互 | 微信级UI + 平滑动画 |
| **⚡ 零配置** | 开箱即用的部署体验 | 一键部署 + 自动配置 |

</div>

### 🌟 技术亮点

- **🔥 零依赖前端** - 纯原生技术栈，极致性能
- **⚡ 边缘计算** - 全球部署，毫秒级响应
- **📱 微信级UI** - 像素级还原微信界面
- **🛡️ 企业级安全** - 多重验证，数据保护
- **🚀 自动扩容** - 无服务器架构，按需付费

## 🤝 贡献指南

### 🔧 开发环境

```bash
# 克隆项目
git clone https://github.com/xiyewuqiu/wxchat.git
cd wxchat

# 安装依赖
npm install

# 本地开发
npm run dev

# 代码检查
npm run lint

# 构建项目
npm run build
```

### 📝 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 🔧 故障排除

<details>
<summary><strong>❌ HTTP 500 错误 - 数据库未初始化</strong></summary>

**症状**: 访问应用时出现 `HTTP 500: Internal Server Error`

**原因**: 数据库表未创建或初始化失败

**解决方案**:
1. 检查数据库状态：访问 `https://your-app.workers.dev/api/health`
2. 如果显示表不存在，请按照上方"数据库初始化"部分重新初始化
3. 确认 `wrangler.toml` 中的数据库ID正确

</details>

<details>
<summary><strong>🔗 数据库连接失败</strong></summary>

**症状**: API返回 `数据库配置错误：DB绑定未找到`

**原因**: D1数据库绑定配置错误

**解决方案**:
1. 检查 `wrangler.toml` 中的数据库配置：
```toml
[[d1_databases]]
binding = "DB"
database_name = "wxchat"
database_id = "your-database-id"
```
2. 确认数据库ID与实际创建的数据库匹配
3. 重新部署应用：`npm run deploy`

</details>

<details>
<summary><strong>📁 文件上传失败</strong></summary>

**症状**: 文件上传时出现错误

**原因**: R2存储桶配置问题或权限不足

**解决方案**:
1. 检查 `wrangler.toml` 中的R2配置：
```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "wxchat"
```
2. 确认R2存储桶已创建：`npx wrangler r2 bucket list`
3. 检查文件大小是否超过限制（默认10MB）

</details>

<details>
<summary><strong>🌐 CORS 跨域问题</strong></summary>

**症状**: 浏览器控制台显示CORS错误

**原因**: 跨域请求被阻止

**解决方案**:
1. 确认应用已正确部署到Cloudflare Workers
2. 检查是否使用了正确的域名访问
3. 清除浏览器缓存并重试

</details>

<details>
<summary><strong>📱 移动端显示异常</strong></summary>

**症状**: 移动设备上界面显示不正常

**原因**: 缓存或兼容性问题

**解决方案**:
1. 清除浏览器缓存
2. 尝试使用无痕模式访问
3. 确认使用现代浏览器（Chrome、Safari、Firefox等）

</details>

### 🐛 问题反馈

遇到问题？请通过以下方式反馈：

- 🐛 [提交 Issue](https://github.com/xiyewuqiu/wxchat/issues)
- 💬 [讨论区](https://github.com/xiyewuqiu/wxchat/discussions)
- 📧 邮件联系: xiyewuqiu@gmail.com

**反馈时请提供**:
- 🌐 访问的URL
- 📱 使用的设备和浏览器
- 🔍 具体的错误信息
- 📋 重现步骤

## 🌟 技术亮点

<div align="center">

### 🔥 **前沿技术栈**

| 技术特色 | 实现方案 | 优势效果 |
|---------|---------|---------|
| **🚀 边缘计算** | Cloudflare Workers | 全球毫秒级响应 |
| **🛡️ 企业级安全** | D1 + R2 + HTTPS | 数据安全保障 |
| **📱 WeChat级UI** | 原生CSS + 精致动画 | 专业用户体验 |
| **⚡ 零依赖前端** | 纯JavaScript ES6+ | 极致性能优化 |
| **🔄 实时同步** | SSE + 长轮询 | 消息即时送达 |

</div>

### 🎯 **核心创新点**

- **🧩 模块化架构**: 前端采用ES6模块化设计，职责分离，易于维护
- **📱 移动优先**: 响应式设计，完美适配各种设备尺寸
- **🎨 WeChat风格**: 像素级还原微信界面，用户零学习成本
- **⚡ 性能优化**: 边缘计算 + CDN加速，全球用户体验一致
- **🛡️ 安全可靠**: 企业级安全标准，数据加密传输存储
- **🔄 实时通信**: 双重保障机制，确保消息实时性

## 🤝 贡献指南

### 🔧 开发环境

<details>
<summary>💻 点击展开开发环境配置</summary>

```bash
# 1️⃣ 克隆项目
git clone https://github.com/xiyewuqiu/wxchat.git
cd wxchat

# 2️⃣ 安装依赖
npm install

# 3️⃣ 配置环境
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml 配置你的资源ID

# 4️⃣ 本地开发
npm run dev

# 5️⃣ 代码检查
npm run lint

# 6️⃣ 构建项目
npm run build

# 7️⃣ 部署测试
npm run deploy
```

</details>

### 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 🎯 贡献方式

1. **🍴 Fork 项目** - 点击右上角 Fork 按钮
2. **🌿 创建分支** - `git checkout -b feature/amazing-feature`
3. **💻 编写代码** - 遵循项目代码规范
4. **✅ 测试验证** - 确保功能正常工作
5. **📝 提交更改** - `git commit -m 'feat: add amazing feature'`
6. **🚀 推送分支** - `git push origin feature/amazing-feature`
7. **🔄 创建 PR** - 提交 Pull Request

### 🎨 代码规范

- **JavaScript**: 使用 ES6+ 语法，遵循 ESLint 规范
- **CSS**: 使用 BEM 命名规范，保持样式模块化
- **HTML**: 语义化标签，保持结构清晰
- **注释**: 关键逻辑必须添加注释说明

## 📄 开源许可证

<div align="center">

### 📜 **CC BY-NC-SA 4.0 International License**

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![GitHub](https://img.shields.io/badge/GitHub-xiyewuqiu%2Fwxchat-blue.svg)](https://github.com/xiyewuqiu/wxchat)

**Copyright (c) 2025 xiyewuqiu**

本项目采用 [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证。

</div>

### 🚫 **严格禁止商业用途**

<div align="center">

| ✅ **允许的使用** | ❌ **禁止的使用** |
|-----------------|-----------------|
| 🎓 个人学习和研究 | 💰 商业销售或盈利 |
| 🔬 学术研究项目 | 🏢 企业商业部署 |
| 🎨 非营利性修改 | 💼 商业服务提供 |
| 📚 教育教学用途 | 🛒 付费产品集成 |
| 🌍 开源项目集成 | 📈 商业推广使用 |

</div>

### 📋 **使用条件详解**

1. **🏷️ 署名要求**
   - 必须保留原作者信息和版权声明
   - 提供指向原项目和许可证的链接
   - 标明是否对原作品进行了修改

2. **🚫 非商业性使用**
   - 不得将本作品用于任何商业目的
   - 不得通过本作品获取经济利益
   - 企业内部使用也需要特别授权

3. **🔄 相同方式共享**
   - 基于本作品的衍生作品必须使用相同许可证
   - 修改后的作品必须开源并保持免费
   - 不得对衍生作品施加额外限制

### 💼 **商业授权**

如需商业使用，请联系作者获取商业许可证：
- 📧 邮箱: [xiyewuqiu@gmail.com](mailto:xiyewuqiu@gmail.com)
- 💬 GitHub: [@xiyewuqiu](https://github.com/xiyewuqiu)

---

<div align="center">

### 🌟 **支持项目**

如果这个项目对你有帮助，请考虑：

[![Star](https://img.shields.io/github/stars/xiyewuqiu/wxchat?style=social)](https://github.com/xiyewuqiu/wxchat/stargazers)
[![Fork](https://img.shields.io/github/forks/xiyewuqiu/wxchat?style=social)](https://github.com/xiyewuqiu/wxchat/network/members)
[![Watch](https://img.shields.io/github/watchers/xiyewuqiu/wxchat?style=social)](https://github.com/xiyewuqiu/wxchat/watchers)

**⭐ 给项目点个 Star** | **🍴 Fork 并贡献代码** | **👀 Watch 获取更新**

---

<p>
  <strong>Made with ❤️ by <a href="https://github.com/xiyewuqiu">xiyewuqiu</a></strong><br>
  <em>基于 Cloudflare Workers 的现代化微信文件传输助手</em>
</p>

<p>
  <a href="#-微信文件传输助手-web-应用">🔝 回到顶部</a>
</p>

</div>
