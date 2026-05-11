import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { deletePayloadProductsWorkflow } from "../workflows/delete-payload-products"

export default async function productDeletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await deletePayloadProductsWorkflow(container).run({
      input: { product_ids: [data.id] },
    })
    logger.info(`Product ${data.id} deleted from Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to delete product ${data.id} from Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}
