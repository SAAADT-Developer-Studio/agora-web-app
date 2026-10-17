import { describe, expect, it } from "vitest";
import { collectSocialMentions, parseSocialPost } from "~/utils/socialPost";

const redditMetadata = {
  title: "Janševa vlada nasprotuje strožjim kaznim",
  subreddit: "slovenija",
  postedDate: "2026-07-25T09:07:31.000Z",
  author: "Fun_Raise_7858",
};

function post(overrides: Partial<Parameters<typeof parseSocialPost>[0]> = {}) {
  return {
    id: 1,
    platform: "reddit",
    url: "https://www.reddit.com/r/slovenija/comments/abc/",
    postedAt: null,
    platformMetadata: JSON.stringify(redditMetadata),
    ...overrides,
  };
}

describe("parseSocialPost", () => {
  it("reads reddit metadata stored as a JSON string", () => {
    expect(parseSocialPost(post())).toEqual({
      id: 1,
      platform: "reddit",
      url: "https://www.reddit.com/r/slovenija/comments/abc/",
      title: "Janševa vlada nasprotuje strožjim kaznim",
      community: "slovenija",
      author: "Fun_Raise_7858",
      postedAt: "2026-07-25T09:07:31.000Z",
    });
  });

  it("reads metadata stored as an object", () => {
    const parsed = parseSocialPost(post({ platformMetadata: redditMetadata }));
    expect(parsed.title).toBe(redditMetadata.title);
    expect(parsed.community).toBe("slovenija");
  });

  it("prefers the post's own posted_at over the metadata date", () => {
    const parsed = parseSocialPost(
      post({ postedAt: "2026-07-26T10:00:00.000Z" }),
    );
    expect(parsed.postedAt).toBe("2026-07-26T10:00:00.000Z");
  });

  it("falls back to nulls when metadata is missing or malformed", () => {
    for (const platformMetadata of [null, "{not json", 42, ["x"]]) {
      expect(parseSocialPost(post({ platformMetadata }))).toMatchObject({
        title: null,
        community: null,
        author: null,
        postedAt: null,
      });
    }
  });

  it("ignores metadata fields with the wrong type", () => {
    const parsed = parseSocialPost(
      post({ platformMetadata: { title: 5, subreddit: "", author: null } }),
    );
    expect(parsed).toMatchObject({
      title: null,
      community: null,
      author: null,
    });
  });
});

describe("collectSocialMentions", () => {
  it("merges a post linked from several articles and sorts newest first", () => {
    const older = post({ id: 1, postedAt: "2026-07-25T09:00:00.000Z" });
    const newer = post({
      id: 2,
      url: "https://www.reddit.com/r/slovenija/comments/def/",
      postedAt: "2026-07-26T09:00:00.000Z",
    });

    const mentions = collectSocialMentions([
      { id: 10, articleSocialPosts: [{ socialPost: older }] },
      {
        id: 11,
        articleSocialPosts: [{ socialPost: older }, { socialPost: newer }],
      },
    ]);

    expect(mentions.map((m) => [m.id, m.articleIds])).toEqual([
      [2, [11]],
      [1, [10, 11]],
    ]);
  });

  it("puts undated posts last", () => {
    const undated = post({ id: 1, platformMetadata: null });
    const dated = post({ id: 2, postedAt: "2026-07-26T09:00:00.000Z" });

    const mentions = collectSocialMentions([
      { id: 10, articleSocialPosts: [{ socialPost: undated }] },
      { id: 11, articleSocialPosts: [{ socialPost: dated }] },
    ]);

    expect(mentions.map((m) => m.id)).toEqual([2, 1]);
  });
});
