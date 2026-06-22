# 消息堆叠、设备配色、多工作区与时区改造计划

## 背景

当前项目是单实例、单共享密码、单消息空间的自部署文件传输助手。数据库核心表是 `messages`、`files`、`devices`，消息已经包含 `device_id`，可选包含 `device_info`。这为消息堆叠、设备区分、时区显示和工作区隔离提供了基础。

本计划覆盖四个目标：

1. 同设备连续消息自动堆叠，视觉上参考 Telegram 的连续气泡策略。
2. 不同设备自动分配稳定消息颜色，便于在同一聊天流里区分来源。
3. 支持多工作区，先满足学习、工作等不同使用场景隔离。
4. 支持读取部署机器时区，并允许实例级或前端选择显示时区。

## 总体判断

建议实施顺序：

1. 消息堆叠与设备配色。
2. 时区配置与显示修正。
3. 多工作区 MVP。
4. 多账号与工作区成员权限。

原因：

- 消息堆叠和设备配色主要是前端渲染层改造，收益明显，风险较低。
- 时区问题会影响消息展示、搜索时间范围和实时判断，应在多工作区前统一口径。
- 多工作区会改数据模型和 API 查询边界，但可以继续沿用当前单密码登录。
- 多账号会触碰认证、权限、邀请、成员关系，应该在工作区模型稳定后再做。

## 阶段一：消息堆叠与设备配色

### 目标

让同一设备在短时间内连续发送的多条消息自动形成一组，减少重复设备名和时间信息。同时给不同设备分配稳定的消息强调色，用户能快速识别消息来源。

### 范围

涉及文件：

- `public/js/ui/messageRenderer.js`
- `public/js/ui.js`
- `public/css/messages.css`
- `public/js/utils.js`
- 可选：`public/js/config.js`

### 规则设计

消息分组规则：

- 相邻消息的 `device_id` 相同。
- 相邻消息时间间隔小于配置窗口，默认 `15 分钟`。
- 中间没有日期分割或系统提示。
- 文件消息和文本消息可以在同一组里，但图片预览、Markdown 按当前逻辑保持独立。

分组状态：

- `single`：独立消息。
- `start`：组内第一条。
- `middle`：组内中间消息。
- `end`：组内最后一条。

展示规则：

- `single` 显示完整气泡圆角、设备名和时间。
- `start` 显示较完整圆角，可显示设备名。
- `middle` 压缩上下间距，隐藏 meta。
- `end` 显示时间和设备名，底部圆角收尾。
- 自己设备仍靠右，其他设备靠左。

设备配色规则：

- 使用 `device_id` 生成稳定 hash，映射到预设色板。
- 同一个 `device_id` 在不同浏览器刷新后颜色不变。
- 当前设备可保留现有主色或使用更轻的本机专属色。
- 其他设备使用低饱和、可读性高的气泡背景色。
- 颜色只用于消息气泡、设备名小点或细边，不改变正文可读性。

推荐色板：

- 以 CSS 变量维护，例如 `--device-color-1-bg`、`--device-color-1-text`。
- 避免只靠颜色表达来源，设备名仍保留在每组最后一条或组首。
- 深色模式单独定义色值，保证对比度。

### 实施步骤

1. 在 `Utils` 中新增 `getDeviceColorIndex(deviceId)`，输出稳定的色板索引。
2. 在消息列表渲染前计算每条消息的分组状态和设备颜色。
3. `MessageRenderer.createMessageElement` 给 DOM 加上：
   - `data-device-id`
   - `data-group-position`
   - `device-color-N`
   - `group-start/group-middle/group-end/group-single`
4. 调整 `messages.css`：
   - 连续气泡圆角。
   - 组内间距。
   - 中间消息隐藏 meta。
   - 设备色 class。
5. 验证文本、Markdown、文件、图片预览、AI 消息都能正常展示。

### 验收标准

- 同设备连续发送 3 条消息时，只有组尾展示时间信息。
- 不同设备交替发送时不会错误合并。
- 间隔超过 15 分钟时自动开启新组。
- 至少 6 个不同设备能获得可区分颜色。
- 移动端窄屏下设备名和时间不重叠。

### 复杂度

预计 `0.5-1.5 天`。

主要风险：

- 当前增量渲染只追加新消息，若只对新元素计算分组，可能无法更新上一条消息从 `single` 到 `start` 的状态。
- 需要在新增消息时同步更新相邻消息的 class。

## 阶段二：时区配置与显示修正

### 目标

服务端默认读取部署机器的时区，前端可使用服务端时区显示消息，也可以允许用户切换显示时区。数据库时间存储保持统一，显示层负责转换。

### 范围

涉及文件：

- `server/env.js`
- `worker/routes/config.js`
- `public/js/config.js`
- `public/js/utils.js`
- `worker/services/messageService.js`
- `worker/routes/search.js`
- `database/schema.sql`
- 部署文档：`SELFHOST.md`

### 设计原则

- 数据库存储统一使用 UTC。
- API 返回时间建议统一为 ISO 8601，例如 `2026-06-22T10:20:30.000Z`。
- 展示层通过 IANA 时区格式化，例如 `Asia/Shanghai`、`America/Los_Angeles`。
- 服务端自部署模式优先读取机器时区。
- Cloudflare Workers 无可靠机器时区概念，应使用环境变量兜底。

### 配置项

新增环境变量：

- `APP_TIMEZONE`：实例默认显示时区，未设置时自部署读取机器时区。
- `ALLOW_CLIENT_TIMEZONE_OVERRIDE`：是否允许前端覆盖显示时区，默认 `true`。

前端本地设置：

- `wxchat.timezone.mode`：`server`、`browser`、`custom`。
- `wxchat.timezone.value`：自定义 IANA 时区。

### 实施步骤

1. 在 `server/env.js` 读取 `APP_TIMEZONE`。
2. 自部署 Node 环境中通过 `Intl.DateTimeFormat().resolvedOptions().timeZone` 获取机器时区。
3. `/api/config` 返回：
   - `serverTimezone`
   - `defaultTimezone`
   - `allowClientTimezoneOverride`
4. 前端 `loadRuntimeConfig` 合并时区配置。
5. `Utils.formatTime(timestamp, options)` 支持指定 `timeZone`。
6. 修正 SQLite `CURRENT_TIMESTAMP` 返回格式的解析歧义，必要时在查询层转换为 ISO UTC。
7. 搜索里的 `today/yesterday/week/month` 改成按配置时区计算边界，而不是直接用 SQLite `date('now')`。

### 验收标准

- 部署机器时区为 `Asia/Shanghai` 时，默认展示北京时间。
- 设置 `APP_TIMEZONE=UTC` 后，刷新页面显示 UTC。
- 浏览器切换为自定义时区后，消息时间按自定义时区展示。
- “今天”“昨天”搜索结果按当前显示时区边界计算。

### 复杂度

预计 `1-2 天`。

主要风险：

- 历史数据中 `timestamp` 是无时区 SQLite 字符串，前端解析可能已有偏差。
- 搜索时间范围要避免和消息展示时区不一致。

## 阶段三：多工作区 MVP

### 目标

让一个自部署服务支持多个隔离空间，例如“学习”“工作”“生活”。每个工作区拥有独立消息、文件、设备视图和搜索结果。此阶段仍可沿用单共享密码。

### 范围

涉及文件：

- `database/schema.sql`
- `worker/services/messageService.js`
- `worker/services/fileService.js`
- `worker/services/deviceService.js`
- `worker/routes/messages.js`
- `worker/routes/files.js`
- `worker/routes/search.js`
- `worker/routes/realtime.js`
- `worker/routes/sync.js`
- `public/js/api.js`
- `public/js/config.js`
- `public/js/app.js`
- `public/index.html`
- 相关 CSS 文件

### 数据模型

新增表：

```sql
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

为现有表新增字段：

```sql
ALTER TABLE messages ADD COLUMN workspace_id TEXT;
ALTER TABLE files ADD COLUMN workspace_id TEXT;
ALTER TABLE devices ADD COLUMN workspace_id TEXT;
```

索引：

```sql
CREATE INDEX idx_messages_workspace_timestamp ON messages(workspace_id, timestamp DESC);
CREATE INDEX idx_files_workspace_created ON files(workspace_id, created_at DESC);
CREATE INDEX idx_devices_workspace_active ON devices(workspace_id, last_active DESC);
```

兼容策略：

- 初始化时创建默认工作区：`default`。
- 历史消息、文件、设备回填到默认工作区。
- `workspace_id` 过渡期可为空，但服务层查询时统一兜底为默认工作区。
- 迁移稳定后再考虑加 `NOT NULL`。

### API 设计

新增接口：

- `GET /api/workspaces`
- `POST /api/workspaces`
- `PATCH /api/workspaces/:id`
- `DELETE /api/workspaces/:id`

现有接口增加工作区上下文：

- 优先读取请求头 `X-Workspace-Id`。
- 其次读取 query `workspaceId`。
- 未传则使用默认工作区。

受影响接口：

- `GET /api/messages`
- `POST /api/messages`
- `POST /api/files/upload`
- `GET /api/search`
- `GET /api/events`
- `GET /api/poll`
- `POST /api/sync`
- `POST /api/sync/clear-all`

### 前端交互

推荐位置：

- 顶部或输入区附近增加工作区切换按钮。
- 移动端使用底部弹层或紧凑菜单。
- 当前页面首屏仍然是聊天，不做营销式首页。

工作区切换行为：

- 切换后清空消息缓存。
- 重新加载当前工作区消息。
- 重连实时事件。
- 文件上传、搜索、清空只作用于当前工作区。
- 当前工作区记录到 localStorage。

### 验收标准

- 可以创建“学习”和“工作”两个工作区。
- 在“学习”发送的消息不会出现在“工作”。
- 搜索只返回当前工作区结果。
- 清空聊天只清空当前工作区。
- 文件下载只能下载当前工作区中存在的文件记录。
- 刷新页面后保持上次选择的工作区。

### 复杂度

预计 `2-4 天`。

主要风险：

- 所有查询都必须带工作区过滤，漏一处就会串数据。
- 文件下载需要校验工作区上下文，否则可能跨工作区访问文件。
- 实时轮询按“最近消息数”判断，需要加工作区条件。

## 阶段四：多账号与成员权限

### 目标

在多工作区基础上增加真正的用户体系，让不同人登录后只能访问自己有权限的工作区。

### 数据模型

新增表：

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspace_members (
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id)
);
```

角色：

- `owner`：管理工作区和成员。
- `admin`：管理内容和设置。
- `member`：读写消息和文件。
- `viewer`：只读。

### 认证改造

当前认证是单密码登录，JWT payload 只有基础访问类型。多账号阶段需要：

- 登录接口接受 `username/password`。
- JWT payload 增加 `userId`、`username`。
- 中间件解析用户身份并加载可访问工作区。
- 所有工作区接口检查成员权限。
- 保留可选兼容模式：`SINGLE_PASSWORD_MODE=true`。

### 验收标准

- 用户 A 只能看到自己加入的工作区。
- 用户 B 无法通过修改 `workspaceId` 访问 A 的工作区。
- owner 可以添加、移除成员。
- viewer 不能发送消息或上传文件。

### 复杂度

预计 `5-10 天`。

主要风险：

- 密码存储和迁移必须谨慎，不能继续明文密码。
- JWT 过期、登出、权限变化后的旧 token 行为需要定义。
- 多账号会显著增加 UI 和测试范围。

## 测试计划

### 单元与服务层测试

- 设备色 hash 稳定性。
- 消息分组边界：同设备、不同设备、超过 15 分钟、跨天。
- 时区格式化：UTC、Asia/Shanghai、America/Los_Angeles。
- 工作区查询过滤：消息、文件、设备、搜索。
- 权限过滤：成员、非成员、只读成员。

### 浏览器验证

- 桌面宽屏。
- 手机窄屏。
- 深色模式。
- 多设备模拟。
- PWA 缓存刷新后配置是否更新。

### 数据迁移验证

- 空数据库初始化。
- 已有数据库升级。
- 历史消息回填默认工作区。
- 回滚策略：保留迁移前数据库备份。

## 里程碑

### M1：消息展示增强

交付：

- 同设备消息堆叠。
- 不同设备自动配色。
- 移动端视觉验证。

预计时间：`0.5-1.5 天`。

### M2：时区可靠化

交付：

- 服务端读取机器时区。
- 环境变量覆盖。
- 前端显示时区设置。
- 搜索时间范围按目标时区计算。

预计时间：`1-2 天`。

### M3：多工作区 MVP

交付：

- 工作区表和迁移。
- 工作区切换 UI。
- 消息、文件、搜索、实时同步按工作区隔离。

预计时间：`2-4 天`。

### M4：多账号

交付：

- 用户表。
- 登录改造。
- 工作区成员权限。
- 管理入口。

预计时间：`5-10 天`。

## 推荐第一批实现清单

第一批建议只做 M1 和 M2：

1. 先实现消息堆叠和设备配色，快速改善多人、多设备聊天可读性。
2. 同步修正时间显示和配置，避免后续工作区搜索继续扩大时区问题。
3. 等 M1、M2 稳定后，再开始 M3 的数据模型改造。

这样可以避免一次性改动认证、数据库、前端状态和实时同步，降低回归风险。
