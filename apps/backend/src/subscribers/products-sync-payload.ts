import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncPayloadProductsWorkflow } from "../workflows/sync-payload-products"
import { PAYLOAD_MODULE } from "../modules/payload"
import PayloadModuleService from "../modules/payload/service"

const BATCH_SIZE = 20

export default async function productsSyncPayloadHandler({
  event: { data },
  container,
}: SubscriberArgs<{ ids?: string[] }>) {
  const logger = container.resolve("logger")
  const payloadService: PayloadModuleService = container.resolve(PAYLOAD_MODULE)

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
      payloadService.startSync("products", 0)
      payloadService.finishSync("products")
      return
    }

    payloadService.startSync("products", productIds.length)

    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE)
      try {
        const { result } = await syncPayloadProductsWorkflow(container).run({
          input: { product_ids: batch },
        })
        const summary = result as { created: number; updated: number }
        payloadService.reportSyncProgress("products", {
          processed: batch.length,
          created: summary.created || 0,
          updated: summary.updated || 0,
        })
        logger.info(
          `Synced batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} products) to Payload CMS`
        )
      } catch (batchError: any) {
        payloadService.reportSyncProgress("products", {
          processed: batch.length,
          failed: batch.length,
        })
        logger.error(
          `Batch starting at index ${i} failed: ${batchError.message}`
        )
      }
    }

    const finalState = payloadService.getSyncState("products")
    payloadService.finishSync(
      "products",
      finalState.failed > 0
        ? `${finalState.failed} of ${finalState.total} products failed`
        : undefined
    )

    logger.info(
      `Bulk sync complete: ${finalState.created} created, ${finalState.updated} updated, ${finalState.failed} failed (${finalState.total} total)`
    )
  } catch (error: any) {
    payloadService.finishSync("products", error.message)
    logger.error(`Failed to bulk sync products to Payload: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "products.sync-payload",
}
