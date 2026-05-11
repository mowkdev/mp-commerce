import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { updatePayloadItemsStep } from "./steps/update-payload-items"

type DeletePayloadProductOptionsInput = {
  option_id: string
  product_id: string
}

export const deletePayloadProductOptionsWorkflow = createWorkflow(
  "delete-payload-product-options",
  function (input: DeletePayloadProductOptionsInput) {
    const payloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: [input.product_id],
    })

    const updateInput = transform(
      { payloadProducts, input },
      (data) => {
        const payloadProduct = data.payloadProducts[0]
        if (!payloadProduct) return { collection: "products", items: [] }

        const existingOptions = (payloadProduct.options as any[]) || []
        const filteredOptions = existingOptions.filter(
          (o: any) => o.medusa_id !== data.input.option_id
        )

        return {
          collection: "products",
          items: [
            {
              id: payloadProduct.id,
              data: { options: filteredOptions },
            },
          ],
        }
      }
    )

    const result = updatePayloadItemsStep(updateInput)

    return new WorkflowResponse(result)
  }
)
