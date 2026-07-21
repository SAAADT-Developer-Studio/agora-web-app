-- Local dev schema, derived from app/drizzle/schema.ts.
-- Uses default btree opclasses (schema.ts has a text_ops opclass on a timestamptz
-- column which drizzle-kit push cannot apply). Not committed; local dev only.

CREATE TABLE IF NOT EXISTS news_provider (
	key varchar PRIMARY KEY NOT NULL,
	name varchar NOT NULL,
	url varchar NOT NULL,
	rank integer NOT NULL,
	bias_rating varchar,
	CONSTRAINT news_provider_name_key UNIQUE(name),
	CONSTRAINT news_provider_url_key UNIQUE(url)
);

CREATE TABLE IF NOT EXISTS cluster (
	id serial PRIMARY KEY NOT NULL,
	title varchar NOT NULL,
	slug varchar,
	CONSTRAINT cluster_slug_key UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS cluster_run (
	id serial PRIMARY KEY NOT NULL,
	algo_version varchar NOT NULL,
	params jsonb,
	is_production boolean NOT NULL,
	created_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cluster_run_created_at ON cluster_run USING btree (created_at);

CREATE TABLE IF NOT EXISTS cluster_v2 (
	id serial PRIMARY KEY NOT NULL,
	title varchar NOT NULL,
	slug varchar,
	created_at timestamptz NOT NULL,
	run_id integer NOT NULL,
	CONSTRAINT cluster_v2_slug_key UNIQUE(slug),
	CONSTRAINT cluster_v2_run_id_fkey FOREIGN KEY (run_id) REFERENCES cluster_run(id) ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS ix_cluster_v2_run_id ON cluster_v2 USING btree (run_id);

CREATE TABLE IF NOT EXISTS social_post (
	id serial PRIMARY KEY NOT NULL,
	platform varchar(6) NOT NULL,
	url varchar NOT NULL,
	posted_at timestamptz,
	platform_metadata jsonb,
	created_at timestamptz NOT NULL,
	CONSTRAINT social_post_url_key UNIQUE(url)
);

CREATE TABLE IF NOT EXISTS article (
	id serial PRIMARY KEY NOT NULL,
	url varchar NOT NULL,
	title varchar NOT NULL,
	published_at timestamptz NOT NULL,
	deck varchar,
	author varchar,
	content varchar,
	embedding double precision[] NOT NULL,
	news_provider_key varchar NOT NULL,
	summary varchar,
	cluster_id integer,
	image_urls varchar[],
	categories varchar[],
	llm_rank integer,
	is_paywalled boolean,
	CONSTRAINT article_url_key UNIQUE(url),
	CONSTRAINT article_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES cluster(id) ON DELETE set null,
	CONSTRAINT article_news_provider_key_fkey FOREIGN KEY (news_provider_key) REFERENCES news_provider(key)
);
CREATE INDEX IF NOT EXISTS ix_article_published_at_news_provider_key ON article USING btree (published_at, news_provider_key);

CREATE TABLE IF NOT EXISTS article_cluster (
	id serial PRIMARY KEY NOT NULL,
	article_id integer NOT NULL,
	cluster_id integer NOT NULL,
	run_id integer NOT NULL,
	CONSTRAINT uq_article_cluster_run UNIQUE(article_id, cluster_id, run_id),
	CONSTRAINT article_cluster_article_id_fkey FOREIGN KEY (article_id) REFERENCES article(id) ON DELETE cascade,
	CONSTRAINT article_cluster_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES cluster_v2(id) ON DELETE cascade,
	CONSTRAINT article_cluster_run_id_fkey FOREIGN KEY (run_id) REFERENCES cluster_run(id) ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS ix_article_cluster_cluster_id ON article_cluster USING btree (cluster_id);
CREATE INDEX IF NOT EXISTS ix_article_cluster_run_id ON article_cluster USING btree (run_id);

CREATE TABLE IF NOT EXISTS article_social_post (
	id serial PRIMARY KEY NOT NULL,
	article_id integer NOT NULL,
	social_post_id integer NOT NULL,
	CONSTRAINT uq_article_social_post UNIQUE(article_id, social_post_id),
	CONSTRAINT article_social_post_article_id_fkey FOREIGN KEY (article_id) REFERENCES article(id) ON DELETE cascade,
	CONSTRAINT article_social_post_social_post_id_fkey FOREIGN KEY (social_post_id) REFERENCES social_post(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS moss_data (
	id uuid PRIMARY KEY NOT NULL,
	provider_key varchar NOT NULL,
	rank integer NOT NULL,
	website varchar NOT NULL,
	publisher varchar NOT NULL,
	reach integer NOT NULL,
	reach_percent double precision NOT NULL,
	avg_daily_reach integer NOT NULL,
	views integer NOT NULL,
	avg_session_duration varchar NOT NULL,
	trend double precision NOT NULL,
	created_at timestamptz NOT NULL,
	CONSTRAINT moss_data_provider_key_fkey FOREIGN KEY (provider_key) REFERENCES news_provider(key)
);

CREATE TABLE IF NOT EXISTS alembic_version (
	version_num varchar(32) PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS vote (
	user_id uuid NOT NULL,
	provider_id varchar NOT NULL,
	value varchar NOT NULL,
	created_at timestamptz NOT NULL,
	CONSTRAINT vote_pkey PRIMARY KEY (user_id, provider_id),
	CONSTRAINT vote_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES news_provider(key)
);
