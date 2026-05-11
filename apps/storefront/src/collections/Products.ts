import { CollectionConfig } from 'payload'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';

const isMedusaRequest = ({ req }: { req: any }) => !!req.query.is_from_medusa

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'medusa_id',
      type: 'text',
      label: 'Medusa Product ID',
      required: true,
      unique: true,
      admin: {
        hidden: true,
      },
      access: {
        update: isMedusaRequest,
      }
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
      admin: {
        readOnly: true,
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
      name: 'description',
      type: 'richText',
      label: 'Description',
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
      name: 'images',
      type: 'array',
      label: 'Product Images',
      required: false,
      admin: {
        readOnly: true,
      },
      access: {
        update: isMedusaRequest,
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'Image URL',
          required: true,
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
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
    {
      name: "options",
      type: "array",
      admin: {
        readOnly: true,
      },
      access: {
        update: isMedusaRequest,
      },
      fields: [
        {
          name: "title",
          type: "text",
          label: "Option Title",
          required: true,
          localized: true,
        },
        {
          name: "medusa_id",
          type: "text",
          label: "Medusa Option ID",
          required: true,
          admin: {
            hidden: true,
          },
          access: {
            update: isMedusaRequest,
          }
        }
      ],
    },
    {
      name: "variants",
      type: "array",
      admin: {
        readOnly: true,
      },
      access: {
        update: isMedusaRequest,
      },
      fields: [
        {
          name: "title",
          type: "text",
          label: "Variant Title",
          required: true,
          localized: true,
        },
        {
          name: "medusa_id",
          type: "text",
          label: "Medusa Variant ID",
          required: true,
          admin: {
            hidden: true,
          },
          access: {
            update: isMedusaRequest,
          }
        },
        {
          name: "option_values",
          type: "array",
          fields: [
            {
              name: "medusa_id",
              type: "text",
              label: "Medusa Option Value ID",
              required: true,
              admin: {
                hidden: true,
              },
              access: {
                update: isMedusaRequest,
              }
            },
            {
              name: "medusa_option_id",
              type: "text",
              label: "Medusa Option ID",
              required: true,
              admin: {
                hidden: true,
              },
              access: {
                update: isMedusaRequest,
              }
            },
            {
              name: "value",
              type: "text",
              label: "Value",
              required: true,
              localized: true,
            }
          ]
        }
      ],
    }
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (typeof data.description === "string") {
          data.description = convertMarkdownToLexical({
            editorConfig: await editorConfigFactory.default({
              config: req.payload.config
            }),
            markdown: data.description,
          })
        }

        return data
      }
    ]
  },
  access: {
    create: isMedusaRequest,
    delete: isMedusaRequest,
  }
}
