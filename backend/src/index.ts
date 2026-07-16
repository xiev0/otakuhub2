console.log("👉 [1] Файл index.ts начал выполняться...");

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { animeRoutes } from './routes/anime';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("👉 [2] Импорты прошли успешно, создаем Fastify...");

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

// ─── Plugins ───
await app.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL ?? 'https://otakuhub.su',
  ],
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'otakuhub-secret-change-me-in-production',
});

await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

await app.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
});

// ─── Routes ───
await app.register(animeRoutes, { prefix: '/api/anime' });
await app.register(authRoutes,  { prefix: '/api/auth' });
await app.register(userRoutes,  { prefix: '/api/user' });

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start ───
console.log("👉 [3] Плагины и роуты зарегистрированы, запускаем сервер...");

const PORT = Number(process.env.PORT ?? 8000);
const HOST = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`🚀 OtakuHub2 backend running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}