// sw.js — Service Worker para Doodle Tasks Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Recebe push do servidor (futuro) ou da página
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'doodle-tasks',
    data: { url: data.url || '/' },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clique na notificação abre a aba correta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Mensagens da página principal (para disparar notificações agendadas)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...options,
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
    });
  }
});
