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
import { updatePayloadItemsStep } from "./steps/update-payload-items"
import { retrievePayloadItemsStep } from "./steps/retrieve-payload-items"

type SyncPayloadProductsInput = {
  product_ids: string[]
}

export const syncPayloadProductsWorkflow = createWorkflow(
  "sync-payload-products",
  function (input: SyncPayloadProductsInput) {
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

    const existingPayloadProducts = retrievePayloadItemsStep({
      collection: "products",
      medusa_ids: input.product_ids,
    })

    const splitData = transform(
      { products, existingPayloadProducts },
      (data) => {
        const existingByMedusaId = new Map(
          data.existingPayloadProducts.map((p: any) => [p.medusa_id, p])
        )

        const mapProduct = (product: any) => ({
          medusa_id: product.id,
          title: product.title,
          subtitle: product.subtitle || "",
          handle: product.handle,
          thumbnail: product.thumbnail || "",
        })

        const toCreate: any[] = []
        const toUpdate: any[] = []

        for (const product of data.products) {
          const existing = existingByMedusaId.get(product.id)
          if (existing) {
            toUpdate.push({
              id: existing.id,
              data: mapProduct(product),
            })
          } else {
            toCreate.push(mapProduct(product))
          }
        }

        return { toCreate, toUpdate }
      }
    )

    const createInput = transform({ splitData }, (data) => ({
      collection: "products",
      items: data.splitData.toCreate,
    }))

    const createdItems = createPayloadItemsStep(createInput)

    const updateInput = transform({ splitData }, (data) => ({
      collection: "products",
      items: data.splitData.toUpdate,
    }))

    const updatedItems = updatePayloadItemsStep(updateInput)

    const metadataUpdates = transform({ createdItems }, (data) => {
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
        products: metadataUpdates,
      },
    })

    const summary = transform(
      { createdItems, updatedItems },
      (data) => ({
        created: data.createdItems.length,
        updated: data.updatedItems.length,
        total: data.createdItems.length + data.updatedItems.length,
      })
    )

    return new WorkflowResponse(summary)
  }
)
