import qs from "qs"
import {
  PayloadModuleOptions,
  PayloadCollectionItem,
  PayloadUpsertData,
  PayloadQueryOptions,
  PayloadItemResult,
  PayloadBulkResult,
} from "./types"

type InjectedDependencies = {
  logger: {
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
  }
}

export type SyncState = {
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

const initialSyncState = (): SyncState => ({
  status: "idle",
  total: 0,
  processed: 0,
  created: 0,
  updated: 0,
  failed: 0,
  startedAt: null,
  finishedAt: null,
  error: null,
})

class PayloadModuleService {
  private serverUrl: string
  private apiKey: string
  private userCollection: string
  private logger: InjectedDependencies["logger"]
  private isConfigured: boolean
  private syncStates: Map<string, SyncState> = new Map()

  constructor(
    { logger }: InjectedDependencies,
    options: PayloadModuleOptions
  ) {
    this.logger = logger
    this.serverUrl = options.serverUrl
    this.apiKey = options.apiKey
    this.userCollection = options.userCollection || "users"

    if (!this.serverUrl) {
      throw new Error(
        "PayloadModuleService: serverUrl is required. Set PAYLOAD_SERVER_URL in your environment."
      )
    }

    if (!this.apiKey) {
      this.isConfigured = false
      this.logger.warn(
        "PayloadModuleService: apiKey is not set. Payload sync operations will be skipped. " +
        "Set PAYLOAD_API_KEY after creating a user in the Payload admin panel."
      )
    } else {
      this.isConfigured = true
      this.logger.info(
        `PayloadModuleService: initialized with server ${this.serverUrl}`
      )
    }
  }

  private getAuthHeader(): string {
    return `${this.userCollection} API-Key ${this.apiKey}`
  }

  private buildUrl(
    collection: string,
    id?: string,
    queryParams?: Record<string, unknown>
  ): string {
    let url = `${this.serverUrl}/api/${collection}`
    if (id) {
      url += `/${id}`
    }

    const params = {
      ...queryParams,
      is_from_medusa: true,
    }

    const queryString = qs.stringify(params, { addQueryPrefix: true })
    return `${url}${queryString}`
  }

  private async request<T>(
    url: string,
    options: RequestInit
  ): Promise<T> {
    this.logger.info(`Payload request: ${options.method} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.getAuthHeader(),
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage =
        data?.errors?.[0]?.message || data?.message || response.statusText
      this.logger.error(
        `Payload API error (${response.status}): ${errorMessage} — URL: ${url}`
      )
      throw new Error(
        `Payload API error (${response.status}): ${errorMessage}`
      )
    }

    return data as T
  }

  async create(
    collection: string,
    data: PayloadUpsertData,
    locale?: string
  ): Promise<PayloadItemResult> {
    if (!this.isConfigured) {
      this.logger.warn(
        `PayloadModuleService: skipping create for ${collection} — API key not configured`
      )
      return { doc: {} as PayloadCollectionItem, message: "skipped" }
    }

    const queryParams = locale ? { locale } : undefined
    const url = this.buildUrl(collection, undefined, queryParams)
    return this.request<PayloadItemResult>(url, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update(
    collection: string,
    id: string,
    data: PayloadUpsertData,
    locale?: string
  ): Promise<PayloadItemResult> {
    if (!this.isConfigured) {
      this.logger.warn(
        `PayloadModuleService: skipping update for ${collection}/${id} — API key not configured`
      )
      return { doc: {} as PayloadCollectionItem, message: "skipped" }
    }

    const queryParams = locale ? { locale } : undefined
    const url = this.buildUrl(collection, id, queryParams)
    return this.request<PayloadItemResult>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete(
    collection: string,
    id: string
  ): Promise<PayloadItemResult> {
    if (!this.isConfigured) {
      this.logger.warn(
        `PayloadModuleService: skipping delete for ${collection}/${id} — API key not configured`
      )
      return { doc: {} as PayloadCollectionItem, message: "skipped" }
    }

    const url = this.buildUrl(collection, id)
    return this.request<PayloadItemResult>(url, {
      method: "DELETE",
    })
  }

  async find(
    collection: string,
    query?: PayloadQueryOptions
  ): Promise<PayloadBulkResult> {
    if (!this.isConfigured) {
      this.logger.warn(
        `PayloadModuleService: skipping find for ${collection} — API key not configured`
      )
      return {
        docs: [],
        totalDocs: 0,
        limit: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
        pagingCounter: 1,
      }
    }

    const url = this.buildUrl(collection, undefined, query as Record<string, unknown>)
    return this.request<PayloadBulkResult>(url, {
      method: "GET",
    })
  }

  async list(
    collection: string,
    medusaIds: string[]
  ): Promise<PayloadBulkResult> {
    return this.find(collection, {
      where: {
        medusa_id: {
          in: medusaIds.join(","),
        },
      },
      limit: medusaIds.length,
    })
  }

  getSyncState(collection: string): SyncState {
    return this.syncStates.get(collection) ?? initialSyncState()
  }

  startSync(collection: string, total: number): void {
    this.syncStates.set(collection, {
      ...initialSyncState(),
      status: "running",
      total,
      startedAt: Date.now(),
    })
  }

  reportSyncProgress(
    collection: string,
    delta: { processed?: number; created?: number; updated?: number; failed?: number }
  ): void {
    const current = this.syncStates.get(collection) ?? initialSyncState()
    this.syncStates.set(collection, {
      ...current,
      processed: current.processed + (delta.processed ?? 0),
      created: current.created + (delta.created ?? 0),
      updated: current.updated + (delta.updated ?? 0),
      failed: current.failed + (delta.failed ?? 0),
    })
  }

  finishSync(collection: string, error?: string): void {
    const current = this.syncStates.get(collection) ?? initialSyncState()
    this.syncStates.set(collection, {
      ...current,
      status: error ? "failed" : "completed",
      finishedAt: Date.now(),
      error: error ?? null,
    })
  }
}

export default PayloadModuleService
