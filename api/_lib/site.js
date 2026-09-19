// Shared helpers for the server-rendered pages (Vercel functions in /api).
// Files and folders starting with "_" are not deployed as endpoints.
const fs = require("fs");
const path = require("path");

const SITE_URL = (process.env.SITE_URL || "https://www.nprany.org").replace(/\/$/, "");
const ORG_NAME = "National Puerto Rican Agenda, New York Chapter";
const SANITY_PROJECT = "nn3j1n98";
const SANITY_DATASET = "production";
// The live (uncached) API: Vercel's CDN already caches each page, so going
// through Sanity's API CDN as well would only add delay after a publish.
const SANITY_API = `https://${SANITY_PROJECT}.api.sanity.io/v2025-02-19/data/query/${SANITY_DATASET}`;
// How long Vercel's CDN keeps a rendered page before re-rendering it:
// edits published in the Studio show up within about 30 seconds.
const PAGE_CACHE = "public, max-age=0, s-maxage=30, stale-while-revalidate=30";

async function sanityQuery(query, params) {
  const url = new URL(SANITY_API);
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params || {})) {
    url.searchParams.set("$" + key, JSON.stringify(value));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity request failed: ${res.status}`);
  return (await res.json()).result;
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// "image-<id>-<w>x<h>-<ext>" → CDN URL, optionally resized.
function imageUrl(ref, params) {
  const m = /^image-(.+)-(\d+x\d+)-(\w+)$/.exec(ref || "");
  if (!m) return "";
  const base = `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/${m[1]}-${m[2]}.${m[3]}`;
  return params ? `${base}?${params}` : base;
}

function formatDate(isoDate, opts) {
  if (!isoDate) return "";
  return new Date(isoDate + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC", ...opts,
  });
}

function safeHref(href) {
  return /^(https?:|mailto:|tel:)/i.test(href || "") ? href : "";
}

/* ---- Portable Text (rich text from the Studio) → HTML --------------- */
function renderSpans(children, markDefs) {
  const defs = Object.fromEntries((markDefs || []).map((d) => [d._key, d]));
  return (children || []).map((span) => {
    let out = esc(span.text).replace(/\n/g, "<br>");
    for (const mark of span.marks || []) {
      if (mark === "strong") out = `<strong>${out}</strong>`;
      else if (mark === "em") out = `<em>${out}</em>`;
      else if (defs[mark] && defs[mark]._type === "link") {
        const href = safeHref(defs[mark].href);
        if (!href) continue;
        const external = /^https?:/i.test(href) && !href.startsWith(SITE_URL);
        out = `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${out}</a>`;
      }
    }
    return out;
  }).join("");
}

function renderPortableText(blocks) {
  let html = "";
  let openList = null;
  const blockTags = { h2: "h2", h3: "h3", blockquote: "blockquote" };
  for (const b of blocks || []) {
    const listTag = b._type === "block" && b.listItem ? (b.listItem === "number" ? "ol" : "ul") : null;
    if (openList && openList !== listTag) { html += `</${openList}>`; openList = null; }
    if (listTag && !openList) { html += `<${listTag}>`; openList = listTag; }

    if (b._type === "block") {
      const inner = renderSpans(b.children, b.markDefs);
      if (listTag) { html += `<li>${inner}</li>`; continue; }
      if (!inner.replace(/<br>/g, "").trim()) continue; // skip empty paragraphs
      const tag = blockTags[b.style] || "p";
      html += `<${tag}>${inner}</${tag}>`;
    } else if (b._type === "image" && b.asset && b.asset._ref) {
      html += `<figure><img loading="lazy" src="${esc(imageUrl(b.asset._ref, "w=1400&fit=max&auto=format"))}" alt="${esc(b.alt)}">` +
        (b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : "") + "</figure>";
    }
  }
  if (openList) html += `</${openList}>`;
  return html;
}

/* ---- Site shell ----------------------------------------------------
   Server pages reuse newsletter.html's head, header, subscribe band and
   footer, so they always match the rest of the site. Relative URLs are
   made absolute because these pages live at /la-agenda/<slug>. */
let shellCache = null;
async function siteShell(req) {
  if (shellCache) return shellCache;
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, "..", "..", "newsletter.html"), "utf8");
  } catch (err) {
    // Fallback if the file wasn't bundled with the function: fetch it from the site.
    const host = (req && req.headers && req.headers.host) || new URL(SITE_URL).host;
    const proto = /^(localhost|127\.)/.test(host) ? "http" : "https";
    html = await (await fetch(`${proto}://${host}/newsletter.html`)).text();
  }
  html = html.replace(/(\s(?:href|src))="(?!https?:|\/|#|mailto:|tel:|data:)([^"]*)"/g, '$1="/$2"');

  const headInner = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"))
    .replace(/\s*<title>[\s\S]*?<\/title>/, "")
    .replace(/\s*<meta name="description"[^>]*>/, "");
  const top = html.slice(html.indexOf("<body>"), html.indexOf("<!-- Page Header -->"))
    .replace('href="#archive" class="skip-link"', 'href="#issue" class="skip-link"');
  const bottom = html.slice(html.indexOf("<!-- Subscribe -->"));
  shellCache = { headInner, top, bottom };
  return shellCache;
}

async function renderPage(req, { title, description, canonical, headExtra, main }) {
  const shell = await siteShell(req);
  return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n" +
    `  <title>${esc(title)}</title>\n` +
    (description ? `  <meta name="description" content="${esc(description)}" />\n` : "") +
    (canonical ? `  <link rel="canonical" href="${esc(canonical)}" />\n` : "") +
    (headExtra || "") +
    shell.headInner.replace(/^\s*\n/, "") +
    "</head>\n\n" + shell.top + main + "\n\n  " + shell.bottom;
}

// Trim to ~max chars on a word boundary (meta descriptions).
function clip(text, max) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function send(res, status, body, { type = "text/html; charset=utf-8", cache } = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  if (cache) res.setHeader("Cache-Control", cache);
  res.end(body);
}

module.exports = {
  SITE_URL, ORG_NAME, PAGE_CACHE, sanityQuery, esc, imageUrl, formatDate, safeHref,
  renderPortableText, renderPage, clip, send,
};
