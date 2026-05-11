import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { deletePayloadItemsStep } from "./steps/delete-payload-items"

type DeletePayloadProductsInput = {
  product_ids: string[]
}

export const deletePayloadProductsWorkflow = createWorkflow(
  "delete-payload-products",
  function (input: DeletePayloadProductsInput) {
    const payloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: input.product_ids,
    })

    const deleteInput = transform({ payloadProducts }, (data) => ({
      collection: "products",
      ids: data.payloadProducts.map((p: any) => p.id).filter(Boolean),
    }))

    deletePayloadItemsStep(deleteInput)

    return new WorkflowResponse({ deleted: true })
  }
)
