import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'nn3j1n98',
    dataset: 'production'
  },
  deployment: {
    // Hosted at https://nprany.sanity.studio
    appId: 'fq1yn51vwvf6qahe4ubla1so',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})
