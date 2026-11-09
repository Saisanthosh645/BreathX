import { GoogleGenAI } from '@google/genai';

export interface GeminiContext {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  europeanAqi?: number | null;
  usAqi?: number | null;
  aqiCategory?: string;
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  o3?: number | null;
  co?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
}

export async function generateAirQualityAnswer(
  ai: GoogleGenAI,
  message: string,
  context?: GeminiContext
): Promise<string> {
  const systemInstruction = `You are BreatheX AI, an expert environmental and air quality intelligence advisor developed for the BreatheX Environmental Intelligence Platform.
Your mission is to help people understand real air pollution, health risks, historical trends, and forecasts in simple, scientifically sound language.

STRICT ACCURACY RULES:
1. Base your air quality answers strictly on the user's provided real-world data context (city, AQI, PM2.5, PM10, NO2, O3, SO2, weather).
2. Never invent or hallucinate missing measurements. If a pollutant or variable is marked N/A or unavailable, explicitly acknowledge that it is not measured or reported.
3. Clearly explain what AQI values mean (e.g. European AQI vs US AQI vs Indian AQI).
4. Provide practical, compassionate, actionable advice for sensitive groups (children, elderly, asthma/COPD patients, outdoor runners).
5. Always remind users for severe health symptoms that your educational guidance does not replace professional medical advice.
6. Keep answers structured, concise, and easy to read with bullet points when listing recommendations.`;

  let promptWithContext = message;
  if (context) {
    promptWithContext = `Current Location & Air Quality Data Context:
Location: ${context.city || 'Unknown'}, ${context.country || ''}
Coordinates: Lat ${context.latitude ?? 'N/A'}, Lon ${context.longitude ?? 'N/A'}
Measurement Timestamp: ${context.timestamp || 'N/A'}
European AQI (EAQI): ${context.europeanAqi ?? 'N/A'} (${context.aqiCategory || 'N/A'})
US AQI: ${context.usAqi ?? 'N/A'}
PM2.5: ${context.pm25 != null ? `${context.pm25} µg/m³` : 'N/A'}
PM10: ${context.pm10 != null ? `${context.pm10} µg/m³` : 'N/A'}
Nitrogen Dioxide (NO2): ${context.no2 != null ? `${context.no2} µg/m³` : 'N/A'}
Sulphur Dioxide (SO2): ${context.so2 != null ? `${context.so2} µg/m³` : 'N/A'}
Ozone (O3): ${context.o3 != null ? `${context.o3} µg/m³` : 'N/A'}
Carbon Monoxide (CO): ${context.co != null ? `${context.co} µg/m³` : 'N/A'}
Weather: Temperature ${context.temperature != null ? `${context.temperature}°C` : 'N/A'}, Humidity ${context.humidity != null ? `${context.humidity}%` : 'N/A'}, Wind Speed ${context.windSpeed != null ? `${context.windSpeed} km/h` : 'N/A'}

User Question:
${message}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: promptWithContext,
    config: { systemInstruction },
  });

  return response.text || 'No response received from BreatheX AI.';
}
