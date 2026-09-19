import {defineArrayMember, defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons'

function formatDate(date) {
  if (!date) return ''
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const event = defineType({
  name: 'event',
  title: 'Event / Flyer',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Event name',
      type: 'string',
      validation: (rule) => rule.required().error('Give the event a name.'),
    }),
    defineField({
      name: 'image',
      title: 'Flyer',
      type: 'image',
      description: 'Upload the flyer (JPG or PNG). It shows on the calendar and opens full size when clicked.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Flyer text',
          type: 'text',
          rows: 2,
          description: 'Type the key words on the flyer so people using screen readers get the same information.',
        }),
      ],
      validation: (rule) => rule.required().warning('Events show best on the calendar with a flyer.'),
    }),
    defineField({
      name: 'startDate',
      title: 'Date',
      type: 'date',
      description: 'The day of the event (or the first day, if it runs several days).',
      options: {dateFormat: 'MMMM D, YYYY'},
      validation: (rule) => rule.required().error('Pick the date of the event.'),
    }),
    defineField({
      name: 'endDate',
      title: 'Last day',
      type: 'date',
      description: 'Only for events that run more than one day in a row, like a 3-day convention.',
      options: {dateFormat: 'MMMM D, YYYY'},
      validation: (rule) =>
        rule.custom((endDate, context) => {
          const start = context.document?.startDate
          if (endDate && start && endDate < start) return 'The last day can’t be before the first day.'
          return true
        }),
    }),
    defineField({
      name: 'moreDates',
      title: 'Also happening on',
      type: 'array',
      description: 'Same flyer, other dates? Add each extra date here, e.g. a meeting that repeats.',
      of: [defineArrayMember({type: 'date', options: {dateFormat: 'MMMM D, YYYY'}})],
    }),
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      description: 'Optional. Write it the way you’d say it, e.g. “6:00 – 8:00 PM”.',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Optional, e.g. “El Museo del Barrio, New York” or “Online (Zoom)”.',
    }),
    defineField({
      name: 'description',
      title: 'Details',
      type: 'text',
      rows: 3,
      description: 'Optional. A sentence or two about the event.',
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      description: 'Optional. Registration, tickets or more info.',
    }),
  ],
  orderings: [
    {title: 'Date (newest first)', name: 'startDesc', by: [{field: 'startDate', direction: 'desc'}]},
    {title: 'Date (oldest first)', name: 'startAsc', by: [{field: 'startDate', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', start: 'startDate', end: 'endDate', more: 'moreDates', media: 'image'},
    prepare({title, start, end, more, media}) {
      let when = formatDate(start)
      if (end && end !== start) when += ' – ' + formatDate(end)
      if (more?.length) when += ` (+${more.length} more date${more.length > 1 ? 's' : ''})`
      return {title: title || 'Untitled event', subtitle: when, media}
    },
  },
})
