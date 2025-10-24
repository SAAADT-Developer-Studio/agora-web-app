import { relations } from "drizzle-orm/relations";
import { cluster, article, newsProvider, vote } from "./schema";

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
	votes: many(vote),
}));

export const voteRelations = relations(vote, ({one}) => ({
	newsProvider: one(newsProvider, {
		fields: [vote.providerId],
		references: [newsProvider.key]
	}),
}));