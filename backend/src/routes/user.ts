import { FastifyInstance } from 'fastify';
import { db, schema } from '../db/client';
import { eq, desc, and } from 'drizzle-orm';

export async function userRoutes(app: FastifyInstance) {

  async function requireAuth(req: any, reply: any) {
    try { await req.jwtVerify(); } catch { reply.status(401).send({ error: 'Требуется авторизация' }); }
  }

  // ─── Anime Lists ───

  // GET /api/user/lists
  app.get('/lists', { preHandler: requireAuth }, async (req) => {
    const uid = (req.user as any).id;
    const { status } = req.query as { status?: string };
    const query = db.select().from(schema.animeLists).where(
      status
        ? and(eq(schema.animeLists.userId, uid), eq(schema.animeLists.status, status))
        : eq(schema.animeLists.userId, uid)
    ).orderBy(desc(schema.animeLists.updatedAt));
    return query;
  });

  // POST /api/user/lists
  app.post('/lists', { preHandler: requireAuth }, async (req, reply) => {
    const uid = (req.user as any).id;
    const { release_id, status, release_title, release_poster, score } = req.body as any;

    if (!release_id) return reply.status(400).send({ error: 'release_id обязателен' });

    // Delete if status is empty
    if (status === '') {
      await db.delete(schema.animeLists)
        .where(and(eq(schema.animeLists.userId, uid), eq(schema.animeLists.releaseId, release_id)));
      return reply.status(204).send();
    }

    const [entry] = await db.insert(schema.animeLists).values({
      userId: uid,
      releaseId: release_id,
      releaseTitle: release_title ?? '',
      releasePoster: release_poster,
      status,
      score,
    }).onConflictDoUpdate({
      target: [schema.animeLists.userId, schema.animeLists.releaseId],
      set: { status, releasePoster: release_poster, releaseTitle: release_title, score, updatedAt: new Date() },
    }).returning();

    return reply.status(201).send(entry);
  });

  // DELETE /api/user/lists/:entryId
  app.delete('/lists/:entryId', { preHandler: requireAuth }, async (req, reply) => {
    const uid = (req.user as any).id;
    const { entryId } = req.params as { entryId: string };
    await db.delete(schema.animeLists)
      .where(and(eq(schema.animeLists.id, Number(entryId)), eq(schema.animeLists.userId, uid)));
    return reply.status(204).send();
  });

  // ─── Watch History ───

  // GET /api/user/history
  app.get('/history', { preHandler: requireAuth }, async (req) => {
    const uid = (req.user as any).id;
    return db.select().from(schema.watchHistory)
      .where(eq(schema.watchHistory.userId, uid))
      .orderBy(desc(schema.watchHistory.updatedAt))
      .limit(50);
  });

  // POST /api/user/history
  app.post('/history', { preHandler: requireAuth }, async (req, reply) => {
    const uid = (req.user as any).id;
    const { release_id, release_title, release_poster, episode_id, episode_ordinal, current_time, duration } = req.body as any;

    if (!release_id || !episode_id) return reply.status(400).send({ error: 'release_id и episode_id обязательны' });

    const [entry] = await db.insert(schema.watchHistory).values({
      userId: uid,
      releaseId: release_id,
      releaseTitle: release_title ?? '',
      releasePoster: release_poster,
      episodeId: episode_id,
      episodeOrdinal: episode_ordinal ?? 1,
      currentTime: current_time ?? 0,
      duration: duration ?? 0,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [schema.watchHistory.userId, schema.watchHistory.releaseId, schema.watchHistory.episodeId],
      set: { currentTime: current_time, duration, episodeOrdinal: episode_ordinal, updatedAt: new Date() },
    }).returning();

    return entry;
  });

  // DELETE /api/user/history/:entryId
  app.delete('/history/:entryId', { preHandler: requireAuth }, async (req, reply) => {
    const uid = (req.user as any).id;
    const { entryId } = req.params as { entryId: string };
    await db.delete(schema.watchHistory)
      .where(and(eq(schema.watchHistory.id, Number(entryId)), eq(schema.watchHistory.userId, uid)));
    return reply.status(204).send();
  });
}
