import { useEffect, useMemo, useState } from 'react'
import { hasMarkdownSyntax, renderMarkdown } from '@/lib/markdown'

interface MarkdownContentProps {
  content: string
  /** 是否允许切换到源码视图（流式输出时不提供切换） */
  toggleable?: boolean
}

/** 文本/ Markdown 渲染：自动识别语法，渲染后消毒，可切换源码视图 */
export function MarkdownContent({ content, toggleable = true }: MarkdownContentProps) {
  const hasMarkdown = useMemo(() => hasMarkdownSyntax(content), [content])
  const [rendered, setRendered] = useState(hasMarkdown)

  // 内容变化（如流式更新）时重新按语法判定默认视图
  useEffect(() => {
    setRendered(hasMarkdownSyntax(content))
  }, [content])

  if (!hasMarkdown) {
    return <div className="text-message">{content}</div>
  }

  const showRendered = toggleable && rendered

  return (
    <div className={`text-message${showRendered ? ' markdown-rendered' : ''}`}>
      {showRendered ? (
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      ) : (
        content
      )}
      {toggleable && (
        <button
          type="button"
          className="markdown-toggle"
          title="切换源码/渲染视图"
          onClick={() => setRendered((value) => !value)}
        >
          📝
        </button>
      )}
    </div>
  )
}