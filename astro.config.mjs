import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs/promises";
import path from "node:path";

function localPortfolioEditor() {
  return {
    name: "local-portfolio-editor",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(async (request, response, next) => {
          const pathname = request.url?.split("?")[0];
          if (
            request.method !== "POST" ||
            !["/__admin-save", "/sunghyun/__admin-save"].includes(pathname)
          ) {
            return next();
          }

          try {
            let body = "";
            for await (const chunk of request) body += chunk;
            const data = JSON.parse(body);
            const keys = [
              "site",
              "education",
              "experience",
              "publications",
              "presentations",
              "researchAgenda",
              "projects",
              "news",
              "memberships",
              "methods",
              "languages",
              "thesis",
              "blogPosts",
            ];
            const source = keys
              .map((key) => `export const ${key} = ${JSON.stringify(data[key], null, 2)};\n`)
              .join("\n");
            const target = path.resolve("src/data/site.ts");
            await fs.writeFile(target, source, "utf8");
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: true }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, message: error.message }));
          }
        });
      },
    },
  };
}

export default defineConfig({
  site: "https://shpark-jason.github.io",
  base: "/sunghyun",
  integrations: [sitemap(), localPortfolioEditor()],
});
