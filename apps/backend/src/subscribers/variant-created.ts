import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { createPayloadProductVariantWorkflow } from "../workflows/create-payload-product-variant"

export default async function variantCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve("logger")

  try {
    await createPayloadProductVariantWorkflow(container).run({
      input: { variant_id: data.id, product_id: data.product_id },
    })
    logger.info(`Variant ${data.id} synced to Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to sync variant ${data.id} to Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product-variant.created",
}
