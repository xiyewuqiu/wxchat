export interface StreamState {
  thinking: string
  response: string
}

interface TokenMatch {
  index: number
  length: number
}

// DeepSeek-R1 的思考标记有两种写法：ASCII 形式与全角形式，两种都要兼容。
// 源码里统一用 \u 转义书写尖括号，避免被任何 HTML 处理链路吞掉标签。
const OPEN_TOKENS = ['\u003cthink\u003e', '\u003c\uff5cbegin\u2581of\u2581thinking\uff5c\u003e']
const CLOSE_TOKENS = ['\u003c/think\u003e', '\u003c\uff5cend\u2581of\u2581thinking\uff5c\u003e']

function findToken(raw: string, from: number, tokens: string[]): TokenMatch | null {
  let best: TokenMatch | null = null
  for (const token of tokens) {
    const index = raw.indexOf(token, from)
    if (index === -1) continue
    if (!best || index < best.index) best = { index, length: token.length }
  }
  return best
}

/**
 * 解析思考标记。
 * 输入是累积的全文而非单个分片，因此标记被切分到多个 chunk 时同样能正确解析。
 * 思考区间内（闭标签尚未到达）全部计入 thinking，闭标签之后的全部计入 response。
 */
export function parseStream(raw: string): StreamState {
  const open = findToken(raw, 0, OPEN_TOKENS)
  if (!open) return { thinking: '', response: raw }

  const contentStart = open.index + open.length
  const close = findToken(raw, contentStart, CLOSE_TOKENS)

  if (!close) {
    return { thinking: raw.slice(contentStart), response: '' }
  }

  return {
    thinking: raw.slice(contentStart, close.index),
    response: raw.slice(close.index + close.length),
  }
}