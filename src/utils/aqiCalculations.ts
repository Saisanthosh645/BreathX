import { AQICategory, AQIScale } from '../types/airQuality';

/**
 * Linear interpolation helper for EPA and CPCB AQI piecewise breakpoints
 */
function interpolate(
  conc: number,
  cLow: number,
  cHigh: number,
  iLow: number,
  iHigh: number
): number {
  if (cHigh === cLow) return iLow;
  const val = ((iHigh - iLow) / (cHigh - cLow)) * (conc - cLow) + iLow;
  return Math.round(val);
}

/**
 * Calculates US EPA AQI sub-index for PM2.5 (µg/m³)
 */
export function calculateUsPm25Aqi(pm25: number): number {
  if (pm25 < 0) return 0;
  // EPA PM2.5 breakpoints (2024 update / standard):
  // 0.0 - 9.0 (or 12.0) -> 0 - 50
  if (pm25 <= 12.0) return interpolate(pm25, 0.0, 12.0, 0, 50);
  if (pm25 <= 35.4) return interpolate(pm25, 12.1, 35.4, 51, 100);
  if (pm25 <= 55.4) return interpolate(pm25, 35.5, 55.4, 101, 150);
  if (pm25 <= 150.4) return interpolate(pm25, 55.5, 150.4, 151, 200);
  if (pm25 <= 250.4) return interpolate(pm25, 150.5, 250.4, 201, 300);
  if (pm25 <= 500.4) return interpolate(pm25, 250.5, 500.4, 301, 500);
  return 500;
}

/**
 * Calculates US EPA AQI sub-index for PM10 (µg/m³)
 */
export function calculateUsPm10Aqi(pm10: number): number {
  if (pm10 < 0) return 0;
  if (pm10 <= 54) return interpolate(pm10, 0, 54, 0, 50);
  if (pm10 <= 154) return interpolate(pm10, 55, 154, 51, 100);
  if (pm10 <= 254) return interpolate(pm10, 155, 254, 101, 150);
  if (pm10 <= 354) return interpolate(pm10, 255, 354, 151, 200);
  if (pm10 <= 424) return interpolate(pm10, 355, 424, 201, 300);
  if (pm10 <= 604) return interpolate(pm10, 425, 604, 301, 500);
  return 500;
}

/**
 * Calculates US EPA Overall AQI (max sub-index)
 */
export function calculateUsAqi(
  pm25: number | null,
  pm10: number | null
): number | null {
  const values: number[] = [];
  if (pm25 !== null && !isNaN(pm25)) {
    values.push(calculateUsPm25Aqi(pm25));
  }
  if (pm10 !== null && !isNaN(pm10)) {
    values.push(calculateUsPm10Aqi(pm10));
  }
  if (values.length === 0) return null;
  return Math.max(...values);
}

/**
 * Calculates Indian CPCB AQI sub-index for PM2.5 (µg/m³)
 */
export function calculateIndPm25Aqi(pm25: number): number {
  if (pm25 < 0) return 0;
  if (pm25 <= 30) return interpolate(pm25, 0, 30, 0, 50);
  if (pm25 <= 60) return interpolate(pm25, 31, 60, 51, 100);
  if (pm25 <= 90) return interpolate(pm25, 61, 90, 101, 200);
  if (pm25 <= 120) return interpolate(pm25, 91, 120, 201, 300);
  if (pm25 <= 250) return interpolate(pm25, 121, 250, 301, 400);
  return interpolate(Math.min(pm25, 500), 251, 500, 401, 500);
}

/**
 * Calculates Indian CPCB AQI sub-index for PM10 (µg/m³)
 */
export function calculateIndPm10Aqi(pm10: number): number {
  if (pm10 < 0) return 0;
  if (pm10 <= 50) return interpolate(pm10, 0, 50, 0, 50);
  if (pm10 <= 100) return interpolate(pm10, 51, 100, 51, 100);
  if (pm10 <= 250) return interpolate(pm10, 101, 250, 101, 200);
  if (pm10 <= 350) return interpolate(pm10, 251, 350, 201, 300);
  if (pm10 <= 430) return interpolate(pm10, 351, 430, 301, 400);
  return interpolate(Math.min(pm10, 600), 431, 600, 401, 500);
}

/**
 * Calculates a PM2.5/PM10-only Indian AQI estimate, not the official CPCB overall AQI.
 */
export function calculateIndAqi(
  pm25: number | null,
  pm10: number | null
): number | null {
  const values: number[] = [];
  if (pm25 !== null && !isNaN(pm25)) {
    values.push(calculateIndPm25Aqi(pm25));
  }
  if (pm10 !== null && !isNaN(pm10)) {
    values.push(calculateIndPm10Aqi(pm10));
  }
  if (values.length === 0) return null;
  return Math.max(...values);
}

/**
 * Category & Advice for European AQI (EAQI)
 * EAQI scale: 0-20 Good, 20-40 Fair, 40-60 Moderate, 60-80 Poor, 80-100 Very Poor, >100 Extremely Poor
 */
export function getEaqiCategory(eaqi: number | null): AQICategory {
  if (eaqi === null || isNaN(eaqi)) {
    return {
      category: 'Unknown',
      color: '#94A3B8',
      bgClass: 'bg-slate-500/10',
      borderClass: 'border-slate-500/30',
      textClass: 'text-slate-400',
      level: 0,
      healthSummary: 'Air quality index data currently unavailable.',
      outdoorAdvice: 'Check back shortly for updated measurements.',
      maskAdvice: 'Not determined.',
      ventilationAdvice: 'Maintain usual indoor ventilation.',
    };
  }

  if (eaqi <= 20) {
    return {
      category: 'Good',
      color: '#22C55E',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/40',
      textClass: 'text-emerald-400',
      level: 1,
      healthSummary: 'Air quality is excellent. Air pollution poses little to no risk.',
      outdoorAdvice: 'Perfect for all outdoor activities, running, and sports.',
      maskAdvice: 'No mask required for general public or sensitive groups.',
      ventilationAdvice: 'Open windows freely to ventilate living and workspaces.',
    };
  } else if (eaqi <= 40) {
    return {
      category: 'Fair',
      color: '#84CC16',
      bgClass: 'bg-lime-500/15',
      borderClass: 'border-lime-500/40',
      textClass: 'text-lime-400',
      level: 2,
      healthSummary: 'Air quality is acceptable. Very sensitive individuals may experience minor irritation.',
      outdoorAdvice: 'Enjoy normal outdoor recreation. Highly sensitive individuals should watch for symptoms.',
      maskAdvice: 'Generally unnecessary. Sensitive individuals with respiratory issues may carry a mask.',
      ventilationAdvice: 'Good time for natural indoor ventilation.',
    };
  } else if (eaqi <= 60) {
    return {
      category: 'Moderate',
      color: '#EAB308',
      bgClass: 'bg-amber-500/15',
      borderClass: 'border-amber-500/40',
      textClass: 'text-amber-400',
      level: 3,
      healthSummary: 'Air pollution is noticeable. Children, elderly, and people with lung/heart disease should take care.',
      outdoorAdvice: 'Reduce strenuous outdoor exertion if experiencing coughing or throat irritation.',
      maskAdvice: 'Recommended for sensitive individuals during prolonged outdoor stays.',
      ventilationAdvice: 'Ventilate during periods of lowest pollution (typically early morning or after rain).',
    };
  } else if (eaqi <= 80) {
    return {
      category: 'Poor',
      color: '#F97316',
      bgClass: 'bg-orange-500/15',
      borderClass: 'border-orange-500/40',
      textClass: 'text-orange-400',
      level: 4,
      healthSummary: 'Air quality is poor. Everyone may begin to experience minor health effects; sensitive groups more severe.',
      outdoorAdvice: 'Avoid prolonged or intense outdoor exercise. Move activities indoors.',
      maskAdvice: 'N95 or FFP2 respirator mask advised when stepping outdoors.',
      ventilationAdvice: 'Keep windows closed; run HEPA air purifiers indoors.',
    };
  } else if (eaqi <= 100) {
    return {
      category: 'Very Poor',
      color: '#EF4444',
      bgClass: 'bg-rose-500/15',
      borderClass: 'border-rose-500/40',
      textClass: 'text-rose-400',
      level: 5,
      healthSummary: 'Health alert: Serious risk of respiratory irritation for the entire population.',
      outdoorAdvice: 'Strictly avoid outdoor physical exertion. Stay indoors with filtered air.',
      maskAdvice: 'Wear a well-fitted N95 / FFP2 mask outdoors at all times.',
      ventilationAdvice: 'Seal windows and doors tightly. Use air purifiers in auto-high mode.',
    };
  } else {
    return {
      category: 'Extremely Poor',
      color: '#A855F7',
      bgClass: 'bg-purple-500/15',
      borderClass: 'border-purple-500/40',
      textClass: 'text-purple-400',
      level: 6,
      healthSummary: 'Emergency condition: Hazardous pollution levels affecting all residents severely.',
      outdoorAdvice: 'Stay strictly indoors. Do not engage in any outdoor sports or walks.',
      maskAdvice: 'Respirators (N95/FFP3) mandatory if outdoors. Minimize any exposure.',
      ventilationAdvice: 'Keep all outdoor vents closed. Create a clean room with continuous HEPA filtration.',
    };
  }
}

/**
 * Category & Advice for US AQI
 * 0-50 Good, 51-100 Moderate, 101-150 USG, 151-200 Unhealthy, 201-300 Very Unhealthy, 301+ Hazardous
 */
export function getUsAqiCategory(aqi: number | null): AQICategory {
  if (aqi === null || isNaN(aqi)) {
    return getEaqiCategory(null);
  }

  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#22C55E',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/40',
      textClass: 'text-emerald-400',
      level: 1,
      healthSummary: 'Air quality is satisfactory, and air pollution poses little or no risk.',
      outdoorAdvice: 'Great conditions for outdoor exercise and recreation.',
      maskAdvice: 'No mask required.',
      ventilationAdvice: 'Ideal for ventilating indoor spaces with fresh air.',
    };
  } else if (aqi <= 100) {
    return {
      category: 'Moderate',
      color: '#EAB308',
      bgClass: 'bg-amber-500/15',
      borderClass: 'border-amber-500/40',
      textClass: 'text-amber-400',
      level: 2,
      healthSummary: 'Air quality is acceptable. Unusually sensitive individuals may notice mild respiratory symptoms.',
      outdoorAdvice: 'Active children and adults with respiratory illness should limit prolonged exertion.',
      maskAdvice: 'Optional; recommended for individuals with severe asthma.',
      ventilationAdvice: 'Ventilate during low-traffic afternoon hours.',
    };
  } else if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: '#F97316',
      bgClass: 'bg-orange-500/15',
      borderClass: 'border-orange-500/40',
      textClass: 'text-orange-400',
      level: 3,
      healthSummary: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
      outdoorAdvice: 'Sensitive groups should reduce prolonged outdoor exertion; take frequent breaks.',
      maskAdvice: 'N95 masks advised for children, seniors, and heart/lung patients.',
      ventilationAdvice: 'Keep windows closed during peak commute hours; run air purifiers.',
    };
  } else if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      color: '#EF4444',
      bgClass: 'bg-rose-500/15',
      borderClass: 'border-rose-500/40',
      textClass: 'text-rose-400',
      level: 4,
      healthSummary: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
      outdoorAdvice: 'Avoid prolonged outdoor exertion. Move fitness sessions indoors.',
      maskAdvice: 'Wear a certified N95 or KN95 mask whenever outdoors.',
      ventilationAdvice: 'Seal windows and doors; run indoor filtration.',
    };
  } else if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      color: '#A855F7',
      bgClass: 'bg-purple-500/15',
      borderClass: 'border-purple-500/40',
      textClass: 'text-purple-400',
      level: 5,
      healthSummary: 'Health alert: Increased risk of aggravating heart or lung disease and other adverse effects.',
      outdoorAdvice: 'Avoid all outdoor activities. Sensitive groups should remain indoors in a clean room.',
      maskAdvice: 'N95 respirator required for any essential outdoor transit.',
      ventilationAdvice: 'Keep windows firmly closed. Clean air purifier filters.',
    };
  } else {
    return {
      category: 'Hazardous',
      color: '#881337',
      bgClass: 'bg-red-950/40',
      borderClass: 'border-rose-700/60',
      textClass: 'text-rose-300',
      level: 6,
      healthSummary: 'Emergency conditions: The entire population is more likely to be affected by serious health complications.',
      outdoorAdvice: 'Remain strictly indoors. Avoid all physical activities.',
      maskAdvice: 'High-grade N95/FFP3 respirator compulsory if going outside.',
      ventilationAdvice: 'Strict indoor quarantine with high-grade HEPA filters running continuously.',
    };
  }
}

/**
 * Category & Advice for Indian CPCB AQI
 * 0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401-500 Severe
 */
export function getIndAqiCategory(aqi: number | null): AQICategory {
  if (aqi === null || isNaN(aqi)) {
    return getEaqiCategory(null);
  }

  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#22C55E',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/40',
      textClass: 'text-emerald-400',
      level: 1,
      healthSummary: 'Minimal health impact. Air quality is clean and safe.',
      outdoorAdvice: 'Optimal conditions for morning walks, jogging, and outdoor sports.',
      maskAdvice: 'No mask needed.',
      ventilationAdvice: 'Keep windows and doors open for cross ventilation.',
    };
  } else if (aqi <= 100) {
    return {
      category: 'Satisfactory',
      color: '#84CC16',
      bgClass: 'bg-lime-500/15',
      borderClass: 'border-lime-500/40',
      textClass: 'text-lime-400',
      level: 2,
      healthSummary: 'Minor breathing discomfort to sensitive people with lung problems.',
      outdoorAdvice: 'Safe for most outdoor recreation. Sensitive individuals take normal precautions.',
      maskAdvice: 'Generally not needed.',
      ventilationAdvice: 'Good for natural ventilation during non-peak hours.',
    };
  } else if (aqi <= 200) {
    return {
      category: 'Moderate',
      color: '#EAB308',
      bgClass: 'bg-amber-500/15',
      borderClass: 'border-amber-500/40',
      textClass: 'text-amber-400',
      level: 3,
      healthSummary: 'Breathing discomfort to people with asthma, heart disease, and children.',
      outdoorAdvice: 'Reduce intense outdoor workout duration. Avoid high-traffic corridors.',
      maskAdvice: 'Mask recommended for vulnerable individuals.',
      ventilationAdvice: 'Keep windows closed during evening rush hours.',
    };
  } else if (aqi <= 300) {
    return {
      category: 'Poor',
      color: '#F97316',
      bgClass: 'bg-orange-500/15',
      borderClass: 'border-orange-500/40',
      textClass: 'text-orange-400',
      level: 4,
      healthSummary: 'Breathing discomfort to most people on prolonged exposure.',
      outdoorAdvice: 'Avoid vigorous outdoor jogging or cycling. Move workouts indoors.',
      maskAdvice: 'Wear N95/pollution mask when outdoors.',
      ventilationAdvice: 'Keep windows closed; switch on air purifiers.',
    };
  } else if (aqi <= 400) {
    return {
      category: 'Very Poor',
      color: '#EF4444',
      bgClass: 'bg-rose-500/15',
      borderClass: 'border-rose-500/40',
      textClass: 'text-rose-400',
      level: 5,
      healthSummary: 'Respiratory illness to the general public on prolonged exposure.',
      outdoorAdvice: 'Stay indoors. Elderly, children, and heart/lung patients avoid all outdoor exposure.',
      maskAdvice: 'N95 mask compulsory outside.',
      ventilationAdvice: 'Keep indoor spaces sealed with HEPA filtration.',
    };
  } else {
    return {
      category: 'Severe',
      color: '#881337',
      bgClass: 'bg-red-950/40',
      borderClass: 'border-rose-700/60',
      textClass: 'text-rose-300',
      level: 6,
      healthSummary: 'Affects healthy people and seriously impacts those with existing diseases.',
      outdoorAdvice: 'Stay strictly indoors. Stop all outdoor activity and transit.',
      maskAdvice: 'Fitted N95/FFP3 respirator required if stepping out.',
      ventilationAdvice: 'Maintain closed clean room environment.',
    };
  }
}

/**
 * Universal category accessor given the active scale
 */
export function getCategoryForScale(
  value: number | null,
  scale: AQIScale
): AQICategory {
  if (scale === 'EAQI') {
    return getEaqiCategory(value);
  } else if (scale === 'USAQI') {
    return getUsAqiCategory(value);
  } else {
    return getIndAqiCategory(value);
  }
}

/**
 * Identifies the dominant pollutant from available measurements
 */
export function getDominantPollutant(pollutants: {
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
}): string | null {
  const scores: { name: string; score: number }[] = [];

  // Relative severity weight based on WHO 24-hr guideline thresholds:
  // PM2.5: 15 µg/m³
  // PM10: 45 µg/m³
  // NO2: 25 µg/m³
  // O3: 100 µg/m³ (8-hr)
  // SO2: 40 µg/m³
  // CO: 4000 µg/m³ (approx 4 mg/m³)
  if (pollutants.pm2_5 !== null && pollutants.pm2_5 > 0) {
    scores.push({ name: 'PM2.5', score: pollutants.pm2_5 / 15 });
  }
  if (pollutants.pm10 !== null && pollutants.pm10 > 0) {
    scores.push({ name: 'PM10', score: pollutants.pm10 / 45 });
  }
  if (pollutants.no2 !== null && pollutants.no2 > 0) {
    scores.push({ name: 'NO2', score: pollutants.no2 / 25 });
  }
  if (pollutants.o3 !== null && pollutants.o3 > 0) {
    scores.push({ name: 'Ozone (O3)', score: pollutants.o3 / 100 });
  }
  if (pollutants.so2 !== null && pollutants.so2 > 0) {
    scores.push({ name: 'SO2', score: pollutants.so2 / 40 });
  }
  if (pollutants.co !== null && pollutants.co > 0) {
    scores.push({ name: 'CO', score: pollutants.co / 4000 });
  }

  if (scores.length === 0) return null;
  scores.sort((a, b) => b.score - a.score);
  return scores[0].name;
}
