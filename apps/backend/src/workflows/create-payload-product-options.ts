import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { updatePayloadItemsStep } from "./steps/update-payload-items"

type CreatePayloadProductOptionsInput = {
  option_id: string
  product_id: string
}

export const createPayloadProductOptionsWorkflow = createWorkflow(
  "create-payload-product-options",
  function (input: CreatePayloadProductOptionsInput) {
    const { data: options } = useQueryGraphStep({
      entity: "product_option",
      fields: ["id", "title", "product_id"],
      filters: {
        id: input.option_id,
      },
    })

    const payloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: [input.product_id],
    })

    const updateInput = transform(
      { options, payloadProducts },
      (data) => {
        const payloadProduct = data.payloadProducts[0]
        if (!payloadProduct) return { collection: "products", items: [] }

        const option = data.options[0]
        if (!option) return { collection: "products", items: [] }

        const existingOptions = (payloadProduct.options as any[]) || []
        const newOption = {
          title: option.title,
          medusa_id: option.id,
        }

        return {
          collection: "products",
          items: [
            {
              id: payloadProduct.id,
              data: {
                options: [...existingOptions, newOption],
              },
            },
          ],
        }
      }
    )

    const result = updatePayloadItemsStep(updateInput)

    return new WorkflowResponse(result)
  }
)
