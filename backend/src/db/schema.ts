import { pgTable, serial, varchar, text, boolean, integer, real, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// ─── Users ───
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  displayId: integer('display_id').unique(),
  username: varchar('username', { length: 150 }).notNull().unique(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  banner: varchar('banner', { length: 500 }),
  bio: text('bio').default(''),
  gender: varchar('gender', { length: 10 }).default('unknown'),
  isStaff: boolean('is_staff').default(false),
  isPrivate: boolean('is_private').default(false),
  birthDate: varchar('birth_date', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
  lastSeen: timestamp('last_seen'),
  // Social
  telegram: varchar('telegram', { length: 100 }).default(''),
  discord: varchar('discord', { length: 100 }).default(''),
  youtube: varchar('youtube', { length: 100 }).default(''),
  twitch: varchar('twitch', { length: 100 }).default(''),
});

// ─── Password Reset Tokens ───
export const passwordResets = pgTable('password_resets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Anime List ───
export const animeLists = pgTable('anime_lists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  releaseId: integer('release_id').notNull(),
  releaseTitle: varchar('release_title', { length: 255 }).default(''),
  releasePoster: varchar('release_poster', { length: 500 }),
  status: varchar('status', { length: 20 }).notNull(), // watching, planned, completed, on_hold, dropped
  episodesWatched: integer('episodes_watched').default(0),
  score: integer('score'),
  addedAt: timestamp('added_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  uniqUserRelease: uniqueIndex('uniq_user_release').on(t.userId, t.releaseId),
}));

// ─── Watch History ───
export const watchHistory = pgTable('watch_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  releaseId: integer('release_id').notNull(),
  releaseTitle: varchar('release_title', { length: 255 }).default(''),
  releasePoster: varchar('release_poster', { length: 500 }),
  episodeId: varchar('episode_id', { length: 100 }).notNull(),
  episodeOrdinal: integer('episode_ordinal').default(1),
  currentTime: real('current_time').default(0),
  duration: real('duration').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  uniqUserEp: uniqueIndex('uniq_user_ep').on(t.userId, t.releaseId, t.episodeId),
}));

// ─── Anime Comments ───
export const animeComments = pgTable('anime_comments', {
  id: serial('id').primaryKey(),
  releaseId: integer('release_id').notNull(),
  userId: integer('user_id').notNull(),
  text: text('text').notNull(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Anime Ratings ───
export const animeRatings = pgTable('anime_ratings', {
  id: serial('id').primaryKey(),
  releaseId: integer('release_id').notNull(),
  userId: integer('user_id').notNull(),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqUserRating: uniqueIndex('uniq_user_rating').on(t.userId, t.releaseId),
}));
