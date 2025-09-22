// Service Worker for 花費追蹤器 PWA
const CACHE_NAME = 'expense-tracker-v1.0.13';
const STATIC_CACHE_NAME = 'expense-tracker-static-v1.0.13';
const DYNAMIC_CACHE_NAME = 'expense-tracker-dynamic-v1.0.13';

// 需要快取的靜態資源
const STATIC_ASSETS = [
  './',
  './index.html',
  './privacy-policy.html',
  './script.js',
  './character.js',
  './style.css',
  './manifest.json',
  // 角色圖片
  './images/level-0.png',
  './images/level-1.png',
  './images/level-2.png',
  './images/level-3.png',
  './images/level-4.png',
  './images/level-5.png',
  './images/level-6.png',
  // 外部 CDN 資源
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap'
];

// 安裝事件
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// 啟動事件
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 刪除舊的快取
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 只處理 GET 請求
  if (request.method !== 'GET') {
    return;
  }

  // 處理同源請求
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          // 如果快取中有，直接返回
          if (response) {
            return response;
          }

          // 否則從網路獲取
          return fetch(request)
            .then(fetchResponse => {
              // 檢查是否為有效回應
              if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                return fetchResponse;
              }

              // 複製回應並存到動態快取
              const responseToCache = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });

              return fetchResponse;
            })
            .catch(() => {
              // 網路失敗時，嘗試返回離線頁面
              if (request.destination === 'document') {
                return caches.match('./index.html');
              }
            });
        })
    );
  }

  // 處理外部 CDN 資源
  if (url.origin === 'https://cdn.tailwindcss.com' || 
      url.origin === 'https://cdn.jsdelivr.net' ||
      url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }

          return fetch(request)
            .then(fetchResponse => {
              if (!fetchResponse || fetchResponse.status !== 200) {
                return fetchResponse;
              }

              const responseToCache = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });

              return fetchResponse;
            })
            .catch(() => {
              // 對於外部資源，如果網路失敗，返回空回應
              return new Response('', { status: 404 });
            });
        })
    );
  }
});

// 處理背景同步（如果支援）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // 這裡可以處理離線時的資料同步
  }
});

// 處理推送通知（如果支援）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: '查看詳情',
          icon: './icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: '關閉',
          icon: './icons/icon-96x96.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 處理通知點擊
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// 處理應用程式更新
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
