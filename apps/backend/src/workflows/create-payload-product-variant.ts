import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"
import { updatePayloadItemsStep } from "./steps/update-payload-items"

type CreatePayloadProductVariantInput = {
  variant_id: string
  product_id: string
}

export const createPayloadProductVariantWorkflow = createWorkflow(
  "create-payload-product-variant",
  function (input: CreatePayloadProductVariantInput) {
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
        const newVariant = {
          title: variant.title,
          medusa_id: variant.id,
          option_values: (variant.options || []).map((ov: any) => ({
            medusa_id: ov.id,
            medusa_option_id: ov.option_id,
            value: ov.value,
          })),
        }

        return {
          collection: "products",
          items: [
            {
              id: payloadProduct.id,
              data: {
                variants: [...existingVariants, newVariant],
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
