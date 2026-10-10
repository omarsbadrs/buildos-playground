/*
 * BuildOs service worker: web push only (BuildOs AI, phase 8 leftovers). No caching, no fetch handler —
 * the app is always loaded from the network. A push from the engine (app/ai/push.py) carries a title,
 * a body, a link and a tag; it is shown unless a BuildOs window is in front (the app shows it there).
 * Clicking it brings BuildOs forward on that link.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "BuildOs", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      if (data.tag !== "test" && windows.some((w) => w.focused && w.visibilityState === "visible")) return undefined;
      return self.registration.showNotification(data.title || "BuildOs", {
        body: data.body || "",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        icon: "/icon.png",
        badge: "/icon.png",
        data: { url: data.url || "/" },
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const same = windows.find((w) => new URL(w.url).origin === url.origin);
      if (same) {
        same.postMessage({ type: "buildos-open", url: url.href });
        return same.focus();
      }
      return self.clients.openWindow(url.href);
    }),
  );
});
