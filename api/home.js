// Server-rendered homepage: /  (see vercel.json)
// templates/home.html is the page; each <!--cms:key-->…<!--/cms:key--> region is
// filled from the Studio's "Home page" document. A region with no content in
// Sanity keeps the template's text, and if Sanity can't be reached the template
// is served as-is, so the homepage never goes blank.
const fs = require("fs");
const path = require("path");
const { SITE_URL, PAGE_CACHE, sanityQuery, esc, clip, send } = require("./_lib/site");

const CACHE_FALLBACK = "public, max-age=0, s-maxage=30";

// Accent colors for the board monograms, in order (open positions use the last).
const MONOGRAM_COLORS = [
  "oklch(0.45 0.13 27)", "oklch(0.48 0.08 235)", "oklch(0.55 0.10 75)",
  "oklch(0.52 0.11 45)", "oklch(0.45 0.08 330)", "oklch(0.48 0.07 175)",
];
const OPEN_COLOR = "oklch(0.50 0.09 235)";
const PLUS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>';
const CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';

let templateCache = null;
async function template(req) {
  if (templateCache) return templateCache;
  try {
    templateCache = fs.readFileSync(path.join(__dirname, "..", "templates", "home.html"), "utf8");
  } catch (err) {
    const host = (req.headers && req.headers.host) || new URL(SITE_URL).host;
    const proto = /^(localhost|127\.)/.test(host) ? "http" : "https";
    templateCache = await (await fetch(`${proto}://${host}/templates/home`)).text();
  }
  return templateCache;
}

const has = (v) => typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v != null;
const lines = (text) => String(text).split(/\n/).map((l) => l.trim()).filter(Boolean);
const paragraphs = (text) => String(text).split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);

function initials(name) {
  const words = String(name).split(/\s+/).filter((w) => /^\p{L}/u.test(w) && !/^\p{L}\.$/u.test(w));
  if (!words.length) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Mission statement: plain text with the "em" words set in the red italic accent.
function statementHtml(blocks) {
  return (blocks || []).filter((b) => b._type === "block").map((b) =>
    '<p class="mission-quote">' + (b.children || []).map((span) => {
      const t = esc(span.text);
      return (span.marks || []).includes("em") ? `<span class="accent">${t}</span>` : t;
    }).join("") + "</p>"
  ).join("\n        ");
}

function boardCard(m, index) {
  const open = m.status === "open";
  const color = open ? OPEN_COLOR : MONOGRAM_COLORS[index % MONOGRAM_COLORS.length];
  const bio = has(m.bio) ? paragraphs(m.bio).map((p) => `<p>${esc(p)}</p>`).join("\n              ")
    : '<p class="tc-bio-pending">Bio coming soon.</p>';
  if (open) {
    return `
        <div class="tc-card reveal" style="--ca:${color};" tabindex="0" role="button" aria-label="Open position: ${esc(m.role)}. Learn more">
          <div class="tc-face">
            <div class="tc-monogram tc-monogram--plus">+</div>
            <div class="tc-nameplate">
              <div class="tc-name">You?</div>
              <div class="tc-role">${esc(m.role)}</div>
            </div>
            <div class="tc-prompt" aria-hidden="true">${PLUS_ICON} Learn more</div>
          </div>
          <div class="tc-bio">
            <div class="tc-bio-inner">
              <div class="tc-bio-name">Open Position</div>
              <div class="tc-bio-role">${esc(m.role)}</div>
              ${bio}
              <a href="/join" class="btn btn-primary" style="margin-top: 1.1rem;">Get Involved</a>
            </div>
          </div>
        </div>`;
  }
  return `
        <div class="tc-card reveal" style="--ca:${color};" tabindex="0" role="button" aria-label="${esc(m.name)}, ${esc(m.role)}. View bio">
          <div class="tc-face">
            <div class="tc-monogram">${esc(initials(m.name))}</div>
            <div class="tc-nameplate">
              <div class="tc-name">${esc(m.name)}</div>
              <div class="tc-role">${esc(m.role)}</div>
            </div>
            <div class="tc-prompt" aria-hidden="true">${PLUS_ICON} View bio</div>
          </div>
          <div class="tc-bio">
            <div class="tc-bio-inner">
              <div class="tc-bio-name">${esc(m.name)}</div>
              <div class="tc-bio-role">${esc(m.role)}</div>
              ${bio}
            </div>
          </div>
        </div>`;
}

// Each renderer returns the region's HTML, or null to keep the template's text.
const REGIONS = {
  heroTitle: (d) => has(d.hero?.title) && has(d.hero?.kicker) ? `<h1 class="hero-title">
        <span class="hero-kicker">${esc(d.hero.kicker)}</span>
        ${lines(d.hero.title).map((l) => `<span class="hero-line">${esc(l)}</span>`).join("\n        ")}
      </h1>` : null,
  heroText: (d) => has(d.hero?.text) ? `<p class="hero-lead">${esc(d.hero.text)}</p>` : null,
  storyHeading: (d) => has(d.story?.heading) ? `<h2 class="h2">${esc(d.story.heading)}</h2>` : null,
  storyTimeline: (d) => has(d.story?.timeline) ? `<ol class="story-timeline">
            ${d.story.timeline.map((t) => `<li><span class="story-year">${esc(t.year)}</span><span class="story-event">${esc(t.text)}</span></li>`).join("\n            ")}
          </ol>` : null,
  storyText: (d) => has(d.story?.lead) && has(d.story?.body)
    ? `<p class="story-lead">${esc(d.story.lead)}</p>\n          ` +
      paragraphs(d.story.body).map((p) => `<p class="story-body">${esc(p)}</p>`).join("\n          ")
    : null,
  missionLabel: (d) => has(d.mission?.label) ? `<h2 class="mission-label">${esc(d.mission.label)}</h2>` : null,
  missionStatement: (d) => has(d.mission?.statement) ? statementHtml(d.mission.statement) : null,
  focusHead: (d) => has(d.focus?.heading) ? `
        <h2 class="h2">${esc(d.focus.heading)}</h2>` + (has(d.focus.intro) ? `
        <p class="lead">${esc(d.focus.intro)}</p>` : "") : null,
  focusAreas: (d) => has(d.focus?.areas) ? d.focus.areas.map((a) => `
        <div class="focus-item reveal">
          <div class="focus-body">
            <h3>${esc(a.title)}</h3>
            <p>${esc(a.text)}</p>
          </div>
        </div>`).join("") : null,
  boardHead: (d) => has(d.board?.heading) ? `<h2 class="h2">${esc(d.board.heading)}</h2>` +
    (has(d.board.intro) ? `\n        <p class="lead">${esc(d.board.intro)}</p>` : "") : null,
  boardMembers: (d) => has(d.board?.members) ? d.board.members.map(boardCard).join("\n") : null,
  eventsHeading: (d) => has(d.events?.heading) ? `<h2 class="h2">${esc(d.events.heading)}</h2>` : null,
  newsletterIntro: (d) => has(d.newsletter?.intro) ? `          <p>${esc(d.newsletter.intro)}</p>` : null,
  joinHead: (d) => has(d.join?.heading) ? `<h2 class="h2">${esc(d.join.heading)}</h2>` +
    (has(d.join.text) ? `\n            <p class="lead">${esc(d.join.text)}</p>` : "") : null,
  joinBenefits: (d) => has(d.join?.benefits) ? d.join.benefits.filter(has).map((b) =>
    `\n            <li><span class="check">${CHECK_ICON}</span>${esc(b)}</li>`).join("") : null,
};

function fill(html, data) {
  let out = html;
  for (const [key, render] of Object.entries(REGIONS)) {
    const rendered = render(data);
    if (rendered == null) continue;
    const re = new RegExp(`<!--cms:${key}-->[\\s\\S]*?<!--/cms:${key}-->`);
    out = out.replace(re, () => rendered);
  }
  if (has(data.seoDescription)) {
    out = out.replace(/<meta name="description" content="[^"]*"/, () => `<meta name="description" content="${esc(clip(data.seoDescription, 170))}"`);
  }
  return out;
}

function finish(html) {
  // Strip the region markers and add a canonical URL for the one homepage address.
  return html
    .replace(/<!--\/?cms:\w+-->/g, "")
    .replace("</title>", `</title>\n  <link rel="canonical" href="${SITE_URL}/" />`);
}

module.exports = async function handler(req, res) {
  const html = await template(req);
  let data = null;
  try {
    data = await sanityQuery('*[_id == "homePage"][0]');
  } catch (err) {
    console.error(err); // fall back to the template's own text
  }
  if (!data) return send(res, 200, finish(html), { cache: CACHE_FALLBACK });
  send(res, 200, finish(fill(html, data)), { cache: PAGE_CACHE });
};
