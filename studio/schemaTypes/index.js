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

const newsletter = {
  name: 'newsletter',
  title: 'Newsletter Issue',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'date', title: 'Display Date', type: 'string', description: 'e.g. April 2026' },
    { name: 'issueNumber', title: 'Issue Number', type: 'number', description: 'e.g. 18' },
    { name: 'body', title: 'Summary', type: 'text', description: 'Short paragraph shown in the archive' },
    { name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}] },
    { name: 'link', title: 'Full Issue Link', type: 'url' },
    { name: 'publishedAt', title: 'Published Date', type: 'date', description: 'Used for ordering newest first' },
  ],
}

export const schemaTypes = [siteSettings, event, newsletter]
