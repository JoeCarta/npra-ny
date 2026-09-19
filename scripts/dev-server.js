// Local preview server: static files + the /api functions, with the same
// routes as vercel.json (keep the two in sync). No dependencies.
//   node scripts/dev-server.js        → http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};
// Re-require the functions on every request so edits show up without a restart.
function api(name) {
  const apiDir = path.join(ROOT, "api");
  for (const key of Object.keys(require.cache)) if (key.startsWith(apiDir)) delete require.cache[key];
  return require(path.join(apiDir, name));
}

function redirect(res, location, status) {
  res.writeHead(status, { Location: location });
  res.end();
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;
  const keep = url.search + url.hash;
  try {
    // --- mirrors vercel.json "trailingSlash": false ---
    if (p.length > 1 && p.endsWith("/")) return redirect(res, p.replace(/\/+$/, "") + keep, 308);
    // --- mirrors vercel.json "redirects" ---
    if (p === "/index" || p === "/index.html") return redirect(res, "/" + keep, 308);
    if (p === "/la-agenda") return redirect(res, "/newsletter", 307);
    if (p === "/issue.html" && /^[a-z0-9-]+$/.test(url.searchParams.get("i") || "")) {
      return redirect(res, "/la-agenda/" + url.searchParams.get("i"), 308);
    }
    // --- mirrors vercel.json "cleanUrls": /page.html → /page ---
    if (p.endsWith(".html") && fs.existsSync(path.join(ROOT, decodeURIComponent(p)))) {
      return redirect(res, p.slice(0, -5) + keep, 308);
    }
    // --- mirrors vercel.json "rewrites" ---
    if (p === "/") return await api("home.js")(req, res);
    const issue = p.match(/^\/la-agenda\/([^/]+)$/);
    if (issue) {
      req.url = "/api/issue?slug=" + issue[1];
      return await api("issue.js")(req, res);
    }
    if (p === "/sitemap.xml") return await api("sitemap.js")(req, res);
    if (p.startsWith("/api/")) {
      const name = p.slice(5).replace(/\/$/, "") + ".js";
      if (/^[a-z-]+\.js$/.test(name) && fs.existsSync(path.join(ROOT, "api", name))) return await api(name)(req, res);
    }

    // --- static files ---
    let file = path.normalize(path.join(ROOT, decodeURIComponent(p)));
    if (!file.startsWith(ROOT) || /[\\/](\.|studio|scripts|node_modules)/.test(file.slice(ROOT.length))) {
      res.writeHead(404); return res.end("Not found");
    }
    if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html"; // /members → members.html
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
}).listen(PORT, () => console.log(`NPRA-NY preview on http://localhost:${PORT}`));
