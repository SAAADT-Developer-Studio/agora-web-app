import { relations } from "drizzle-orm/relations";
import { cluster, article, newsProvider } from "./schema";

export const articleRelations = relations(article, ({one}) => ({
	cluster: one(cluster, {
		fields: [article.clusterId],
		references: [cluster.id]
	}),
	newsProvider: one(newsProvider, {
		fields: [article.newsProviderKey],
		references: [newsProvider.key]
	}),
}));

export const clusterRelations = relations(cluster, ({many}) => ({
	articles: many(article),
}));

export const newsProviderRelations = relations(newsProvider, ({many}) => ({
	articles: many(article),
}));