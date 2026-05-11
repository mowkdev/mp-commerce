import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../modules/payload"
import PayloadModuleService from "../../modules/payload/service"

type DeletePayloadItemsInput = {
  collection: string
  ids: string[]
}

export const deletePayloadItemsStep = createStep(
  "delete-payload-items",
  async (input: DeletePayloadItemsInput, { container }) => {
    const payloadService: PayloadModuleService =
      container.resolve(PAYLOAD_MODULE)

    for (const id of input.ids) {
      await payloadService.delete(input.collection, id)
    }

    return new StepResponse(undefined)
  }
)
