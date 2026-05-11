import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { createPayloadProductsWorkflow } from "../workflows/create-payload-products"

export default async function productCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await createPayloadProductsWorkflow(container).run({
      input: { product_ids: [data.id] },
    })
    logger.info(`Product ${data.id} synced to Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to sync product ${data.id} to Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
}
