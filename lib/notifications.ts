"use client";

import { useEffect, useState } from "react";

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied";
    }
  };

  const scheduleLocalNotification = (title: string, options?: NotificationOptions) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          icon: "/icon.svg",
          badge: "/icon.svg",
          ...options,
        });
      } catch {
        // Ignore notification errors in unsupported webview contexts
      }
    }
  };

  return {
    permission,
    isSupported: permission !== "unsupported",
    isGranted: permission === "granted",
    requestPermission,
    scheduleLocalNotification,
  };
}
