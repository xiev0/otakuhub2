import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import path from 'path';

import { animeRoutes } from './routes/anime';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';

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

// ─── Routes ───
await app.register(animeRoutes, { prefix: '/api/anime' });
await app.register(authRoutes,  { prefix: '/api/auth' });
await app.register(userRoutes,  { prefix: '/api/user' });

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start ───
const PORT = Number(process.env.PORT ?? 8000);
const HOST = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`🚀 OtakuHub2 backend running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
