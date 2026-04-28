// ─── Push notification handler — injected into the service worker ────────────
// This file is referenced by vite-plugin-pwa's injectManifest or loaded by the SW.
// Handles: incoming push messages, notification clicks, scheduled reminders from the app.

self.addEventListener("push", event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Chronos", {
      body:    data.body  || "",
      icon:    data.icon  || "/icon-192.png",
      badge:   data.badge || "/icon-192.png",
      tag:     data.tag   || "chronos",
      data:    data.data  || {},
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      // Focus existing window if open
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
      }
      // Otherwise open a new window
      return clients.openWindow("/");
    })
  );
});

// Messages from the main thread (in-app scheduled notifications)
self.addEventListener("message", event => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, icon, badge, tag, data } = event.data;
    self.registration.showNotification(title, {
      body,
      icon:   icon  || "/icon-192.png",
      badge:  badge || "/icon-192.png",
      tag:    tag   || "chronos",
      data:   data  || {},
      vibrate: [150, 75, 150],
    });
  }

  // Skip waiting (for PWA update flow)
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
