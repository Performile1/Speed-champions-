import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// AI Livery Concept Generator
app.post('/api/gemini/generate-livery', async (req, res) => {
  try {
    const { prompt, currentModelName, era } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return high quality procedural fallbacks if API key is not configured
      const fallbackThemes = [
        {
          themeName: 'Cyberpunk Synthwave Neon',
          conceptDescription: 'A high-contrast night race livery with vibrant neon magenta and electric cyan highlights against deep satin matte black carbon aero surfaces.',
          colors: {
            nose: '#ec4899', // Pink
            frontWing: '#06b6d4', // Cyan
            halo: '#facc15', // Yellow
            cockpit: '#09090b', // Black
            sidepods: '#18181b', // Dark Zinc
            engineCover: '#ec4899', // Pink
            rearWing: '#06b6d4', // Cyan
            floor: '#27272a', // Zinc
            rims: '#facc15', // Gold
            tireCompound: '#e11d48', // Red Soft
            helmet: '#ec4899'
          },
          decals: {
            racingNumber: '77',
            sponsorPrimary: 'CYBER//TECH',
            sponsorSecondary: 'NEO MATRIX',
            sponsorEngine: 'QUANTUM POWER',
            liveryStyle: 'neon-split',
            accentStripe: '#06b6d4'
          },
          boxTitle: 'Cyberpunk 2077 Formula 1 Special Edition',
          boxSubtitle: 'Neo-Tokyo Night Grand Prix'
        },
        {
          themeName: 'Heritage Gulf Oil Classic',
          conceptDescription: 'The legendary light sky blue and radiant orange racing stripes reminiscent of 1960s-1970s Le Mans and Monaco Grand Prix winners.',
          colors: {
            nose: '#7dd3fc', // Baby Blue
            frontWing: '#f97316', // Orange
            halo: '#0284c7', // Deep Blue
            cockpit: '#1e293b', // Slate
            sidepods: '#7dd3fc', // Baby Blue
            engineCover: '#7dd3fc', // Baby Blue
            rearWing: '#f97316', // Orange
            floor: '#0f172a', // Dark Navy
            rims: '#f8fafc', // Classic White
            tireCompound: '#eab308', // Yellow Medium
            helmet: '#f97316'
          },
          decals: {
            racingNumber: '04',
            sponsorPrimary: 'GULF OIL',
            sponsorSecondary: 'TAG HEUER',
            sponsorEngine: 'PORSCHE HYBRID',
            liveryStyle: 'center-stripe',
            accentStripe: '#f97316'
          },
          boxTitle: 'Scuderia Heritage Gulf Tribute Edition',
          boxSubtitle: 'Monaco GP Historic Spec'
        },
        {
          themeName: 'John Player Special Gold & Stealth Black',
          conceptDescription: 'Unmistakable championship-winning heritage: High-gloss piano black bodywork with opulent metallic gold pinstriping and bronze wheels.',
          colors: {
            nose: '#18181b',
            frontWing: '#eab308',
            halo: '#eab308',
            cockpit: '#09090b',
            sidepods: '#18181b',
            engineCover: '#18181b',
            rearWing: '#eab308',
            floor: '#27272a',
            rims: '#ca8a04',
            tireCompound: '#f8fafc', // White Hard
            helmet: '#ca8a04'
          },
          decals: {
            racingNumber: '12',
            sponsorPrimary: 'JPS RACING',
            sponsorSecondary: 'CHAMPION',
            sponsorEngine: 'FORD COSWORTH',
            liveryStyle: 'gold-pinstripe',
            accentStripe: '#ca8a04'
          },
          boxTitle: 'Black & Gold Imperial Heritage GP',
          boxSubtitle: 'World Championship Commemorative'
        }
      ];

      const selected = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
      return res.json({ success: true, livery: selected, source: 'curated-procedural' });
    }

    const systemPrompt = `You are an elite LEGO Speed Champions master designer and Formula 1 livery artist.
The user wants a creative custom color scheme and decal configuration for a LEGO Speed Champions F1 model (${currentModelName || 'Modern 8-Stud F1'}).
User idea prompt: "${prompt || 'Surprise me with a legendary or futuristic racing livery'}"

Output strict JSON only with NO markdown fences, matching this schema:
{
  "themeName": "Short punchy name (e.g. Apex Viper Racing)",
  "conceptDescription": "1-2 sentence compelling rationale for this livery and materials.",
  "colors": {
    "nose": "#hex",
    "frontWing": "#hex",
    "halo": "#hex",
    "cockpit": "#hex",
    "sidepods": "#hex",
    "engineCover": "#hex",
    "rearWing": "#hex",
    "floor": "#hex",
    "rims": "#hex",
    "tireCompound": "#hex (red #e11d48 for Soft, yellow #eab308 for Medium, white #f8fafc for Hard, green #22c55e for Intermediate)",
    "helmet": "#hex"
  },
  "decals": {
    "racingNumber": "1-99 string",
    "sponsorPrimary": "Brand or fictional tech sponsor (e.g. ROLEX, VELO, AMD, ANDRETTI)",
    "sponsorSecondary": "Secondary brand (e.g. SHELL, MOBIL 1, AWS)",
    "sponsorEngine": "Engine partner (e.g. HONDA HRC, FERRARI 066/12, MERCEDES-AMG)",
    "liveryStyle": "center-stripe | two-tone | geometric-camo | gradient-fade | minimalist",
    "accentStripe": "#hex"
  },
  "boxTitle": "Speed Champions Box Title (e.g. Scuderia Custom Concept Race Car)",
  "boxSubtitle": "Special Edition Subtitle"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({ success: true, livery: parsed, source: 'gemini' });
  } catch (error: any) {
    console.error('Error generating AI livery:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate livery' });
  }
});

// Connect directly to Lego & BrickLink info
app.get('/api/lego/connect/:articleNumber', (req, res) => {
  const { articleNumber } = req.params;
  const officialUrl = `https://www.lego.com/en-us/product/${articleNumber}`;
  const brickLinkUrl = `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${articleNumber}-1`;
  const brickEconomyUrl = `https://www.brickeconomy.com/set/${articleNumber}-1`;
  const rebrickableUrl = `https://rebrickable.com/sets/${articleNumber}-1/`;

  res.json({
    articleNumber,
    officialUrl,
    brickLinkUrl,
    brickEconomyUrl,
    rebrickableUrl,
    timestamp: new Date().toISOString()
  });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LEGO F1 Speed Champions server running on http://0.0.0.0:${PORT}`);
  });
}

start();
