export type PayloadModuleOptions = {
  serverUrl: string
  apiKey: string
  userCollection: string
}

export type PayloadCollectionItem = {
  id: string
  createdAt: string
  updatedAt: string
  medusa_id: string
  [key: string]: unknown
}

export type PayloadUpsertData = {
  [key: string]: unknown
}

export type PayloadQueryOptions = {
  depth?: number
  locale?: string
  fallbackLocale?: string
  select?: string
  populate?: string
  limit?: number
  page?: number
  sort?: string
  where?: Record<string, unknown>
}

export type PayloadItemResult<T = PayloadCollectionItem> = {
  doc: T
  message: string
}

export type PayloadBulkResult<T = PayloadCollectionItem> = {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: number | null
  prevPage: number | null
  pagingCounter: number
}
