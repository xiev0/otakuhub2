CREATE TABLE "anime_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"release_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"text" text NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anime_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"release_id" integer NOT NULL,
	"release_title" varchar(255) DEFAULT '',
	"release_poster" varchar(500),
	"status" varchar(20) NOT NULL,
	"episodes_watched" integer DEFAULT 0,
	"score" integer,
	"added_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anime_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"release_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_id" integer,
	"username" varchar(150) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"avatar" varchar(500),
	"banner" varchar(500),
	"bio" text DEFAULT '',
	"gender" varchar(10) DEFAULT 'unknown',
	"is_staff" boolean DEFAULT false,
	"is_private" boolean DEFAULT false,
	"birth_date" varchar(10),
	"created_at" timestamp DEFAULT now(),
	"last_seen" timestamp,
	"telegram" varchar(100) DEFAULT '',
	"discord" varchar(100) DEFAULT '',
	"youtube" varchar(100) DEFAULT '',
	"twitch" varchar(100) DEFAULT '',
	CONSTRAINT "users_display_id_unique" UNIQUE("display_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watch_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"release_id" integer NOT NULL,
	"release_title" varchar(255) DEFAULT '',
	"release_poster" varchar(500),
	"episode_id" varchar(100) NOT NULL,
	"episode_ordinal" integer DEFAULT 1,
	"current_time" real DEFAULT 0,
	"duration" real DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_release" ON "anime_lists" USING btree ("user_id","release_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_rating" ON "anime_ratings" USING btree ("user_id","release_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_ep" ON "watch_history" USING btree ("user_id","release_id","episode_id");