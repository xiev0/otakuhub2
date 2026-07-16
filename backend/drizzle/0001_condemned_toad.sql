CREATE TABLE "poster_cache" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"poster_url" text,
	"updated_at" timestamp DEFAULT now()
);
