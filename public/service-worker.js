// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const cacheName = 'sodia-cache';
const filesToCache = [
    '/',
    '/favicon.ico',
    '/javascripts/sodia.js',
    '/javascripts/bootstrap.min.js',
    '/javascripts/bootstrap.min.js.map',
    '/javascripts/jquery.min.js',
    '/javascripts/jquery.min.js.map',
    '/javascripts/socket.io.js',
    '/javascripts/socket.io.js.map',
    '/javascripts/idb.js',
    '/javascripts/database.js',
    '/stylesheets/style.css',
    '/stylesheets/bootstrap.min.css',
    '/stylesheets/bootstrap.min.css.map',
    '/stylesheets/font-awesome.css',
    '/images/avatars/default.png',
    '/images/icons/icon-32x32.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-256x256.png',
    '/webfonts/fa-brands-400.eot',
    '/webfonts/fa-brands-400.svg',
    '/webfonts/fa-brands-400.ttf',
    '/webfonts/fa-brands-400.woff',
    '/webfonts/fa-brands-400.woff2',
    '/webfonts/fa-regular-400.eot',
    '/webfonts/fa-regular-400.svg',
    '/webfonts/fa-regular-400.ttf',
    '/webfonts/fa-regular-400.woff',
    '/webfonts/fa-regular-400.woff2',
    '/webfonts/fa-solid-900.eot',
    '/webfonts/fa-solid-900.svg',
    '/webfonts/fa-solid-900.ttf',
    '/webfonts/fa-solid-900.woff',
    '/webfonts/fa-solid-900.woff2'
];

/**
 * installation event: it adds all the files to be cached
 */
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        })
    );
});

/**
 * activation of service worker: it removes all cashed files if necessary
 */
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== cacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    console.log('[Service Worker] ' + event.request.method, event.request.url);
    const picUrl = '/images/pictures';
    if (event.request.method !== 'GET' ||
        event.request.url.indexOf('/reg') > -1 ||
        event.request.url.indexOf('/login') > -1 ||
        event.request.url.indexOf('/logout') > -1 ||
        event.request.url.indexOf('/socket.io') > -1) {
        // Ignore these urls
        console.log('[Service Worker] Ignore', event.request.url);
        return false;
    } else if (event.request.url.indexOf(picUrl) > -1) {
        // Generic fallback + save cache
        event.respondWith((async () => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                console.log('[Service Worker] Load cache', event.request.url);
                return cachedResponse;
            }

            try {
                const cache = await caches.open('sodia-cache');
                const networkResponsePromise = fetch(event.request);
                const networkResponse = await networkResponsePromise;
                await cache.put(event.request, networkResponse.clone());
                return networkResponsePromise;
            } catch (e) {
                return caches.match(event.request);
            }
        })());
    } else {
        // Network falling back to cache
        event.respondWith((async () => {
            try {
                const cache = await caches.open('sodia-cache');
                const networkResponsePromise = fetch(event.request);
                const networkResponse = await networkResponsePromise;
                await cache.put(event.request, networkResponse.clone());
                return networkResponsePromise;
            } catch (e) {
                return caches.match(event.request);
            }
        })());
    }
});
