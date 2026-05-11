import { CollectionConfig } from 'payload'

const isMedusaRequest = ({ req }: { req: any }) => !!req.query.is_from_medusa

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'handle', 'medusa_id'],
  },
  fields: [
    {
      name: 'medusa_id',
      type: 'text',
      label: 'Medusa Product ID',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Reference to the product in Medusa. Source of truth for product data.',
      },
      access: {
        update: isMedusaRequest,
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Synced from Medusa. Edit in Medusa admin.',
      },
      access: {
        update: isMedusaRequest,
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      required: false,
      localized: true,
      admin: {
        readOnly: true,
      },
      access: {
        update: isMedusaRequest,
      },
    },
    {
      name: 'handle',
      type: 'text',
      label: 'Handle',
      required: false,
      index: true,
      admin: {
        readOnly: true,
      },
      access: {
        update: isMedusaRequest,
      },
    },
    {
      name: 'thumbnail',
      type: 'text',
      label: 'Thumbnail URL',
      required: false,
      admin: {
        readOnly: true,
      },
      access: {
        update: isMedusaRequest,
      },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: {
        description: 'SEO metadata is managed in Payload (per-locale).',
      },
      fields: [
        {
          name: 'meta_title',
          type: 'text',
          label: 'Meta Title',
          required: false,
          localized: true,
        },
        {
          name: 'meta_description',
          type: 'textarea',
          label: 'Meta Description',
          required: false,
          localized: true,
        },
        {
          name: 'meta_keywords',
          type: 'text',
          label: 'Meta Keywords',
          required: false,
          localized: true,
        },
      ],
    },
  ],
  access: {
    create: isMedusaRequest,
    delete: isMedusaRequest,
  },
}
