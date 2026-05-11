import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { updatePayloadItemsStep } from "./steps/update-payload-items"

type DeletePayloadProductVariantsInput = {
  variant_id: string
  product_id: string
}

export const deletePayloadProductVariantsWorkflow = createWorkflow(
  "delete-payload-product-variants",
  function (input: DeletePayloadProductVariantsInput) {
    const payloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: [input.product_id],
    })

    const updateInput = transform(
      { payloadProducts, input },
      (data) => {
        const payloadProduct = data.payloadProducts[0]
        if (!payloadProduct) return { collection: "products", items: [] }

        const existingVariants = (payloadProduct.variants as any[]) || []
        const filteredVariants = existingVariants.filter(
          (v: any) => v.medusa_id !== data.input.variant_id
        )

        return {
          collection: "products",
          items: [
            {
              id: payloadProduct.id,
              data: { variants: filteredVariants },
            },
          ],
        }
      }
    )

    const result = updatePayloadItemsStep(updateInput)

    return new WorkflowResponse(result)
  }
)
