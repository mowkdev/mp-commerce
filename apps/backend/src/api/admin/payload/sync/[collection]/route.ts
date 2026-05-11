import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

type SyncRequestBody = {
  ids?: string[]
}

export async function POST(
  req: AuthenticatedMedusaRequest<SyncRequestBody>,
  res: MedusaResponse
) {
  const { collection } = req.params
  const { ids } = req.body || {}
  const eventBus = req.scope.resolve("event_bus")

  await eventBus.emit({
    name: `${collection}.sync-payload`,
    data: { ids },
  })

  const scope = ids?.length
    ? `${ids.length} specific items`
    : "all items"

  res.json({
    message: `Sync started for ${collection}: ${scope}`,
  })
}
