import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../modules/payload"
import PayloadModuleService from "../../modules/payload/service"
import { PayloadCollectionItem, PayloadUpsertData } from "../../modules/payload/types"

type CreatePayloadItemsInput = {
  collection: string
  items: PayloadUpsertData[]
  locale?: string
}

export const createPayloadItemsStep = createStep(
  "create-payload-items",
  async (input: CreatePayloadItemsInput, { container }) => {
    const payloadService: PayloadModuleService =
      container.resolve(PAYLOAD_MODULE)

    const createdItems: PayloadCollectionItem[] = []

    for (const item of input.items) {
      const result = await payloadService.create(input.collection, item, input.locale)
      createdItems.push(result.doc)
    }

    return new StepResponse(createdItems, {
      collection: input.collection,
      ids: createdItems.map((item) => item.id).filter(Boolean),
    })
  },
  async (compensationInput, { container }) => {
    if (!compensationInput?.ids?.length) return

    const payloadService: PayloadModuleService =
      container.resolve(PAYLOAD_MODULE)

    for (const id of compensationInput.ids) {
      await payloadService.delete(compensationInput.collection, id)
    }
  }
)
