import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { sdk } from "../../../lib/sdk"

type SyncState = {
  status: "idle" | "running" | "completed" | "failed"
  total: number
  processed: number
  created: number
  updated: number
  failed: number
  startedAt: number | null
  finishedAt: number | null
  error: string | null
}

type SyncStateResponse = { status: SyncState }

const COLLECTION = "products"

const PayloadSettingsPage = () => {
  const queryClient = useQueryClient()

  const { data: statusData } = useQuery<SyncStateResponse>({
    queryKey: ["payload-sync-status", COLLECTION],
    queryFn: () =>
      sdk.client.fetch(`/admin/payload/sync/${COLLECTION}/status`, {
        method: "GET",
      }),
    refetchInterval: (q) =>
      q.state.data?.status?.status === "running" ? 1500 : false,
    refetchIntervalInBackground: false,
  })

  const state = statusData?.status

  const { mutateAsync: triggerSync, isPending: isStarting } = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/payload/sync/${COLLECTION}`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Sync started")
      queryClient.invalidateQueries({
        queryKey: ["payload-sync-status", COLLECTION],
      })
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to start sync")
    },
  })

  const isRunning = state?.status === "running"
  const isCompleted = state?.status === "completed"
  const isFailed = state?.status === "failed"

  const progressPercent = useMemo(() => {
    if (!state || state.total === 0) return 0
    return Math.min(100, Math.round((state.processed / state.total) * 100))
  }, [state])

  const durationSeconds = useMemo(() => {
    if (!state?.startedAt) return null
    const end = state.finishedAt ?? Date.now()
    return Math.max(0, Math.round((end - state.startedAt) / 1000))
  }, [state])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Payload Settings</Heading>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Syncs products from Medusa to Payload. Only minimal fields
          (medusa_id, title, handle, thumbnail, subtitle) are mirrored —
          Payload stores references for content blocks, Medusa remains the
          source of truth.
        </Text>

        <div>
          <Button
            variant="primary"
            size="small"
            onClick={() => triggerSync()}
            isLoading={isStarting || isRunning}
            disabled={isStarting || isRunning}
          >
            {isRunning ? "Syncing…" : "Sync Products to Payload"}
          </Button>
        </div>

        {state && state.status !== "idle" && (
          <div className="flex flex-col gap-y-3 rounded-md border border-ui-border-base p-4">
            <div className="flex items-baseline justify-between">
              <Text size="small" weight="plus" leading="compact">
                {isRunning && "Syncing products…"}
                {isCompleted && "Sync complete"}
                {isFailed && "Sync failed"}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {state.processed} / {state.total}
                {durationSeconds !== null && ` · ${durationSeconds}s`}
              </Text>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ui-bg-component">
              <div
                className="h-full rounded-full bg-ui-fg-interactive transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex gap-x-4">
              <Text size="small" className="text-ui-fg-subtle">
                Created: <span className="text-ui-fg-base">{state.created}</span>
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                Updated: <span className="text-ui-fg-base">{state.updated}</span>
              </Text>
              {state.failed > 0 && (
                <Text size="small" className="text-ui-fg-error">
                  Failed: {state.failed}
                </Text>
              )}
            </div>

            {isFailed && state.error && (
              <Text size="small" className="text-ui-fg-error">
                {state.error}
              </Text>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payload",
})

export default PayloadSettingsPage
