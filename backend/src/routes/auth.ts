import { FastifyInstance } from 'fastify';
import { db, schema } from '../db/client';
import { eq, or, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_USE_SSL === 'true',
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });
}

export async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/register
  app.post('/register', async (req, reply) => {
    const { username, email, password } = req.body as {
      username: string; email: string; password: string;
    };

    if (!username || !email || !password)
      return reply.status(400).send({ error: 'Все поля обязательны' });
    if (password.length < 8)
      return reply.status(400).send({ error: 'Пароль должен быть не менее 8 символов' });

    // Check unique
    const existing = await db.select().from(schema.users)
      .where(or(ilike(schema.users.username, username), ilike(schema.users.email, email)))
      .limit(1);

    if (existing.length) {
      const field = existing[0].username.toLowerCase() === username.toLowerCase() ? 'Username' : 'Email';
      return reply.status(400).send({ error: `${field}: пользователь с таким значением уже существует.` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Get next displayId
    const allUsers = await db.select({ displayId: schema.users.displayId }).from(schema.users);
    const maxId = allUsers.reduce((m, u) => Math.max(m, u.displayId ?? 0), 0);

    const [user] = await db.insert(schema.users).values({
      username,
      email: email.toLowerCase(),
      passwordHash,
      displayId: maxId + 1,
    }).returning();

    const token = app.jwt.sign({ id: user.id, username: user.username }, { expiresIn: '7d' });
    const refresh = app.jwt.sign({ id: user.id, type: 'refresh' }, { expiresIn: '30d' });

    return reply.status(201).send({
      user: sanitizeUser(user),
      tokens: { access: token, refresh },
    });
  });

  // POST /api/auth/login
  app.post('/login', async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password)
      return reply.status(400).send({ error: 'Логин и пароль обязательны' });

    const isEmail = username.includes('@');
    const users = await db.select().from(schema.users)
      .where(isEmail ? ilike(schema.users.email, username) : ilike(schema.users.username, username))
      .limit(1);

    if (!users.length) return reply.status(401).send({ error: 'Пользователь не найден' });

    const user = users[0];
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.status(401).send({ error: 'Пароль не верный' });

    // Update last_seen
    await db.update(schema.users).set({ lastSeen: new Date() }).where(eq(schema.users.id, user.id));

    const token = app.jwt.sign({ id: user.id, username: user.username }, { expiresIn: '7d' });
    const refresh = app.jwt.sign({ id: user.id, type: 'refresh' }, { expiresIn: '30d' });

    return { user: sanitizeUser(user), tokens: { access: token, refresh } };
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: requireAuth }, async (req) => {
    const uid = (req.user as any).id;
    const users = await db.select().from(schema.users).where(eq(schema.users.id, uid)).limit(1);
    if (!users.length) throw new Error('User not found');
    return sanitizeUser(users[0]);
  });

  // PATCH /api/auth/me
  app.patch('/me', { preHandler: requireAuth }, async (req, reply) => {
    const uid = (req.user as any).id;
    const body = req.body as Record<string, any>;
    const allowed = ['bio', 'gender', 'birthDate', 'telegram', 'discord', 'youtube', 'twitch', 'isPrivate'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (!Object.keys(updates).length) return reply.status(400).send({ error: 'Нет данных для обновления' });
    await db.update(schema.users).set(updates).where(eq(schema.users.id, uid));
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, uid)).limit(1);
    return sanitizeUser(user);
  });

  // POST /api/auth/me/avatar
  app.post('/me/avatar', { preHandler: requireAuth }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'Файл не найден' });
    
    const uid = (req.user as any).id;
    const ext = path.extname(data.filename) || '.png';
    const filename = `avatar_${uid}_${Date.now()}${ext}`;
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filepath = path.join(uploadDir, filename);
    await pump(data.file, fs.createWriteStream(filepath));
    
    const backendUrl = process.env.API_BASE_URL ?? process.env.VITE_API_URL ?? 'http://localhost:8000';
    const avatarUrl = `${backendUrl}/uploads/avatars/${filename}`;
    
    await db.update(schema.users).set({ avatar: avatarUrl }).where(eq(schema.users.id, uid));
    
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, uid)).limit(1);
    return sanitizeUser(user);
  });

  // POST /api/auth/me/password
  app.post('/me/password', { preHandler: requireAuth }, async (req, reply) => {
    const uid = (req.user as any).id;
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
    if (!oldPassword || !newPassword) return reply.status(400).send({ error: 'Поля обязательны' });
    if (newPassword.length < 8) return reply.status(400).send({ error: 'Минимум 8 символов' });

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, uid)).limit(1);
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) return reply.status(400).send({ error: 'Неверный текущий пароль' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, uid));
    return { message: 'Пароль успешно изменён' };
  });

  // POST /api/auth/forgot-password
  app.post('/forgot-password', async (req, reply) => {
    const { email } = req.body as { email: string };
    if (!email) return reply.status(400).send({ error: 'Email обязателен' });

    const users = await db.select().from(schema.users)
      .where(ilike(schema.users.email, email)).limit(1);

    if (users.length) {
      const user = users[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await db.insert(schema.passwordResets).values({ userId: user.id, token, expiresAt });

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      try {
        await getTransport().sendMail({
          from: process.env.DEFAULT_FROM_EMAIL ?? 'noreply@otakuhub.su',
          to: user.email,
          subject: 'Восстановление пароля — OtakuHub',
          text: `Перейдите по ссылке для сброса пароля: ${resetLink}\n\nЕсли вы не запрашивали смену пароля — проигнорируйте это письмо.`,
        });
      } catch (e) {
        console.error('Email send error:', e);
      }
    }

    return { message: 'Инструкции отправлены на почту, если аккаунт существует.' };
  });

  // POST /api/auth/reset-password
  app.post('/reset-password', async (req, reply) => {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) return reply.status(400).send({ error: 'Все поля обязательны' });
    if (password.length < 8) return reply.status(400).send({ error: 'Минимум 8 символов' });

    const resets = await db.select().from(schema.passwordResets)
      .where(eq(schema.passwordResets.token, token)).limit(1);

    if (!resets.length || resets[0].used || resets[0].expiresAt < new Date())
      return reply.status(400).send({ error: 'Ссылка недействительна или устарела' });

    const reset = resets[0];
    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, reset.userId));
    await db.update(schema.passwordResets).set({ used: true }).where(eq(schema.passwordResets.id, reset.id));

    return { message: 'Пароль успешно изменён. Теперь вы можете войти.' };
  });
}

async function requireAuth(req: any, reply: any) {
  try { await req.jwtVerify(); } catch { reply.status(401).send({ error: 'Требуется авторизация' }); }
}

function sanitizeUser(u: any) {
  const { passwordHash, ...safe } = u;
  return safe;
}
