import { useState, useEffect } from 'react';
import { AlertSetting, AQIScale } from '../types/airQuality';

const ALERTS_STORAGE_KEY = 'breathex_alerts_v1';

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertSetting[]>(() => {
    try {
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial alert rule
    return [
      {
        id: 'default-alert-1',
        locationName: 'Hyderabad',
        latitude: 17.385,
        longitude: 78.4867,
        threshold: 100,
        scale: 'USAQI' as AQIScale,
        enabled: true,
        browserNotify: true,
      },
    ];
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.error(e);
    }
  }, [alerts]);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm === 'granted';
    } catch {
      return false;
    }
  };

  const addAlert = (newAlert: Omit<AlertSetting, 'id'>) => {
    const alert: AlertSetting = {
      ...newAlert,
      id: `alert-${Date.now()}`,
    };
    setAlerts((prev) => [...prev, alert]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  /**
   * Evaluates current AQI against configured alerts and triggers notification
   */
  const evaluateAlerts = (
    currentAqi: number | null,
    locationName: string,
    scale: AQIScale
  ) => {
    if (currentAqi === null) return;

    for (const alert of alerts) {
      if (!alert.enabled) continue;
      // Compare if location matches
      if (
        alert.locationName.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(alert.locationName.toLowerCase())
      ) {
        if (currentAqi >= alert.threshold) {
          // If browser notification enabled & permitted
          if (
            alert.browserNotify &&
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            // Check if already notified recently (within last 3 hours)
            const lastNotified = alert.lastNotifiedTime ? new Date(alert.lastNotifiedTime).getTime() : 0;
            if (Date.now() - lastNotified > 3 * 60 * 60 * 1000) {
              try {
                new Notification(`BreatheX AQI Alert: ${locationName}`, {
                  body: `Air Quality Index reached ${currentAqi} (${scale}), surpassing your alert threshold of ${alert.threshold}. Take precautions outdoors.`,
                  icon: '/favicon.ico',
                });
                // Update last notified
                setAlerts((prev) =>
                  prev.map((a) =>
                    a.id === alert.id
                      ? {
                          ...a,
                          lastNotifiedAqi: currentAqi,
                          lastNotifiedTime: new Date().toISOString(),
                        }
                      : a
                  )
                );
              } catch (err) {
                console.error('Notification error:', err);
              }
            }
          }
        }
      }
    }
  };

  return {
    alerts,
    notificationPermission,
    requestPermission,
    addAlert,
    removeAlert,
    toggleAlert,
    evaluateAlerts,
  };
}
