import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PAYLOAD_MODULE } from "../../../../../../modules/payload"
import PayloadModuleService from "../../../../../../modules/payload/service"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { collection } = req.params
  const payloadService: PayloadModuleService =
    req.scope.resolve(PAYLOAD_MODULE)

  res.json({ status: payloadService.getSyncState(collection) })
}
