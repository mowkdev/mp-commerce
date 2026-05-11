import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncPayloadProductsWorkflow } from "../workflows/sync-payload-products"

export default async function productsSyncPayloadHandler({
  event: { data },
  container,
}: SubscriberArgs<{ ids?: string[] }>) {
  const logger = container.resolve("logger")

  try {
    const query = container.resolve("query") as any

    let productIds: string[] = data.ids || []

    if (!productIds.length) {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id"],
        filters: {},
      })
      productIds = products.map((p: any) => p.id)
    }

    if (!productIds.length) {
      logger.info("No products to sync to Payload CMS")
      return
    }

    const batchSize = 20
    let totalCreated = 0
    let totalUpdated = 0

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize)
      const { result } = await syncPayloadProductsWorkflow(container).run({
        input: { product_ids: batch },
      })
      totalCreated += (result as any).created || 0
      totalUpdated += (result as any).updated || 0
      logger.info(
        `Synced batch ${Math.floor(i / batchSize) + 1} (${batch.length} products) to Payload CMS`
      )
    }

    logger.info(
      `Bulk sync complete: ${totalCreated} created, ${totalUpdated} updated (${productIds.length} total)`
    )
  } catch (error: any) {
    logger.error(`Failed to bulk sync products to Payload: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "products.sync-payload",
}
