import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../modules/payload"
import PayloadModuleService from "../../modules/payload/service"
import { PayloadCollectionItem, PayloadUpsertData } from "../../modules/payload/types"

type UpdatePayloadItemsInput = {
  collection: string
  items: {
    id: string
    data: PayloadUpsertData
  }[]
  locale?: string
}

export const updatePayloadItemsStep = createStep(
  "update-payload-items",
  async (input: UpdatePayloadItemsInput, { container }) => {
    const payloadService: PayloadModuleService =
      container.resolve(PAYLOAD_MODULE)

    const updatedItems: PayloadCollectionItem[] = []

    for (const item of input.items) {
      const result = await payloadService.update(
        input.collection,
        item.id,
        item.data,
        input.locale
      )
      updatedItems.push(result.doc)
    }

    return new StepResponse(updatedItems)
  }
)
