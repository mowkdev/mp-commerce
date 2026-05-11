import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { createPayloadProductOptionsWorkflow } from "../workflows/create-payload-product-options"

export default async function optionCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve("logger")

  try {
    await createPayloadProductOptionsWorkflow(container).run({
      input: { option_id: data.id, product_id: data.product_id },
    })
    logger.info(`Option ${data.id} synced to Payload CMS`)
  } catch (error: any) {
    logger.error(
      `Failed to sync option ${data.id} to Payload: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product-option.created",
}
