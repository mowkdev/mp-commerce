import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncPayloadProductTranslationsWorkflow } from "../workflows/sync-payload-product-translations"

type TranslationEventData = {
  id: string
  reference: string
  reference_id: string
  locale_code: string
}

export default async function translationUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<TranslationEventData>) {
  const logger = container.resolve("logger")

  if (data.reference !== "product") {
    return
  }

  try {
    await syncPayloadProductTranslationsWorkflow(container).run({
      input: {
        product_ids: [data.reference_id],
        locale_code: data.locale_code,
      },
    })
    logger.info(
      `Synced ${data.locale_code} translation for product ${data.reference_id} to Payload`
    )
  } catch (error: any) {
    logger.error(
      `Failed to sync translation for product ${data.reference_id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["translation.created", "translation.updated"],
}
