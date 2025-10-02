import { pgTable, unique, varchar, integer, foreignKey, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const newsProvider = pgTable("news_provider", {
	key: varchar().primaryKey().notNull(),
	name: varchar().notNull(),
	url: varchar().notNull(),
	rank: integer().notNull(),
}, (table) => [
	unique("news_provider_name_key").on(table.name),
	unique("news_provider_url_key").on(table.url),
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

export const alembicVersion = pgTable("alembic_version", {
	versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const cluster = pgTable("cluster", {
	id: serial().primaryKey().notNull(),
	title: varchar().notNull(),
});
