const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherData {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  weatherCode: number | null;
  weatherDescription: string;
}

// Map WMO Weather Codes to descriptive conditions
export function getWmoDescription(code: number | null): string {
  if (code === null) return 'Unknown';
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
      return 'Fog / Haze';
    case 48:
      return 'Depositing rime fog';
    case 51:
      return 'Light drizzle';
    case 53:
      return 'Moderate drizzle';
    case 55:
      return 'Dense drizzle';
    case 61:
      return 'Slight rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rain';
    case 71:
      return 'Slight snow fall';
    case 73:
      return 'Moderate snow fall';
    case 75:
      return 'Heavy snow fall';
    case 80:
      return 'Slight rain showers';
    case 81:
      return 'Moderate rain showers';
    case 82:
      return 'Violent rain showers';
    case 95:
      return 'Thunderstorm';
    default:
      return 'Moderate conditions';
  }
}

const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `${WEATHER_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API error: HTTP ${res.status}`);
    }

    const json = await res.json();
    const current = json.current || {};

    const data: WeatherData = {
      temperature: current.temperature_2m ?? null,
      apparentTemperature: current.apparent_temperature ?? null,
      humidity: current.relative_humidity_2m ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      windDirection: current.wind_direction_10m ?? null,
      weatherCode: current.weather_code ?? null,
      weatherDescription: getWmoDescription(current.weather_code ?? null),
    };

    weatherCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error('Failed to fetch weather data:', err);
    return {
      temperature: null,
      apparentTemperature: null,
      humidity: null,
      windSpeed: null,
      windDirection: null,
      weatherCode: null,
      weatherDescription: 'Data unavailable',
    };
  }
}
