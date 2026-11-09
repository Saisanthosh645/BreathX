import { useState } from 'react';
import { LocationInfo } from '../types/airQuality';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = (): Promise<LocationInfo> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        setError(msg);
        setLoading(false);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            // Reverse geocode coordinate approximation via Open-Meteo or generic fallback
            const res = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=City&count=1`
            );
            // Form location object from GPS
            const loc: LocationInfo = {
              name: `GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
              country: 'Local Device',
              latitude: lat,
              longitude: lon,
            };
            setLoading(false);
            resolve(loc);
          } catch {
            const loc: LocationInfo = {
              name: 'My Current Location',
              country: 'Detected GPS',
              latitude: lat,
              longitude: lon,
            };
            setLoading(false);
            resolve(loc);
          }
        },
        (err) => {
          let msg = 'Unable to retrieve your location.';
          if (err.code === 1) msg = 'Location access was denied.';
          else if (err.code === 2) msg = 'Location is unavailable.';
          else if (err.code === 3) msg = 'Location request timed out.';
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  return { getCurrentLocation, loading, error };
}
