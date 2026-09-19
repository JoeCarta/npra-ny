import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon, UserIcon} from '@sanity/icons'

// One "Home page" document (a singleton, see structure.js). Its sections follow
// the page from top to bottom; each is collapsed so the form reads like an outline.
const section = (name, title, fields, collapsed = true) =>
  defineField({name, title, type: 'object', options: {collapsible: true, collapsed}, fields})

const required = (message) => (rule) => rule.required().error(message)
const paragraphsHelp = 'To start a new paragraph, leave a blank line.'

const boardMember = defineArrayMember({
  name: 'boardMember',
  title: 'Board member',
  type: 'object',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'status',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Board member', value: 'member'},
          {title: 'Open position (recruiting)', value: 'open'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'member',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      hidden: ({parent}) => parent?.status === 'open',
      validation: (rule) =>
        rule.custom((name, {parent}) =>
          parent?.status === 'open' || name ? true : 'Add the board member’s name.',
        ),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'E.g. “Chapter President”. For an open position, the role you’re recruiting for.',
      validation: required('Add a role.'),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 8,
      description: `${paragraphsHelp} Leave empty to show “Bio coming soon.”`,
    }),
  ],
  preview: {
    select: {name: 'name', role: 'role', status: 'status'},
    prepare: ({name, role, status}) => ({
      title: status === 'open' ? `Open position: ${role || ''}` : name || 'New board member',
      subtitle: status === 'open' ? 'Shown as “You?” with a Get Involved button' : role,
    }),
  },
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    section(
      'hero',
      'Top of the page',
      [
        defineField({name: 'kicker', title: 'Small line above the title', type: 'string', validation: required('Add the small line above the title.')}),
        defineField({name: 'title', title: 'Title', type: 'text', rows: 2, description: 'Each line here is its own line on the page.', validation: required('Add the title.')}),
        defineField({name: 'text', title: 'Intro sentence', type: 'text', rows: 3, validation: required('Add the intro sentence.')}),
      ],
      false,
    ),
    section('story', 'Our Story', [
      defineField({name: 'heading', title: 'Heading', type: 'string', validation: required('Add a heading.')}),
      defineField({
        name: 'timeline',
        title: 'Timeline',
        type: 'array',
        description: 'Key dates shown beside the story. Drag to reorder.',
        of: [
          defineArrayMember({
            name: 'milestone',
            title: 'Date',
            type: 'object',
            fields: [
              defineField({name: 'year', title: 'Year', type: 'string', validation: required('Add the year.')}),
              defineField({name: 'text', title: 'What happened', type: 'string', validation: required('Describe what happened.')}),
            ],
            preview: {select: {title: 'year', subtitle: 'text'}},
          }),
        ],
      }),
      defineField({name: 'lead', title: 'Opening sentence (large)', type: 'text', rows: 3, validation: required('Add the opening sentence.')}),
      defineField({name: 'body', title: 'Story', type: 'text', rows: 8, description: paragraphsHelp, validation: required('Add the story.')}),
    ]),
    section('mission', 'Mission', [
      defineField({name: 'label', title: 'Label', type: 'string', validation: required('Add a label.')}),
      defineField({
        name: 'statement',
        title: 'Mission statement',
        type: 'array',
        description: 'Select words and press Italic to highlight them in red italics.',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [{title: 'Normal', value: 'normal'}],
            lists: [],
            marks: {decorators: [{title: 'Italic', value: 'em'}], annotations: []},
          }),
        ],
        validation: required('Add the mission statement.'),
      }),
    ]),
    section('focus', 'Focus Areas', [
      defineField({name: 'heading', title: 'Heading', type: 'string', validation: required('Add a heading.')}),
      defineField({name: 'intro', title: 'Intro', type: 'text', rows: 3}),
      defineField({
        name: 'areas',
        title: 'Focus areas',
        type: 'array',
        description: 'Drag to reorder.',
        of: [
          defineArrayMember({
            name: 'focusArea',
            title: 'Focus area',
            type: 'object',
            fields: [
              defineField({name: 'title', title: 'Title', type: 'string', validation: required('Add a title.')}),
              defineField({name: 'text', title: 'Description', type: 'text', rows: 4, validation: required('Add a description.')}),
            ],
            preview: {select: {title: 'title', subtitle: 'text'}},
          }),
        ],
      }),
    ]),
    section('board', 'Board', [
      defineField({name: 'heading', title: 'Heading', type: 'string', validation: required('Add a heading.')}),
      defineField({name: 'intro', title: 'Intro', type: 'text', rows: 3}),
      defineField({
        name: 'members',
        title: 'Board members',
        type: 'array',
        description: 'Click a person to edit their name, role or bio. Drag to change the order on the page.',
        of: [boardMember],
      }),
    ]),
    section('events', 'Upcoming Events', [
      defineField({
        name: 'heading',
        title: 'Heading',
        type: 'string',
        description: 'The events themselves come from Calendar (events & flyers).',
        validation: required('Add a heading.'),
      }),
    ]),
    section('newsletter', 'La Agenda sign-up', [
      defineField({
        name: 'intro',
        title: 'Text under “La Agenda-NY”',
        type: 'text',
        rows: 3,
        description: 'The recent issues come from La Agenda (newsletter).',
        validation: required('Add the text.'),
      }),
    ]),
    section('join', 'Become a Member', [
      defineField({name: 'heading', title: 'Heading', type: 'string', validation: required('Add a heading.')}),
      defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
      defineField({
        name: 'benefits',
        title: 'Member benefits (checklist)',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        description: 'Drag to reorder.',
      }),
    ]),
    defineField({
      name: 'seoDescription',
      title: 'Google description',
      type: 'text',
      rows: 3,
      description: 'The short summary Google may show under the site’s name in search results. About 150 characters.',
      validation: (rule) => rule.max(170).warning('Google usually cuts this off after about 160 characters.'),
    }),
  ],
  preview: {prepare: () => ({title: 'Home page'})},
})
