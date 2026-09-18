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

const event = {
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'date', title: 'Date', type: 'string', description: 'e.g. April 23-25, 2026' },
    { name: 'location', title: 'Location', type: 'string' },
    { name: 'url', title: 'Registration Link', type: 'url' },
    { name: 'image', title: 'Event Image', type: 'image' },
  ],
}

export const schemaTypes = [newsletter, event, siteSettings]
