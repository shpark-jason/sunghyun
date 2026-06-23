import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const FEED_URL = "https://sh-life.tistory.com/rss";
const OUTPUT_FILE = path.resolve("src/data/tistory-posts.json");
const IMAGE_DIR = path.resolve("public/images/tistory");
const POST_LIMIT = 10;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || "";

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
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
    /<media:content[^>]+url=["']([^"']+)["']/i,
    /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i,
    /<img[^>]+data-origin-width=["'][^"']+["'][^>]+data-origin-height=["'][^"']+["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+data-url=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+data-src=["']([^"']+)["']/i,
  ];
  for (const pattern of candidates) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeXml(match[1]);
  }
  return "";
}

function normalizeImageUrl(value = "") {
  const url = decodeXml(value).trim();
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return new URL(url, "https://sh-life.tistory.com").href;
  return url.replace(/^http:\/\//i, "https://");
}

async function fetchPageThumbnail(postUrl) {
  if (!postUrl) return "";
  try {
    const response = await fetch(postUrl, {
      headers: {
        "User-Agent": "SunghyunParkPortfolio/1.0",
        Accept: "text/html",
      },
    });
    if (!response.ok) return "";
    const html = await response.text();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return normalizeImageUrl(match[1]);
    }
  } catch {
    // A missing thumbnail should never stop the feed update.
  }
  return "";
}

function imageExtension(contentType = "", imageUrl = "") {
  const type = contentType.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.includes("avif")) return "avif";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  const match = imageUrl.match(/\.(png|webp|gif|avif|jpe?g)(?:[?#]|$)/i);
  return match ? match[1].replace("jpeg", "jpg").toLowerCase() : "jpg";
}

async function cacheThumbnail(imageUrl, postUrl) {
  if (!imageUrl) return "";
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 SunghyunParkPortfolio/1.0",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
        Referer: postUrl || "https://sh-life.tistory.com/",
      },
      redirect: "follow",
    });
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return "";

    const extension = imageExtension(contentType, imageUrl);
    const filename = `${crypto
      .createHash("sha1")
      .update(postUrl || imageUrl)
      .digest("hex")
      .slice(0, 16)}.${extension}`;
    await fs.mkdir(IMAGE_DIR, { recursive: true });
    await fs.writeFile(
      path.join(IMAGE_DIR, filename),
      Buffer.from(await response.arrayBuffer()),
    );
    return `/images/tistory/${filename}`;
  } catch {
    return "";
  }
}

function containsKorean(value = "") {
  return /[\u3131-\u318e\uac00-\ud7a3]/.test(value);
}

async function translateToEnglish(title, excerpt) {
  if (!DEEPL_API_KEY || (!containsKorean(title) && !containsKorean(excerpt))) {
    return { titleEn: "", excerptEn: "" };
  }
  try {
    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [title, excerpt],
        source_lang: "KO",
        target_lang: "EN",
        context: excerpt,
      }),
    });
    if (!response.ok) throw new Error(`DeepL HTTP ${response.status}`);
    const result = await response.json();
    return {
      titleEn: result.translations?.[0]?.text || "",
      excerptEn: result.translations?.[1]?.text || "",
    };
  } catch (error) {
    console.warn(`Tistory translation skipped: ${error.message}`);
    return { titleEn: "", excerptEn: "" };
  }
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
  const parsedItems = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
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
        thumbnail: normalizeImageUrl(
          findThumbnail(item) || findThumbnail(content),
        ),
      };
    })
    .filter((post) => post.title && post.url);

  const items = await Promise.all(
    parsedItems.map(async (post) => {
      const remoteThumbnail =
        post.thumbnail || (await fetchPageThumbnail(post.url));
      const translation = await translateToEnglish(post.title, post.excerpt);
      return {
        ...post,
        ...translation,
        thumbnail:
          (await cacheThumbnail(remoteThumbnail, post.url)) || remoteThumbnail,
      };
    }),
  );

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
