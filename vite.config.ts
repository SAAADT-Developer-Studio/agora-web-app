import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { appendFileSync } from "node:fs";

function agentDebugLogger() {
  return {
    name: "agent-debug-logger",
    apply: "serve" as const,
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (
            req: NodeJS.ReadableStream & { method?: string },
            res: { statusCode: number; end: (body?: string) => void },
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use("/__agent-debug-log", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += String(chunk);
        });
        req.on("end", () => {
          try {
            const entry = JSON.parse(body);
            // #region agent log
            appendFileSync(
              "/opt/cursor/logs/debug.log",
              `${JSON.stringify(entry)}\n`,
            );
            // #endregion
            res.statusCode = 204;
            res.end();
          } catch {
            res.statusCode = 400;
            res.end("Invalid debug log payload");
          }
        });
      });
    },
  };
}

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    agentDebugLogger(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    devtoolsJson(),
  ],
});
