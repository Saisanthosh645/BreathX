export type AQIScale = 'EAQI' | 'USAQI' | 'INDAQI';

export interface LocationInfo {
  id?: number;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
}

export interface PollutantDetail {
  name: string;
  code: 'pm2_5' | 'pm10' | 'nitrogen_dioxide' | 'sulphur_dioxide' | 'carbon_monoxide' | 'ozone';
  label: string;
  value: number | null;
  unit: string;
  description: string;
  healthImpact: string;
  whoGuideline?: number; // WHO 24-hr guideline level
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
}

export interface AQICategory {
  category: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  level: number; // 1 to 6
  healthSummary: string;
  outdoorAdvice: string;
  maskAdvice: string;
  ventilationAdvice: string;
}

export interface CurrentAirQualityData {
  location: LocationInfo;
  timestamp: string; // ISO string from API
  dataSource: string;
  europeanAqi: number | null;
  usAqi: number | null;
  indAqi: number | null;
  dominantPollutant: string | null;
  pollutants: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
  };
  weather?: {
    temperature: number | null;
    apparentTemperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    weatherCode: number | null;
    weatherDescription: string;
  };
}

export interface HourlyAirQualityPoint {
  time: string;
  timestamp: string;
  europeanAqi: number | null;
  usAqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
  isForecast?: boolean;
}

export interface DailyPollutionSummary {
  date: string;
  dayName: string;
  avgAqi: number;
  maxAqi: number;
  minAqi: number;
  avgPm25: number;
  avgPm10: number;
  dominantPollutant: string;
  category: AQICategory;
}

export interface PollutionSpike {
  time: string;
  pollutant: string;
  value: number;
  unit: string;
  mean: number;
  threshold: number;
  severity: 'moderate' | 'high' | 'severe';
  reason: string;
}

export interface AlertSetting {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  threshold: number;
  scale: AQIScale;
  enabled: boolean;
  browserNotify: boolean;
  lastNotifiedAqi?: number;
  lastNotifiedTime?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface HotspotLocation {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  timestamp: string;
  dominantPollutant: string;
  type: 'city' | 'industrial' | 'sensor_grid';
}
