import {event} from './event'
import {newsletter} from './newsletter'

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

export const schemaTypes = [newsletter, event, siteSettings]
