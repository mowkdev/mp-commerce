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
import { syncPayloadTranslationsStep } from "./steps/sync-payload-translations"

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
        "description",
        "handle",
        "thumbnail",
        "images.*",
        "metadata",
        "created_at",
        "updated_at",
        "options.*",
        "variants.*",
        "variants.options.*",
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
          handle: product.handle,
          subtitle: product.subtitle || "",
          description: product.description || "",
          thumbnail: product.thumbnail || "",
          images: (product.images || []).map((img: any) => ({
            url: img.url,
          })),
          createdAt: product.created_at,
          updatedAt: product.updated_at,
          options: (product.options || []).map((option: any) => ({
            title: option.title,
            medusa_id: option.id,
          })),
          variants: (product.variants || []).map((variant: any) => ({
            title: variant.title,
            medusa_id: variant.id,
            option_values: (variant.options || []).map((ov: any) => ({
              medusa_id: ov.id,
              medusa_option_id: ov.option_id,
              value: ov.value,
            })),
          })),
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

    const translationInput = transform(
      { createdItems, updatedItems, existingPayloadProducts },
      (data) => {
        const allItems = [
          ...data.createdItems
            .filter((item: any) => item.id && item.medusa_id)
            .map((item: any) => ({
              payload_id: item.id,
              medusa_id: item.medusa_id,
            })),
          ...data.existingPayloadProducts
            .filter((item: any) => item.id && item.medusa_id)
            .map((item: any) => ({
              payload_id: item.id,
              medusa_id: item.medusa_id,
            })),
        ]

        return {
          collection: "products",
          entity: "product",
          items: allItems,
          locales: [{ medusa: "lv-LV", payload: "lv" }],
          translatable_fields: ["title", "subtitle", "description"],
        }
      }
    )

    syncPayloadTranslationsStep(translationInput)

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
