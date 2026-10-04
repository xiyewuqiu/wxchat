import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true, gfm: true })

// 渲染后的外链统一在新标签打开，并阻断 opener
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

const MARKDOWN_PATTERNS: RegExp[] = [
  /^#{1,6}\s+/m,
  /\*\*[^*]+\*\*/,
  /\*[^*]+\*/,
  /^[-*+]\s+/m,
  /^>\s+/m,
  /```[\s\S]*?```/,
  /`[^`]+`/,
  /\[([^\]]+)\]\(([^)]+)\)/,
  /^---+$/m,
  /^\d+\.\s+/m,
]

export function hasMarkdownSyntax(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text))
}

/** Markdown → 安全 HTML */
export function renderMarkdown(text: string): string {
  try {
    return DOMPurify.sanitize(marked.parse(text) as string)
  } catch {
    return DOMPurify.sanitize(text)
  }
}