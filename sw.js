const CACHE_NAME = 'yuanlairuci-v3';

const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/words.js',
    './js/words_loader.js',
    './js/phrases.js',
    './js/auth.js',
    './js/cloud.js',
    './js/essence.js',
    './js/ai.js',
    './js/api.js',
    './js/tree.js',
    './js/storage.js',
    './js/srs.js',
    './data/words.json',
    './data/cet4_new.json',
    './data/cet6_new.json',
    './manifest.json'
];

// 安装：预缓存所有静态资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(e => {
            console.warn('[SW] Cache addAll partial failure:', e);
        }))
    );
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// 请求拦截：网络优先，离线回退缓存
self.addEventListener('fetch', event => {
    // 跳过 Chrome DevTools 和 chrome-extension 请求
    if (event.request.url.startsWith('chrome-extension://') || event.request.url.includes('chrome-extension')) return;

    // API 请求（mymemory / free dictionary）走网络，不做缓存
    if (event.request.url.includes('api.mymemory') || event.request.url.includes('api.dictionaryapi')) {
        return; // 让浏览器默认处理
    }

    // 静态资源：网络优先，失败则回退缓存
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 仅缓存同源资源
                if (response && response.status === 200 && new URL(event.request.url).origin === self.location.origin) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
