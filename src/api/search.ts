import { API_ENDPOINTS, SEARCH_CONFIG } from '@/config'
import { get } from '@/lib/http'
import type { SearchFilters, SearchResponse } from '@/types'

interface SuggestionsResponse {
  success: boolean
  data?: string[]
}

export async function search(
  query: string,
  filters: Partial<SearchFilters> = {},
  limit = SEARCH_CONFIG.MAX_RESULTS,
  offset = 0,
): Promise<SearchResponse> {
  const params: Record<string, string | number> = { q: query, limit, offset }

  if (filters.type && filters.type !== 'all') params.type = filters.type
  if (filters.timeRange && filters.timeRange !== 'all') params.timeRange = filters.timeRange
  if (filters.deviceId && filters.deviceId !== 'all') params.deviceId = filters.deviceId
  if (filters.fileType && filters.fileType !== 'all') params.fileType = filters.fileType

  const result = await get<SearchResponse>(API_ENDPOINTS.SEARCH, params)
  if (!result.success) throw new Error(result.error || '搜索失败')
  return result
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) return []
  try {
    const result = await get<SuggestionsResponse>(API_ENDPOINTS.SEARCH_SUGGESTIONS, { q: query })
    return result.data ?? []
  } catch {
    // 建议为增强功能，失败静默返回空
    return []
  }
}