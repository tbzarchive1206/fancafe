import fs from "node:fs/promises";
import vm from "node:vm";

const sourceUrl = new URL("../from-the-boyz/posts.js", import.meta.url);
const outputUrl = new URL("../from-the-boyz/content.js", import.meta.url);
const source = await fs.readFile(sourceUrl, "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

let content = {};
try {
  const existingContext = { window: {} };
  vm.createContext(existingContext);
  vm.runInContext(await fs.readFile(outputUrl, "utf8"), existingContext);
  content = existingContext.window.FANCAFE_CONTENT || {};
} catch {}
const posts = context.window.FANCAFE_POSTS.filter((post) => post.type === "doc" && !content[post.id]);
const failures = [];
const allowedTags = new Set(["p", "br", "span", "strong", "b", "em", "i", "u", "s", "blockquote", "h1", "h2", "h3", "h4", "ul", "ol", "li", "a", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "hr", "sup", "sub"]);
const voidTags = new Set(["br", "img", "hr"]);

function attribute(source, name) {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "iu"));
  return match?.[2] || "";
}

function safeUrl(value) {
  const decoded = value.replaceAll("&amp;", "&").trim();
  return /^(https?:)?\/\//iu.test(decoded) ? decoded : "";
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function sanitize(html) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/iu)?.[1] || "";
  return body
    .replace(/<!--[\s\S]*?-->/gu, "")
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/giu, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/giu, (tag, rawName, rawAttributes) => {
      const name = rawName.toLocaleLowerCase();
      if (!allowedTags.has(name)) return "";
      if (tag.startsWith("</")) return voidTags.has(name) ? "" : `</${name}>`;
      if (name === "a") {
        const href = safeUrl(attribute(rawAttributes, "href"));
        return href ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">` : "<a>";
      }
      if (name === "img") {
        const src = safeUrl(attribute(rawAttributes, "src"));
        const alt = escapeAttribute(attribute(rawAttributes, "alt"));
        return src ? `<img src="${escapeAttribute(src)}" alt="${alt}" loading="lazy">` : "";
      }
      if (name === "td" || name === "th") {
        const colspan = attribute(rawAttributes, "colspan").replace(/\D/gu, "");
        const rowspan = attribute(rawAttributes, "rowspan").replace(/\D/gu, "");
        return `<${name}${colspan ? ` colspan="${colspan}"` : ""}${rowspan ? ` rowspan="${rowspan}"` : ""}>`;
      }
      return `<${name}>`;
    })
    .replace(/<p>\s*<\/p>/giu, "")
    .trim();
}

async function fetchPost(post) {
  const url = `https://docs.google.com/document/d/${encodeURIComponent(post.id)}/export?format=html`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = sanitize(await response.text());
      if (!body) throw new Error("empty document body");
      return body;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
}

let completed = 0;
for (let start = 0; start < posts.length; start += 48) {
  const batch = posts.slice(start, start + 48);
  const results = await Promise.all(batch.map(async (post) => {
    try {
      return [post.id, await fetchPost(post)];
    } catch (error) {
      failures.push({ id: post.id, title: post.originalName, error: String(error) });
      return [post.id, ""];
    }
  }));
  for (const [id, html] of results) if (html) content[id] = html;
  completed += batch.length;
  if (completed % 192 === 0 || completed === posts.length) console.log(`Fetched ${completed}/${posts.length}`);
}

await fs.writeFile(outputUrl, `window.FANCAFE_CONTENT=${JSON.stringify(content)};\n`, "utf8");
console.log(`Saved ${Object.keys(content).length} posts to ${outputUrl.pathname}`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 2;
}
