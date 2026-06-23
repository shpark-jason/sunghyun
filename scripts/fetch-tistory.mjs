import fs from "node:fs/promises";
import path from "node:path";

const FEED_URL = "https://sh-life.tistory.com/rss";
const OUTPUT_FILE = path.resolve("src/data/tistory-posts.json");
const POST_LIMIT = 10;

function decodeXml(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function stripHtml(value = "") {
  return decodeXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function findThumbnail(html = "") {
  const candidates = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+data-src=["']([^"']+)["']/i,
  ];
  for (const pattern of candidates) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeXml(match[1]);
  }
  return "";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

async function fetchFeed() {
  const response = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "SunghyunParkPortfolio/1.0",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });
  if (!response.ok) throw new Error(`Tistory RSS returned ${response.status}`);
  return response.text();
}

try {
  const xml = await fetchFeed();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, POST_LIMIT)
    .map((match) => {
      const item = match[1];
      const content =
        readTag(item, "content:encoded") ||
        readTag(item, "description");
      const plainText = stripHtml(content);
      return {
        source: "Tistory",
        title: stripHtml(readTag(item, "title")),
        url: readTag(item, "link"),
        date: formatDate(readTag(item, "pubDate")),
        excerpt:
          plainText.length > 160
            ? `${plainText.slice(0, 157).trim()}…`
            : plainText,
        thumbnail: findThumbnail(content),
      };
    })
    .filter((post) => post.title && post.url);

  if (!items.length) throw new Error("No posts found in Tistory RSS");

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(`Updated ${items.length} Tistory posts.`);
} catch (error) {
  try {
    await fs.access(OUTPUT_FILE);
    console.warn(`Tistory sync skipped; using cached posts. ${error.message}`);
  } catch {
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, "[]\n", "utf8");
    console.warn(`Tistory sync failed; created an empty cache. ${error.message}`);
  }
}
