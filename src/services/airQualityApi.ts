import {
  CurrentAirQualityData,
  HourlyAirQualityPoint,
  LocationInfo,
} from '../types/airQuality';
import {
  calculateIndAqi,
  calculateUsAqi,
  getDominantPollutant,
} from '../utils/aqiCalculations';
import { fetchWeatherData } from './weatherApi';

const AIR_QUALITY_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const liveCache = new Map<string, CacheEntry<{ current: CurrentAirQualityData; hourly: HourlyAirQualityPoint[] }>>();
const historyCache = new Map<string, CacheEntry<HourlyAirQualityPoint[]>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function normalizeUtcTimestamp(timestamp: string): string {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp) ? timestamp : `${timestamp}Z`;
}

/**
 * Fetches current and hourly (past 30 days + forecast 4 days) air quality for given location
 */
export async function fetchLiveAirQuality(
  location: LocationInfo
): Promise<{ current: CurrentAirQualityData; hourly: HourlyAirQualityPoint[] }> {
  const cacheKey = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
  const cached = liveCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${AIR_QUALITY_BASE_URL}?latitude=${location.latitude}&longitude=${location.longitude}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi&timezone=GMT&timeformat=iso8601&past_days=30&forecast_days=4`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: any) {
    throw new Error(`Network failure connecting to Open-Meteo Air Quality API: ${err?.message || 'Check connection'}`);
  }

  if (response.status === 429) {
    throw new Error('Open-Meteo API rate limit reached. Please wait a moment before refreshing.');
  }

  if (!response.ok) {
    throw new Error(`Open-Meteo API responded with HTTP status ${response.status}`);
  }

  const json = await response.json();
  const currentRaw = json.current || {};
  const hourlyRaw = json.hourly || {};
  if (!currentRaw.time) {
    throw new Error('Open-Meteo returned current data without a measurement timestamp.');
  }

  // Fetch concurrent weather data
  const weather = await fetchWeatherData(location.latitude, location.longitude);

  const pm25 = currentRaw.pm2_5 != null ? Number(currentRaw.pm2_5) : null;
  const pm10 = currentRaw.pm10 != null ? Number(currentRaw.pm10) : null;
  const no2 = currentRaw.nitrogen_dioxide != null ? Number(currentRaw.nitrogen_dioxide) : null;
  const so2 = currentRaw.sulphur_dioxide != null ? Number(currentRaw.sulphur_dioxide) : null;
  const co = currentRaw.carbon_monoxide != null ? Number(currentRaw.carbon_monoxide) : null;
  const o3 = currentRaw.ozone != null ? Number(currentRaw.ozone) : null;

  const europeanAqi = currentRaw.european_aqi != null ? Number(currentRaw.european_aqi) : null;
  // Use the provider's US AQI when available; otherwise calculate a particulate-only estimate.
  const calculatedUsAqi = currentRaw.us_aqi != null ? Number(currentRaw.us_aqi) : calculateUsAqi(pm25, pm10);
  const indAqi = calculateIndAqi(pm25, pm10);

  const dominantPollutant = getDominantPollutant({
    pm2_5: pm25,
    pm10,
    no2,
    so2,
    co,
    o3,
  });

  const current: CurrentAirQualityData = {
    location,
    timestamp: normalizeUtcTimestamp(currentRaw.time),
    dataSource: 'Copernicus Atmospheric Monitoring Service (CAMS) via Open-Meteo Model',
    europeanAqi,
    usAqi: calculatedUsAqi,
    indAqi,
    dominantPollutant,
    pollutants: {
      pm2_5: pm25,
      pm10,
      no2,
      so2,
      co,
      o3,
    },
    weather,
  };

  // Parse hourly times and series
  const hourly: HourlyAirQualityPoint[] = [];
  const times: string[] = hourlyRaw.time || [];
  const eaqiList: (number | null)[] = hourlyRaw.european_aqi || [];
  const usaqiList: (number | null)[] = hourlyRaw.us_aqi || [];
  const pm25List: (number | null)[] = hourlyRaw.pm2_5 || [];
  const pm10List: (number | null)[] = hourlyRaw.pm10 || [];
  const no2List: (number | null)[] = hourlyRaw.nitrogen_dioxide || [];
  const so2List: (number | null)[] = hourlyRaw.sulphur_dioxide || [];
  const coList: (number | null)[] = hourlyRaw.carbon_monoxide || [];
  const o3List: (number | null)[] = hourlyRaw.ozone || [];

  const nowEpoch = Date.now();

  for (let i = 0; i < times.length; i++) {
    const t = normalizeUtcTimestamp(times[i]);
    const pointTime = new Date(t).getTime();
    const isForecast = pointTime > nowEpoch;

    const ptPm25 = pm25List[i] != null ? Number(pm25List[i]) : null;
    const ptPm10 = pm10List[i] != null ? Number(pm10List[i]) : null;

    hourly.push({
      time: t,
      timestamp: t,
      europeanAqi: eaqiList[i] != null ? Number(eaqiList[i]) : null,
      usAqi: usaqiList[i] != null ? Number(usaqiList[i]) : calculateUsAqi(ptPm25, ptPm10),
      pm2_5: ptPm25,
      pm10: ptPm10,
      no2: no2List[i] != null ? Number(no2List[i]) : null,
      so2: so2List[i] != null ? Number(so2List[i]) : null,
      co: coList[i] != null ? Number(coList[i]) : null,
      o3: o3List[i] != null ? Number(o3List[i]) : null,
      isForecast,
    });
  }

  const result = { current, hourly };
  liveCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Fetches historical CAMS model data for a specific date range.
 */
export async function fetchHistoricalAirQuality(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<HourlyAirQualityPoint[]> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)},${startDate},${endDate}`;
  const cached = historyCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${AIR_QUALITY_BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi&start_date=${startDate}&end_date=${endDate}&timezone=GMT&timeformat=iso8601`;

  const res = await fetch(url);
  if (res.status === 429) {
    throw new Error('Open-Meteo API rate limit reached. Please wait before retrying historical data.');
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch historical data: HTTP ${res.status}`);
  }

  const json = await res.json();
  const hourlyRaw = json.hourly || {};
  const times: string[] = hourlyRaw.time || [];
  const points: HourlyAirQualityPoint[] = [];

  for (let i = 0; i < times.length; i++) {
    const t = normalizeUtcTimestamp(times[i]);
    const ptPm25 = hourlyRaw.pm2_5?.[i] != null ? Number(hourlyRaw.pm2_5[i]) : null;
    const ptPm10 = hourlyRaw.pm10?.[i] != null ? Number(hourlyRaw.pm10[i]) : null;

    points.push({
      time: t,
      timestamp: t,
      europeanAqi: hourlyRaw.european_aqi?.[i] != null ? Number(hourlyRaw.european_aqi[i]) : null,
      usAqi: hourlyRaw.us_aqi?.[i] != null ? Number(hourlyRaw.us_aqi[i]) : calculateUsAqi(ptPm25, ptPm10),
      pm2_5: ptPm25,
      pm10: ptPm10,
      no2: hourlyRaw.nitrogen_dioxide?.[i] != null ? Number(hourlyRaw.nitrogen_dioxide[i]) : null,
      so2: hourlyRaw.sulphur_dioxide?.[i] != null ? Number(hourlyRaw.sulphur_dioxide[i]) : null,
      co: hourlyRaw.carbon_monoxide?.[i] != null ? Number(hourlyRaw.carbon_monoxide[i]) : null,
      o3: hourlyRaw.ozone?.[i] != null ? Number(hourlyRaw.ozone[i]) : null,
      isForecast: false,
    });
  }

  historyCache.set(cacheKey, { data: points, timestamp: Date.now() });
  return points;
}

/**
 * Fetches CAMS model estimates at multiple grid coordinates around a city.
 */
export async function fetchGridPoints(
  centerLat: number,
  centerLon: number,
  cityName: string
): Promise<{
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  europeanAqi: number | null;
  usAqi: number | null;
  indAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  timestamp: string;
  type: string;
}[]> {
  // Query actual coordinate offsets around the city (~10-15km model grid cells)
  const offsets = [
    { label: `${cityName} Center`, dLat: 0, dLon: 0, type: 'CAMS model grid cell' },
    { label: `${cityName} North Grid`, dLat: 0.1, dLon: 0.02, type: 'CAMS model grid cell' },
    { label: `${cityName} South Grid`, dLat: -0.1, dLon: -0.02, type: 'CAMS model grid cell' },
    { label: `${cityName} East Grid`, dLat: 0.02, dLon: 0.1, type: 'CAMS model grid cell' },
    { label: `${cityName} West Grid`, dLat: -0.02, dLon: -0.1, type: 'CAMS model grid cell' },
  ];

  const results = await Promise.all(
    offsets.map(async (item, idx) => {
      const lat = centerLat + item.dLat;
      const lon = centerLon + item.dLon;
      const url = `${AIR_QUALITY_BASE_URL}?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,nitrogen_dioxide&timezone=GMT&timeformat=iso8601`;
      const res = await fetch(url);
      if (res.status === 429) {
        throw new Error('Open-Meteo rate limit reached while loading map grid points.');
      }
      if (!res.ok) {
        throw new Error(`Open-Meteo map request failed with HTTP ${res.status}.`);
      }
      const data = await res.json();
      const current = data.current || {};
      if (!current.time) return null;
      return {
        id: `grid-${idx}`,
        name: item.label,
        latitude: lat,
        longitude: lon,
        europeanAqi: current.european_aqi != null ? Number(current.european_aqi) : null,
        usAqi: current.us_aqi != null ? Number(current.us_aqi) : null,
        pm25: current.pm2_5 != null ? Number(current.pm2_5) : null,
        pm10: current.pm10 != null ? Number(current.pm10) : null,
        indAqi: calculateIndAqi(
          current.pm2_5 != null ? Number(current.pm2_5) : null,
          current.pm10 != null ? Number(current.pm10) : null
        ),
        no2: current.nitrogen_dioxide != null ? Number(current.nitrogen_dioxide) : null,
        timestamp: normalizeUtcTimestamp(current.time),
        type: item.type,
      };
    })
  );

  return results.filter((point): point is NonNullable<typeof point> => point !== null);
}

export function clearAirQualityCache(): void {
  liveCache.clear();
  historyCache.clear();
}
