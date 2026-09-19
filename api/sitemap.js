// /sitemap.xml (see vercel.json): the site's pages plus every La Agenda issue,
// so search engines find new issues as soon as they're published.
const { SITE_URL, sanityQuery, esc, send } = require("./_lib/site");

const STATIC_PAGES = ["/", "/newsletter", "/members", "/join"];

module.exports = async function handler(req, res) {
  let issues = [];
  try {
    issues = await sanityQuery(
      '*[_type == "newsletter" && defined(slug.current)] | order(publishedAt desc){"slug": slug.current, _updatedAt}'
    );
  } catch (err) {
    console.error(err); // still serve the static pages
  }
  const urls = STATIC_PAGES.map((p) => `  <url><loc>${esc(SITE_URL + p)}</loc></url>`)
    .concat((issues || []).map((i) =>
      `  <url><loc>${esc(`${SITE_URL}/la-agenda/${i.slug}`)}</loc><lastmod>${esc(String(i._updatedAt).slice(0, 10))}</lastmod></url>`));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join("\n") + "\n</urlset>\n";
  send(res, 200, xml, {
    type: "application/xml; charset=utf-8",
    cache: "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
  });
};
