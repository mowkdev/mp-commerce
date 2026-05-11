import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { deletePayloadProductVariantsWorkflow } from "../workflows/delete-payload-product-variants"

export default async function variantDeletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve("logger")

  try {
    await deletePayloadProductVariantsWorkflow(container).run({
      input: { variant_id: data.id, product_id: data.product_id },
    })
    logger.info(`Variant ${data.id} deleted from Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to delete variant ${data.id} from Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product-variant.deleted",
}
