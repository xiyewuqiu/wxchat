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
