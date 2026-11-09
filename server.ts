import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Initialize GoogleGenAI server-side with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    hasGeminiKey: Boolean(apiKey),
  });
});

// Gemini Assistant Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required' });
    }

    if (!apiKey || !ai) {
      return res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your environment variables or Secrets panel.',
      });
    }

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
Coordinates: Lat ${context.latitude}, Lon ${context.longitude}
Measurement Timestamp: ${context.timestamp || 'N/A'}
European AQI (EAQI): ${context.europeanAqi != null ? context.europeanAqi : 'N/A'} (${context.aqiCategory || 'N/A'})
US AQI: ${context.usAqi != null ? context.usAqi : 'N/A'}
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
      config: {
        systemInstruction,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini API',
    });
  }
});

// Vite middleware for dev or static serving for prod
if (!isProd) {
  const fs = await import('fs');
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BreatheX server running on port ${PORT} (mode: ${isProd ? 'production' : 'development'})`);
});
