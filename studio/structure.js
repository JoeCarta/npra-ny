import {CalendarIcon, DocumentTextIcon, HomeIcon} from '@sanity/icons'

// Types with their own sidebar entry (or hidden) instead of the generic list.
const CUSTOM = ['homePage', 'newsletter', 'event', 'siteSettings']

// Sidebar for writers: the Home page, La Agenda and the calendar first.
export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home page')
        .id('homePage')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home page')),
      S.divider(),
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
      ...S.documentTypeListItems().filter((item) => !CUSTOM.includes(item.getId())),
    ])
