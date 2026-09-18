import {DocumentTextIcon} from '@sanity/icons'

// Sidebar for writers: La Agenda first, everything else below.
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
      S.divider(),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'newsletter'),
    ])
