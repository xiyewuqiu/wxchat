// 微信文件传输助手 Service Worker
// 提供离线缓存和后台同步功能

const CACHE_NAME = 'wxchat-v2.1.0';
const STATIC_CACHE_NAME = 'wxchat-static-v2.1.0';
const DYNAMIC_CACHE_NAME = 'wxchat-dynamic-v2.1.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/messages.css',
  '/css/input.css',
  '/css/ai-chat.css',
  '/css/modals.css',
  '/css/auth-page.css',
  '/css/mobile.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/ui.js',
  '/js/fileUpload.js',
  '/js/realtime.js',
  '/js/messageHandler.js',
  '/js/pwa.js',
  '/js/app.js',
  '/icons/android/android-launchericon-192-192.png',
  '/icons/android/android-launchericon-512-512.png',
  '/icons/ios/32.png',
  '/icons/ios/180.png',
  'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js'
];

// 需要网络优先的资源（API请求等）
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/auth\//
];

// 需要缓存优先的资源
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:css|js)$/,
  /\/icons\//
];

// Service Worker 安装事件
self.addEventListener('install', event => {
  console.log('🔧 Service Worker 安装中...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE_NAME).then(async cache => {
        console.log('📦 缓存静态资源...');

        // 逐个添加资源，跳过失败的
        const cachePromises = STATIC_ASSETS.map(async url => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn(`⚠️ 缓存失败: ${url}`, error.message);
          }
        });

        await Promise.all(cachePromises);
        console.log('📦 静态资源缓存完成');
      }),
      // 跳过等待，立即激活
      self.skipWaiting()
    ])
  );
});

// Service Worker 激活事件
self.addEventListener('activate', event => {
  console.log('✅ Service Worker 激活中...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('wxchat-')) {
              console.log('🗑️ 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  );
});

// 网络请求拦截
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 HTTP(S) 请求
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// 处理网络请求的核心逻辑
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // API 请求：网络优先策略
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request);
    }
    
    // 静态资源：缓存优先策略
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await cacheFirst(request);
    }
    
    // HTML 页面：网络优先，缓存备用
    if (request.destination === 'document') {
      return await networkFirst(request);
    }
    
    // 其他请求：缓存优先
    return await cacheFirst(request);
    
  } catch (error) {
    console.error('请求处理失败:', error);
    
    // 如果是页面请求且离线，返回缓存的首页
    if (request.destination === 'document') {
      const cachedResponse = await caches.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // 返回离线页面或错误响应
    return new Response('离线状态，请检查网络连接', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // 只缓存GET请求的成功响应
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取（只对GET请求）
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    throw error;
  }
}

// 缓存优先策略
async function cacheFirst(request) {
  // 只对GET请求使用缓存策略
  if (request.method !== 'GET') {
    return fetch(request);
  }

  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // 后台更新缓存
    updateCache(request);
    return cachedResponse;
  }

  // 缓存中没有，从网络获取
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// 后台更新缓存
async function updateCache(request) {
  // 只更新GET请求的缓存
  if (request.method !== 'GET') {
    return;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // 静默失败，不影响用户体验
    console.log('后台缓存更新失败:', error);
  }
}

// 消息处理（用于与主线程通信）
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('未知消息类型:', type);
  }
});

// 清理所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🗑️ 所有缓存已清理');
}

// 后台同步（如果支持）
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
      event.waitUntil(doBackgroundSync());
    }
  });
}

// 执行后台同步
async function doBackgroundSync() {
  try {
    // 这里可以添加后台同步逻辑
    // 比如同步离线时的消息等
    console.log('🔄 执行后台同步...');
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

console.log('🚀 Service Worker 已加载');
