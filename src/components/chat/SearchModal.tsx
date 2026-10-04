import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSuggestions, search } from '@/api/search'
import { SEARCH_CONFIG } from '@/config'
import { parseAiContent } from '@/lib/aiContent'
import { escapeHtml, formatFileSize, formatTime, getFileIcon } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import type { SearchFilters, SearchResultItem } from '@/types'

interface SearchModalProps {
  onLocate: (messageId: number) => void
}

interface DisplayResult {
  id: number
  type: 'text' | 'file' | 'ai'
  aiKind?: 'response' | 'thinking'
  icon: string
  text: string
  fileName: string
  fileSize: string | null
  time: string
}

function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 关键词高亮：先转义原文，再包裹匹配片段 */
function highlight(text: string, query: string): string {
  const escaped = escapeHtml(text)
  if (!query) return escaped
  const pattern = escapeHtml(regexEscape(query))
  try {
    return escaped.replace(new RegExp(`(${pattern})`, 'gi'), `<mark class="${SEARCH_CONFIG.HIGHLIGHT_CLASS}">$1</mark>`)
  } catch {
    return escaped
  }
}

function toDisplayResult(item: SearchResultItem): DisplayResult {
  const ai = parseAiContent(item.content)

  if (ai) {
    return {
      id: item.id,
      type: 'ai',
      aiKind: ai.kind,
      icon: '🤖',
      text: ai.text,
      fileName: '',
      fileSize: null,
      time: formatTime(item.timestamp),
    }
  }

  if (item.type === 'file') {
    return {
      id: item.id,
      type: 'file',
      icon: getFileIcon(item.mime_type, item.original_name),
      text: item.original_name ?? '未知文件',
      fileName: item.original_name ?? '',
      fileSize: item.file_size ? formatFileSize(item.file_size) : null,
      time: formatTime(item.timestamp),
    }
  }

  return {
    id: item.id,
    type: 'text',
    icon: '💬',
    text: item.content ?? '',
    fileName: '',
    fileSize: null,
    time: formatTime(item.timestamp),
  }
}

const DEFAULT_FILTERS: SearchFilters = { ...SEARCH_CONFIG.DEFAULT_FILTERS }

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_CONFIG.HISTORY_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

/** 搜索弹窗：防抖搜索、类型/时间筛选、历史记录、结果定位 */
export function SearchModal({ onLocate }: SearchModalProps) {
  const open = useUiStore((state) => state.searchOpen)
  const setOpen = useUiStore((state) => state.setSearchOpen)
  const toast = useUiStore((state) => state.toast)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<DisplayResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (open) setHistory(loadHistory())
  }, [open])

  const persistHistory = useCallback((next: string[]) => {
    setHistory(next)
    localStorage.setItem(SEARCH_CONFIG.HISTORY_KEY, JSON.stringify(next))
  }, [])

  const addHistory = useCallback(
    (keyword: string) => {
      const trimmed = keyword.trim()
      if (!trimmed) return
      const next = [trimmed, ...loadHistory().filter((item) => item !== trimmed)].slice(0, SEARCH_CONFIG.HISTORY_LIMIT)
      persistHistory(next)
    },
    [persistHistory],
  )

  const runSearch = useCallback(
    async (keyword: string, activeFilters: SearchFilters) => {
      const trimmed = keyword.trim()
      if (trimmed.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) return

      setLoading(true)
      setError(null)
      try {
        const response = await search(trimmed, activeFilters)
        setResults(response.data.map(toDisplayResult))
        setTotal(response.total)
        addHistory(trimmed)
      } catch (searchError) {
        setError((searchError as Error).message || '搜索失败')
        setResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [addHistory],
  )

  // 输入防抖
  useEffect(() => {
    if (!open || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return
    }
    const timer = setTimeout(() => void runSearch(query, filters), SEARCH_CONFIG.DEBOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [query, filters, open, runSearch])

  // 打开时预取搜索建议，用于补充历史为空的情况
  useEffect(() => {
    if (!open || query.trim().length < 2) return
    let active = true
    const timer = setTimeout(async () => {
      const suggestions = await getSuggestions(query)
      if (active) setSuggestions(suggestions)
    }, 400)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, query])

  const mergedSuggestions = useMemo(() => {
    const set = new Set([...suggestions, ...history])
    return Array.from(set).slice(0, 10)
  }, [history, suggestions])

  const close = () => {
    setOpen(false)
    setQuery('')
    setResults([])
    setError(null)
  }

  if (!open) return null

  const hasQuery = query.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH
  const showWelcome = !hasQuery && results.length === 0 && !loading

  return (
    <div className="search-modal show" role="dialog" aria-modal="true">
      <div className="search-modal-overlay" onClick={close} />
      <div className="search-modal-content">
        <div className="search-header">
          <div className="search-input-container">
            <input
              autoFocus
              className="search-input"
              placeholder="🔍 搜索消息和文件..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void runSearch(query, filters)
                if (event.key === 'Escape') close()
              }}
            />
            {query && (
              <button type="button" className="search-clear-btn" onClick={() => setQuery('')}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                  />
                </svg>
              </button>
            )}
          </div>
          <button type="button" className="search-close-btn" onClick={close}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
              />
            </svg>
          </button>
        </div>

        <div className={`search-filters${showFilters ? ' expanded' : ''}`}>
          <div className="search-filter-group">
            <label htmlFor="searchTypeFilter">类型:</label>
            <select
              id="searchTypeFilter"
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value as SearchFilters['type'] })}
            >
              <option value="all">全部</option>
              <option value="text">文本</option>
              <option value="file">文件</option>
            </select>
          </div>

          <div className="search-filter-group">
            <label htmlFor="searchFileTypeFilter">文件类型:</label>
            <select
              id="searchFileTypeFilter"
              value={filters.fileType}
              onChange={(event) => setFilters({ ...filters, fileType: event.target.value as SearchFilters['fileType'] })}
            >
              <option value="all">全部</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="document">文档</option>
              <option value="archive">压缩包</option>
              <option value="text">文本</option>
              <option value="code">代码</option>
            </select>
          </div>

          <div className="search-filter-group">
            <label htmlFor="searchTimeFilter">时间:</label>
            <select
              id="searchTimeFilter"
              value={filters.timeRange}
              onChange={(event) => setFilters({ ...filters, timeRange: event.target.value as SearchFilters['timeRange'] })}
            >
              <option value="all">全部时间</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
          </div>

          <button type="button" className="search-filter-toggle" onClick={() => setShowFilters((value) => !value)}>
            筛选 <span className="toggle-icon">{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>

        {!hasQuery && mergedSuggestions.length > 0 && (
          <div className="search-suggestions">
            <div className="suggestions-header">
              <span>搜索建议</span>
              <button
                type="button"
                className="clear-history-btn"
                onClick={() => {
                  persistHistory([])
                  toast('搜索历史已清除', 'success')
                }}
              >
                清除历史
              </button>
            </div>
            <div className="suggestions-list">
              {mergedSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="suggestion-item"
                  onClick={() => {
                    setQuery(item)
                    void runSearch(item, filters)
                  }}
                >
                  <div className="suggestion-icon">🕒</div>
                  <div className="suggestion-text">{item}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="search-results">
          {showWelcome && (
            <div className="search-status">
              <div className="search-welcome">
                <div className="search-welcome-icon">🔍</div>
                <div className="search-welcome-text">输入关键词开始搜索</div>
                <div className="search-welcome-tips">
                  <div>• 支持消息内容和文件名搜索</div>
                  <div>• 可按文件类型和时间筛选</div>
                  <div>• 支持模糊匹配和关键词高亮</div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="search-status">
              <div className="search-loading">
                <div className="loading-spinner" />
                <div className="loading-text">正在搜索 "{query}"...</div>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="search-status">
              <div className="search-error">
                <div className="error-icon">⚠️</div>
                <div className="error-text">搜索失败: {error}</div>
                <button type="button" className="retry-btn" onClick={() => void runSearch(query, filters)}>
                  重试
                </button>
              </div>
            </div>
          )}

          {!loading && !error && hasQuery && (
            <div className="search-results-list">
              <div className="search-results-stats">
                找到 {total} 条相关结果 {query ? `(搜索: "${query}")` : ''}
              </div>

              {results.length === 0 && (
                <div className="search-no-results">
                  <div className="no-results-icon">🔍</div>
                  <div className="no-results-text">没有找到相关结果</div>
                  <div className="no-results-tips">试试其他关键词或调整筛选条件</div>
                </div>
              )}

              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="search-result-item"
                  onClick={() => {
                    close()
                    onLocate(result.id)
                  }}
                >
                  <div className="result-icon">{result.icon}</div>
                  <div className="result-content">
                    <div className="result-header">
                      <div className="result-type-info">
                        {result.type === 'ai' && (
                          <span className={`result-type-tag ${result.aiKind === 'thinking' ? 'ai-thinking' : 'ai-response'}`}>
                            {result.aiKind === 'thinking' ? 'AI思考' : 'AI回答'}
                          </span>
                        )}
                        {result.type === 'file' && <span className="result-type-tag file">文件</span>}
                        {result.fileSize && <span className="file-size">{result.fileSize}</span>}
                      </div>
                      <div className="result-time">{result.time}</div>
                    </div>
                    <div
                      className="result-text"
                      dangerouslySetInnerHTML={{ __html: highlight(result.text, query) }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}