import { HourlyAirQualityPoint, PollutionSpike, DailyPollutionSummary, AQIScale } from '../types/airQuality';
import { calculateIndAqi, getCategoryForScale } from './aqiCalculations';

/**
 * Calculates percentage change between old and new values.
 * Returns null if baseline is 0 or invalid.
 */
export function calculatePercentageChange(
  baseline: number | null,
  current: number | null
): { percent: number; direction: 'up' | 'down' | 'stable' } | null {
  if (baseline === null || current === null || isNaN(baseline) || isNaN(current)) {
    return null;
  }
  if (baseline <= 0) {
    if (current > 0) return { percent: 100, direction: 'up' };
    return { percent: 0, direction: 'stable' };
  }

  const diff = current - baseline;
  const percent = Math.round((Math.abs(diff) / baseline) * 100);

  if (Math.abs(diff) < 0.5) {
    return { percent: 0, direction: 'stable' };
  }
  return {
    percent,
    direction: diff > 0 ? 'up' : 'down',
  };
}

/**
 * Statistical Pollution Spike Detection using Mean + K * Standard Deviation (Z-score approach)
 * Detects hours where a pollutant spiked significantly above normal baseline.
 */
export function detectPollutionSpikes(
  dataPoints: HourlyAirQualityPoint[],
  pollutantKey: 'pm2_5' | 'pm10' | 'no2' | 'o3' = 'pm2_5'
): PollutionSpike[] {
  const validPoints = dataPoints.filter(
    (pt) => pt[pollutantKey] !== null && !isNaN(pt[pollutantKey] as number)
  );

  if (validPoints.length < 5) return [];

  const values = validPoints.map((pt) => pt[pollutantKey] as number);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;

  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Anomaly threshold: 1.8 standard deviations above mean, with a minimum absolute delta
  const minDelta = pollutantKey === 'pm2_5' ? 12 : 25;
  const threshold = Math.max(mean + 1.8 * stdDev, mean + minDelta);

  const spikes: PollutionSpike[] = [];

  for (const pt of validPoints) {
    const val = pt[pollutantKey] as number;
    if (val >= threshold) {
      const zScore = stdDev > 0 ? (val - mean) / stdDev : 2;
      let severity: 'moderate' | 'high' | 'severe' = 'moderate';
      if (zScore > 3.0 || val > mean * 2.5) {
        severity = 'severe';
      } else if (zScore > 2.2 || val > mean * 1.8) {
        severity = 'high';
      }

      spikes.push({
        time: pt.time,
        pollutant: pollutantKey.toUpperCase().replace('_', '.'),
        value: Math.round(val * 10) / 10,
        unit: 'µg/m³',
        mean: Math.round(mean * 10) / 10,
        threshold: Math.round(threshold * 10) / 10,
        severity,
        reason: `Exceeded standard baseline by ${Math.round(((val - mean) / (mean || 1)) * 100)}% (z-score: ${zScore.toFixed(1)})`,
      });
    }
  }

  // Sort descending by value
  return spikes.sort((a, b) => b.value - a.value).slice(0, 5);
}

/**
 * Groups hourly data points into daily summaries
 */
export function aggregateDailySummaries(
  dataPoints: HourlyAirQualityPoint[],
  scale: AQIScale = 'EAQI'
): DailyPollutionSummary[] {
  const grouped: Record<string, HourlyAirQualityPoint[]> = {};

  for (const pt of dataPoints) {
    const dateKey = pt.time.split('T')[0];
    if (!dateKey) continue;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(pt);
  }

  const results: DailyPollutionSummary[] = [];

  for (const [date, points] of Object.entries(grouped)) {
    const aqiValues = points
      .map((p) => scale === 'EAQI'
        ? p.europeanAqi
        : scale === 'USAQI'
        ? p.usAqi
        : calculateIndAqi(p.pm2_5, p.pm10))
      .filter((v): v is number => v !== null && !isNaN(v));

    const pm25Values = points
      .map((p) => p.pm2_5)
      .filter((v): v is number => v !== null && !isNaN(v));

    const pm10Values = points
      .map((p) => p.pm10)
      .filter((v): v is number => v !== null && !isNaN(v));

    if (aqiValues.length === 0) continue;

    const avgAqi = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    const maxAqi = Math.max(...aqiValues);
    const minAqi = Math.min(...aqiValues);
    const avgPm25 =
      pm25Values.length > 0
        ? Math.round((pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length) * 10) / 10
        : null;
    const avgPm10 =
      pm10Values.length > 0
        ? Math.round((pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length) * 10) / 10
        : null;

    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const category = getCategoryForScale(avgAqi, scale);

    results.push({
      date,
      dayName,
      avgAqi,
      maxAqi,
      minAqi,
      avgPm25,
      avgPm10,
      dominantPollutant:
        avgPm25 === null && avgPm10 === null
          ? 'Unavailable'
          : avgPm25 === null
          ? 'PM10'
          : avgPm10 === null
          ? 'PM2.5'
          : avgPm25 > avgPm10 * 0.4
          ? 'PM2.5'
          : 'PM10',
      category,
    });
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generates verified, data-backed insights from actual readings
 */
export function generateRealDataInsights(
  currentAqi: number | null,
  scale: AQIScale,
  pollutants: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    o3: number | null;
    so2: number | null;
    co: number | null;
  },
  weather?: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  }
): string[] {
  const insights: string[] = [];

  // WHO Guideline comparison for PM2.5 (15 µg/m³ 24-hr)
  if (pollutants.pm2_5 !== null) {
    if (pollutants.pm2_5 > 15) {
      const times = (pollutants.pm2_5 / 15).toFixed(1);
      insights.push(
        `PM2.5 concentration (${pollutants.pm2_5} µg/m³) is currently ${times}x the WHO 24-hour safe guideline level (15 µg/m³).`
      );
    } else {
      insights.push(
        `PM2.5 concentration (${pollutants.pm2_5} µg/m³) is within the WHO 24-hour safe guideline (15 µg/m³). Clean fine-particle levels.`
      );
    }
  }

  // Weather impact insight
  if (weather) {
    if (weather.windSpeed !== null && weather.windSpeed < 5) {
      insights.push(
        `Stagnant air conditions detected: Low wind speed (${weather.windSpeed} km/h) prevents pollutant dispersion, causing local accumulation.`
      );
    } else if (weather.windSpeed !== null && weather.windSpeed > 20) {
      insights.push(
        `Active ventilation: Stronger winds (${weather.windSpeed} km/h) are actively assisting in dispersing airborne particulate matter.`
      );
    }

    if (weather.humidity !== null && weather.humidity > 75) {
      insights.push(
        `High relative humidity (${weather.humidity}%) can promote secondary aerosol formation and particulate trapping near surface level.`
      );
    }
  }

  // Ozone photochemical insight
  if (pollutants.o3 !== null && pollutants.o3 > 80) {
    insights.push(
      `Elevated ground-level ozone (${pollutants.o3} µg/m³): Ground-level ozone peaks in warm, sunny conditions; lung irritations may increase during peak daylight.`
    );
  }

  // Overall scale insight
  if (currentAqi !== null) {
    const cat = getCategoryForScale(currentAqi, scale);
    insights.push(
      `Overall rating under ${scale}: "${cat.category}". ${cat.healthSummary}`
    );
  }

  return insights;
}
