import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { updatePayloadItemsStep } from "./steps/update-payload-items"

type UpdatePayloadProductVariantsInput = {
  variant_id: string
  product_id: string
}

export const updatePayloadProductVariantsWorkflow = createWorkflow(
  "update-payload-product-variants",
  function (input: UpdatePayloadProductVariantsInput) {
    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "title", "product_id", "options.*"],
      filters: {
        id: input.variant_id,
      },
    })

    const payloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: [input.product_id],
    })

    const updateInput = transform(
      { variants, payloadProducts },
      (data) => {
        const payloadProduct = data.payloadProducts[0]
        if (!payloadProduct) return { collection: "products", items: [] }

        const variant = data.variants[0]
        if (!variant) return { collection: "products", items: [] }

        const existingVariants = (payloadProduct.variants as any[]) || []
        const updatedVariants = existingVariants.map((v: any) => {
          if (v.medusa_id === variant.id) {
            return {
              ...v,
              title: variant.title,
              option_values: (variant.options || []).map((ov: any) => ({
                medusa_id: ov.id,
                medusa_option_id: ov.option_id,
                value: ov.value,
              })),
            }
          }
          return v
        })

        return {
          collection: "products",
          items: [
            {
              id: payloadProduct.id,
              data: { variants: updatedVariants },
            },
          ],
        }
      }
    )

    const result = updatePayloadItemsStep(updateInput)

    return new WorkflowResponse(result)
  }
)
