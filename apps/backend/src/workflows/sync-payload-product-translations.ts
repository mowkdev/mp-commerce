import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { syncPayloadTranslationsStep } from "./steps/sync-payload-translations"

type SyncPayloadProductTranslationsInput = {
  product_ids: string[]
  locale_code: string
}

const MEDUSA_TO_PAYLOAD_LOCALE: Record<string, string> = {
  "lv-LV": "lv",
  "en": "en",
}

export const syncPayloadProductTranslationsWorkflow = createWorkflow(
  "sync-payload-product-translations",
  function (input: SyncPayloadProductTranslationsInput) {
    const payloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: input.product_ids,
    })

    const translationInput = transform(
      { payloadProducts, input },
      (data) => {
        const payloadLocale =
          MEDUSA_TO_PAYLOAD_LOCALE[data.input.locale_code] ||
          data.input.locale_code

        return {
          collection: "products",
          entity: "product",
          items: data.payloadProducts
            .filter((p: any) => p.id && p.medusa_id)
            .map((p: any) => ({
              payload_id: p.id,
              medusa_id: p.medusa_id,
            })),
          locales: [
            { medusa: data.input.locale_code, payload: payloadLocale },
          ],
          translatable_fields: [
            "title",
            "subtitle",
            "description",
          ],
        }
      }
    )

    const result = syncPayloadTranslationsStep(translationInput)

    return new WorkflowResponse(result)
  }
)
