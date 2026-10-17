export type SocialPostRow = {
  id: number;
  platform: string;
  url: string;
  postedAt: string | null;
  platformMetadata: unknown;
};

export type SocialMention = {
  id: number;
  platform: string;
  url: string;
  title: string | null;
  /** Subreddit for reddit posts, without the `r/` prefix. */
  community: string | null;
  author: string | null;
  postedAt: string | null;
};

/**
 * `social_post.platform_metadata` is a jsonb column, but the scraper stores
 * reddit metadata as a JSON-encoded string inside it, so accept both shapes.
 */
export function parseSocialPost(post: SocialPostRow): SocialMention {
  const metadata = readMetadata(post.platformMetadata);
  return {
    id: post.id,
    platform: post.platform,
    url: post.url,
    title: readString(metadata.title),
    community: readString(metadata.subreddit),
    author: readString(metadata.author),
    postedAt: post.postedAt ?? readString(metadata.postedDate),
  };
}

export type StoryMention = SocialMention & {
  /** Story articles the post links to. */
  articleIds: number[];
};

/** Every post linked from the story's articles, once each, newest first. */
export function collectSocialMentions(
  articles: {
    id: number;
    articleSocialPosts: { socialPost: SocialPostRow }[];
  }[],
): StoryMention[] {
  const byId = new Map<number, StoryMention>();
  for (const article of articles) {
    for (const { socialPost } of article.articleSocialPosts) {
      const existing = byId.get(socialPost.id);
      if (existing) {
        if (!existing.articleIds.includes(article.id)) {
          existing.articleIds.push(article.id);
        }
        continue;
      }
      byId.set(socialPost.id, {
        ...parseSocialPost(socialPost),
        articleIds: [article.id],
      });
    }
  }

  const time = (m: SocialMention) =>
    m.postedAt ? Date.parse(m.postedAt) || 0 : 0;
  return [...byId.values()].sort((a, b) => time(b) - time(a));
}

function readMetadata(raw: unknown): Record<string, unknown> {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
