import { LocationInfo } from '../types/airQuality';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Default featured cities across different continents and pollution profiles
export const FEATURED_CITIES: LocationInfo[] = [
  {
    id: 1269843,
    name: 'Hyderabad',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1273294,
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 2643743,
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    admin1: 'England',
    latitude: 51.5085,
    longitude: -0.1257,
    timezone: 'Europe/London',
  },
  {
    id: 5128581,
    name: 'New York',
    country: 'United States',
    countryCode: 'US',
    admin1: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
  {
    id: 1850147,
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    admin1: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.6917,
    timezone: 'Asia/Tokyo',
  },
  {
    id: 2988507,
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    admin1: 'Île-de-France',
    latitude: 48.8534,
    longitude: 2.3488,
    timezone: 'Europe/Paris',
  },
  {
    id: 292223,
    name: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    admin1: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
  },
  {
    id: 1880252,
    name: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    admin1: 'Singapore',
    latitude: 1.2897,
    longitude: 103.8501,
    timezone: 'Asia/Singapore',
  },
];

// Simple in-memory cache for search queries
const searchCache = new Map<string, { data: LocationInfo[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function searchCities(query: string): Promise<LocationInfo[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(
      trimmed
    )}&count=10&language=en&format=json`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geocoding API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    const locations: LocationInfo[] = data.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      country: r.country || '',
      countryCode: r.country_code,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      elevation: r.elevation,
      timezone: r.timezone,
    }));

    searchCache.set(cacheKey, { data: locations, timestamp: Date.now() });
    return locations;
  } catch (error) {
    console.error('Failed to search locations:', error);
    // Fallback: match local featured cities if offline/rate-limited
    return FEATURED_CITIES.filter((c) =>
      c.name.toLowerCase().includes(cacheKey) ||
      c.country.toLowerCase().includes(cacheKey)
    );
  }
}
