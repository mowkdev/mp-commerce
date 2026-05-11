import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  useQueryGraphStep,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { createPayloadItemsStep } from "./steps/create-payload-items"

type CreatePayloadProductsInput = {
  product_ids: string[]
}

export const createPayloadProductsWorkflow = createWorkflow(
  "create-payload-products",
  function (input: CreatePayloadProductsInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "handle",
        "thumbnail",
        "metadata",
      ],
      filters: {
        id: input.product_ids,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const payloadProducts = transform({ products }, (data) => {
      return data.products.map((product: any) => ({
        medusa_id: product.id,
        title: product.title,
        subtitle: product.subtitle || "",
        handle: product.handle,
        thumbnail: product.thumbnail || "",
      }))
    })

    const createdItems = createPayloadItemsStep({
      collection: "products",
      items: payloadProducts,
    })

    const updateData = transform({ createdItems }, (data) => {
      return data.createdItems
        .filter((item: any) => item.id && item.medusa_id)
        .map((item: any) => ({
          id: item.medusa_id,
          metadata: {
            payload_id: item.id,
          },
        }))
    })

    updateProductsWorkflow.runAsStep({
      input: {
        products: updateData,
      },
    })

    return new WorkflowResponse(createdItems)
  }
)
