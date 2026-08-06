import type { Route } from "./+types/robots";
import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { SITE_URL } from "~/lib/seo";

export async function loader({}: Route.LoaderArgs) {
  // Default policies already include "User-agent: *" and "Allow: /".
  // Explicit AI crawler rules make GEO intent clear for assistants that check
  // robots.txt before citing content.
  return generateRobotsTxt(
    [
      { type: "disallow", value: "/api/" },
      { type: "userAgent", value: "GPTBot" },
      { type: "allow", value: "/" },
      { type: "userAgent", value: "ChatGPT-User" },
      { type: "allow", value: "/" },
      { type: "userAgent", value: "ClaudeBot" },
      { type: "allow", value: "/" },
      { type: "userAgent", value: "anthropic-ai" },
      { type: "allow", value: "/" },
      { type: "userAgent", value: "Google-Extended" },
      { type: "allow", value: "/" },
      { type: "userAgent", value: "PerplexityBot" },
      { type: "allow", value: "/" },
      { type: "userAgent", value: "Applebot-Extended" },
      { type: "allow", value: "/" },
      { type: "sitemap", value: `${SITE_URL}/sitemap.xml` },
    ],
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
