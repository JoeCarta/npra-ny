# NPRA-NY Content Studio

Sanity Studio for nprany.org. Writers use the hosted version at
**https://nprany.sanity.studio**; nothing here needs to run for them to publish.

- Project `nn3j1n98`, dataset `production` (public read)
- The website reads published content straight from Sanity: the homepage and
  La Agenda issue pages are rendered by Vercel functions (`api/`, cached ~30s),
  and lists like events and recent issues load in the browser (`js/main.js`).
  Publishing in the Studio updates the live site within about 30 seconds,
  with no site redeploy needed.

## What's editable

| Studio section | Where it shows up |
| --- | --- |
| Home page | All the homepage's text (hero, Our Story, Mission, Focus Areas, Board, section headings, membership). `api/home.js` fills the marked regions of `templates/home.html`; anything empty keeps the template's text |
| La Agenda (newsletter) | `newsletter.html` archive, homepage "Recent Issues", and each issue's own page at `/la-agenda/<page link>`, server-rendered by `api/issue.js` so the full text is searchable (also listed in `/sitemap.xml`) |
| Calendar (events & flyers) | Upcoming list on `members.html#events`, next three events on the homepage, and the full-screen monthly calendar both pages open with "Open monthly calendar" (per-day flyer view, shareable `?day=YYYY-MM-DD` links) |
| Site Settings | Retired (replaced by Home page); hidden from the sidebar |

## Developing

```bash
npm install
npm run dev      # local Studio at http://localhost:3333
npm run deploy   # build + deploy to nprany.sanity.studio (also deploys the schema)
```

The hosted Studio auto-updates Sanity itself, so keep the local `sanity`
version in line with what `sanity build` reports as the runtime version.

Schema lives in `schemaTypes/`; the sidebar layout is in `structure.js`.
