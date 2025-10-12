import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const cache = await caches.open("custom:vidik-page-cache");
    let response = await cache.match(request);

    if (!response) {
      response = await requestHandler(request, {
        cloudflare: { env, ctx },
      });
      ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
