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
import { syncPayloadTranslationsStep } from "./steps/sync-payload-translations"

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

    const payloadProducts = transform({ products }, (data) => {
      return data.products.map((product: any) => ({
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

    const translationInput = transform({ createdItems }, (data) => {
      return {
        collection: "products",
        entity: "product",
        items: data.createdItems
          .filter((item: any) => item.id && item.medusa_id)
          .map((item: any) => ({
            payload_id: item.id,
            medusa_id: item.medusa_id,
          })),
        locales: [
          { medusa: "lv-LV", payload: "lv" },
        ],
        translatable_fields: [
          "title",
          "subtitle",
          "description",
        ],
      }
    })

    syncPayloadTranslationsStep(translationInput)

    return new WorkflowResponse(createdItems)
  }
)
