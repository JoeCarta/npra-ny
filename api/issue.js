// Server-rendered La Agenda issue page: /la-agenda/<page link>  (see vercel.json)
// The full text is in the HTML Google receives, with title, description,
// canonical URL, social previews and NewsArticle structured data.
const {
  SITE_URL, ORG_NAME, PAGE_CACHE, sanityQuery, esc, imageUrl, formatDate, safeHref,
  renderPortableText, renderPage, clip, send,
} = require("./_lib/site");

const CACHE_MISSING = "public, max-age=0, s-maxage=30";

const ISSUE_QUERY = `*[_type == "newsletter" && slug.current == $slug][0]{
  title, "slug": slug.current, issueNumber, publishedAt, _updatedAt, author, summary, tags, link,
  coverImage{alt, asset}, article, "pdfUrl": pdf.asset->url
}`;

function slugFrom(req) {
  if (req.query && typeof req.query.slug === "string") return req.query.slug;
  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get("slug") || (url.pathname.match(/^\/la-agenda\/([^/]+)/) || [])[1] || "";
}

function missingPage(req, heading, message) {
  return renderPage(req, {
    title: `${heading} | La Agenda-NY`,
    headExtra: '  <meta name="robots" content="noindex" />\n',
    main: `  <main id="issue">
    <section class="page-header" id="top">
      <div class="container">
        <div class="page-header-content">
          <div class="eyebrow"><a href="/newsletter" class="issue-eyebrow-link">La Agenda&#8209;NY</a></div>
          <h1 class="page-title issue-title">${esc(heading)}</h1>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="issue-body">
          <p class="lead">${esc(message)}</p>
          <div class="issue-actions"><a href="/newsletter" class="nl-archive-link issue-back">&larr; All issues</a></div>
        </div>
      </div>
    </section>
  </main>`,
  });
}

module.exports = async function handler(req, res) {
  const slug = decodeURIComponent(slugFrom(req)).toLowerCase();
  if (!/^[a-z0-9-]{1,96}$/.test(slug)) {
    return send(res, 404, await missingPage(req, "Issue not found", "This link doesn’t point to an issue of La Agenda-NY."), { cache: CACHE_MISSING });
  }

  let issue;
  try {
    issue = await sanityQuery(ISSUE_QUERY, { slug });
  } catch (err) {
    console.error(err);
    return send(res, 503, await missingPage(req, "Couldn’t load this issue", "Please try again in a moment."), { cache: "no-store" });
  }
  if (!issue) {
    return send(res, 404, await missingPage(req, "Issue not found",
      "We couldn’t find that issue. It may not be published yet, or its link may have changed."), { cache: CACHE_MISSING });
  }

  const url = `${SITE_URL}/la-agenda/${issue.slug}`;
  const description = clip(issue.summary, 160);
  const coverRef = issue.coverImage && issue.coverImage.asset && issue.coverImage.asset._ref;
  const shareImage = coverRef ? imageUrl(coverRef, "w=1200&h=630&fit=crop&auto=format") : "";
  const tags = issue.tags || [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: clip(issue.title, 110),
    description,
    url,
    mainEntityOfPage: url,
    datePublished: issue.publishedAt,
    dateModified: issue._updatedAt,
    inLanguage: "en",
    articleSection: "La Agenda-NY",
    isPartOf: { "@type": "Periodical", name: "La Agenda-NY" },
    author: issue.author
      ? { "@type": "Person", name: issue.author }
      : { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/images/NPRAflag.png` },
    },
    ...(shareImage ? { image: [shareImage] } : {}),
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
  };

  const headExtra = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="La Agenda-NY | NPRA New York Chapter" />`,
    `<meta property="og:title" content="${esc(issue.title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    issue.publishedAt ? `<meta property="article:published_time" content="${esc(issue.publishedAt)}" />` : "",
    shareImage ? `<meta property="og:image" content="${esc(shareImage)}" />` : "",
    `<meta name="twitter:card" content="${shareImage ? "summary_large_image" : "summary"}" />`,
    `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`,
  ].filter(Boolean).map((line) => "  " + line + "\n").join("");

  const meta = [
    issue.publishedAt ? `<time class="issue-date" datetime="${esc(issue.publishedAt)}">${esc(formatDate(issue.publishedAt))}</time>` : "",
    issue.issueNumber ? `<span>Issue #${esc(issue.issueNumber)}</span>` : "",
    issue.author ? `<span>By ${esc(issue.author)}</span>` : "",
  ].join("");
  const cover = coverRef
    ? `<figure class="issue-cover"><img src="${esc(imageUrl(coverRef, "w=1600&fit=max&auto=format"))}" alt="${esc(issue.coverImage.alt)}"></figure>`
    : "";
  const buttons = [
    issue.pdfUrl ? `<a href="${esc(issue.pdfUrl)}" class="btn btn-primary" target="_blank" rel="noopener">Download the PDF</a>` : "",
    safeHref(issue.link) ? `<a href="${esc(issue.link)}" class="btn" target="_blank" rel="noopener">View this issue online</a>` : "",
  ].join("");
  const tagList = tags.length
    ? `<div class="nl-archive-tags">${tags.map((t) => `<span class="nl-archive-tag">${esc(t)}</span>`).join("")}</div>`
    : "";

  const main = `  <main id="issue">
    <article>
      <header class="page-header" id="top">
        <div class="container">
          <div class="page-header-content">
            <div class="eyebrow"><a href="/newsletter" class="issue-eyebrow-link">La Agenda&#8209;NY</a></div>
            <h1 class="page-title issue-title">${esc(issue.title)}</h1>
            ${meta ? `<p class="issue-meta">${meta}</p>` : ""}
            ${issue.summary ? `<p class="lead">${esc(issue.summary)}</p>` : ""}
          </div>
        </div>
      </header>
      <div class="section">
        <div class="container">
          <div class="issue-body">
            ${cover}<div class="prose">${renderPortableText(issue.article)}</div>${buttons ? `<div class="issue-buttons">${buttons}</div>` : ""}
            <div class="issue-actions">${tagList}<a href="/newsletter" class="nl-archive-link issue-back">&larr; All issues</a></div>
          </div>
        </div>
      </div>
    </article>
  </main>`;

  const html = await renderPage(req, {
    title: `${issue.title} | La Agenda-NY`,
    description,
    canonical: url,
    headExtra,
    main,
  });
  send(res, 200, html, { cache: PAGE_CACHE });
};
