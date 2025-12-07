// Service Worker for Push Notifications and Offline Support
// File: public/sw.js

const CACHE_NAME = 'edu51five-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/image.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📨 Push event received!', event);
  
  let data = {};
  let title = 'Edu51Five';
  let body = 'New notification';
  
  try {
    if (event.data) {
      // Try to parse JSON payload
      const text = event.data.text();
      console.log('Raw push data:', text);
      
      if (text) {
        data = JSON.parse(text);
        console.log('Parsed notification data:', data);
      }
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
  }
  
  // Extract title and body from data
  title = data.title || 'Edu51Five Update';
  body = data.body || 'New notification from Edu51Five';
  
  const options = {
    body: body,
    icon: data.icon || '/Edu_51_Logo.png',
    badge: data.badge || '/Edu_51_Logo.png',
    image: data.image || null, // Optional large image
    data: data.data || {
      url: data.url || '/',
      noticeId: data.noticeId || null
    },
    tag: data.tag || 'edu51five-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: '📖 View Now',
        icon: '/Edu_51_Logo.png'
      },
      {
        action: 'close',
        title: '❌ Dismiss'
      }
    ],
    // Additional options for better visibility
    silent: false,
    renotify: true,
    timestamp: Date.now()
  };

  console.log('Showing notification with options:', { title, options });

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('✅ Notification shown successfully'))
      .catch(err => console.error('❌ Error showing notification:', err))
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();

  // If user clicked "close", just dismiss
  if (event.action === 'close') {
    console.log('User dismissed notification');
    return;
  }

  // Get the URL to open (default to home page)
  const urlToOpen = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  console.log('Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      // Try to find an existing window with the app
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen);
        
        // If same origin, focus and navigate
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          console.log('Focusing existing window');
          return client.focus().then(() => {
            // Navigate to the specific URL if different
            if (client.url !== urlToOpen && 'navigate' in client) {
              return client.navigate(urlToOpen);
            }
            return client;
          });
        }
      }
      
      // No existing window found, open a new one
      if (clients.openWindow) {
        console.log('Opening new window');
        return clients.openWindow(urlToOpen);
      }
    })
    .catch(err => console.error('Error handling notification click:', err))
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notices') {
    event.waitUntil(syncNotices());
  }
});

async function syncNotices() {
  // Placeholder for syncing notices when back online
  console.log('Syncing notices...');
}
