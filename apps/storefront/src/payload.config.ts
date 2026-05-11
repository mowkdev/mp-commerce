import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { Users } from './collections/Users'
import { Products } from './collections/Products'
import { Media } from './collections/Media'

export default buildConfig({
  editor: lexicalEditor(),

  collections: [
    Users,
    Products,
    Media
  ],

  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'lv', label: 'Latvian', fallbackLocale: 'en' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URL || '',
    },
  }),
  sharp,
})