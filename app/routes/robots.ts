import type { Route } from "./+types/robots";
import { generateRobotsTxt } from "@nasa-gcn/remix-seo";

export async function loader({ request }: Route.LoaderArgs) {
  return generateRobotsTxt([
    { type: "sitemap", value: "https://vidik.si/sitemap.xml" },
    { type: "disallow", value: "/api/" },
  ]);
}
