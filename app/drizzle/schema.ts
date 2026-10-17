import { pgTable, unique, varchar, integer, index, serial, jsonb, boolean, timestamp, foreignKey, doublePrecision, check, uuid, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const newsProvider = pgTable("news_provider", {
	key: varchar().primaryKey().notNull(),
	name: varchar().notNull(),
	url: varchar().notNull(),
	rank: integer().notNull(),
	biasRating: varchar("bias_rating"),
}, (table) => [
	unique("news_provider_name_key").on(table.name),
	unique("news_provider_url_key").on(table.url),
]);

export const clusterRun = pgTable("cluster_run", {
	id: serial().primaryKey().notNull(),
	algoVersion: varchar("algo_version").notNull(),
	params: jsonb(),
	isProduction: boolean("is_production").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("ix_cluster_run_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const article = pgTable("article", {
	id: serial().primaryKey().notNull(),
	url: varchar().notNull(),
	title: varchar().notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }).notNull(),
	deck: varchar(),
	author: varchar(),
	content: varchar(),
	embedding: doublePrecision().array().notNull(),
	newsProviderKey: varchar("news_provider_key").notNull(),
	summary: varchar(),
	clusterId: integer("cluster_id"),
	imageUrls: varchar("image_urls").array(),
	categories: varchar().array(),
	llmRank: integer("llm_rank"),
	isPaywalled: boolean("is_paywalled"),
	firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("ix_article_published_at_news_provider_key").using("btree", table.publishedAt.asc().nullsLast().op("text_ops"), table.newsProviderKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clusterId],
			foreignColumns: [cluster.id],
			name: "article_cluster_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.newsProviderKey],
			foreignColumns: [newsProvider.key],
			name: "article_news_provider_key_fkey"
		}),
	unique("article_url_key").on(table.url),
]);

export const articleCluster = pgTable("article_cluster", {
	id: serial().primaryKey().notNull(),
	articleId: integer("article_id").notNull(),
	clusterId: integer("cluster_id").notNull(),
	runId: integer("run_id").notNull(),
	membershipConfidence: doublePrecision("membership_confidence"),
}, (table) => [
	index("ix_article_cluster_cluster_id").using("btree", table.clusterId.asc().nullsLast().op("int4_ops")),
	index("ix_article_cluster_run_id").using("btree", table.runId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [article.id],
			name: "article_cluster_article_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clusterId],
			foreignColumns: [clusterV2.id],
			name: "article_cluster_cluster_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [clusterRun.id],
			name: "article_cluster_run_id_fkey"
		}).onDelete("cascade"),
	unique("uq_article_cluster_run").on(table.articleId, table.clusterId, table.runId),
	check("ck_article_cluster_membership_confidence", sql`(membership_confidence >= (0)::double precision) AND (membership_confidence <= (1)::double precision)`),
]);

export const articleSocialPost = pgTable("article_social_post", {
	id: serial().primaryKey().notNull(),
	articleId: integer("article_id").notNull(),
	socialPostId: integer("social_post_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [article.id],
			name: "article_social_post_article_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.socialPostId],
			foreignColumns: [socialPost.id],
			name: "article_social_post_social_post_id_fkey"
		}).onDelete("cascade"),
	unique("uq_article_social_post").on(table.articleId, table.socialPostId),
]);

export const socialPost = pgTable("social_post", {
	id: serial().primaryKey().notNull(),
	platform: varchar({ length: 6 }).notNull(),
	url: varchar().notNull(),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'string' }),
	platformMetadata: jsonb("platform_metadata"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("social_post_url_key").on(table.url),
]);

export const mossData = pgTable("moss_data", {
	id: uuid().primaryKey().notNull(),
	providerKey: varchar("provider_key").notNull(),
	rank: integer().notNull(),
	website: varchar().notNull(),
	publisher: varchar().notNull(),
	reach: integer().notNull(),
	reachPercent: doublePrecision("reach_percent").notNull(),
	avgDailyReach: integer("avg_daily_reach").notNull(),
	views: integer().notNull(),
	avgSessionDuration: varchar("avg_session_duration").notNull(),
	trend: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.providerKey],
			foreignColumns: [newsProvider.key],
			name: "moss_data_provider_key_fkey"
		}),
]);

export const alembicVersion = pgTable("alembic_version", {
	versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const cluster = pgTable("cluster", {
	id: serial().primaryKey().notNull(),
	title: varchar().notNull(),
	slug: varchar(),
}, (table) => [
	unique("cluster_slug_key").on(table.slug),
]);

export const storyArticle = pgTable("story_article", {
	id: serial().primaryKey().notNull(),
	storyId: integer("story_id").notNull(),
	articleId: integer("article_id").notNull(),
	method: varchar().notNull(),
	similarity: doublePrecision(),
	nearestArticleId: integer("nearest_article_id"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("ix_story_article_story_id").using("btree", table.storyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [article.id],
			name: "story_article_article_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.nearestArticleId],
			foreignColumns: [article.id],
			name: "story_article_nearest_article_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [story.id],
			name: "story_article_story_id_fkey"
		}).onDelete("cascade"),
	unique("uq_story_article_article_id").on(table.articleId),
]);

export const story = pgTable("story", {
	id: serial().primaryKey().notNull(),
	title: varchar().notNull(),
	lastArticlePublishedAt: timestamp("last_article_published_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("ix_story_last_article_published_at").using("btree", table.lastArticlePublishedAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const clusterV2 = pgTable("cluster_v2", {
	id: serial().primaryKey().notNull(),
	title: varchar().notNull(),
	slug: varchar(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	runId: integer("run_id").notNull(),
	wikiImageUrls: varchar("wiki_image_urls").array().default([""]).notNull(),
	wikiImageLookupAt: timestamp("wiki_image_lookup_at", { withTimezone: true, mode: 'string' }),
	wikiImageLastAttemptAt: timestamp("wiki_image_last_attempt_at", { withTimezone: true, mode: 'string' }),
	wikiImageMetadata: jsonb("wiki_image_metadata").default([]).notNull(),
	rankScore: doublePrecision("rank_score"),
	rankedAt: timestamp("ranked_at", { withTimezone: true, mode: 'string' }),
	rankComponents: jsonb("rank_components"),
	rankVersion: varchar("rank_version"),
	rankCategory: varchar("rank_category"),
	rankingRunId: integer("ranking_run_id"),
}, (table) => [
	index("ix_cluster_v2_created_at_id").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops"), table.id.asc().nullsLast().op("int4_ops")),
	index("ix_cluster_v2_ranking_run_id").using("btree", table.rankingRunId.asc().nullsLast().op("int4_ops")),
	index("ix_cluster_v2_run_id").using("btree", table.runId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.runId],
			foreignColumns: [clusterRun.id],
			name: "cluster_v2_run_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.rankingRunId],
			foreignColumns: [rankingRun.id],
			name: "fk_cluster_v2_ranking_run_id"
		}).onDelete("set null"),
	unique("cluster_v2_slug_key").on(table.slug),
	check("ck_cluster_v2_rank_score", sql`(rank_score >= (0)::double precision) AND (rank_score <= (1)::double precision)`),
]);

export const rankingRun = pgTable("ranking_run", {
	id: serial().primaryKey().notNull(),
	evaluatedAt: timestamp("evaluated_at", { withTimezone: true, mode: 'string' }).notNull(),
	windowDays: integer("window_days").notNull(),
	algorithmVersion: varchar("algorithm_version").notNull(),
	config: jsonb().notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	status: varchar().notNull(),
	scoredCount: integer("scored_count").default(0).notNull(),
	expiredCount: integer("expired_count").default(0).notNull(),
	skippedCount: integer("skipped_count").default(0).notNull(),
	failedClusterId: integer("failed_cluster_id"),
	error: varchar(),
}, (table) => [
	index("ix_ranking_run_started_at").using("btree", table.startedAt.asc().nullsLast().op("timestamptz_ops")),
	check("ck_ranking_run_counts", sql`(scored_count >= 0) AND (expired_count >= 0) AND (skipped_count >= 0)`),
	check("ck_ranking_run_status", sql`(status)::text = ANY ((ARRAY['running'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'interrupted'::character varying])::text[])`),
	check("ck_ranking_run_window_days", sql`window_days > 0`),
]);

export const storySummary = pgTable("story_summary", {
	id: serial().primaryKey().notNull(),
	storyId: integer("story_id").notNull(),
	title: varchar().notNull(),
	bullets: jsonb().notNull(),
	leadArticleId: integer("lead_article_id"),
	model: varchar().notNull(),
	promptVersion: integer("prompt_version").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("ix_story_summary_story_id_id").using("btree", table.storyId.asc().nullsLast().op("int4_ops"), table.id.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.leadArticleId],
			foreignColumns: [article.id],
			name: "story_summary_lead_article_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [story.id],
			name: "story_summary_story_id_fkey"
		}).onDelete("cascade"),
]);

export const vote = pgTable("vote", {
	userId: uuid("user_id").notNull(),
	providerId: varchar("provider_id").notNull(),
	value: varchar().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [newsProvider.key],
			name: "vote_provider_id_fkey"
		}),
	primaryKey({ columns: [table.userId, table.providerId], name: "vote_pkey"}),
]);
