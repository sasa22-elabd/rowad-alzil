self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "طلب جديد";
  const options = {
    body: data.body || "وصل طلب جديد على المتجر",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: { orderId: data.orderId, url: "/admin" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/admin");
      }
    })
  );
});