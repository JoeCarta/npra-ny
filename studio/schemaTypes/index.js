import {event} from './event'
import {homePage} from './homePage'
import {newsletter} from './newsletter'

// Superseded by the Home page document; kept so the old document stays valid.
// Hidden from the Studio sidebar (see structure.js).
const siteSettings = {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Main headline shown on the homepage',
    },
    {
      name: 'subtext',
      title: 'Subtext',
      type: 'text',
      description: 'Short paragraph below the headline',
    },
  ],
}

export const schemaTypes = [homePage, newsletter, event, siteSettings]
