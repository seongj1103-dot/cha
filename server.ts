import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAiFeedback, handleSheetsProxy } from './src/server/apiHandlers.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// 1. Gemini AI Feedback & Hanja Study Assistant
app.post('/api/ai/feedback', async (req: Request, res: Response) => {
  const result = await handleAiFeedback(req.body);
  return res.status(result.status).json(result.data);
});

// 2. Google Apps Script Proxy Endpoint
app.post('/api/sheets/proxy', async (req: Request, res: Response) => {
  const result = await handleSheetsProxy(req.body);
  return res.status(result.status).json(result.data);
});

// Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`4급 한자 단어장 서버 실행 중: http://localhost:${port}`);
});
