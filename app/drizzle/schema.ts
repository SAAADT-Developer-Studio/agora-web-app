import { pgTable, foreignKey, unique, serial, integer, varchar, timestamp, doublePrecision, jsonb, boolean, primaryKey, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const articleCluster = pgTable("article_cluster", {
	id: serial().primaryKey().notNull(),
	articleId: integer("article_id").notNull(),
	clusterId: integer("cluster_id").notNull(),
	runId: integer("run_id").notNull(),
}, (table) => [
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
}, (table) => [
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
});

export const clusterV2 = pgTable("cluster_v2", {
	id: serial().primaryKey().notNull(),
	title: varchar().notNull(),
	slug: varchar(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	runId: integer("run_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.runId],
			foreignColumns: [clusterRun.id],
			name: "cluster_v2_run_id_fkey"
		}).onDelete("cascade"),
	unique("cluster_v2_slug_key").on(table.slug),
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
