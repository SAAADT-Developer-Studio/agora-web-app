import type { Route } from "./+types/robots";
import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { SITE_URL } from "~/lib/seo";

const hiddenDisallows = [
  { type: "disallow" as const, value: "/novo" },
  { type: "disallow" as const, value: "/zgodba/" },
  { type: "disallow" as const, value: "/utrinki" },
];

function aiCrawler(userAgent: string) {
  return [
    { type: "userAgent" as const, value: userAgent },
    { type: "allow" as const, value: "/" },
    ...hiddenDisallows,
  ];
}

export async function loader({}: Route.LoaderArgs) {
  // Default policies already include "User-agent: *" and "Allow: /".
  // Explicit AI crawler rules make GEO intent clear for assistants that check
  // robots.txt before citing content. Hidden routes are disallowed for every
  // group so a later `Allow: /` does not reopen them.
  return generateRobotsTxt(
    [
      { type: "disallow", value: "/api/" },
      { type: "disallow", value: "/dev/" },
      ...hiddenDisallows,
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
