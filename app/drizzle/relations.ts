import { relations } from "drizzle-orm/relations";
import { cluster, article, newsProvider, articleCluster, clusterV2, clusterRun, articleSocialPost, socialPost, mossData, storyArticle, story, rankingRun, storySummary, vote } from "./schema";

export const articleRelations = relations(article, ({one, many}) => ({
	cluster: one(cluster, {
		fields: [article.clusterId],
		references: [cluster.id]
	}),
	newsProvider: one(newsProvider, {
		fields: [article.newsProviderKey],
		references: [newsProvider.key]
	}),
	articleClusters: many(articleCluster),
	articleSocialPosts: many(articleSocialPost),
	storyArticles_articleId: many(storyArticle, {
		relationName: "storyArticle_articleId_article_id"
	}),
	storyArticles_nearestArticleId: many(storyArticle, {
		relationName: "storyArticle_nearestArticleId_article_id"
	}),
	storySummaries: many(storySummary),
}));

export const clusterRelations = relations(cluster, ({many}) => ({
	articles: many(article),
}));

export const newsProviderRelations = relations(newsProvider, ({many}) => ({
	articles: many(article),
	mossData: many(mossData),
	votes: many(vote),
}));

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

export const clusterV2Relations = relations(clusterV2, ({one, many}) => ({
	articleClusters: many(articleCluster),
	clusterRun: one(clusterRun, {
		fields: [clusterV2.runId],
		references: [clusterRun.id]
	}),
	rankingRun: one(rankingRun, {
		fields: [clusterV2.rankingRunId],
		references: [rankingRun.id]
	}),
}));

export const clusterRunRelations = relations(clusterRun, ({many}) => ({
	articleClusters: many(articleCluster),
	clusterV2s: many(clusterV2),
}));

export const articleSocialPostRelations = relations(articleSocialPost, ({one}) => ({
	article: one(article, {
		fields: [articleSocialPost.articleId],
		references: [article.id]
	}),
	socialPost: one(socialPost, {
		fields: [articleSocialPost.socialPostId],
		references: [socialPost.id]
	}),
}));

export const socialPostRelations = relations(socialPost, ({many}) => ({
	articleSocialPosts: many(articleSocialPost),
}));

export const mossDataRelations = relations(mossData, ({one}) => ({
	newsProvider: one(newsProvider, {
		fields: [mossData.providerKey],
		references: [newsProvider.key]
	}),
}));

export const storyArticleRelations = relations(storyArticle, ({one}) => ({
	article_articleId: one(article, {
		fields: [storyArticle.articleId],
		references: [article.id],
		relationName: "storyArticle_articleId_article_id"
	}),
	article_nearestArticleId: one(article, {
		fields: [storyArticle.nearestArticleId],
		references: [article.id],
		relationName: "storyArticle_nearestArticleId_article_id"
	}),
	story: one(story, {
		fields: [storyArticle.storyId],
		references: [story.id]
	}),
}));

export const storyRelations = relations(story, ({many}) => ({
	storyArticles: many(storyArticle),
	storySummaries: many(storySummary),
}));

export const rankingRunRelations = relations(rankingRun, ({many}) => ({
	clusterV2s: many(clusterV2),
}));

export const storySummaryRelations = relations(storySummary, ({one}) => ({
	article: one(article, {
		fields: [storySummary.leadArticleId],
		references: [article.id]
	}),
	story: one(story, {
		fields: [storySummary.storyId],
		references: [story.id]
	}),
}));

export const voteRelations = relations(vote, ({one}) => ({
	newsProvider: one(newsProvider, {
		fields: [vote.providerId],
		references: [newsProvider.key]
	}),
}));