import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSuggestions, search } from '@/api/search'
import { SEARCH_CONFIG } from '@/config'
import { parseAiContent } from '@/lib/aiContent'
import { escapeHtml, formatFileSize, formatTime, isImageFile } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import {
  IconSearch,
  IconMessageSquare,
  IconFile,
  IconFileImage,
  IconFileText,
  IconBot,
  IconClock,
  IconAlertCircle,
  IconChevronLeft,
  IconX,
} from '@/components/icons'

import type { SearchFilters, SearchResultItem } from '@/types'

interface SearchModalProps {
  onLocate: (messageId: number) => void
}

interface DisplayResult {
  id: number
  type: 'text' | 'file' | 'ai'
  aiKind?: 'response' | 'thinking'
  icon: ReactNode
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
    return escaped.replace(
      new RegExp(`(${pattern})`, 'gi'),
      `<mark class="${SEARCH_CONFIG.HIGHLIGHT_CLASS}">$1</mark>`,
    )
  } catch {
    return escaped
  }
}

function renderSearchResultIcon(item: SearchResultItem): ReactNode {
  const ai = parseAiContent(item.content)
  if (ai) {
    return <IconBot size={18} className="search-res-icon ai" />
  }

  if (item.type === 'file') {
    if (isImageFile(item.mime_type)) {
      return <IconFileImage size={18} className="search-res-icon img" />
    }
    return <IconFileText size={18} className="search-res-icon doc" />
  }

  return <IconMessageSquare size={18} className="search-res-icon text" />
}

function toDisplayResult(item: SearchResultItem): DisplayResult {
  const ai = parseAiContent(item.content)

  if (ai) {
    return {
      id: item.id,
      type: 'ai',
      aiKind: ai.kind,
      icon: renderSearchResultIcon(item),
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
      icon: renderSearchResultIcon(item),
      text: item.original_name ?? '未知文件',
      fileName: item.original_name ?? '',
      fileSize: item.file_size ? formatFileSize(item.file_size) : null,
      time: formatTime(item.timestamp),
    }
  }

  return {
    id: item.id,
    type: 'text',
    icon: renderSearchResultIcon(item),
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

/** 全文检索中枢：Spotlight 级体验、分类筛选胶囊、纯矢量标签与精准定位 (零 Emoji) */
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
      const next = [trimmed, ...loadHistory().filter((item) => item !== trimmed)].slice(
        0,
        SEARCH_CONFIG.HISTORY_LIMIT,
      )
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
        setError((searchError as Error).message || '搜索执行失败')
        setResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [addHistory],
  )

  useEffect(() => {
    if (!open || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return
    }
    const timer = setTimeout(() => void runSearch(query, filters), SEARCH_CONFIG.DEBOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [query, filters, open, runSearch])

  useEffect(() => {
    if (!open || query.trim().length < 2) return
    let active = true
    const timer = setTimeout(async () => {
      const list = await getSuggestions(query)
      if (active) setSuggestions(list)
    }, 350)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, query])

  const mergedSuggestions = useMemo(() => {
    const set = new Set([...suggestions, ...history])
    return Array.from(set).slice(0, 8)
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

      <div className="search-spotlight-card">
        {/* 顶部搜索框 */}
        <div className="spotlight-header">
          <button type="button" className="spotlight-back-btn" onClick={close} title="返回">
            <IconChevronLeft size={22} />
          </button>

          <div className="spotlight-input-box">
            <span className="spotlight-search-icon">
              <IconSearch size={18} />
            </span>

            <input
              autoFocus
              className="spotlight-input"
              placeholder="搜索任何文本消息、文件名称或 AI 对话..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void runSearch(query, filters)
                if (event.key === 'Escape') close()
              }}
            />

            {query && (
              <button type="button" className="spotlight-clear-btn" onClick={() => setQuery('')}>
                <IconX size={15} />
              </button>
            )}
          </div>

          <button type="button" className="spotlight-esc-pill" onClick={close} title="关闭搜索">
            取消
          </button>
        </div>


        {/* 快捷过滤药丸组 */}
        <div className="spotlight-filter-bar">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${filters.type === 'all' ? 'active' : ''}`}
              onClick={() => {
                const next: SearchFilters = { ...filters, type: 'all' }
                setFilters(next)
                if (hasQuery) void runSearch(query, next)
              }}
            >
              全部
            </button>
            <button
              type="button"
              className={`filter-pill ${filters.type === 'text' ? 'active' : ''}`}
              onClick={() => {
                const next: SearchFilters = { ...filters, type: 'text' }
                setFilters(next)
                if (hasQuery) void runSearch(query, next)
              }}
            >
              <IconMessageSquare size={13} className="pill-prefix-icon" />
              <span>文本</span>
            </button>
            <button
              type="button"
              className={`filter-pill ${filters.type === 'file' ? 'active' : ''}`}
              onClick={() => {
                const next: SearchFilters = { ...filters, type: 'file' }
                setFilters(next)
                if (hasQuery) void runSearch(query, next)
              }}
            >
              <IconFile size={13} className="pill-prefix-icon" />
              <span>文件</span>
            </button>
          </div>

          <div className="filter-dropdown-group">
            <select
              className="filter-select-pill"
              value={filters.timeRange}
              onChange={(e) => {
                const next: SearchFilters = { ...filters, timeRange: e.target.value as SearchFilters['timeRange'] }
                setFilters(next)
                if (hasQuery) void runSearch(query, next)
              }}
            >
              <option value="all">不限时间</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
          </div>
        </div>

        {/* 历史记录标签云 */}
        {!hasQuery && mergedSuggestions.length > 0 && (
          <div className="spotlight-history-section">
            <div className="history-header">
              <span className="history-title">最近搜索与常用检索词</span>
              <button
                type="button"
                className="history-clear-link"
                onClick={() => {
                  persistHistory([])
                  toast('已清空搜索历史', 'info')
                }}
              >
                清除历史
              </button>
            </div>
            <div className="history-tags-cloud">
              {mergedSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="history-tag-pill"
                  onClick={() => {
                    setQuery(item)
                    void runSearch(item, filters)
                  }}
                >
                  <IconClock size={12} className="tag-clock-icon" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 结果呈现区 */}
        <div className="spotlight-results-area">
          {showWelcome && (
            <div className="spotlight-welcome-state">
              <div className="welcome-spotlight-icon">
                <IconSearch size={36} />
              </div>
              <h4 className="welcome-spotlight-title">即时搜索消息与文件</h4>
              <p className="welcome-spotlight-hint">键入关键词即可秒级模糊匹配上下文，支持高亮与一键滚动定位</p>
            </div>
          )}

          {loading && (
            <div className="spotlight-loading-state">
              <span className="btn-spinner" />
              <span className="spotlight-loading-text">正在检索相关记录...</span>
            </div>
          )}

          {!loading && error && (
            <div className="spotlight-error-state">
              <IconAlertCircle size={16} />
              <span>{error}</span>
              <button type="button" className="spotlight-retry-btn" onClick={() => void runSearch(query, filters)}>
                重试
              </button>
            </div>
          )}

          {!loading && !error && hasQuery && (
            <div className="spotlight-list-container">
              <div className="spotlight-stats-bar">
                <span>找到 {total} 条匹配结果</span>
                <span className="stats-query-badge">"{query}"</span>
              </div>

              {results.length === 0 && (
                <div className="spotlight-empty-state">
                  <IconFile size={32} className="empty-state-svg" />
                  <span>未找到与 "{query}" 相关的记录</span>
                </div>
              )}

              {results.map((result) => (
                <div
                  key={result.id}
                  className="spotlight-item-card"
                  onClick={() => {
                    close()
                    onLocate(result.id)
                  }}
                >
                  <div className="item-card-icon">{result.icon}</div>
                  <div className="item-card-content">
                    <div className="item-card-header">
                      <div className="item-tags">
                        {result.type === 'ai' && (
                          <span className="badge-tag ai">{result.aiKind === 'thinking' ? 'AI 思考' : 'AI 回答'}</span>
                        )}
                        {result.type === 'file' && <span className="badge-tag file">文件</span>}
                        {result.fileSize && <span className="badge-size">{result.fileSize}</span>}
                      </div>
                      <span className="item-time">{result.time}</span>
                    </div>

                    <div
                      className="item-card-text"
                      dangerouslySetInnerHTML={{ __html: highlight(result.text, query) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}