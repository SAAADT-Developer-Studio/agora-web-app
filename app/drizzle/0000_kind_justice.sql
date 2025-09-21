-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "news_provider" (
	"key" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"url" varchar NOT NULL,
	"rank" integer NOT NULL,
	CONSTRAINT "news_provider_name_key" UNIQUE("name"),
	CONSTRAINT "news_provider_url_key" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar NOT NULL,
	"title" varchar NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"deck" varchar,
	"author" varchar,
	"content" varchar,
	"embedding" double precision[] NOT NULL,
	"news_provider_key" varchar NOT NULL,
	"summary" varchar,
	"cluster_id" integer,
	"image_urls" varchar[],
	CONSTRAINT "article_url_key" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "alembic_version" (
	"version_num" varchar(32) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cluster" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "public"."cluster"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_news_provider_key_fkey" FOREIGN KEY ("news_provider_key") REFERENCES "public"."news_provider"("key") ON DELETE no action ON UPDATE no action;
*/