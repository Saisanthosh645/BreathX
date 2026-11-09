import { CurrentAirQualityData } from '../types/airQuality';

export interface ChatPayload {
  message: string;
  context?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    europeanAqi: number | null;
    usAqi: number | null;
    aqiCategory: string;
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    o3: number | null;
    co: number | null;
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  };
}

export async function askBreatheXAI(
  message: string,
  airData?: CurrentAirQualityData | null,
  categoryName?: string
): Promise<string> {
  let contextPayload: ChatPayload['context'] | undefined;

  if (airData) {
    contextPayload = {
      city: airData.location.name,
      country: airData.location.country,
      latitude: airData.location.latitude,
      longitude: airData.location.longitude,
      timestamp: airData.timestamp,
      europeanAqi: airData.europeanAqi,
      usAqi: airData.usAqi,
      aqiCategory: categoryName || 'Moderate',
      pm25: airData.pollutants.pm2_5,
      pm10: airData.pollutants.pm10,
      no2: airData.pollutants.no2,
      so2: airData.pollutants.so2,
      o3: airData.pollutants.o3,
      co: airData.pollutants.co,
      temperature: airData.weather?.temperature ?? null,
      humidity: airData.weather?.humidity ?? null,
      windSpeed: airData.weather?.windSpeed ?? null,
    };
  }

  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context: contextPayload }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Server responded with status ${res.status}`);
  }

  return data.text || 'No response received from BreatheX AI.';
}
