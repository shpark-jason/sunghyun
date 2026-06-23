import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const DATA_FILE = path.resolve("src/data/site.ts");
const OUTPUT_FILE = path.resolve("src/data/news-articles.json");
const IMAGE_DIR = path.resolve("public/images/news");
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || "";

function decodeHtml(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value = "") {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function meta(html, key, value) {
  const patterns = [
    new RegExp(`<meta[^>]+${key}=["']${value}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${key}=["']${value}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return "";
}

function firstParagraph(html) {
  const matches = [...html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)];
  for (const match of matches) {
    const text = stripHtml(match[1]);
    if (text.length >= 45) return text;
  }
  return "";
}

function shorten(text, limit = 210) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trim()}…`;
}

function absoluteUrl(value, pageUrl) {
  if (!value) return "";
  try {
    return new URL(value, pageUrl).href.replace(/^http:\/\//i, "https://");
  } catch {
    return "";
  }
}

function extension(contentType = "", imageUrl = "") {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("avif")) return "avif";
  const match = imageUrl.match(/\.(png|webp|gif|avif|jpe?g)(?:[?#]|$)/i);
  return match ? match[1].replace("jpeg", "jpg").toLowerCase() : "jpg";
}

async function cacheImage(imageUrl, articleUrl) {
  if (!imageUrl) return "";
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 SunghyunParkPortfolio/1.0",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
        Referer: articleUrl,
      },
    });
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.startsWith("image/")) return "";
    const name = `${crypto.createHash("sha1").update(articleUrl).digest("hex").slice(0, 16)}.${extension(type, imageUrl)}`;
    await fs.mkdir(IMAGE_DIR, { recursive: true });
    await fs.writeFile(path.join(IMAGE_DIR, name), Buffer.from(await response.arrayBuffer()));
    return `/images/news/${name}`;
  } catch {
    return "";
  }
}

function containsKorean(value = "") {
  return /[\u3131-\u318e\uac00-\ud7a3]/.test(value);
}

async function translateToEnglish(title, text, fallback = {}) {
  if (!DEEPL_API_KEY || (!containsKorean(title) && !containsKorean(text))) {
    return {
      titleEn: fallback.titleEn || "",
      textEn: fallback.textEn || "",
    };
  }

  try {
    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [title, text],
        source_lang: "KO",
        target_lang: "EN",
        context: text,
      }),
    });
    if (!response.ok) throw new Error(`DeepL HTTP ${response.status}`);
    const result = await response.json();
    return {
      titleEn: result.translations?.[0]?.text || fallback.titleEn || "",
      textEn: result.translations?.[1]?.text || fallback.textEn || "",
    };
  } catch (error) {
    console.warn(`Translation skipped: ${error.message}`);
    return {
      titleEn: fallback.titleEn || "",
      textEn: fallback.textEn || "",
    };
  }
}

async function enrich(item) {
  if (!item.url) return item;
  try {
    const response = await fetch(item.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 SunghyunParkPortfolio/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const title =
      meta(html, "property", "og:title") ||
      meta(html, "name", "twitter:title") ||
      stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "") ||
      item.title;
    const description =
      meta(html, "property", "og:description") ||
      meta(html, "name", "description") ||
      meta(html, "name", "twitter:description") ||
      firstParagraph(html) ||
      item.text;
    const remoteImage = absoluteUrl(
      meta(html, "property", "og:image") ||
        meta(html, "name", "twitter:image"),
      item.url,
    );
    const publisher =
      meta(html, "property", "og:site_name") ||
      new URL(item.url).hostname.replace(/^www\./, "");
    const translation = await translateToEnglish(title, shorten(description || ""), item);

    return {
      ...item,
      title: title || item.title,
      text: shorten(description || ""),
      ...translation,
      publisher,
      image: (await cacheImage(remoteImage, item.url)) || remoteImage,
    };
  } catch (error) {
    console.warn(`News metadata skipped: ${item.url} (${error.message})`);
    return {
      ...item,
      publisher: new URL(item.url).hostname.replace(/^www\./, ""),
      image: "",
      ...(await translateToEnglish(item.title || "", item.text || "", item)),
    };
  }
}

try {
  const moduleUrl = `${pathToFileURL(DATA_FILE).href}?updated=${Date.now()}`;
  const { news = [] } = await import(moduleUrl);
  const articles = await Promise.all(news.map(enrich));
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(articles, null, 2)}\n`, "utf8");
  console.log(`Updated ${articles.length} news items.`);
} catch (error) {
  try {
    await fs.access(OUTPUT_FILE);
    console.warn(`News sync skipped; using cached items. ${error.message}`);
  } catch {
    await fs.writeFile(OUTPUT_FILE, "[]\n", "utf8");
    console.warn(`News sync failed; created an empty cache. ${error.message}`);
  }
}
