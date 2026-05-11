import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { deletePayloadProductOptionsWorkflow } from "../workflows/delete-payload-product-options"

export default async function optionDeletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve("logger")

  try {
    await deletePayloadProductOptionsWorkflow(container).run({
      input: { option_id: data.id, product_id: data.product_id },
    })
    logger.info(`Option ${data.id} deleted from Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to delete option ${data.id} from Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product-option.deleted",
}
