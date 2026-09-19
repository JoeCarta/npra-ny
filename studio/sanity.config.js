import {defineConfig, isDev} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const SITE_URL = 'https://www.nprany.org'

export default defineConfig({
  name: 'default',
  title: 'NPRA NY',

  projectId: 'nn3j1n98',
  dataset: 'production',

  // Vision (the query playground) is a developer tool; keep it out of the writers' Studio.
  plugins: [structureTool({structure}), ...(isDev ? [visionTool()] : [])],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Adds "Open preview" to the document menu, linking to the live issue page.
    productionUrl: async (prev, {document}) => {
      if (document._type === 'newsletter' && document.slug?.current) {
        return `${SITE_URL}/la-agenda/${encodeURIComponent(document.slug.current)}`
      }
      return prev
    },
  },
})
