import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';
import {
  generateAirQualityAnswer,
  type GeminiContext,
} from '../../src/services/geminiServer.js';

interface ChatRequestBody {
  message?: unknown;
  context?: GeminiContext;
}

type VercelRequest = IncomingMessage & { body?: ChatRequestBody };
type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Valid message string is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY to the Vercel project environment variables.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
    const text = await generateAirQualityAnswer(ai, message, context);
    return res.status(200).json({ text });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate response from Gemini API',
    });
  }
}
