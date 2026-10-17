export type StoryBullet = {
  text: string;
  /** Story members that support the bullet, in the order the model cited them. */
  articleIds: number[];
};

/**
 * Reads `story_summary.bullets` (`[{ text, article_ids }]`, written by the
 * clusterer). Citations to articles that have since left the story are dropped.
 */
export function parseStoryBullets(
  raw: unknown,
  memberIds: ReadonlySet<number>,
): StoryBullet[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry): StoryBullet[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const { text, article_ids } = entry as Record<string, unknown>;
    if (typeof text !== "string" || !text.trim()) return [];

    const articleIds = Array.isArray(article_ids)
      ? [...new Set(article_ids)].filter(
          (id): id is number => typeof id === "number" && memberIds.has(id),
        )
      : [];

    return [{ text: text.trim(), articleIds }];
  });
}
