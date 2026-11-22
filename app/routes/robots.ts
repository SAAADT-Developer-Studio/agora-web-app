import type { Route } from "./+types/robots";
import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { SITE_URL } from "~/lib/seo";

function aiCrawler(userAgent: string) {
  return [
    { type: "userAgent" as const, value: userAgent },
    { type: "allow" as const, value: "/" },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  // Default policies already include "User-agent: *" and "Allow: /".
  // Explicit AI crawler rules make GEO intent clear for assistants that check
  // robots.txt before citing content. `/utrinki` stays allowed in every group.
  return generateRobotsTxt(
    [
      { type: "disallow", value: "/api/" },
      { type: "disallow", value: "/dev/" },
      ...aiCrawler("GPTBot"),
      ...aiCrawler("ChatGPT-User"),
      ...aiCrawler("ClaudeBot"),
      ...aiCrawler("anthropic-ai"),
      ...aiCrawler("Google-Extended"),
      ...aiCrawler("PerplexityBot"),
      ...aiCrawler("Applebot-Extended"),
      { type: "sitemap", value: `${SITE_URL}/sitemap.xml` },
    ],
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
