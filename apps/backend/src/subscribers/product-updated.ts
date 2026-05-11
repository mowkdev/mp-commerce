import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncPayloadProductsWorkflow } from "../workflows/sync-payload-products"

export default async function productUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await syncPayloadProductsWorkflow(container).run({
      input: { product_ids: [data.id] },
    })
    logger.info(`Product ${data.id} synced to Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to sync updated product ${data.id} to Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
}
