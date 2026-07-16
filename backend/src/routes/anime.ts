import { FastifyInstance } from 'fastify';
import { db, schema } from '../db/client';
import { eq, desc, and } from 'drizzle-orm';
import * as anilibria from '../services/anilibria';
import * as shikimori from '../services/shikimori';
import * as kodik from '../services/kodik';
import * as malibria from '../services/malibria';

export async function animeRoutes(app: FastifyInstance) {

  app.get('/latest', async (req, reply) => {
    const { limit = '12' } = req.query as { limit?: string };
    return await shikimori.getLatest(Number(limit));
  });

  app.get('/movie', async (req, reply) => {
    const { limit = '12' } = req.query as { limit?: string };
    const releases = await shikimori.getMovie(Number(limit));
    return releases;
  });

  app.get('/popular', async (req, reply) => {
    const { limit = '12' } = req.query as { limit?: string };
    return await shikimori.getPopular(Number(limit));
  });

  app.get('/random', async (req, reply) => {
    const { limit = '12' } = req.query as { limit?: string };
    return await shikimori.getRandom(Number(limit));
  });
// GET /api/anime/recommendations
  app.get('/recommendations', async (req, reply) => {
    const { limit = '12' } = req.query as { limit?: string };
    const releases = await anilibria.getRecommendedReleases(Number(limit));
    return releases.map(anilibria.mapRelease);
  });

  app.get('/schedule', async () => {
    return await shikimori.getSchedule();
  });

  app.get('/search', async (req) => {
    const { q = '', limit = '10' } = req.query as { q?: string; limit?: string };
    if (!q.trim()) return [];
    return await shikimori.searchTitles(q, Number(limit));
  });

// GET /api/anime/:id  — теперь id это Шикимори id
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const release = await shikimori.getTitleById(id);
    if (!release) return reply.status(404).send({ error: 'Not found' });
    return release;
  });

// GET /api/anime/:id/episodes — Шикимори id на входе, возвращает оба источника плеера
  app.get('/:id/episodes', async (req, reply) => {
    const { id } = req.params as { id: string };

    const [anilibriaId, kodikSources] = await Promise.all([
      malibria.getAnilibriaIdByShikimori(Number(id)),
      kodik.getKodikSourcesByShikimoriId(id),
    ]);

    const anilibriaSources = anilibriaId
        ? await anilibria.getHlsEpisodesByAnilibriaId(anilibriaId)
        : [];

    if (!anilibriaSources.length && !kodikSources.length) {
      return reply.status(404).send({ error: 'Эпизоды не найдены ни в одном источнике' });
    }

    return {
      anilibria: anilibriaSources.length ? anilibriaSources : null,
      kodik: kodikSources.length ? kodikSources : null,
    };
  });

  // GET /api/anime/:id/comments
  app.get('/:id/comments', async (req) => {
    const { id } = req.params as { id: string };
    const comments = await db
      .select({
        id: schema.animeComments.id,
        text: schema.animeComments.text,
        createdAt: schema.animeComments.createdAt,
        parentId: schema.animeComments.parentId,
        userId: schema.animeComments.userId,
        username: schema.users.username,
        avatar: schema.users.avatar,
      })
      .from(schema.animeComments)
      .leftJoin(schema.users, eq(schema.animeComments.userId, schema.users.id))
      .where(eq(schema.animeComments.releaseId, Number(id)))
      .orderBy(desc(schema.animeComments.createdAt));
    return comments;
  });

  // POST /api/anime/:id/comments  [auth required]
  app.post('/:id/comments', { preHandler: [async (req, reply) => {
    try { await req.jwtVerify(); } catch { reply.status(401).send({ error: 'Требуется авторизация' }); }
  }]}, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { text, parentId } = req.body as { text: string; parentId?: number };
    const userId = (req.user as any).id;

    if (!text?.trim()) return reply.status(400).send({ error: 'Текст обязателен' });

    const [comment] = await db.insert(schema.animeComments).values({
      releaseId: Number(id),
      userId,
      text: text.trim(),
      parentId: parentId ?? null,
    }).returning();

    const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    return { ...comment, username: user[0]?.username, avatar: user[0]?.avatar };
  });

  // GET /api/anime/:id/ratings
  app.get('/:id/ratings', async (req) => {
    const { id } = req.params as { id: string };
    const ratings = await db
      .select({ score: schema.animeRatings.score })
      .from(schema.animeRatings)
      .where(eq(schema.animeRatings.releaseId, Number(id)));

    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
      : 0;

    let userScore: number | null = null;
    try {
      await req.jwtVerify();
      const uid = (req.user as any).id;
      const r = await db
        .select()
        .from(schema.animeRatings)
        .where(and(eq(schema.animeRatings.releaseId, Number(id)), eq(schema.animeRatings.userId, uid)))
        .limit(1);
      userScore = r[0]?.score ?? null;
    } catch {}

    return { average: Math.round(avg * 10) / 10, count: ratings.length, userScore };
  });

  // POST /api/anime/:id/ratings  [auth required]
  app.post('/:id/ratings', { preHandler: [async (req, reply) => {
    try { await req.jwtVerify(); } catch { reply.status(401).send({ error: 'Требуется авторизация' }); }
  }]}, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { score } = req.body as { score: number };
    const userId = (req.user as any).id;

    if (!score || score < 1 || score > 10) return reply.status(400).send({ error: 'Score 1-10' });

    await db
      .insert(schema.animeRatings)
      .values({ releaseId: Number(id), userId, score })
      .onConflictDoUpdate({
        target: [schema.animeRatings.userId, schema.animeRatings.releaseId],
        set: { score },
      });

    return { success: true };
  });
}
