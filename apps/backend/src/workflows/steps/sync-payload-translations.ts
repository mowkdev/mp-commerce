import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../modules/payload"
import PayloadModuleService from "../../modules/payload/service"

type LocaleMapping = {
  medusa: string
  payload: string
}

type PayloadItemRef = {
  payload_id: string
  medusa_id: string
}

type SyncPayloadTranslationsInput = {
  collection: string
  items: PayloadItemRef[]
  locales: LocaleMapping[]
  entity: string
  translatable_fields: string[]
}

export const syncPayloadTranslationsStep = createStep(
  "sync-payload-translations",
  async (input: SyncPayloadTranslationsInput, { container }) => {
    if (!input.items.length || !input.locales.length) {
      return new StepResponse([])
    }

    const payloadService: PayloadModuleService =
      container.resolve(PAYLOAD_MODULE)
    const query = container.resolve("query") as any
    const logger = container.resolve("logger") as any

    const existingDocs = await payloadService.find(input.collection, {
      where: {
        medusa_id: {
          in: input.items.map((i) => i.medusa_id).join(","),
        },
      },
      limit: input.items.length,
    })

    const existingByMedusaId = new Map(
      existingDocs.docs.map((doc: any) => [doc.medusa_id, doc])
    )

    const results: any[] = []

    for (const locale of input.locales) {
      const { data: products } = await query.graph(
        {
          entity: input.entity,
          fields: [
            "id",
            "title",
            "subtitle",
            "description",
            "options.*",
            "variants.*",
            "variants.options.*",
          ],
          filters: {
            id: input.items.map((i) => i.medusa_id),
          },
        },
        { locale: locale.medusa }
      )

      for (const product of products as any[]) {
        const item = input.items.find((i) => i.medusa_id === product.id)
        if (!item?.payload_id) continue

        const existingDoc = existingByMedusaId.get(product.id)
        if (!existingDoc) continue

        const localeData: Record<string, any> = {}

        if (product.title) localeData.title = product.title
        if (product.subtitle) localeData.subtitle = product.subtitle
        if (product.description) localeData.description = product.description

        if (product.options?.length && existingDoc.options?.length) {
          localeData.options = existingDoc.options.map((existing: any) => {
            const translated = product.options.find(
              (opt: any) => opt.id === existing.medusa_id
            )
            return {
              id: existing.id,
              medusa_id: existing.medusa_id,
              title: translated?.title || existing.title,
            }
          })
        }

        if (product.variants?.length && existingDoc.variants?.length) {
          localeData.variants = existingDoc.variants.map((existing: any) => {
            const translated = product.variants.find(
              (v: any) => v.id === existing.medusa_id
            )
            const optionValues = (existing.option_values || []).map(
              (existingOv: any) => {
                const translatedOv = (translated?.options || []).find(
                  (ov: any) => ov.id === existingOv.medusa_id
                )
                return {
                  id: existingOv.id,
                  medusa_id: existingOv.medusa_id,
                  medusa_option_id: existingOv.medusa_option_id,
                  value: translatedOv?.value || existingOv.value,
                }
              }
            )
            return {
              id: existing.id,
              medusa_id: existing.medusa_id,
              title: translated?.title || existing.title,
              option_values: optionValues,
            }
          })
        }

        try {
          const result = await payloadService.update(
            input.collection,
            item.payload_id,
            localeData,
            locale.payload
          )
          results.push(result.doc)
        } catch (error: any) {
          logger.warn(
            `Failed to sync ${locale.payload} translation for ${item.payload_id}: ${error.message}`
          )
        }
      }
    }

    return new StepResponse(results)
  }
)
