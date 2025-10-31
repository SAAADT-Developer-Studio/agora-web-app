import { relations } from "drizzle-orm/relations";
import { article, articleCluster, clusterV2, clusterRun, cluster, newsProvider, vote } from "./schema";

export const articleClusterRelations = relations(articleCluster, ({one}) => ({
	article: one(article, {
		fields: [articleCluster.articleId],
		references: [article.id]
	}),
	clusterV2: one(clusterV2, {
		fields: [articleCluster.clusterId],
		references: [clusterV2.id]
	}),
	clusterRun: one(clusterRun, {
		fields: [articleCluster.runId],
		references: [clusterRun.id]
	}),
}));

export const articleRelations = relations(article, ({one, many}) => ({
	articleClusters: many(articleCluster),
	cluster: one(cluster, {
		fields: [article.clusterId],
		references: [cluster.id]
	}),
	newsProvider: one(newsProvider, {
		fields: [article.newsProviderKey],
		references: [newsProvider.key]
	}),
}));

export const clusterV2Relations = relations(clusterV2, ({one, many}) => ({
	articleClusters: many(articleCluster),
	clusterRun: one(clusterRun, {
		fields: [clusterV2.runId],
		references: [clusterRun.id]
	}),
}));

export const clusterRunRelations = relations(clusterRun, ({many}) => ({
	articleClusters: many(articleCluster),
	clusterV2s: many(clusterV2),
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