import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon, LinkIcon} from '@sanity/icons'

// Turns "¡No a Esencia! Echoes…" into "no-a-esencia-echoes…" (accents and
// punctuation stripped) so issue links stay clean and shareable.
function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const altText = defineField({
  name: 'alt',
  title: 'Image description',
  type: 'string',
  description: 'A short description for readers who use screen readers, e.g. "Marchers outside J.P. Morgan’s NYC headquarters".',
  validation: (rule) => rule.required().warning('Add a short image description for screen readers.'),
})

export const newsletter = defineType({
  name: 'newsletter',
  title: 'La Agenda Issue',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [{name: 'details', title: 'Issue details', options: {columns: 2}}],
  fields: [
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      validation: (rule) => rule.required().error('Every issue needs a headline.'),
    }),
    defineField({
      name: 'slug',
      title: 'Page link',
      type: 'slug',
      description: 'Click “Generate” to create this from the headline. The issue’s page will be nprany.org/la-agenda/ followed by this.',
      options: {source: 'title', maxLength: 80, slugify},
      validation: (rule) => rule.required().error('Click “Generate” to create the page link.'),
    }),
    defineField({
      name: 'issueNumber',
      title: 'Issue number',
      type: 'number',
      fieldset: 'details',
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Issue date',
      type: 'date',
      fieldset: 'details',
      description: 'Issues are listed newest first by this date.',
      options: {dateFormat: 'MMMM D, YYYY'},
      validation: (rule) => rule.required().error('Pick the date for this issue.'),
    }),
    defineField({
      name: 'author',
      title: 'Written by',
      type: 'string',
      description: 'Optional. Shown under the headline, e.g. “Desiree Colón”.',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'Two or three sentences shown on the La Agenda page and the homepage. The opening paragraph of the article often works.',
      validation: (rule) => [
        rule.required().error('Add a short summary for the issue list.'),
        rule.max(400).warning('Long summaries get cut off on the homepage. Try to keep it under 400 characters.'),
      ],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      description: 'Optional. Shown at the top of the issue.',
      options: {hotspot: true},
      fields: [altText],
    }),
    defineField({
      name: 'article',
      title: 'Full article',
      type: 'array',
      description: 'Required. Type it here or paste straight from Google Docs or Word (bold, italics, headings, lists and links carry over). This text becomes the issue’s own web page, which is what Google can find and read. A PDF or image alone can’t be searched.',
      validation: (rule) =>
        rule.required().error('Add the full text of the issue. It’s what readers and Google see on the issue’s page.'),
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Paragraph', value: 'normal'},
            {title: 'Heading', value: 'h2'},
            {title: 'Subheading', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bulleted list', value: 'bullet'},
            {title: 'Numbered list', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              defineArrayMember({
                name: 'link',
                title: 'Link',
                type: 'object',
                icon: LinkIcon,
                fields: [
                  defineField({
                    name: 'href',
                    title: 'Web address',
                    type: 'url',
                    validation: (rule) =>
                      rule.required().uri({scheme: ['http', 'https', 'mailto', 'tel']}),
                  }),
                ],
              }),
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          title: 'Image',
          options: {hotspot: true},
          fields: [
            altText,
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Topics',
      type: 'array',
      description: 'Optional. Type a topic and press Enter, e.g. Housing, Advocacy, Education.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'pdf',
      title: 'PDF version',
      type: 'file',
      description: 'Optional extra. If the issue was also designed as a PDF (Canva, InDesign, etc.), upload it and readers get a download button. The full text above is still needed.',
      options: {accept: 'application/pdf'},
    }),
    defineField({
      name: 'link',
      title: 'Outside link',
      type: 'url',
      description: 'Optional. If the issue also lives somewhere else (like an email campaign page), paste that link here.',
    }),
  ],
  initialValue: async (_params, {getClient}) => {
    const client = getClient({apiVersion: '2025-02-19'})
    const lastIssue = await client.fetch(
      '*[_type == "newsletter" && defined(issueNumber)] | order(issueNumber desc)[0].issueNumber',
    )
    return {
      // en-CA formats as YYYY-MM-DD in the writer's own timezone.
      publishedAt: new Date().toLocaleDateString('en-CA'),
      issueNumber: typeof lastIssue === 'number' ? lastIssue + 1 : undefined,
    }
  },
  orderings: [
    {title: 'Newest first', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
    {title: 'Issue number', name: 'issueDesc', by: [{field: 'issueNumber', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', issueNumber: 'issueNumber', date: 'publishedAt', media: 'coverImage'},
    prepare({title, issueNumber, date, media}) {
      const subtitle = [issueNumber && `Issue #${issueNumber}`, formatDate(date)]
        .filter(Boolean)
        .join(' · ')
      return {title: title || 'Untitled issue', subtitle, media}
    },
  },
})
