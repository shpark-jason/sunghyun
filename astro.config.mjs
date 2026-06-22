import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://shpark-jason.github.io",
  base: "/sunghyun",
  integrations: [sitemap()],
});
