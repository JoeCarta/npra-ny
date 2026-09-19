import {CalendarIcon, DocumentTextIcon} from '@sanity/icons'

const LISTED = ['newsletter', 'event']

// Sidebar for writers: La Agenda and the calendar first, everything else below.
export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('La Agenda (newsletter)')
        .icon(DocumentTextIcon)
        .schemaType('newsletter')
        .child(
          S.documentTypeList('newsletter')
            .title('La Agenda issues')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Calendar (events & flyers)')
        .icon(CalendarIcon)
        .schemaType('event')
        .child(
          S.documentTypeList('event')
            .title('Events & flyers')
            .defaultOrdering([{field: 'startDate', direction: 'desc'}]),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !LISTED.includes(item.getId())),
    ])
