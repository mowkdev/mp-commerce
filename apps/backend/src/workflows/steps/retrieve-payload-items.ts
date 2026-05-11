import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../modules/payload"
import PayloadModuleService from "../../modules/payload/service"

type RetrievePayloadItemsInput = {
  collection: string
  medusa_ids: string[]
}

export const retrievePayloadItemsStep = createStep(
  "retrieve-payload-items",
  async (input: RetrievePayloadItemsInput, { container }) => {
    const payloadService: PayloadModuleService =
      container.resolve(PAYLOAD_MODULE)

    const result = await payloadService.list(
      input.collection,
      input.medusa_ids
    )

    return new StepResponse(result.docs)
  }
)
