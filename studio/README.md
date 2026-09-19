# NPRA-NY Content Studio

Sanity Studio for nprany.org. Writers use the hosted version at
**https://nprany.sanity.studio**; nothing here needs to run for them to publish.

- Project `nn3j1n98`, dataset `production` (public read)
- The website reads published content straight from Sanity in the browser
  (`js/main.js`), so publishing in the Studio updates the live site within
  about a minute, with no site redeploy needed.

## What's editable

| Studio section | Where it shows up |
| --- | --- |
| La Agenda (newsletter) | `newsletter.html` archive, homepage "Recent Issues", and `issue.html?i=<page link>` for issues with a full article |
| Calendar (events & flyers) | Monthly calendar on `members.html#events` (flyer popup per day, shareable `?day=YYYY-MM-DD` links) and the next three events on the homepage |
| Site Settings | Homepage board intro text (`subtext`) |

## Developing

```bash
npm install
npm run dev      # local Studio at http://localhost:3333
npm run deploy   # build + deploy to nprany.sanity.studio (also deploys the schema)
```

The hosted Studio auto-updates Sanity itself, so keep the local `sanity`
version in line with what `sanity build` reports as the runtime version.

Schema lives in `schemaTypes/`; the sidebar layout is in `structure.js`.
