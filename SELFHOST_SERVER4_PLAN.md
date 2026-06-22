# WXChat Server 4 Self-Hosted Plan

记录日期：2026-06-22

目标：把最新 `xiyewuqiu/wxchat` 从 Cloudflare Workers / D1 / R2 形态改成可在 Server 4（腾讯云上海 `110.42.235.46`）上长期运行的自部署版本。

## 当前判断

推荐路线：基于最新 WXChat 做自部署 fork，而不是长期依赖 `DEKVIW/docker-wxchat`。

原因：

- `xiyewuqiu/wxchat` 更新更活跃。最近确认的 upstream commit 是 `0705942`，提交时间为 `2026-06-01T21:37:27+08:00`，内容是组件 MD3 化。
- 最新 WXChat 后端已经拆成 `routes`、`services`、`middleware`，代码结构比 Docker 分叉版更适合继续维护。
- `DEKVIW/docker-wxchat` 更容易直接 Docker 部署，但最近确认的最新提交是 `2025-11-21T13:25:44+08:00`，且后端主要集中在单个 Express `server.js`，后续追上上游会更别扭。
- Server 4 已经有成熟的 Docker + loopback backend + OpenResty HTTPS 反代模式，适合承载一个干净的 WXChat 自部署版本。

## Server 4 实际环境

服务器：

- 主机：Server 4 / 腾讯云上海
- IP：`110.42.235.46`
- SSH：`ubuntu@110.42.235.46`
- 管理方式：日常用 `sudo -n`，root 直连 SSH 已禁用

最近只读检查结果：

- Docker 正在运行并设为开机启动。
- OpenResty 通过 1Panel 容器运行，容器名形如 `1Panel-openresty-A5Qg`。
- Mihomo 正在运行。
- CPU 很闲，健康检查约 `4.7%`。
- 内存约 `3719 MB`，已用约 `1692 MB`，约 `45.5%`。
- 根盘 `40G`，已用约 `20G`，可用约 `18G`。

已有公开入口：

| 端口 | 用途 |
|---|---|
| `18443` | OpenResty -> OpenClaw |
| `18444` | OpenResty -> SillyTavern |
| `18445` | OpenResty -> SyncClipboard |
| `18446` | OpenResty -> Gitea |
| `18447` | OpenResty -> SnappyMail |
| `8080` | sub2api，直接 Docker publish |
| `20470` | 1Panel |

可用于 WXChat 的空闲规划：

| 层级 | 推荐值 |
|---|---|
| 公网 HTTPS 入口 | `https://110.42.235.46:18448/` |
| OpenResty listen | `18448 ssl` |
| 后端 loopback | `127.0.0.1:18091` |
| 容器内端口 | `3000` |
| 项目目录 | `/opt/wxchat` |
| 数据库 | `/opt/wxchat/data/wxchat.db` |
| 上传目录 | `/opt/wxchat/uploads` |

已确认 `18448`、`18091`、`18092`、`3010`、`3011` 当前空闲。

当前 IP HTTPS 证书：

- 证书文件：`/opt/1panel/apps/openresty/openresty/conf/ssl/gitea-ip.crt`
- 私钥文件：`/opt/1panel/apps/openresty/openresty/conf/ssl/gitea-ip.key`
- SAN：`IP Address:110.42.235.46`
- 最近检查到期：`2026-06-25 21:47:16 GMT`

部署前需要确认 Certbot 续期和 OpenResty reload hook 仍健康。

## 目标架构

```text
browser / mobile PWA
  -> https://110.42.235.46:18448/
  -> 1Panel OpenResty
  -> 127.0.0.1:18091
  -> wxchat container
  -> Node.js + Hono
  -> SQLite + local uploads
```

与 Cloudflare 原版的替换关系：

| Cloudflare 原版 | Server 4 自部署版 |
|---|---|
| Workers runtime | Node.js 容器，建议 Hono Node adapter |
| D1 | SQLite |
| R2 | 本地文件目录，后续可选 S3 / MinIO |
| Workers assets / KV asset handler | Node 静态文件服务 |
| Wrangler vars | `.env` / Docker Compose env |
| 前端直连 AI API | 后端代理，密钥只留服务端 |

## 代码改造清单

### 1. 新增 Node 自部署入口

新增一个自部署入口，例如：

```text
server/
  index.js
  env.js
  static.js
```

建议使用：

- `@hono/node-server` 跑 Hono。
- `serve-static` 或 Hono 静态中间件提供 `public/`。
- 保持现有 `/api/*` 路由结构，减少前端改动。

要替换掉 Cloudflare-only 逻辑：

- `worker/index.js` 里的 `getAssetFromKV`
- `c.env.DB`
- `c.env.R2`
- `c.executionCtx.waitUntil`

### 2. 做 SQLite 数据库适配

现有 `database/schema.sql` 基本是 SQLite 语法，可以继续复用。

建议新增数据库适配层，把现有 D1 风格封装成 Node 可用 API：

```text
worker/services/database-node.js
```

推荐库：

- 首选：`better-sqlite3`，简单稳定，适合个人服务。
- 备选：`sqlite` + `sqlite3`，异步风格更接近现在代码。

需要适配的常见调用：

```js
DB.prepare(sql).bind(...params).all()
DB.prepare(sql).bind(...params).first()
DB.prepare(sql).bind(...params).run()
```

目标是让 `MessageService`、`FileService`、`DeviceService` 的业务代码尽量少变。

### 3. 做本地文件存储适配

现有 `FileService` 是 R2 抽象：

- `uploadToR2`
- `getFromR2`
- `deleteFromR2`
- `generateR2Key`

自部署版改成：

- 上传写到 `/app/uploads/<r2_key>`
- 下载从 `/app/uploads/<r2_key>` 读 stream
- 删除本地文件
- 数据库字段 `r2_key` 继续保留，作为本地对象 key

这样前端 `/api/files/download/:r2Key` 不需要大改。

### 4. 处理认证与环境变量

保留现有 JWT 登录模式，但把所有配置放到 `.env`：

```env
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://110.42.235.46:18448
DATABASE_PATH=/app/data/wxchat.db
UPLOAD_DIR=/app/uploads
ACCESS_PASSWORD=change-me
JWT_SECRET=change-me-long-random
SESSION_EXPIRE_HOURS=24
MAX_FILE_SIZE_MB=100
```

需要注意：

- 不要在启动日志里打印访问密码或 JWT secret。
- `ACCESS_PASSWORD` 和 `JWT_SECRET` 必须生产部署前生成强值。
- 后端应支持 `X-Forwarded-Proto` 和 `X-Forwarded-Port`，避免生成错误 URL。

### 5. 把 AI 密钥移到后端

最新 WXChat 前端仍有直接调用 SiliconFlow API 的痕迹，且 `public/js/config.js` 中有 API key 设计。这对自部署不合适。

改造目标：

- 前端只调用本服务：
  - `/api/ai/chat`
  - `/api/ai/image`
  - `/api/config`
- AI API key 只放在容器环境变量。
- `/api/config` 只返回非敏感配置，例如模型名、开关、默认参数。

建议环境变量：

```env
AI_ENABLED=false
IMAGE_GEN_ENABLED=false
AI_CHAT_BASE_URL=https://api.example.com/v1/chat/completions
AI_CHAT_API_KEY=
AI_CHAT_MODEL=gpt-4o-mini
AI_IMAGE_BASE_URL=https://api.example.com/v1/images/generations
AI_IMAGE_API_KEY=
AI_IMAGE_MODEL=example-model
AI_RATE_LIMIT=10
IMAGE_RATE_LIMIT=5
```

如果暂时不用 AI，第一版可以只保留开关和空实现，避免前端报错。

### 6. 补 Docker 部署文件

建议新增：

```text
Dockerfile
docker-compose.yml
.env.example
.dockerignore
```

Server 4 目标部署结构：

```text
/opt/wxchat/
  docker-compose.yml
  .env
  data/
    wxchat.db
  uploads/
  app/
```

compose 端口只绑定 loopback：

```yaml
services:
  wxchat:
    build: .
    container_name: wxchat
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "127.0.0.1:18091:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
```

不要直接公开 `3000` 或 `18091`。

### 7. 加 OpenResty 反代

新增：

```text
/opt/1panel/www/conf.d/wxchat.conf
```

建议配置要点：

- `listen 18448 ssl;`
- `server_name 110.42.235.46;`
- 使用现有 IP 证书 `gitea-ip.crt` / `gitea-ip.key`
- `client_max_body_size 100m;`
- Host allowlist 参考 SyncClipboard / SnappyMail
- `/api/events` 关闭 buffering，设置长 timeout
- 普通 location 代理到 `http://127.0.0.1:18091`

部署后验证：

```bash
sudo docker exec 1Panel-openresty-A5Qg sh -lc 'openresty -t'
sudo docker exec 1Panel-openresty-A5Qg sh -lc 'openresty -s reload'
curl -k -I https://110.42.235.46:18448/
```

还需要确认腾讯云安全组放行 `18448/TCP`。

### 8. 加备份

最低备份范围：

```text
/opt/wxchat/data/wxchat.db
/opt/wxchat/uploads
/opt/wxchat/.env
/opt/wxchat/docker-compose.yml
```

建议策略：

- SQLite 备份用 `sqlite3 .backup` 或停容器后打包。
- `uploads` 可能增长很快，按需设置保留天数。
- 初期可以本机 `/opt/wxchat/backups` 保留 7 到 14 天。
- 如果进入日常使用，再考虑同步到香港服务器或本地 Mac。

## 实施阶段

### 阶段 1：本地改造验证

目标：在 Mac 本地跑起来，不碰 Server 4。

任务：

- 新增 Node/Hono 自部署入口。
- SQLite adapter 跑通 `database/schema.sql`。
- 本地文件存储跑通上传/下载。
- 登录、发文本、上传文件、下载文件、搜索、清空数据跑通。
- 清掉前端硬编码 AI key。
- 如果启用 AI，改为后端代理。

验收：

```bash
npm install
npm run selfhost:dev
curl -i http://127.0.0.1:3000/login.html
```

浏览器手测：

- 登录
- 文本消息
- 文件上传
- 文件下载
- 图片预览
- 搜索
- 清空
- PWA 基础加载

### 阶段 2：Docker 化

目标：本地 Docker Compose 可跑。

任务：

- 写 Dockerfile。
- 写 `docker-compose.yml`。
- 写 `.env.example`。
- 初始化数据库。
- 加健康检查。

验收：

```bash
docker compose up -d --build
curl -i http://127.0.0.1:3000/login.html
docker compose logs --tail 100
```

### 阶段 3：Server 4 部署

目标：部署到 `/opt/wxchat`，只绑定 loopback。

任务：

- 上传或 git clone 到 `/opt/wxchat/app`。
- 写 `/opt/wxchat/.env`。
- 创建 `/opt/wxchat/data` 和 `/opt/wxchat/uploads`。
- `docker compose up -d --build`。
- 本机 curl 验证 `127.0.0.1:18091`。

验收：

```bash
sudo docker compose ps
curl -i http://127.0.0.1:18091/login.html
```

### 阶段 4：OpenResty 入口

目标：通过 `https://110.42.235.46:18448/` 访问。

任务：

- 新增 `wxchat.conf`。
- `openresty -t`。
- reload OpenResty。
- 腾讯云安全组放行 `18448/TCP`。

验收：

```bash
curl -k -I https://110.42.235.46:18448/
```

浏览器手测完整功能。

### 阶段 5：备份和运维文档

任务：

- 写备份脚本。
- 写恢复步骤。
- 记录 secrets 路径。
- 记录升级步骤。
- 可选：加 systemd timer。

## 风险与注意事项

- 不要把后端端口公开到 `0.0.0.0`，保持 `127.0.0.1:18091`。
- 不要把 AI API key 放在 `public/js/config.js` 或任何前端文件里。
- OpenResty 当前不监听 `443/8443`，不要改现有端口策略，使用 `18448`。
- 现有 IP 证书很短期，部署前必须确认续期。
- 上传文件会吃磁盘，`/` 目前可用约 `18G`，需要控制 `MAX_FILE_SIZE_MB` 和备份保留。
- SQLite 适合个人使用；如果并发或文件量明显增加，再考虑 PostgreSQL。
- `docker-wxchat` 可以作为参考实现，尤其是 AI 后端代理和本地文件存储，但不要直接把单文件 `server.js` 作为长期架构。

## 第一版推荐范围

第一版先做：

- Node 自部署入口
- SQLite
- 本地 uploads
- Docker Compose
- OpenResty `18448`
- 登录、消息、文件、搜索、清空
- 移除前端 AI key

第一版可以暂缓：

- 多数据库支持
- S3 / MinIO
- 用户系统
- 多房间 / 多账号
- 大文件分片上传
- 高级审计日志

