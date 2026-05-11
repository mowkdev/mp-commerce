import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { updatePayloadProductVariantsWorkflow } from "../workflows/update-payload-product-variants"

export default async function variantUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve("logger")

  try {
    await updatePayloadProductVariantsWorkflow(container).run({
      input: { variant_id: data.id, product_id: data.product_id },
    })
    logger.info(`Variant ${data.id} updated in Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to update variant ${data.id} in Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product-variant.updated",
}
