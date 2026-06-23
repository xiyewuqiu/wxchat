# WXChat Self-Hosted

自部署版运行形态：

```text
browser / PWA
  -> OpenResty HTTPS
  -> 127.0.0.1:18091
  -> Node.js + Hono
  -> SQLite + local uploads
```

## 本地运行

```bash
npm install
cp .env.example .env
npm run selfhost:dev
```

默认访问：

```text
http://127.0.0.1:3000/login.html
```

## Docker Compose

生产部署前先生成强密码和 JWT secret：

```bash
cp .env.example .env
openssl rand -base64 32
```

然后编辑 `.env`，至少修改：

```env
ACCESS_PASSWORD=
JWT_SECRET=
PUBLIC_BASE_URL=
```

让 Docker 容器使用宿主机时区：

```bash
./scripts/sync-host-timezone.sh .env
```

脚本会读取宿主机 `timedatectl`、`/etc/timezone` 或 `/etc/localtime`，并把检测到的 IANA 时区写入 `.env` 的 `TZ=`。`docker-compose.yml` 会同时把 `TZ` 传给容器，并只读挂载宿主机 `/etc/localtime`。

启动：

```bash
docker compose up -d --build
```

Compose 默认只绑定 loopback：

```text
127.0.0.1:18091 -> container:3000
```

数据位置：

```text
./data/wxchat.db
./uploads/
```

## 消息设备信息

默认只区分“本机 / 其他设备”。如需记录每条新消息发送时的设备信息快照，可在 `.env` 中启用：

```env
MESSAGE_DEVICE_INFO_ENABLED=true
```

启用后，新发送的文本、文件消息会保存设备名称、类型、系统、浏览器、屏幕等轻量信息；历史消息不会自动补齐。

## 消息堆叠与时区

同一设备在短时间内连续发送的消息会自动堆叠，默认窗口是 15 分钟。可以在 `.env` 中调整：

```env
MESSAGE_GROUP_WINDOW_MINUTES=15
```

自部署版会读取运行机器的时区并通过配置接口返回给前端；前端默认跟随当前浏览器/客户端时区显示。也可以显式指定服务端默认时区：

```env
APP_TIMEZONE=Asia/Shanghai
ALLOW_CLIENT_TIMEZONE_OVERRIDE=true
```

`APP_TIMEZONE` 留空时使用部署机器时区；`ALLOW_CLIENT_TIMEZONE_OVERRIDE=false` 时，前端不能切换到浏览器或自定义时区，并会强制跟随服务端默认时区。

在 Linux/Docker 中，推荐运行 `./scripts/sync-host-timezone.sh .env`，或手动设置 `TZ=Asia/Shanghai`。Compose 会挂载宿主机 `/etc/localtime`，这样容器系统时区和 `/api/config` 中的 `timezone.serverTimezone` 可以跟宿主机保持一致。

## Server 4 OpenResty

建议反代目标：

```text
http://127.0.0.1:18091
```

入口：

```text
https://110.42.235.46:18448/
```

关键配置：

```nginx
client_max_body_size 100m;

location /api/events {
    proxy_pass http://127.0.0.1:18091;
    proxy_buffering off;
    proxy_read_timeout 3600s;
}

location / {
    proxy_pass http://127.0.0.1:18091;
}
```

## AI

前端不保存 API key。启用 AI 时只在 `.env` 中配置服务端变量：

```env
AI_ENABLED=true
AI_CHAT_BASE_URL=
AI_CHAT_API_KEY=
AI_CHAT_MODEL=

IMAGE_GEN_ENABLED=true
AI_IMAGE_BASE_URL=
AI_IMAGE_API_KEY=
AI_IMAGE_MODEL=
```
