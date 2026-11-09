import { useState, useEffect, useCallback } from 'react';
import {
  CurrentAirQualityData,
  HourlyAirQualityPoint,
  LocationInfo,
  AQIScale,
} from '../types/airQuality';
import { fetchLiveAirQuality } from '../services/airQualityApi';
import { FEATURED_CITIES } from '../services/geocodingApi';

const DEFAULT_LOCATION: LocationInfo = FEATURED_CITIES[0]; // Hyderabad, India
const SEARCH_HISTORY_KEY = 'breathex_recent_searches_v1';
const SCALE_PREF_KEY = 'breathex_scale_pref_v1';

export function useAirQuality() {
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [airData, setAirData] = useState<CurrentAirQualityData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyAirQualityPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const [activeScale, setActiveScaleState] = useState<AQIScale>(() => {
    try {
      const saved = localStorage.getItem(SCALE_PREF_KEY);
      if (saved === 'EAQI' || saved === 'USAQI' || saved === 'INDAQI') {
        return saved;
      }
    } catch {}
    return 'USAQI'; // Default scale
  });

  const [recentSearches, setRecentSearches] = useState<LocationInfo[]>(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return FEATURED_CITIES.slice(0, 4);
  });

  const setActiveScale = (scale: AQIScale) => {
    setActiveScaleState(scale);
    try {
      localStorage.setItem(SCALE_PREF_KEY, scale);
    } catch {}
  };

  const loadData = useCallback(async (loc: LocationInfo, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchLiveAirQuality(loc);
      setAirData(result.current);
      setHourlyData(result.hourly);
      setLastFetched(new Date().toISOString());
    } catch (err: any) {
      console.error('Failed to load air quality:', err);
      setError(
        err?.message ||
          'Failed to retrieve air quality data. Please verify network access or try again shortly.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedLocation, false);
  }, [selectedLocation, loadData]);

  const changeLocation = (loc: LocationInfo) => {
    setSelectedLocation(loc);
    // Add to recent searches
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (p) =>
          p.name.toLowerCase() !== loc.name.toLowerCase() ||
          p.country.toLowerCase() !== loc.country.toLowerCase()
      );
      const updated = [loc, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const refreshData = () => {
    loadData(selectedLocation, true);
  };

  return {
    selectedLocation,
    airData,
    hourlyData,
    loading,
    refreshing,
    error,
    lastFetched,
    activeScale,
    recentSearches,
    changeLocation,
    refreshData,
    setActiveScale,
    clearError: () => setError(null),
  };
}
